from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from extensions import db
from models import User, Alert

alerts_bp = Blueprint('alerts', __name__, url_prefix='/api/alerts')

VALID_ALERT_TYPES = {'Traffic', 'Emergency', 'Construction', 'Weather'}


def _require_verified_gov(user_id):
    user = User.query.get(user_id)
    if not user:
        return None, (jsonify({'error': 'NOT_FOUND', 'message': 'User not found'}), 404)
    # Superuser can also manage alerts
    if user.is_superuser:
        return user, None
    if not user.is_government:
        return None, (jsonify({'error': 'FORBIDDEN', 'message': 'Government account required'}), 403)
    if not user.is_verified:
        return None, (jsonify({'error': 'FORBIDDEN', 'message': 'Account not yet verified'}), 403)
    return user, None


@alerts_bp.route('', methods=['GET'])
def get_alerts():
    alert_type  = request.args.get('type')
    author_only = request.args.get('author_only', 'false').lower() == 'true'

    query = Alert.query
    if alert_type:
        query = query.filter_by(alert_type=alert_type)
    if author_only:
        try:
            verify_jwt_in_request(optional=False)
        except Exception:
            return jsonify({'error': 'UNAUTHORIZED', 'message': 'Authentication required'}), 401
        query = query.filter_by(author_id=int(get_jwt_identity()))

    return jsonify([a.to_dict() for a in query.order_by(Alert.created_at.desc()).all()]), 200


@alerts_bp.route('/<int:alert_id>', methods=['GET'])
def get_alert(alert_id):
    alert = Alert.query.get(alert_id)
    if not alert:
        return jsonify({'error': 'NOT_FOUND', 'message': 'Alert not found'}), 404
    return jsonify(alert.to_dict()), 200


@alerts_bp.route('', methods=['POST'])
@jwt_required()
def create_alert():
    user_id = int(get_jwt_identity())
    user, err = _require_verified_gov(user_id)
    if err: return err

    data = request.get_json() or {}
    required = ['title', 'description', 'alert_type', 'location_lat', 'location_lng']
    missing = [f for f in required if data.get(f) is None or data.get(f) == '']
    if missing:
        return jsonify({'error': 'VALIDATION_ERROR', 'message': f'Missing: {", ".join(missing)}'}), 422
    if data['alert_type'] not in VALID_ALERT_TYPES:
        return jsonify({'error': 'VALIDATION_ERROR', 'message': f'alert_type must be one of: {", ".join(VALID_ALERT_TYPES)}'}), 422

    alert = Alert(title=data['title'], description=data['description'],
                  alert_type=data['alert_type'],
                  location_lat=float(data['location_lat']),
                  location_lng=float(data['location_lng']),
                  author_id=user_id)
    db.session.add(alert)
    db.session.commit()
    return jsonify(alert.to_dict()), 201


@alerts_bp.route('/<int:alert_id>', methods=['PUT'])
@jwt_required()
def update_alert(alert_id):
    user_id = int(get_jwt_identity())
    user, err = _require_verified_gov(user_id)
    if err: return err

    alert = Alert.query.get(alert_id)
    if not alert:
        return jsonify({'error': 'NOT_FOUND', 'message': 'Alert not found'}), 404

    data = request.get_json() or {}
    if 'title'       in data: alert.title       = data['title']
    if 'description' in data: alert.description = data['description']
    if 'alert_type'  in data:
        if data['alert_type'] not in VALID_ALERT_TYPES:
            return jsonify({'error': 'VALIDATION_ERROR', 'message': 'Invalid alert_type'}), 422
        alert.alert_type = data['alert_type']
    if 'location_lat' in data: alert.location_lat = float(data['location_lat'])
    if 'location_lng' in data: alert.location_lng = float(data['location_lng'])
    alert.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(alert.to_dict()), 200


@alerts_bp.route('/<int:alert_id>', methods=['DELETE'])
@jwt_required()
def delete_alert(alert_id):
    user_id = int(get_jwt_identity())
    user, err = _require_verified_gov(user_id)
    if err: return err

    alert = Alert.query.get(alert_id)
    if not alert:
        return jsonify({'error': 'NOT_FOUND', 'message': 'Alert not found'}), 404
    db.session.delete(alert)
    db.session.commit()
    return jsonify({'message': 'Alert deleted'}), 200


@alerts_bp.route('/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete_alerts():
    user_id = int(get_jwt_identity())
    user, err = _require_verified_gov(user_id)
    if err: return err

    ids = (request.get_json() or {}).get('ids', [])
    deleted = 0
    for aid in ids:
        alert = Alert.query.get(aid)
        if alert:
            db.session.delete(alert)
            deleted += 1
    db.session.commit()
    return jsonify({'deleted': deleted}), 200
