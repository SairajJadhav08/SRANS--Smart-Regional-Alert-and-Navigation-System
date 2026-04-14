from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db
from models import User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def _user_to_dict(user):
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_government': user.is_government,
        'is_superuser': user.is_superuser,
        'agency_name': user.agency_name,
        'department': user.department,
        'is_verified': user.is_verified,
    }


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'INVALID_CREDENTIALS', 'message': 'Invalid username or password'}), 401

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'INVALID_CREDENTIALS', 'message': 'Invalid username or password'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': _user_to_dict(user)}), 200


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    user_type = data.get('user_type', 'user')

    errors = {}
    if not username: errors['username'] = 'Username is required'
    if not email:    errors['email'] = 'Email is required'
    if not password: errors['password'] = 'Password is required'
    if errors:
        return jsonify({'error': 'VALIDATION_ERROR', 'message': 'Validation failed', 'fields': errors}), 422

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'USERNAME_TAKEN', 'message': 'Username already exists'}), 422
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'EMAIL_TAKEN', 'message': 'Email already exists'}), 422

    is_government = user_type == 'government'
    agency_name = data.get('agency_name', '').strip() if is_government else None
    department  = data.get('department', '').strip()  if is_government else None

    if is_government:
        if not agency_name:
            return jsonify({'error': 'VALIDATION_ERROR', 'message': 'Agency name is required'}), 422
        if not department:
            return jsonify({'error': 'VALIDATION_ERROR', 'message': 'Department is required'}), 422

    new_user = User(username=username, email=email,
                    is_government=is_government,
                    agency_name=agency_name, department=department)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    msg = 'Government account registered and pending verification' if is_government else 'Registration successful'
    return jsonify({'message': msg}), 201


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'NOT_FOUND', 'message': 'User not found'}), 404
    return jsonify(_user_to_dict(user)), 200


@auth_bp.route('/admin/gov-users', methods=['GET'])
@jwt_required()
def list_gov_users():
    current_id = int(get_jwt_identity())
    me = User.query.get(current_id)
    if not me or not me.is_superuser:
        return jsonify({'error': 'FORBIDDEN', 'message': 'Superuser access required'}), 403
    users = User.query.filter_by(is_government=True).order_by(User.id).all()
    return jsonify([_user_to_dict(u) for u in users]), 200


@auth_bp.route('/admin/gov-users/<int:user_id>/approve', methods=['POST'])
@jwt_required()
def approve_gov_user(user_id):
    current_id = int(get_jwt_identity())
    me = User.query.get(current_id)
    if not me or not me.is_superuser:
        return jsonify({'error': 'FORBIDDEN', 'message': 'Superuser access required'}), 403
    user = User.query.get(user_id)
    if not user or not user.is_government:
        return jsonify({'error': 'NOT_FOUND', 'message': 'Government user not found'}), 404
    user.is_verified = True
    db.session.commit()
    return jsonify({'message': f'{user.username} approved', 'user': _user_to_dict(user)}), 200


@auth_bp.route('/admin/gov-users/<int:user_id>/revoke', methods=['POST'])
@jwt_required()
def revoke_gov_user(user_id):
    current_id = int(get_jwt_identity())
    me = User.query.get(current_id)
    if not me or not me.is_superuser:
        return jsonify({'error': 'FORBIDDEN', 'message': 'Superuser access required'}), 403
    user = User.query.get(user_id)
    if not user or not user.is_government:
        return jsonify({'error': 'NOT_FOUND', 'message': 'Government user not found'}), 404
    user.is_verified = False
    db.session.commit()
    return jsonify({'message': f'{user.username} revoked', 'user': _user_to_dict(user)}), 200
