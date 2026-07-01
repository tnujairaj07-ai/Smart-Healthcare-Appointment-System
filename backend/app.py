from flask import Flask, request, jsonify
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from models import db, User, Doctor, Condition, Appointment, SymptomCheck, Prescription
from utils.nlp_engine import analyze_symptoms
from utils.doctor_matcher import match_doctors
from utils.qr_generator import generate_prescription_qr
from config import Config
import json

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
jwt = JWTManager(app)

# Create DB tables
with app.app_context():
    db.create_all()

# ---------- AUTH ----------

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400

    user = User(
        name=data['name'],
        email=data['email'],
        password=data['password'],  # TODO: hash in real app
        role=data['role']
    )
    db.session.add(user)
    db.session.commit()

    if data['role'] == 'doctor':
        doctor = Doctor(
            user_id=user.id,
            specialty=data.get('specialty', 'General Medicine'),
            location=data.get('location', 'Gurugram')
        )
        db.session.add(doctor)
        db.session.commit()

    return jsonify({'message': 'Registered successfully', 'user_id': user.id}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()

    if user and user.password == data['password']:
        access_token = create_access_token(identity={'id': user.id, 'role': user.role})
        return jsonify({
            'token': access_token,
            'role': user.role,
            'name': user.name
        }), 200

    return jsonify({'error': 'Invalid credentials'}), 401

# Helper to get current user id from JWT
def current_user_id():
    identity = get_jwt_identity()
    return identity['id'] if identity else None

# ---------- AI SYMPTOM CHECKER ----------

@app.route('/api/ai/symptom-check', methods=['POST'])
@jwt_required()
def symptom_check():
    data = request.json
    symptoms_input = data['symptoms']
    patient_id = current_user_id()

    conditions = Condition.query.all()
    conditions_list = [
        {
            'name': c.name,
            'symptoms': c.symptoms,
            'description': c.description,
            'specialty': c.recommended_specialty,
            'urgency': c.urgency
        }
        for c in conditions
    ]

    results = analyze_symptoms(symptoms_input, conditions_list)

    check = SymptomCheck(
        patient_id=patient_id,
        symptoms=symptoms_input,
        diagnosed_conditions=json.dumps([r['condition'] for r in results]),
        confidence_scores=json.dumps([r['confidence'] for r in results])
    )
    db.session.add(check)
    db.session.commit()

    return jsonify({'results': results}), 200

# ---------- DOCTOR MATCHING ----------

@app.route('/api/doctors/match', methods=['POST'])
@jwt_required()
def match():
    data = request.json
    symptoms = data['symptoms']
    patient_location = data['location']

    conditions = Condition.query.all()
    conditions_list = [
        {
            'name': c.name,
            'symptoms': c.symptoms,
            'recommended_specialty': c.recommended_specialty
        }
        for c in conditions
    ]

    diagnosed = analyze_symptoms(symptoms, conditions_list)
    recommended_specialty = diagnosed[0]['specialty'] if diagnosed else 'General Medicine'

    doctors = Doctor.query.filter_by(specialty=recommended_specialty).all()
    doctors_list = [
        {
            'id': d.id,
            'name': d.user.name,
            'specialty': d.specialty,
            'location': d.location,
            'rating': d.rating,
            'availability': d.availability
        }
        for d in doctors
    ]

    matches = match_doctors(patient_location, doctors_list)
    return jsonify({'matches': matches}), 200

# ---------- APPOINTMENT BOOKING ----------

@app.route('/api/appointments/book', methods=['POST'])
@jwt_required()
def book_appointment():
    data = request.json
    patient_id = current_user_id()

    appointment = Appointment(
        patient_id=patient_id,
        doctor_id=data['doctor_id'],
        date=data['date'],
        time_slot=data['time_slot']
    )
    db.session.add(appointment)
    db.session.commit()

    return jsonify({
        'message': 'Appointment booked',
        'appointment_id': appointment.id
    }), 201

# ---------- PRESCRIPTION + QR ----------

@app.route('/api/prescriptions/generate', methods=['POST'])
@jwt_required()
def generate_prescription():
    data = request.json

    prescription = Prescription(
        appointment_id=data['appointment_id'],
        doctor_id=data['doctor_id'],
        patient_id=data['patient_id'],
        diagnosis=data['diagnosis'],
        medications=json.dumps(data['medications']),
        notes=data.get('notes', '')
    )
    db.session.add(prescription)
    db.session.commit()

    qr_path, pdf_path = generate_prescription_qr(
        prescription.id,
        data['patient_name'],
        data['doctor_name'],
        data['diagnosis'],
        data['medications']
    )

    prescription.qr_code_path = qr_path
    prescription.pdf_path = pdf_path
    db.session.commit()

    return jsonify({
        'message': 'Prescription generated',
        'qr_path': qr_path,
        'pdf_path': pdf_path
    }), 201

# ---------- ANALYTICS ----------

@app.route('/api/analytics/appointments', methods=['GET'])
@jwt_required()
def appointment_analytics():
    user_id = current_user_id()
    appointments = Appointment.query.filter_by(patient_id=user_id).all()

    trends = {}
    for appt in appointments:
        trends[appt.date] = trends.get(appt.date, 0) + 1

    return jsonify({'trends': trends}), 200

@app.route('/api/analytics/symptoms', methods=['GET'])
@jwt_required()
def symptom_analytics():
    user_id = current_user_id()
    checks = SymptomCheck.query.filter_by(patient_id=user_id).all()

    symptom_count = {}
    for check in checks:
        for symptom in check.symptoms.split(','):
            symptom = symptom.strip()
            symptom_count[symptom] = symptom_count.get(symptom, 0) + 1

    return jsonify({'top_symptoms': symptom_count}), 200

if __name__ == '__main__':
    app.run(debug=True)