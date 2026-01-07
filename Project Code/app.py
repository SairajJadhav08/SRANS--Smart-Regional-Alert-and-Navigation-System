from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from datetime import datetime
import os
import json

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_for_testing')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    is_government = db.Column(db.Boolean, default=False)
    agency_name = db.Column(db.String(120))
    department = db.Column(db.String(120))
    is_verified = db.Column(db.Boolean, default=False)
    alerts = db.relationship('Alert', backref='author', lazy=True)
    saved_routes = db.relationship('SavedRoute', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Alert(db.Model):
    __tablename__ = 'alerts'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    alert_type = db.Column(db.String(50), nullable=False)  # Traffic, Emergency, Construction, Weather
    location_lat = db.Column(db.Float, nullable=False)
    location_lng = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __repr__(self):
        return f'<Alert {self.title}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'alert_type': self.alert_type,
            'title': self.title,
            'description': self.description,
            'location_lat': self.location_lat,
            'location_lng': self.location_lng,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class SavedRoute(db.Model):
    __tablename__ = 'saved_routes'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    start_lat = db.Column(db.Float, nullable=False)
    start_lng = db.Column(db.Float, nullable=False)
    end_lat = db.Column(db.Float, nullable=False)
    end_lng = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

class ContactMessage(db.Model):
    __tablename__ = 'contact_messages'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

# Authentication middleware
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'danger')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def government_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'danger')
            return redirect(url_for('login'))
        
        user = User.query.get(session['user_id'])
        if not user.is_government:
            flash('This page is only accessible to government users.', 'danger')
            return redirect(url_for('index'))
            
        if not user.is_verified:
            flash('Your government account is pending verification. You cannot perform this action yet.', 'warning')
            return redirect(url_for('dashboard'))
            
        return f(*args, **kwargs)
    return decorated_function

# Helper functions
def is_logged_in():
    return 'user_id' in session

def is_government_user():
    if not is_logged_in():
        return False
    user = User.query.get(session['user_id'])
    return user and user.is_government and user.is_verified

def is_any_government_user():
    if not is_logged_in():
        return False
    user = User.query.get(session['user_id'])
    return user and user.is_government

# Make the functions available to the templates
@app.context_processor
def utility_processor():
    return {
        'is_logged_in': is_logged_in,
        'is_government_user': is_government_user,
        'is_any_government_user': is_any_government_user
    }

# Routes
@app.route('/')
def index():
    alerts = Alert.query.order_by(Alert.created_at.desc()).limit(5).all()
    return render_template('index.html', alerts=alerts)

@app.route('/features')
def features():
    return render_template('features.html')

@app.route('/alerts')
def alerts():
    all_alerts = Alert.query.order_by(Alert.created_at.desc()).all()
    return render_template('alerts.html', alerts=all_alerts)

@app.route('/alerts/<alert_type>')
def alerts_by_type(alert_type):
    valid_types = ['traffic', 'emergency', 'construction', 'weather']
    if alert_type.lower() not in valid_types:
        flash('Invalid alert type', 'danger')
        return redirect(url_for('alerts'))
    
    alerts = Alert.query.filter_by(alert_type=alert_type.capitalize()).order_by(Alert.created_at.desc()).all()
    return render_template('alerts.html', alerts=alerts, current_type=alert_type)

@app.route('/map')
def map():
    # Get all active alerts ordered by creation date (newest first)
    alerts = Alert.query.order_by(Alert.created_at.desc()).all()
    return render_template('map.html', alerts=alerts)

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        subject = request.form.get('subject')
        message = request.form.get('message')
        
        if not all([name, email, subject, message]):
            flash('All fields are required', 'error')
            return redirect(url_for('contact'))
        
        new_message = ContactMessage(
            name=name,
            email=email,
            subject=subject,
            message=message
        )
        
        db.session.add(new_message)
        db.session.commit()
        
        flash('Your message has been sent! We will get back to you soon.', 'success')
        return redirect(url_for('contact'))
        
    return render_template('contact.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if is_logged_in():
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user_type = request.form.get('user_type', 'user')
        
        user = User.query.filter_by(username=username).first()
        
        if not user or not user.check_password(password):
            flash('Invalid username or password', 'error')
            return redirect(url_for('login'))
            
        if user_type == 'government' and not user.is_government:
            flash('This account is not registered as a government account', 'error')
            return redirect(url_for('login'))
            
        # Allow government users with pending verification to log in
        session['user_id'] = user.id
        
        if user.is_government:
            if not user.is_verified:
                flash('Your government account is pending verification. Some features will be limited until verification is complete.', 'warning')
            return redirect(url_for('dashboard'))
        else:
            return redirect(url_for('index'))
            
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if is_logged_in():
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        user_type = request.form.get('user_type', 'user')
        
        # Check if passwords match
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return redirect(url_for('register'))
            
        # Check if user already exists
        existing_user = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            flash('Username or email already exists', 'error')
            return redirect(url_for('register'))
            
        # Create new user
        new_user = User(
            username=username,
            email=email,
            is_government=(user_type == 'government')
        )
        new_user.set_password(password)
        
        # Additional fields for government users
        if user_type == 'government':
            agency_name = request.form.get('agency_name')
            department = request.form.get('department')
            
            if not agency_name or not department:
                flash('Agency name and department are required for government accounts', 'error')
                return redirect(url_for('register'))
                
            new_user.agency_name = agency_name
            new_user.department = department
            
        db.session.add(new_user)
        db.session.commit()
        
        if user_type == 'government':
            flash('Your government account has been registered and is pending verification', 'success')
        else:
            flash('Registration successful! You can now log in', 'success')
            
        return redirect(url_for('login'))
        
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('You have been logged out', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    # Get the current user
    user = User.query.get(session['user_id'])
    
    # Get all alerts created by this user
    alerts = Alert.query.filter_by(author_id=session['user_id']).order_by(Alert.created_at.desc()).all()
    
    if user.is_government and not user.is_verified:
        flash('Your government account is pending verification. Some features may be limited.', 'warning')
    
    # Count the alerts by type
    stats = {
        'total': len(alerts),
        'traffic': sum(1 for alert in alerts if alert.alert_type == 'Traffic'),
        'emergency': sum(1 for alert in alerts if alert.alert_type == 'Emergency'),
        'construction': sum(1 for alert in alerts if alert.alert_type == 'Construction'),
        'weather': sum(1 for alert in alerts if alert.alert_type == 'Weather'),
    }
    
    return render_template('dashboard.html', alerts=alerts, stats=stats, current_user=user)

@app.route('/new_alert', methods=['GET', 'POST'])
def new_alert():
    if not is_logged_in() or not is_government_user():
        flash('You need to be logged in as a verified government user to create alerts', 'error')
        return redirect(url_for('login'))
        
    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        alert_type = request.form.get('alert_type')
        lat = request.form.get('lat')
        lng = request.form.get('lng')
        
        if not all([title, description, alert_type, lat, lng]):
            flash('All fields are required', 'error')
            return redirect(url_for('new_alert'))
            
        new_alert = Alert(
            title=title,
            description=description,
            alert_type=alert_type,
            location_lat=float(lat),
            location_lng=float(lng),
            author_id=session['user_id']
        )
        
        db.session.add(new_alert)
        db.session.commit()
        
        flash('Alert created successfully', 'success')
        return redirect(url_for('dashboard'))
        
    return render_template('new_alert.html')

@app.route('/edit_alert/<int:alert_id>', methods=['GET', 'POST'])
def edit_alert(alert_id):
    if not is_logged_in() or not is_government_user():
        flash('You need to be logged in as a verified government user to edit alerts', 'error')
        return redirect(url_for('login'))
        
    alert = Alert.query.get_or_404(alert_id)
    
    # Check if the alert belongs to the current user
    if alert.author_id != session['user_id']:
        flash('You do not have permission to edit this alert', 'error')
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        alert_type = request.form.get('alert_type')
        lat = request.form.get('lat')
        lng = request.form.get('lng')
        
        if not all([title, description, alert_type, lat, lng]):
            flash('All fields are required', 'error')
            return redirect(url_for('edit_alert', alert_id=alert_id))
            
        alert.title = title
        alert.description = description
        alert.alert_type = alert_type
        alert.location_lat = float(lat)
        alert.location_lng = float(lng)
        alert.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        flash('Alert updated successfully', 'success')
        return redirect(url_for('dashboard'))
        
    return render_template('edit_alert.html', alert=alert)

@app.route('/delete_alert/<int:alert_id>', methods=['POST'])
def delete_alert(alert_id):
    if not is_logged_in() or not is_government_user():
        flash('You need to be logged in as a verified government user to delete alerts', 'error')
        return redirect(url_for('login'))
        
    alert = Alert.query.get_or_404(alert_id)
    
    # Check if the alert belongs to the current user
    if alert.author_id != session['user_id']:
        flash('You do not have permission to delete this alert', 'error')
        return redirect(url_for('dashboard'))
        
    db.session.delete(alert)
    db.session.commit()
    
    flash('Alert deleted successfully', 'success')
    return redirect(url_for('dashboard'))

@app.route('/bulk_delete_alerts', methods=['POST'])
def bulk_delete_alerts():
    if not is_logged_in() or not is_government_user():
        flash('You need to be logged in as a verified government user to delete alerts', 'error')
        return redirect(url_for('login'))
    
    try:
        alert_ids = request.form.get('alert_ids')
        if not alert_ids:
            flash('No alerts selected for deletion', 'error')
            return redirect(url_for('dashboard'))
        
        # Parse the JSON string to get the alert IDs
        alert_ids = json.loads(alert_ids)
        
        # Get all alerts and verify ownership
        deleted_count = 0
        for alert_id in alert_ids:
            alert = Alert.query.get(alert_id)
            if alert and alert.author_id == session['user_id']:
                db.session.delete(alert)
                deleted_count += 1
        
        db.session.commit()
        
        if deleted_count > 0:
            flash(f'{deleted_count} alerts deleted successfully', 'success')
        else:
            flash('No alerts were deleted', 'warning')
            
    except Exception as e:
        db.session.rollback()
        flash(f'An error occurred: {str(e)}', 'error')
    
    return redirect(url_for('dashboard'))

@app.route('/save_route', methods=['POST'])
def save_route():
    if not is_logged_in():
        return {'success': False, 'message': 'You need to be logged in to save routes'}, 401
        
    data = request.get_json()
    
    # Validate input
    required_fields = ['name', 'start_lat', 'start_lng', 'end_lat', 'end_lng']
    if not all(field in data for field in required_fields):
        return {'success': False, 'message': 'Missing required fields'}, 400
        
    # Create new saved route
    new_route = SavedRoute(
        name=data['name'],
        start_lat=data['start_lat'],
        start_lng=data['start_lng'],
        end_lat=data['end_lat'],
        end_lng=data['end_lng'],
        user_id=session['user_id']
    )
    
    db.session.add(new_route)
    db.session.commit()
    
    return {'success': True, 'message': 'Route saved successfully'}, 200

@app.route('/my_routes')
def my_routes():
    if not is_logged_in():
        flash('You need to be logged in to view your saved routes', 'error')
        return redirect(url_for('login'))
        
    routes = SavedRoute.query.filter_by(user_id=session['user_id']).order_by(SavedRoute.created_at.desc()).all()
    return render_template('my_routes.html', routes=routes)

@app.route('/delete_route/<int:route_id>', methods=['POST'])
def delete_route(route_id):
    if not is_logged_in():
        flash('You need to be logged in to delete routes', 'error')
        return redirect(url_for('login'))
        
    route = SavedRoute.query.get_or_404(route_id)
    
    # Check if the route belongs to the current user
    if route.user_id != session['user_id']:
        flash('You do not have permission to delete this route', 'error')
        return redirect(url_for('my_routes'))
        
    db.session.delete(route)
    db.session.commit()
    
    flash('Route deleted successfully', 'success')
    return redirect(url_for('my_routes'))

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500

# Initialize database and seed data
def init_db():
    with app.app_context():
        db.create_all()
        
        # Check if there are existing users
        if User.query.count() == 0:
            # Create default admin user
            admin_user = User(
                username='admin',
                email='admin@admin.com',
                is_government=True,
                agency_name='Admin',
                department='Admin',
                is_verified=True
            )
            admin_user.set_password('admin')
            
            # Create default regular user
            regular_user = User(
                username='user',
                email='user@user.com',
                is_government=False
            )
            regular_user.set_password('user')
            
            db.session.add(admin_user)
            db.session.add(regular_user)
            db.session.commit()
            
            # Create sample alerts
            sample_alerts = [
                Alert(
                    title='Highway 101 Closure',
                    description='Highway 101 closed between Main St and Oak Ave due to construction. Expected to reopen at 5 PM.',
                    alert_type='Traffic',
                    location_lat=37.7749,
                    location_lng=-122.4194,
                    author_id=admin_user.id
                ),
                Alert(
                    title='Flash Flood Warning',
                    description='Flash flood warning in effect for downtown area. Avoid low-lying areas and follow safety instructions.',
                    alert_type='Emergency',
                    location_lat=37.7833,
                    location_lng=-122.4167,
                    author_id=admin_user.id
                ),
                Alert(
                    title='Bridge Repair',
                    description='Golden Gate Bridge undergoing maintenance. One lane closed.',
                    alert_type='Construction',
                    location_lat=37.8199,
                    location_lng=-122.4783,
                    author_id=admin_user.id
                ),
                Alert(
                    title='Flood Warning',
                    description='Heavy rain expected. Possible flooding in low-lying areas.',
                    alert_type='Weather',
                    location_lat=37.7833,
                    location_lng=-122.4167,
                    author_id=admin_user.id
                )
            ]
            
            for alert in sample_alerts:
                db.session.add(alert)
            
            db.session.commit()

# Initialize database when the app starts (needed for Render)
init_db()

# Run the application
if __name__ == '__main__':
    app.run(debug=True) 