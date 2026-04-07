from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_for_testing')
app.config['JWT_SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_for_testing')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app, origins=[os.environ.get('FRONTEND_ORIGIN', 'http://localhost:5173')])

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
    alert_type = db.Column(db.String(50), nullable=False)
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
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
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


# Register blueprints
from api.auth import auth_bp
from api.alerts import alerts_bp
from api.routes_bp import routes_bp
from api.contact import contact_bp

app.register_blueprint(auth_bp)
app.register_blueprint(alerts_bp)
app.register_blueprint(routes_bp)
app.register_blueprint(contact_bp)


# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    return jsonify({'error': 'NOT_FOUND', 'message': 'Resource not found'}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'SERVER_ERROR', 'message': 'Internal server error'}), 500


# Initialize database and seed data
def init_db():
    with app.app_context():
        db.create_all()

        if User.query.count() == 0:
            admin_user = User(
                username='admin',
                email='admin@admin.com',
                is_government=True,
                agency_name='Admin',
                department='Admin',
                is_verified=True,
            )
            admin_user.set_password('admin')

            regular_user = User(
                username='user',
                email='user@user.com',
                is_government=False,
            )
            regular_user.set_password('user')

            db.session.add(admin_user)
            db.session.add(regular_user)
            db.session.commit()

            sample_alerts = [
                Alert(
                    title='Highway 101 Closure',
                    description='Highway 101 closed between Main St and Oak Ave due to construction. Expected to reopen at 5 PM.',
                    alert_type='Traffic',
                    location_lat=37.7749,
                    location_lng=-122.4194,
                    author_id=admin_user.id,
                ),
                Alert(
                    title='Flash Flood Warning',
                    description='Flash flood warning in effect for downtown area. Avoid low-lying areas and follow safety instructions.',
                    alert_type='Emergency',
                    location_lat=37.7833,
                    location_lng=-122.4167,
                    author_id=admin_user.id,
                ),
                Alert(
                    title='Bridge Repair',
                    description='Golden Gate Bridge undergoing maintenance. One lane closed.',
                    alert_type='Construction',
                    location_lat=37.8199,
                    location_lng=-122.4783,
                    author_id=admin_user.id,
                ),
                Alert(
                    title='Flood Warning',
                    description='Heavy rain expected. Possible flooding in low-lying areas.',
                    alert_type='Weather',
                    location_lat=37.7833,
                    location_lng=-122.4167,
                    author_id=admin_user.id,
                ),
            ]

            for alert in sample_alerts:
                db.session.add(alert)

            db.session.commit()


# Initialize database when the app starts
init_db()

if __name__ == '__main__':
    app.run(debug=True)
