from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

alerts_bp = Blueprint('alerts', __name__, url_prefix='/api/alerts')

VALID_ALERT_TYPES = {'Traffic', 'Emergency', 'Construction', 'Weather'}


def _alert_to_dict(alert):
    return {
        'id': alert.id,
        'alert_type': alert.alert_type,
        'title': alert.title,
        'description': alert.description,
        'location_lat': alert.location_lat,
        'location_lng': alert.location_lng,
        'created_at': alert.created_at.strftime('%Y-%m-%dT%H:%M:%S'),
        'updated_at': alert.updated_at.strftime('%Y-%m-%dT%H:%M:%S'),
        'author_id': alert.author_id,
    }


def _require_verified_gov(user_id):
    """Check that user exists, is_government, and is_verified.
    Returns (user, None) on success or (None, error_response_tuple) on failure."""
    from app import User

    user = User.query.get(user_id)
    if not user:
        return None, (jsonify({'error': 'NOT_FOUND', 'message': 'User not found'}), 404)
    if not user.is_government:
        return None, (jsonify({'error': 'FORBIDDEN', 'message': 'Government account required'}), 403)
    if not user.is_verified:
        return None, (jsonify({'error': 'FORBIDDEN', 'message': 'Account not yet verified'}), 403)
    return user, None


# ---------------------------------------------------------------------------
# GET /api/alerts
# ---------------------------------------------------------------------------
@alerts_bp.route('', methods=['GET'])
def get_alerts():
    from app import Alert

    alert_type = request.args.get('type')
    author_only = request.args.get('author_only', 'false').lower() == 'true'

    query = Alert.query

    if alert_type:
        query = query.filter_by(alert_type=alert_type)

    if author_only:
        # Require JWT when author_only is requested
        try:
            verify_jwt_in_request(optional=False)
        except Exception:
            return jsonify({'error': 'UNAUTHORIZED', 'message': 'Authentication required'}), 401
        current_user_id = get_jwt_identity()
        query = query.filter_by(author_id=current_user_id)

    alerts = query.order_by(Alert.created_at.desc()).all()
    return jsonify([_alert_to_dict(a) for a in alerts]), 200


# ---------------------------------------------------------------------------
# GET /api/alerts/<alert_id>
# ---------------------------------------------------------------------------
@alerts_bp.route('/<int:alert_id>', methods=['GET'])
def get_alert(alert_id):
    from app import Alert

    alert = Alert.query.get(alert_id)
    if not alert:
        return jsonify({'error': 'NOT_FOUND', 'message': 'Alert not found'}), 404
    return jsonify(_alert_to_dict(alert)), 200


# ---------------------------------------------------------------------------
# POST /api/alerts
# ---------------------------------------------------------------------------
@alerts_bp.route('', methods=['POST'])
@jwt_required()
def create_alert():
    from app import db, Alert

    current_user_id = get_jwt_identity()
    user, err = _require_verified_gov(current_user_id)
    if err:
        return err

    data = request.get_json() or {}

    required = ['title', 'description', 'alert_type', 'location_lat', 'location_lng']
    missing = [f for f in required if not data.get(f) and data.get(f) != 0]
    if missing:
        return jsonify({
            'error': 'VALIDATION_ERROR',
            'message': f'Missing required fields: {", ".join(missing)}'
        }), 422

    if data['alert_type'] not in VALID_ALERT_TYPES:
        return jsonify({
            'error': 'VALIDATION_ERROR',
            'message': f'alert_type must be one of: {", ".join(VALID_ALERT_TYPES)}'
        }), 422

    alert = Alert(
        title=data['title'],
        description=data['description'],
        alert_type=data['alert_type'],
        location_lat=float(data['location_lat']),
        location_lng=float(data['location_lng']),
        author_id=current_user_id,
    )
    db.session.add(alert)
    db.session.commit()

    return jsonify(_alert_to_dict(alert)), 201


# ---------------------------------------------------------------------------
# PUT /api/alerts/<alert_id>
# ---------------------------------------------------------------------------
@alerts_bp.route('/<int:alert_id>', methods=['PUT'])
@jwt_required()
def update_alert(alert_id):
    from app import db, Alert

    current_user_id = get_jwt_identity()
    user, err = _require_verified_gov(current_user_id)
    if err:
        return err

    alert = Alert.query.get(alert_id)
    if not alert:
        return jsonify({'error': 'NOT_FOUND', 'message': 'Alert not found'}), 404

    if alert.author_id != current_user_id:
        return jsonify({'error': 'FORBIDDEN', 'message': 'You do not own this alert'}), 403

    data = request.get_json() or {}

    if 'title' in data:
        alert.title = data['title']
    if 'description' in data:
        alert.description = data['description']
    if 'alert_type' in data:
        if data['alert_type'] not in VALID_ALERT_TYPES:
            return jsonify({
                'error': 'VALIDATION_ERROR',
                'message': f'alert_type must be one of: {", ".join(VALID_ALERT_TYPES)}'
            }), 422
        alert.alert_type = data['alert_type']
    if 'location_lat' in data:
        alert.location_lat = float(data['location_lat'])
    if 'location_lng' in data:
        alert.location_lng = float(data['location_lng'])

    from datetime import datetime
    alert.updated_at = datetime.utcnow()

    db.session.commit()
    return jsonify(_alert_to_dict(alert)), 200


# ---------------------------------------------------------------------------
# DELETE /api/alerts/<alert_id>
# ---------------------------------------------------------------------------
@alerts_bp.route('/<int:alert_id>', methods=['DELETE'])
@jwt_required()
def delete_alert(alert_id):
    from app import db, Alert

    current_user_id = get_jwt_identity()
    user, err = _require_verified_gov(current_user_id)
    if err:
        return err

    alert = Alert.query.get(alert_id)
    if not alert:
        return jsonify({'error': 'NOT_FOUND', 'message': 'Alert not found'}), 404

    if alert.author_id != current_user_id:
        return jsonify({'error': 'FORBIDDEN', 'message': 'You do not own this alert'}), 403

    db.session.delete(alert)
    db.session.commit()
    return jsonify({'message': 'Alert deleted'}), 200


# ---------------------------------------------------------------------------
# POST /api/alerts/bulk-delete
# ---------------------------------------------------------------------------
@alerts_bp.route('/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete_alerts():
    from app import db, Alert

    current_user_id = get_jwt_identity()
    user, err = _require_verified_gov(current_user_id)
    if err:
        return err

    data = request.get_json() or {}
    ids = data.get('ids', [])

    if not isinstance(ids, list):
        return jsonify({'error': 'VALIDATION_ERROR', 'message': '"ids" must be a list'}), 422

    deleted = 0
    for alert_id in ids:
        alert = Alert.query.get(alert_id)
        if alert and alert.author_id == current_user_id:
            db.session.delete(alert)
            deleted += 1

    db.session.commit()
    return jsonify({'deleted': deleted}), 200
