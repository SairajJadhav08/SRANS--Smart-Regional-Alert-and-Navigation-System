from flask import Flask, jsonify
from extensions import db, jwt, cors
import os


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_for_testing')
    app.config['JWT_SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_for_testing')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, origins=[os.environ.get('FRONTEND_ORIGIN', 'http://localhost:5173')])

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

    # Seed DB
    with app.app_context():
        _init_db()

    return app


def _init_db():
    from models import User, Alert

    db.create_all()

    if User.query.count() == 0:
        superuser = User(
            username='Sairaj',
            email='sairajjadhav433@gmail.com',
            is_government=False,
            is_superuser=True,
            is_verified=True,
        )
        superuser.set_password('sairaj@123')

        admin_user = User(
            username='admin',
            email='admin@admin.com',
            is_government=True,
            agency_name='Admin Agency',
            department='Administration',
            is_verified=True,
        )
        admin_user.set_password('admin')

        regular_user = User(
            username='user',
            email='user@user.com',
            is_government=False,
        )
        regular_user.set_password('user')

        db.session.add_all([superuser, admin_user, regular_user])
        db.session.commit()

        sample_alerts = [
            Alert(title='Highway 101 Closure',
                  description='Highway 101 closed between Main St and Oak Ave due to construction.',
                  alert_type='Traffic', location_lat=18.5204, location_lng=73.8567,
                  author_id=admin_user.id),
            Alert(title='Flash Flood Warning',
                  description='Flash flood warning in effect for downtown area.',
                  alert_type='Emergency', location_lat=18.5304, location_lng=73.8667,
                  author_id=admin_user.id),
            Alert(title='Bridge Repair',
                  description='Bridge undergoing maintenance. One lane closed.',
                  alert_type='Construction', location_lat=18.5104, location_lng=73.8467,
                  author_id=admin_user.id),
            Alert(title='Heavy Rain Warning',
                  description='Heavy rain expected. Possible flooding in low-lying areas.',
                  alert_type='Weather', location_lat=18.5404, location_lng=73.8767,
                  author_id=admin_user.id),
        ]
        db.session.add_all(sample_alerts)
        db.session.commit()


app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
