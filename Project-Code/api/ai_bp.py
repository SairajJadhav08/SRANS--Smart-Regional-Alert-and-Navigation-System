import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import SavedRoute, Alert
from extensions import db
from groq import Groq

ai_bp = Blueprint('ai_bp', __name__, url_prefix='/api/ai')

# Initialize Groq client
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
client = Groq(api_key=GROQ_API_KEY)

@ai_bp.route('/routine-planner', methods=['POST'])
@jwt_required()
def routine_planner():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    route_id = data.get('route_id')
    arrival_time = data.get('arrival_time')
    
    if not route_id or not arrival_time:
        return jsonify({'error': 'VALIDATION_ERROR', 'message': 'Missing route_id or arrival_time'}), 422
        
    route = SavedRoute.query.get(route_id)
    if not route or route.user_id != user_id:
        return jsonify({'error': 'NOT_FOUND', 'message': 'Route not found'}), 404
        
    # Get active alerts
    alerts = Alert.query.all()
    alerts_text = ""
    for idx, alert in enumerate(alerts):
        alerts_text += f"{idx+1}. {alert.alert_type} - {alert.title}: {alert.description} (Lat: {alert.location_lat}, Lng: {alert.location_lng})\n"
        
    if not alerts_text:
        alerts_text = "No active alerts in the system."
        
    prompt = f"""
    You are an expert AI traffic advisor for SRANS (Smart Regional Alert and Navigation System).
    The user wants to travel on their saved route from Start ({route.start_lat}, {route.start_lng}) 
    to End ({route.end_lat}, {route.end_lng}) and needs to arrive by {arrival_time}.
    
    Current active system alerts:
    {alerts_text}
    
    Based on the alerts and the route coordinates, please provide a short, helpful recommendation.
    Include:
    1. A recommended departure time to ensure they arrive by {arrival_time}.
    2. Any specific alerts they should watch out for or avoid.
    3. A brief encouragement.
    
    Keep the response concise (2-4 sentences max) and user-friendly. Do not include markdown formatting like asterisks.
    """
    
    try:
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "You are a helpful and concise traffic advisor assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=150,
        )
        recommendation = completion.choices[0].message.content
        return jsonify({'recommendation': recommendation}), 200
    except Exception as e:
        return jsonify({'error': 'AI_SERVICE_ERROR', 'message': str(e)}), 500
