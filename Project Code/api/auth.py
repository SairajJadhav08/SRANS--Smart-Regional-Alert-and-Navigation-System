from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def _user_to_dict(user):
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_government': user.is_government,
        'agency_name': user.agency_name,
        'department': user.department,
        'is_verified': user.is_verified,
    }


@auth_bp.route('/login', methods=['POST'])
def login():
    from app import db, User

    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({
            'error': 'INVALID_CREDENTIALS',
            'message': 'Invalid username or password'
        }), 401

    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        return jsonify({
            'error': 'INVALID_CREDENTIALS',
            'message': 'Invalid username or password'
        }), 401

    token = create_access_token(identity=user.id)
    return jsonify({'token': token, 'user': _user_to_dict(user)}), 200


@auth_bp.route('/register', methods=['POST'])
def register():
    from app import db, User

    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    user_type = data.get('user_type', 'user')

    errors = {}

    if not username:
        errors['username'] = 'Username is required'
    if not email:
        errors['email'] = 'Email is required'
    if not password:
        errors['password'] = 'Password is required'

    if errors:
        return jsonify({
            'error': 'VALIDATION_ERROR',
            'message': 'Validation failed',
            'fields': errors
        }), 422

    # Check uniqueness
    if User.query.filter_by(username=username).first():
        return jsonify({
            'error': 'USERNAME_TAKEN',
            'message': 'Username already exists'
        }), 422

    if User.query.filter_by(email=email).first():
        return jsonify({
            'error': 'EMAIL_TAKEN',
            'message': 'Email already exists'
        }), 422

    is_government = user_type == 'government'
    agency_name = data.get('agency_name', '').strip() if is_government else None
    department = data.get('department', '').strip() if is_government else None

    if is_government:
        if not agency_name:
            return jsonify({
                'error': 'VALIDATION_ERROR',
                'message': 'Agency name is required for government accounts'
            }), 422
        if not department:
            return jsonify({
                'error': 'VALIDATION_ERROR',
                'message': 'Department is required for government accounts'
            }), 422

    new_user = User(
        username=username,
        email=email,
        is_government=is_government,
        agency_name=agency_name,
        department=department,
    )
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    if is_government:
        msg = 'Government account registered and pending verification'
    else:
        msg = 'Registration successful'

    return jsonify({'message': msg}), 201


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    from app import User

    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({
            'error': 'NOT_FOUND',
            'message': 'User not found'
        }), 404

    return jsonify(_user_to_dict(user)), 200
