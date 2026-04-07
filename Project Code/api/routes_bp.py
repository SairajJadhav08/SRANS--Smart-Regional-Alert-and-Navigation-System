from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

routes_bp = Blueprint('routes_bp', __name__, url_prefix='/api/routes')


def _route_to_dict(route):
    return {
        'id': route.id,
        'name': route.name,
        'start_lat': route.start_lat,
        'start_lng': route.start_lng,
        'end_lat': route.end_lat,
        'end_lng': route.end_lng,
        'created_at': route.created_at.isoformat(),
        'user_id': route.user_id,
    }


@routes_bp.route('', methods=['GET'])
@jwt_required()
def get_routes():
    from app import db, SavedRoute

    user_id = get_jwt_identity()
    routes = SavedRoute.query.filter_by(user_id=user_id).order_by(SavedRoute.created_at.desc()).all()
    return jsonify([_route_to_dict(r) for r in routes]), 200


@routes_bp.route('', methods=['POST'])
@jwt_required()
def create_route():
    from app import db, SavedRoute

    user_id = get_jwt_identity()
    data = request.get_json() or {}

    required_fields = ['name', 'start_lat', 'start_lng', 'end_lat', 'end_lng']
    missing = [f for f in required_fields if data.get(f) is None]
    if missing:
        return jsonify({
            'error': 'VALIDATION_ERROR',
            'message': f'Missing required fields: {", ".join(missing)}'
        }), 422

    route = SavedRoute(
        name=data['name'],
        start_lat=data['start_lat'],
        start_lng=data['start_lng'],
        end_lat=data['end_lat'],
        end_lng=data['end_lng'],
        user_id=user_id,
    )
    db.session.add(route)
    db.session.commit()

    return jsonify(_route_to_dict(route)), 201


@routes_bp.route('/<int:route_id>', methods=['DELETE'])
@jwt_required()
def delete_route(route_id):
    from app import db, SavedRoute

    user_id = get_jwt_identity()
    route = SavedRoute.query.get(route_id)

    if not route:
        return jsonify({
            'error': 'NOT_FOUND',
            'message': 'Route not found'
        }), 404

    if route.user_id != user_id:
        return jsonify({
            'error': 'FORBIDDEN',
            'message': 'You do not have permission to delete this route'
        }), 403

    db.session.delete(route)
    db.session.commit()

    return jsonify({'message': 'Route deleted'}), 200
