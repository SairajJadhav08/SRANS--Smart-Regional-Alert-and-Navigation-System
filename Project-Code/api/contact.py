from flask import Blueprint, request, jsonify
from extensions import db
from models import ContactMessage

contact_bp = Blueprint('contact', __name__, url_prefix='/api/contact')


@contact_bp.route('', methods=['POST'])
def send_message():
    data = request.get_json() or {}
    required = ['name', 'email', 'subject', 'message']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'error': 'VALIDATION_ERROR', 'message': f'Missing: {", ".join(missing)}'}), 422

    msg = ContactMessage(name=data['name'], email=data['email'],
                         subject=data['subject'], message=data['message'])
    db.session.add(msg)
    db.session.commit()
    return jsonify({'message': 'Message sent successfully'}), 200
