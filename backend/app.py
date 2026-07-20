from flask import Flask, request, jsonify
from datetime import datetime
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from models import db, User, Doctor, Condition, Appointment, SymptomCheck, Prescription, MedicalRecord, Product, PharmacyOrder, RAGDataset, SupportTicket, Referral
from utils.nlp_engine import analyze_symptoms
from utils.doctor_matcher import match_doctors
from utils.qr_generator import generate_prescription_qr
from config import Config
import json
from utils.ai_handler import predict_condition, OllamaClient, get_condition_precautions, calculate_symptom_severity_score

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
jwt = JWTManager(app)

@jwt.user_identity_loader
def user_identity_lookup(user_data):
    if isinstance(user_data, dict):
        return json.dumps(user_data)
    return str(user_data)

# Create DB tables
with app.app_context():
    db.create_all()
    
    # Migrations: Alter user and doctor tables to include new columns if they do not exist
    try:
        db.session.execute(db.text("ALTER TABLE user ADD COLUMN status VARCHAR(20) DEFAULT 'Active';"))
        db.session.commit()
    except Exception:
        db.session.rollback()
        
    try:
        db.session.execute(db.text("ALTER TABLE doctor ADD COLUMN duty_status VARCHAR(50) DEFAULT 'On Duty';"))
        db.session.commit()
    except Exception:
        db.session.rollback()

    try:
        db.session.execute(db.text("ALTER TABLE doctor ADD COLUMN hospital VARCHAR(100) DEFAULT 'St. Jude General';"))
        db.session.commit()
    except Exception:
        db.session.rollback()

    try:
        db.session.execute(db.text("ALTER TABLE doctor ADD COLUMN education VARCHAR(100) DEFAULT 'Harvard Medical School';"))
        db.session.commit()
    except Exception:
        db.session.rollback()

    try:
        db.session.execute(db.text("ALTER TABLE doctor ADD COLUMN license VARCHAR(50) DEFAULT 'MD-2023-4982';"))
        db.session.commit()
    except Exception:
        db.session.rollback()

    # User demographics table migrations
    for col, col_type in [
        ("phone", "VARCHAR(30)"),
        ("address", "VARCHAR(200)"),
        ("dob", "VARCHAR(30)"),
        ("allergies", "VARCHAR(200)"),
        ("chronic", "VARCHAR(200)"),
        ("blood_type", "VARCHAR(10)"),
        ("past_illnesses", "VARCHAR(200)"),
        ("intake_form", "TEXT")
    ]:
        try:
            db.session.execute(db.text(f"ALTER TABLE user ADD COLUMN {col} {col_type};"))
            db.session.commit()
        except Exception:
            db.session.rollback()

    # Seed Products
    if Product.query.count() == 0:
        products = [
            Product(name="Amoxicillin 500mg", price=18.50, stock=85, category="Antibiotics", description="Bacterial infections prescription antibiotic."),
            Product(name="Ibuprofen 400mg", price=6.20, stock=200, category="Analgesics", description="Over-the-counter pain relief and anti-inflammatory."),
            Product(name="Atorvastatin 20mg", price=24.90, stock=40, category="Cardiovascular", description="Cholesterol management statin treatment."),
            Product(name="Metformin 850mg", price=12.80, stock=110, category="Antidiabetics", description="Type 2 diabetes blood glucose regulation."),
            Product(name="Loratadine 10mg", price=9.50, stock=150, category="Antihistamines", description="Non-drowsy 24-hour allergy relief.")
        ]
        db.session.bulk_save_objects(products)
        db.session.commit()

    # Seed PharmacyOrders
    if PharmacyOrder.query.count() == 0:
        orders = [
            PharmacyOrder(patient_name="Jerome Bell", items=json.dumps([{"name": "Amoxicillin 500mg", "qty": 1, "price": 18.50}]), total_amount=18.50, status="Pending"),
            PharmacyOrder(patient_name="Theresa Webb", items=json.dumps([{"name": "Ibuprofen 400mg", "qty": 2, "price": 6.20}, {"name": "Loratadine 10mg", "qty": 1, "price": 9.50}]), total_amount=21.90, status="Shipped"),
            PharmacyOrder(patient_name="Albert Flores", items=json.dumps([{"name": "Atorvastatin 20mg", "qty": 1, "price": 24.90}]), total_amount=24.90, status="Pending")
        ]
        db.session.bulk_save_objects(orders)
        db.session.commit()

    # Seed RAGDataset
    if RAGDataset.query.count() == 0:
        datasets = [
            RAGDataset(filename="ICD10_Clinical_Coding_Guidelines.pdf", category="Clinical Guidelines", status="Indexed", file_size="420 KB"),
            RAGDataset(filename="FDA_Drug_Interactions_Reference_2026.pdf", category="Drug Interactions", status="Indexed", file_size="1.8 MB"),
            RAGDataset(filename="NovaCare_Cardiology_Bypass_Protocol.docx", category="Clinical Guidelines", status="Indexed", file_size="84 KB")
        ]
        db.session.bulk_save_objects(datasets)
        db.session.commit()

    # Seed SupportTickets
    if SupportTicket.query.count() == 0:
        tickets = [
            SupportTicket(creator_name="Theresa Webb", role="patient", subject="Cannot book slot for Dr. Simmons", description="The afternoon slots appear as blocked even though they are listed in schedule.", priority="Medium", status="Open"),
            SupportTicket(creator_name="Dr. Ross", role="doctor", subject="Ollama AI diagnostic engine timeout", description="The gateway latency is showing as 5000ms+ occasionally during symptom queries.", priority="High", status="In Progress"),
            SupportTicket(creator_name="Jerome Bell", role="patient", subject="Pharmacy prescription QR scan error", description="The camera cannot resolve the prescription QR code generated in my patient dashboard.", priority="Low", status="Resolved")
        ]
        db.session.bulk_save_objects(tickets)
        db.session.commit()

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
    if not identity:
        return None
    if isinstance(identity, str):
        try:
            identity = json.loads(identity)
        except Exception:
            pass
    if isinstance(identity, dict):
        return identity.get('id')
    return identity

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

# ---------- AI DIAGNOSIS ENGINE (MedGemma + Custom Naive Bayes) ----------

@app.route('/api/ai/diagnose', methods=['POST'])
@jwt_required()
def diagnose_symptoms():
    data = request.json
    query = data.get('query', '')
    if not query:
        return jsonify({'error': 'Query text is required'}), 400
        
    patient_id = current_user_id()
    user = User.query.get(patient_id) if patient_id else None
    
    intake_form = data.get('intake_form')
    if not intake_form and user and user.intake_form:
        try:
            form_json = json.loads(user.intake_form)
            consent_prefs = form_json.get('consentPreferences', {})
            # If patient consented to share data with the AI assistant
            if consent_prefs.get('consentAISharing'):
                intake_form = form_json
        except Exception:
            pass

    patient_info = {
        "name": user.name if user else "Guest Patient",
        "dob": user.dob if user else "Unknown",
        "allergies": user.allergies if user else "None",
        "chronic": user.chronic if user else "None",
        "intake_form": intake_form
    }

    client = OllamaClient()
    
    # Construct conditions reference context (RAG) from database
    conditions = Condition.query.all()
    ref_entries = []
    for c in conditions:
        precs = get_condition_precautions(c.name)
        ref_entries.append(
            f"Condition: {c.name}\n"
            f"- Description: {c.description}\n"
            f"- Recommended Specialty: {c.recommended_specialty}\n"
            f"- Default Urgency: {c.urgency}\n"
            f"- Suggested Precautions: {precs}"
        )
    reference_context = "\n\n".join(ref_entries)

    # Invoke structured clinical reasoning using MedGemma
    diagnosis_result = client.diagnose_query(query, patient_info, reference_context)

    if diagnosis_result:
        condition_name = diagnosis_result.get('suspected_condition')
        confidence = diagnosis_result.get('confidence', 85)
        description = diagnosis_result.get('description', 'Consult doctor for clinical diagnosis.')
        precautions = diagnosis_result.get('precautions', [])
        urgency_tier = diagnosis_result.get('urgency', 'medium')
        recommended_specialty = diagnosis_result.get('recommended_specialty')
        guidance = diagnosis_result.get('guidance')
        extracted_symptoms = diagnosis_result.get('extracted_symptoms', [])

        # Retrieve and rank matching doctors
        doctors_list = []
        if recommended_specialty:
            spec_clean = recommended_specialty.strip().lower().replace("-", " ")
            specialty_mapping = {
                'cardiologist': 'Cardiology',
                'cardiology': 'Cardiology',
                'cardiologist surgeon': 'Cardiology',
                'neurologist': 'Neurology',
                'neurology': 'Neurology',
                'neurosurgeon': 'Neurology',
                'dermatologist': 'Dermatology',
                'dermatology': 'Dermatology',
                'orthopedics': 'Orthopedics',
                'orthopedist': 'Orthopedics',
                'gastroenterology': 'Gastroenterology',
                'gastroenterologist': 'Gastroenterology',
                'pulmonology': 'Pulmonology',
                'pulmonologist': 'Pulmonology',
                'pediatrics': 'Pediatrics',
                'pediatrician': 'Pediatrics',
                'ophthalmology': 'Ophthalmology',
                'ophthalmologist': 'Ophthalmology',
                'psychiatry': 'Psychiatry',
                'psychiatrist': 'Psychiatry',
                'endocrinology': 'Endocrinology',
                'endocrinologist': 'Endocrinology',
                'oncology': 'Oncology',
                'oncologist': 'Oncology',
                'rheumatology': 'Rheumatologist',
                'rheumatologist': 'Rheumatologist',
                'general medicine': 'General Medicine',
                'general practitioner': 'General Medicine',
                'internal medicine': 'General Medicine'
            }
            normalized_specialty = specialty_mapping.get(spec_clean, recommended_specialty)
            
            doctors = Doctor.query.filter(
                (Doctor.specialty.ilike(f"%{normalized_specialty}%")) | 
                (Doctor.specialty.ilike(f"%{recommended_specialty}%"))
            ).all()
            doctors_list = [
                {
                    'id': d.id,
                    'name': d.user.name,
                    'specialty': d.specialty,
                    'location': d.location,
                    'rating': d.rating,
                    'availability': d.availability,
                    'years_experience': d.years_experience
                }
                for d in doctors
            ]
            doctors_list = sorted(doctors_list, key=lambda x: x['rating'], reverse=True)

        severity_score = calculate_symptom_severity_score(extracted_symptoms)
        is_urgent = urgency_tier in ['high', 'critical']

        # Save symptom check history
        check = SymptomCheck(
            patient_id=patient_id,
            symptoms=", ".join(extracted_symptoms) if extracted_symptoms else "General inquiry",
            diagnosed_conditions=json.dumps([condition_name]) if condition_name else json.dumps([]),
            confidence_scores=json.dumps([round(confidence, 1)]) if confidence else json.dumps([]),
            severity_score=severity_score,
            is_urgent=is_urgent
        )
        db.session.add(check)
        db.session.commit()

        return jsonify({
            'symptoms': extracted_symptoms,
            'condition': condition_name,
            'confidence': round(confidence, 1) if confidence else None,
            'description': description,
            'precautions': precautions,
            'recommended_specialty': recommended_specialty,
            'urgency': urgency_tier,
            'guidance': guidance,
            'doctors': doctors_list
        }), 200

    # 1. FALLBACK PATHWAY: Extract symptoms list from patient query using MedGemma / keyword parsing
    extracted_symptoms = client.extract_symptoms(query)
    
    if not extracted_symptoms:
        # Generate generic conversational answer instead of throwing 400 Bad Request
        guidance = client.generate_general_chat(query, patient_info)
        return jsonify({
            'symptoms': [],
            'condition': None,
            'confidence': None,
            'urgency': 'low',
            'description': 'General health consultation.',
            'precautions': [],
            'recommended_specialty': None,
            'guidance': guidance,
            'doctors': []
        }), 200
        
    # 2. Predict condition using our Naive Bayes ML model
    condition_name, confidence = predict_condition(extracted_symptoms)
    
    # 2.5 Calculate severity score from Symptom-severity.csv
    severity_score = calculate_symptom_severity_score(extracted_symptoms)
    is_urgent = severity_score > 15
    
    # 3. Lookup condition details in database
    cond = Condition.query.filter_by(name=condition_name).first()
    description = cond.description if cond else "Consult doctor for clinical diagnosis."
    recommended_specialty = cond.recommended_specialty if cond else "General Medicine"
    urgency_tier = cond.urgency if cond else "medium"
    
    if is_urgent:
        urgency_tier = "high"
        
    # 3.5 Retrieve and rank matching doctors for this recommended specialty
    doctors = Doctor.query.filter_by(specialty=recommended_specialty).all()
    doctors_list = [
        {
            'id': d.id,
            'name': d.user.name,
            'specialty': d.specialty,
            'location': d.location,
            'rating': d.rating,
            'availability': d.availability,
            'years_experience': d.years_experience
        }
        for d in doctors
    ]
    
    # Sort matching doctors by rating (highest first)
    doctors_list = sorted(doctors_list, key=lambda x: x['rating'], reverse=True)
    top_doctors = doctors_list[:3]
        
    # 4. Fetch precautions from metadata CSV lookup
    precautions = get_condition_precautions(condition_name)
    
    # 5. Generate clinical next steps and guidelines using MedGemma (falls back to pre-defined templates)
    guidance = client.generate_guidance(condition_name, description, precautions, patient_info, top_doctors)
    
    # Save the symptom check history
    check = SymptomCheck(
        patient_id=patient_id,
        symptoms=", ".join(extracted_symptoms),
        diagnosed_conditions=json.dumps([condition_name]),
        confidence_scores=json.dumps([round(confidence * 100, 1)]),
        severity_score=severity_score,
        is_urgent=is_urgent
    )
    db.session.add(check)
    db.session.commit()
    
    return jsonify({
        'symptoms': extracted_symptoms,
        'condition': condition_name,
        'confidence': round(confidence * 100, 1),
        'description': description,
        'precautions': [p.strip() for p in precautions.split("|") if p.strip()],
        'recommended_specialty': recommended_specialty,
        'urgency': urgency_tier,
        'guidance': guidance,
        'doctors': doctors_list
    }), 200

@app.route('/api/doctors/<int:id>/profile', methods=['GET'])
@jwt_required()
def get_doctor_profile(id):
    d = Doctor.query.get(id)
    if not d:
        return jsonify({'error': 'Doctor not found'}), 404
        
    reviews = []
    if d.reviews_json:
        try:
            reviews = json.loads(d.reviews_json)
        except Exception:
            pass
            
    licenses = []
    if d.licenses:
        try:
            licenses = json.loads(d.licenses)
        except Exception:
            pass

    return jsonify({
        'id': d.id,
        'name': d.user.name,
        'specialty': d.specialty,
        'location': d.location,
        'latitude': d.latitude,
        'longitude': d.longitude,
        'rating': d.rating,
        'availability': d.availability,
        'schedule': d.schedule,
        'phone': d.phone,
        'address': d.address,
        'description': d.description,
        'npi': d.npi,
        'specialist_type': d.specialist_type,
        'languages': d.languages,
        'verified': d.verified,
        'revenue': d.revenue,
        'avatar_url': d.avatar_url,
        'duty_status': d.duty_status,
        'hospital': d.hospital,
        'years_experience': d.years_experience,
        'reviews_count': d.reviews_count or len(reviews),
        'reviews': reviews,
        'licenses': licenses
    }), 200

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

# ---------- PATIENT PORTAL & SUPPORT ----------

@app.route('/api/patient/profile', methods=['GET'])
@jwt_required()
def get_patient_profile():
    user_id = current_user_id()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'phone': user.phone or '',
        'address': user.address or '',
        'dob': user.dob or '',
        'allergies': user.allergies or '',
        'chronic': user.chronic or '',
        'blood_type': user.blood_type or '',
        'past_illnesses': user.past_illnesses or '',
        'created_at': user.created_at.strftime("%Y-%m-%d") if user.created_at else ''
    }), 200

@app.route('/api/patient/profile', methods=['PUT'])
@jwt_required()
def update_patient_profile():
    user_id = current_user_id()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.json
    if 'name' in data:
        user.name = data['name']
    if 'phone' in data:
        user.phone = data['phone']
    if 'address' in data:
        user.address = data['address']
    if 'dob' in data:
        user.dob = data['dob']
    if 'allergies' in data:
        user.allergies = data['allergies']
    if 'chronic' in data:
        user.chronic = data['chronic']
    if 'blood_type' in data:
        user.blood_type = data['blood_type']
    if 'past_illnesses' in data:
        user.past_illnesses = data['past_illnesses']
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully'}), 200

@app.route('/api/patient/intake-form', methods=['GET'])
@jwt_required()
def get_patient_intake_form():
    user_id = current_user_id()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    form_data = {}
    if user.intake_form:
        try:
            form_data = json.loads(user.intake_form)
        except Exception:
            pass
    return jsonify({'intake_form': form_data}), 200

@app.route('/api/patient/intake-form', methods=['PUT'])
@jwt_required()
def update_patient_intake_form():
    user_id = current_user_id()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.json
    intake_data = data.get('intake_form')
    if intake_data is None:
        return jsonify({'error': 'Intake form data is required'}), 400
        
    user.intake_form = json.dumps(intake_data)
    
    # Sync demographics fields
    personal_info = intake_data.get('patientInformation', {})
    if personal_info.get('fullName'):
        user.name = personal_info['fullName']
    if personal_info.get('dateOfBirth'):
        user.dob = personal_info['dateOfBirth']
    if personal_info.get('contactNumber'):
        user.phone = personal_info['contactNumber']
    if personal_info.get('homeAddress'):
        user.address = personal_info['homeAddress']
        
    allergies_info = intake_data.get('allergiesSensitivities', {})
    allergy_list = []
    if allergies_info.get('drugAllergies'):
        allergy_list.append(f"Drugs: {allergies_info['drugAllergies']}")
    if allergies_info.get('foodAllergies'):
        allergy_list.append(f"Food: {allergies_info['foodAllergies']}")
    if allergies_info.get('otherAllergies'):
        allergy_list.append(f"Other: {allergies_info['otherAllergies']}")
    if allergy_list:
        user.allergies = ", ".join(allergy_list)

    history_info = intake_data.get('pastMedicalHistory', {})
    illness_list = []
    if history_info.get('pastIllnesses'):
        illness_list.append(history_info['pastIllnesses'])
    if illness_list:
        user.past_illnesses = ", ".join(illness_list)

    chronic_info = intake_data.get('currentHealthIssues', {})
    if chronic_info.get('listConditions'):
        user.chronic = chronic_info['listConditions']

    db.session.commit()
    return jsonify({'message': 'Intake form updated successfully'}), 200

@app.route('/api/support/tickets', methods=['POST'])
@jwt_required()
def create_support_ticket():
    user_id = current_user_id()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.json
    ticket = SupportTicket(
        creator_name=user.name,
        role=user.role,
        subject=data.get('subject', 'General Inquiry'),
        description=data.get('description', ''),
        priority=data.get('priority', 'Medium'),
        status='Open'
    )
    db.session.add(ticket)
    db.session.commit()
    return jsonify({'message': 'Support ticket submitted successfully', 'ticket_id': ticket.id}), 201

@app.route('/api/support/tickets', methods=['GET'])
@jwt_required()
def get_support_tickets():
    user_id = current_user_id()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    tickets = SupportTicket.query.filter_by(creator_name=user.name).order_by(SupportTicket.created_at.desc()).all()
    result = []
    for t in tickets:
        result.append({
            'id': t.id,
            'creatorName': t.creator_name,
            'role': t.role,
            'subject': t.subject,
            'description': t.description,
            'priority': t.priority,
            'status': t.status,
            'createdAt': t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else ''
        })
    return jsonify(result), 200

# ---------- ADMIN CUSTOM ENDPOINTS ----------

@app.route('/api/admin/doctors', methods=['GET'])
def admin_get_doctors():
    doctors = Doctor.query.all()
    result = []
    for d in doctors:
        licenses_list = []
        if d.licenses:
            try:
                licenses_list = json.loads(d.licenses)
            except Exception:
                licenses_list = []
                
        overview_dict = {"old": [0,0,0,0,0,0,0], "new": [0,0,0,0,0,0,0]}
        if d.patient_overview:
            try:
                overview_dict = json.loads(d.patient_overview)
            except Exception:
                pass

        result.append({
            'id': d.id,
            'name': d.user.name,
            'email': d.user.email,
            'specialty': d.specialty,
            'location': d.location,
            'latitude': d.latitude,
            'longitude': d.longitude,
            'rating': d.rating,
            'availability': d.availability,
            'schedule': d.schedule,
            'phone': d.phone or '',
            'address': d.address or '',
            'description': d.description or '',
            'npi': d.npi or '',
            'specialistType': d.specialist_type or d.specialty,
            'languages': d.languages or 'English',
            'verified': d.verified or False,
            'revenue': d.revenue or '$0',
            'avatar': d.avatar_url or f"https://ui-avatars.com/api/?name={d.user.name}&background=5c6dfa&color=fff",
            'type': d.type or 'old',
            'licenses': licenses_list,
            'patientOverview': overview_dict,
            'dutyStatus': d.duty_status or 'On Duty',
            'hospital': d.hospital or 'St. Jude General'
        })
    return jsonify(result), 200

@app.route('/api/admin/doctors', methods=['POST'])
def admin_create_doctor():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    
    if not name or not email:
        return jsonify({'error': 'Name and Email are required'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400

    user = User(
        name=name,
        email=email,
        password='doctorpassword', # default temp password
        role='doctor'
    )
    db.session.add(user)
    db.session.commit()

    licenses_input = data.get('licenses')
    if not licenses_input:
        licenses_input = [
            { "number": f"#{user.id}08451", "expiration": "2026 - 2029", "state": "Washington", "status": "Active" },
            { "number": f"#{user.id}14389", "expiration": "2025 - 2028", "state": "California", "status": "Active" }
        ]
    licenses_val = json.dumps(licenses_input)

    overview_val = json.dumps(data.get('patientOverview', {
        "old": [15, 20, 25, 20, 22, 28, 30],
        "new": [5, 12, 10, 15, 18, 14, 16]
    }))

    doctor = Doctor(
        user_id=user.id,
        specialty=data.get('specialty', 'General Practitioner'),
        location=data.get('address', '100 Medical Plaza, USA'),
        latitude=data.get('latitude', 47.6062),
        longitude=data.get('longitude', -122.3321),
        rating=4.5,
        availability='09:00 AM - 05:00 PM',
        schedule='Mon-Sat',
        phone=data.get('phone', '+(555) 000-1111'),
        address=data.get('address', '100 Medical Plaza, USA'),
        description=data.get('description', 'Newly added doctor profile.'),
        npi=data.get('npi', '1000000000'),
        specialist_type=data.get('specialistType', data.get('specialty', 'General Practitioner')),
        languages=data.get('languages', 'English'),
        verified=data.get('verified', False),
        revenue=data.get('revenue', '$12,500'),
        avatar_url=data.get('avatar') or f"https://ui-avatars.com/api/?name={name}&background=5c6dfa&color=fff",
        type=data.get('type', 'New'),
        licenses=licenses_val,
        patient_overview=overview_val
    )
    db.session.add(doctor)
    db.session.commit()

    # Create mock appointments and prescriptions for the new doctor
    patients = User.query.filter_by(role='patient').all()
    if patients:
        import random
        from datetime import timedelta
        # We will create 4 mock cases
        mock_cases = [
            {
                "offset_days": 0,  # Today
                "time": "09:30 AM",
                "diagnosis": "Acute Bronchitis",
                "notes": "Recommend warm fluids, rest, and humidified air. Return if fever increases.",
                "meds": [
                    {"name": "Amoxicillin", "dosage": "500mg", "frequency": "Three times daily"},
                    {"name": "Albuterol inhaler", "dosage": "2 puffs", "frequency": "Every 4 hours as needed"}
                ]
            },
            {
                "offset_days": 0,  # Today
                "time": "02:15 PM",
                "diagnosis": "Essential Hypertension",
                "notes": "Patient started on low-sodium diet. Monitor blood pressure twice daily.",
                "meds": [
                    {"name": "Lisinopril", "dosage": "10mg", "frequency": "Once daily"}
                ]
            },
            {
                "offset_days": -1,  # Yesterday
                "time": "11:00 AM",
                "diagnosis": "Allergic Rhinitis",
                "notes": "Avoid known pollen triggers. Nasal sprays can be used as needed.",
                "meds": [
                    {"name": "Fluticasone spray", "dosage": "50mcg", "frequency": "1 spray per nostril daily"}
                ]
            },
            {
                "offset_days": -30,  # Last month
                "time": "10:30 AM",
                "diagnosis": "Vitamin D Deficiency",
                "notes": "Advised daily sun exposure for 15 minutes. Check Vitamin D levels in 12 weeks.",
                "meds": [
                    {"name": "Vitamin D3", "dosage": "2000 IU", "frequency": "Once daily"}
                ]
            }
        ]
        
        # Current app date is 2026-07-15
        base_date = datetime.strptime("2026-07-15", "%Y-%m-%d")
        
        # Take up to 4 unique patients
        selected_patients = random.sample(patients, min(len(patients), len(mock_cases)))
        for idx, p in enumerate(selected_patients):
            case = mock_cases[idx]
            appt_date = (base_date + timedelta(days=case["offset_days"])).strftime("%Y-%m-%d")
            
            # Create Appointment
            appt = Appointment(
                doctor_id=doctor.id,
                patient_id=p.id,
                date=appt_date,
                time_slot=case["time"],
                status="completed"
            )
            db.session.add(appt)
            db.session.commit()
            
            # Create Prescription
            presc = Prescription(
                appointment_id=appt.id,
                doctor_id=doctor.id,
                patient_id=p.id,
                diagnosis=case["diagnosis"],
                medications=json.dumps(case["meds"]),
                notes=case["notes"]
            )
            db.session.add(presc)
            db.session.commit()

    return jsonify({'message': 'Doctor created successfully', 'id': doctor.id}), 201

@app.route('/api/admin/doctors/<int:id>', methods=['PUT'])
def admin_update_doctor(id):
    doctor = Doctor.query.get(id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
    data = request.json
    
    user = doctor.user
    if 'name' in data:
        user.name = data['name']
    if 'email' in data:
        # Check if email is being updated and already exists elsewhere
        new_email = data['email']
        existing = User.query.filter_by(email=new_email).first()
        if existing and existing.id != user.id:
            return jsonify({'error': 'Email is already taken'}), 400
        user.email = new_email
        
    db.session.add(user)
    
    if 'specialty' in data:
        doctor.specialty = data['specialty']
    if 'address' in data:
        doctor.address = data['address']
        doctor.location = data['address']
    if 'phone' in data:
        doctor.phone = data['phone']
    if 'description' in data:
        doctor.description = data['description']
    if 'npi' in data:
        doctor.npi = data['npi']
    if 'specialistType' in data:
        doctor.specialist_type = data['specialistType']
    if 'languages' in data:
        doctor.languages = data['languages']
    if 'verified' in data:
        doctor.verified = data['verified']
    if 'revenue' in data:
        doctor.revenue = data['revenue']
    if 'avatar' in data:
        doctor.avatar_url = data['avatar']
    if 'type' in data:
        doctor.type = data['type']
    if 'licenses' in data:
        doctor.licenses = json.dumps(data['licenses'])
    if 'dutyStatus' in data:
        doctor.duty_status = data['dutyStatus']
    if 'hospital' in data:
        doctor.hospital = data['hospital']
        
    db.session.add(doctor)
    db.session.commit()
    
    return jsonify({'message': 'Doctor updated successfully'}), 200

@app.route('/api/admin/doctors/<int:id>', methods=['DELETE'])
def admin_delete_doctor(id):
    doctor = Doctor.query.get(id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
    user = doctor.user
    
    # Delete associated appointments and prescriptions
    Appointment.query.filter_by(doctor_id=doctor.id).delete()
    Prescription.query.filter_by(doctor_id=doctor.id).delete()
    
    db.session.delete(doctor)
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'Doctor deleted successfully'}), 200

@app.route('/api/admin/doctors/<int:id>/verify', methods=['POST'])
def admin_verify_doctor(id):
    doctor = Doctor.query.get(id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
    doctor.verified = not doctor.verified
    db.session.commit()
    return jsonify({
        'message': f"Doctor {'verified' if doctor.verified else 'unverified'} successfully",
        'verified': doctor.verified
    }), 200

@app.route('/api/admin/doctors/<int:id>/patients', methods=['GET'])
def admin_get_doctor_patients(id):
    # Query appointments for this doctor
    appointments = Appointment.query.filter_by(doctor_id=id).all()
    result = []
    for appt in appointments:
        prescription = Prescription.query.filter_by(appointment_id=appt.id).first()
        result.append({
            'appointmentId': appt.id,
            'date': appt.date,
            'timeSlot': appt.time_slot,
            'status': appt.status,
            'patientId': appt.patient.id,
            'patientName': appt.patient.name,
            'patientEmail': appt.patient.email,
            'diagnosis': prescription.diagnosis if prescription else 'Pending Diagnosis',
            'notes': prescription.notes if prescription else 'No notes available'
        })
    return jsonify(result), 200

@app.route('/api/admin/patients', methods=['GET'])
def admin_get_patients():
    patients = User.query.filter_by(role='patient').all()
    result = []
    for p in patients:
        # Calculate treatments count
        treatments_count = Prescription.query.filter_by(patient_id=p.id).count()
        
        # Get last visit date and doctor
        last_appt = Appointment.query.filter_by(patient_id=p.id).order_by(Appointment.date.desc()).first()
        
        last_visit_str = 'N/A'
        last_doctor_name = 'N/A'
        status = 'Inactive'
        
        if last_appt:
            last_visit_str = last_appt.date
            try:
                dt = datetime.strptime(last_appt.date, "%Y-%m-%d")
                last_visit_str = dt.strftime("%b %d, %Y")
                
                # If last visit within last 60 days, mark active
                days_diff = (datetime.now() - dt).days
                if days_diff <= 60:
                    status = 'Active'
            except Exception:
                pass
                
            doc = Doctor.query.get(last_appt.doctor_id)
            if doc:
                last_doctor_name = doc.user.name.split(" ")[-1]
                if not last_doctor_name.startswith("Dr. "):
                    last_doctor_name = "Dr. " + last_doctor_name
                    
        # Check if patient has a recent urgent triage check
        latest_check = SymptomCheck.query.filter_by(patient_id=p.id).order_by(SymptomCheck.created_at.desc()).first()
        is_high_risk = latest_check.is_urgent if latest_check else False
                    
        result.append({
            'id': f"#PT-{p.id:03d}",
            'dbId': p.id,
            'name': p.name,
            'email': p.email,
            'lastVisit': last_visit_str,
            'doctor': last_doctor_name,
            'status': status,
            'treatments': treatments_count,
            'isHighRisk': is_high_risk
        })
    return jsonify(result), 200

@app.route('/api/admin/patients/<int:id>/details', methods=['GET'])
def admin_get_patient_details(id):
    patient = User.query.filter_by(id=id, role='patient').first()
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404
        
    # Get prescriptions/history
    prescriptions = Prescription.query.filter_by(patient_id=id).all()
    history = []
    for p in prescriptions:
        # Get doctor name
        doc = Doctor.query.get(p.doctor_id)
        doctor_name = doc.user.name if doc else 'Unknown Doctor'
        
        # Get appointment date
        appt = Appointment.query.get(p.appointment_id)
        date_str = appt.date if appt else p.created_at.strftime("%Y-%m-%d")
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            date_str = dt.strftime("%b %d, %Y")
        except Exception:
            pass
            
        meds = []
        if p.medications:
            try:
                meds = json.loads(p.medications)
            except Exception:
                meds = []
                
        history.append({
            'prescriptionId': p.id,
            'date': date_str,
            'doctorName': doctor_name,
            'diagnosis': p.diagnosis,
            'medications': meds,
            'notes': p.notes
        })
        
    # Get medical records/reports
    records = MedicalRecord.query.filter_by(patient_id=id).all()
    reports = []
    for r in records:
        date_str = r.upload_date.strftime("%b %d, %Y")
        reports.append({
            'recordId': r.id,
            'filePath': r.file_path,
            'fileName': r.file_path.split("/")[-1],
            'fileType': r.file_type,
            'uploadDate': date_str
        })
        
    # Patient profile meta
    profile = {
        'id': f"#PT-{patient.id:03d}",
        'dbId': patient.id,
        'name': patient.name,
        'email': patient.email,
        'phone': patient.phone or '+(555) 019-2834',
        'address': patient.address or 'None declared',
        'dob': patient.dob or '23.07.1994',
        'allergies': patient.allergies or 'None',
        'chronic': patient.chronic or 'None',
        'blood_type': patient.blood_type or 'O+',
        'past_illnesses': patient.past_illnesses or 'None',
        'age': 32,
        'gender': 'Female' if patient.id % 2 == 0 else 'Male',
        'joined': patient.created_at.strftime("%b %d, %Y") if patient.created_at else 'Jul 15, 2026'
    }
    
    return jsonify({
        'profile': profile,
        'history': history,
        'reports': reports
    }), 200

@app.route('/api/admin/appointments', methods=['GET'])
def admin_get_all_appointments():
    appointments = Appointment.query.order_by(Appointment.date.desc()).all()
    result = []
    for appt in appointments:
        prescription = Prescription.query.filter_by(appointment_id=appt.id).first()
        meds_list = []
        if prescription and prescription.medications:
            try:
                meds_list = json.loads(prescription.medications)
            except Exception:
                meds_list = []
                
        result.append({
            'id': appt.id,
            'patientId': appt.patient_id,
            'patientName': appt.patient.name if appt.patient else 'Unknown Patient',
            'patientEmail': appt.patient.email if appt.patient else '',
            'doctorId': appt.doctor_id,
            'doctorName': appt.doctor.user.name if appt.doctor and appt.doctor.user else 'Unknown Doctor',
            'specialty': appt.doctor.specialty if appt.doctor else 'General Practitioner',
            'date': appt.date,
            'timeSlot': appt.time_slot,
            'status': appt.status,
            'diagnosis': prescription.diagnosis if prescription else 'Pending Diagnosis',
            'notes': prescription.notes if prescription else '',
            'medications': meds_list
        })
    return jsonify(result), 200

@app.route('/api/admin/appointments/<int:id>', methods=['PUT'])
def admin_update_appointment(id):
    appt = Appointment.query.get(id)
    if not appt:
        return jsonify({'error': 'Appointment not found'}), 404
        
    data = request.json
    if 'status' in data:
        appt.status = data['status']
    if 'date' in data:
        appt.date = data['date']
    if 'timeSlot' in data:
        appt.time_slot = data['timeSlot']
        
    db.session.commit()
    return jsonify({'message': 'Appointment updated successfully', 'appointmentId': appt.id}), 200

# --- USERS MANAGEMENT ---
@app.route('/api/admin/users', methods=['GET'])
def admin_get_all_users():
    users = User.query.all()
    result = []
    for u in users:
        result.append({
            'id': u.id,
            'name': u.name,
            'email': u.email,
            'role': u.role,
            'status': u.status or 'Active',
            'created_at': u.created_at.strftime("%Y-%m-%d") if u.created_at else ''
        })
    return jsonify(result), 200

@app.route('/api/admin/users/<int:id>', methods=['PUT'])
def admin_update_user_status(id):
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.json
    if 'status' in data:
        user.status = data['status']
    db.session.commit()
    return jsonify({'message': 'User status updated successfully'}), 200

@app.route('/api/pharmacy/products', methods=['GET'])
def get_products():
    category = request.args.get('category')
    search = request.args.get('search')
    
    query = Product.query
    
    if category and category != 'All':
        query = query.filter_by(category=category)
        
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (Product.name.like(search_term)) | 
            (Product.description.like(search_term))
        )
        
    # Limit to top 50 matches for maximum performance
    products = query.limit(50).all()
    
    result = []
    for p in products:
        result.append({
            'id': p.id,
            'name': p.name,
            'price': p.price,
            'stock': p.stock,
            'category': p.category,
            'description': p.description,
            'status': p.status or 'In Stock'
        })
    return jsonify(result), 200

# --- PHARMACY CATALOG MANAGEMENT ---
@app.route('/api/admin/pharmacy/products', methods=['GET'])
def admin_get_products():
    products = Product.query.all()
    result = []
    for p in products:
        result.append({
            'id': p.id,
            'name': p.name,
            'price': p.price,
            'stock': p.stock,
            'category': p.category,
            'description': p.description,
            'status': p.status or 'In Stock'
        })
    return jsonify(result), 200

@app.route('/api/admin/pharmacy/products', methods=['POST'])
def admin_add_product():
    data = request.json
    name = data.get('name')
    price = data.get('price')
    if not name or price is None:
        return jsonify({'error': 'Product Name and Price are required'}), 400
    
    product = Product(
        name=name,
        price=float(price),
        stock=int(data.get('stock', 50)),
        category=data.get('category', 'General'),
        description=data.get('description', ''),
        status='In Stock' if int(data.get('stock', 50)) > 0 else 'Out of Stock'
    )
    db.session.add(product)
    db.session.commit()
    return jsonify({'message': 'Product added successfully', 'id': product.id}), 201

@app.route('/api/admin/pharmacy/products/<int:id>', methods=['PUT'])
def admin_update_product(id):
    product = Product.query.get(id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    data = request.json
    if 'price' in data:
        product.price = float(data['price'])
    if 'stock' in data:
        product.stock = int(data['stock'])
        product.status = 'In Stock' if product.stock > 0 else 'Out of Stock'
    if 'status' in data:
        product.status = data['status']
    db.session.commit()
    return jsonify({'message': 'Product updated successfully'}), 200

# --- PHARMACY ORDERS MANAGEMENT ---
@app.route('/api/admin/pharmacy/orders', methods=['GET'])
def admin_get_pharmacy_orders():
    orders = PharmacyOrder.query.order_by(PharmacyOrder.created_at.desc()).all()
    result = []
    for o in orders:
        items_list = []
        if o.items:
            try:
                items_list = json.loads(o.items)
            except Exception:
                items_list = []
        result.append({
            'id': o.id,
            'patientName': o.patient_name,
            'items': items_list,
            'totalAmount': o.total_amount,
            'status': o.status or 'Pending',
            'created_at': o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else ''
        })
    return jsonify(result), 200

@app.route('/api/admin/pharmacy/orders/<int:id>', methods=['PUT'])
def admin_update_pharmacy_order(id):
    order = PharmacyOrder.query.get(id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    data = request.json
    if 'status' in data:
        order.status = data['status']
    db.session.commit()
    return jsonify({'message': 'Order status updated successfully'}), 200

# --- RAG DATASET CONFIG ---
@app.route('/api/admin/rag', methods=['GET'])
def admin_get_rag_files():
    datasets = RAGDataset.query.order_by(RAGDataset.uploaded_at.desc()).all()
    result = []
    for d in datasets:
        result.append({
            'id': d.id,
            'filename': d.filename,
            'category': d.category,
            'status': d.status or 'Indexed',
            'fileSize': d.file_size,
            'uploadedAt': d.uploaded_at.strftime("%Y-%m-%d %H:%M") if d.uploaded_at else ''
        })
    return jsonify(result), 200

@app.route('/api/admin/rag', methods=['POST'])
def admin_upload_rag_sim():
    data = request.json
    filename = data.get('filename')
    category = data.get('category', 'Clinical Guidelines')
    if not filename:
        return jsonify({'error': 'Filename is required'}), 400
    
    rag = RAGDataset(
        filename=filename,
        category=category,
        status='Indexed',
        file_size=data.get('fileSize', '14 KB')
    )
    db.session.add(rag)
    db.session.commit()
    return jsonify({'message': 'Simulated document indexed in MedGemma RAG database', 'id': rag.id}), 201

# --- SUPPORT TICKETS HELP CENTER ---
@app.route('/api/admin/support', methods=['GET'])
def admin_get_support_tickets():
    tickets = SupportTicket.query.order_by(SupportTicket.created_at.desc()).all()
    result = []
    for t in tickets:
        result.append({
            'id': t.id,
            'creatorName': t.creator_name,
            'role': t.role,
            'subject': t.subject,
            'description': t.description,
            'priority': t.priority or 'Medium',
            'status': t.status or 'Open',
            'createdAt': t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else ''
        })
    return jsonify(result), 200

    return jsonify({'message': 'Ticket status updated successfully'}), 200

# ---------- DOCTOR DASHBOARD ENDPOINTS ----------

def get_logged_in_doctor():
    user_id = current_user_id()
    if not user_id:
        return None
    return Doctor.query.filter_by(user_id=user_id).first()

@app.route('/api/doctor/appointments', methods=['GET'])
@jwt_required()
def get_doctor_appointments():
    doctor = get_logged_in_doctor()
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404

    appointments = Appointment.query.filter_by(doctor_id=doctor.id).all()
    result = []
    for appt in appointments:
        # Get patient details
        patient = appt.patient
        if not patient:
            continue

        # Get latest symptom check
        latest_check = SymptomCheck.query.filter_by(patient_id=patient.id).order_by(SymptomCheck.id.desc()).first()
        severity = latest_check.severity_score if latest_check else 5
        is_urgent = latest_check.is_urgent if latest_check else False

        # Check for prescription
        has_presc = Prescription.query.filter_by(appointment_id=appt.id).first() is not None

        result.append({
            'id': appt.id,
            'date': appt.date,
            'timeSlot': appt.time_slot,
            'status': appt.status,
            'rejectionReason': appt.rejection_reason or "",
            'patient': {
                'id': patient.id,
                'name': patient.name,
                'email': patient.email,
                'phone': patient.phone or "",
                'dob': patient.dob or "",
                'allergies': patient.allergies or "None",
                'chronic': patient.chronic or "None",
                'bloodType': patient.blood_type or "O+",
                'pastIllnesses': patient.past_illnesses or "None"
            },
            'triage': {
                'severity': severity,
                'isUrgent': is_urgent
            },
            'hasPrescription': has_presc,
            'diagnosis': Prescription.query.filter_by(appointment_id=appt.id).first().diagnosis if has_presc else "General Consultation"
        })

    return jsonify(result), 200

@app.route('/api/doctor/appointments/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_appointment_status(id):
    doctor = get_logged_in_doctor()
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404

    appt = Appointment.query.filter_by(id=id, doctor_id=doctor.id).first()
    if not appt:
        return jsonify({'error': 'Appointment not found'}), 404

    data = request.json
    if not data or 'status' not in data:
        return jsonify({'error': 'Status is required'}), 400

    appt.status = data['status']
    db.session.commit()

    return jsonify({'status': appt.status}), 200

@app.route('/api/doctor/appointments/<int:id>/reject', methods=['PUT'])
@jwt_required()
def reject_specialty_mismatch(id):
    doctor = get_logged_in_doctor()
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404

    appt = Appointment.query.filter_by(id=id, doctor_id=doctor.id).first()
    if not appt:
        return jsonify({'error': 'Appointment not found'}), 404

    data = request.json
    reason = data.get('reason', '') if data else ''
    if not reason.strip():
        return jsonify({'error': 'Rejection reason is required'}), 400

    appt.status = 'rejected'
    appt.rejection_reason = reason

    # Create admin support ticket
    ticket = SupportTicket(
        creator_name=doctor.user.name,
        role='doctor',
        subject=f"Specialty Mismatch Reassignment Request (Appt #{appt.id})",
        description=f"Doctor {doctor.user.name} flagged appointment #{appt.id} as out-of-specialty. Reason: {reason}",
        priority='High',
        status='Open'
    )
    db.session.add(ticket)
    db.session.commit()

    return jsonify({'message': 'Appointment mismatch rejected successfully'}), 200

@app.route('/api/doctor/patients/<int:patient_id>/records', methods=['GET'])
@jwt_required()
def get_patient_health_chart(patient_id):
    doctor = get_logged_in_doctor()
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404

    # Enforce treating relationship: an appointment must exist between doctor and patient
    appt_exists = Appointment.query.filter_by(doctor_id=doctor.id, patient_id=patient_id).first()
    if not appt_exists:
        return jsonify({'error': 'Access Denied: No treating relationship exists with this patient.'}), 403

    patient = User.query.get(patient_id)
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404

    # Get clinical visit history (prescriptions & diagnoses)
    appts = Appointment.query.filter_by(patient_id=patient_id).all()
    history = []
    for a in appts:
        presc = Prescription.query.filter_by(appointment_id=a.id).first()
        meds = []
        if presc and presc.medications:
            try:
                meds = json.loads(presc.medications)
            except Exception:
                meds = []
        
        history.append({
            'id': a.id,
            'doctorName': a.doctor.user.name if (a.doctor and a.doctor.user) else "Unknown Doctor",
            'date': a.date,
            'diagnosis': Prescription.query.filter_by(appointment_id=a.id).first().diagnosis if (Prescription.query.filter_by(appointment_id=a.id).first()) else "General Practitioner checkup",
            'medications': meds,
            'notes': presc.notes if presc else ""
        })

    # Get reports (Medical Records)
    records = MedicalRecord.query.filter_by(patient_id=patient_id).all()
    reports = []
    for r in records:
        reports.append({
            'id': r.id,
            'fileName': r.file_path.split('/')[-1] if r.file_path else "Unnamed file",
            'filePath': r.file_path,
            'fileType': r.file_type or "PDF",
            'uploadDate': r.created_at.strftime("%Y-%m-%d") if r.created_at else ""
        })

    # Get symptom checks history
    checks = SymptomCheck.query.filter_by(patient_id=patient_id).all()
    symptom_history = []
    for c in checks:
        conditions = []
        if c.diagnosed_conditions:
            try:
                conditions = json.loads(c.diagnosed_conditions)
            except Exception:
                conditions = []

        symptom_history.append({
            'id': c.id,
            'symptoms': c.symptoms,
            'diagnosedConditions': conditions,
            'severity': c.severity_score or 5,
            'isUrgent': c.is_urgent or False,
            'date': c.created_at.strftime("%Y-%m-%d") if c.created_at else ""
        })

    intake_form = None
    if patient.intake_form:
        try:
            form_json = json.loads(patient.intake_form)
            consent_prefs = form_json.get('consentPreferences', {})
            if consent_prefs.get('consentStoreCareAnalytics'):
                intake_form = form_json
        except Exception:
            pass

    profile = {
        'id': patient.id,
        'name': patient.name,
        'email': patient.email,
        'phone': patient.phone or "",
        'address': patient.address or "",
        'dob': patient.dob or "",
        'bloodType': patient.blood_type or "O+",
        'allergies': patient.allergies or "None",
        'chronic': patient.chronic or "None",
        'pastIllnesses': patient.past_illnesses or "None"
    }

    return jsonify({
        'profile': profile,
        'history': history,
        'reports': reports,
        'symptomHistory': symptom_history,
        'intakeForm': intake_form
    }), 200

@app.route('/api/doctor/patients/<int:patient_id>/upload', methods=['POST'])
@jwt_required()
def upload_patient_record(patient_id):
    doctor = get_logged_in_doctor()
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404

    appt_exists = Appointment.query.filter_by(doctor_id=doctor.id, patient_id=patient_id).first()
    if not appt_exists:
        return jsonify({'error': 'Access Denied: No treating relationship exists.'}), 403

    filename = None
    if 'file' in request.files:
        file = request.files['file']
        if file.filename:
            filename = file.filename
            import os
            os.makedirs('uploads', exist_ok=True)
            file.save(os.path.join('uploads', filename))
    else:
        # Fallback simulation/JSON filename post
        data = request.json
        if data and 'filename' in data:
            filename = data['filename']

    if not filename:
        return jsonify({'error': 'No file uploaded'}), 400

    rec = MedicalRecord(
        patient_id=patient_id,
        file_path=f"uploads/{filename}",
        file_type="PDF" if filename.lower().endswith('.pdf') else "Image"
    )
    db.session.add(rec)
    db.session.commit()

    return jsonify({'recordId': rec.id, 'fileName': filename}), 201

@app.route('/api/doctor/referrals', methods=['GET'])
@jwt_required()
def get_doctor_referrals():
    doctor = get_logged_in_doctor()
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404

    # Inbound referrals
    inbound_records = Referral.query.filter_by(referee_id=doctor.id).all()
    inbound = []
    for ref in inbound_records:
        inbound.append({
            'id': ref.id,
            'patientName': ref.patient.name if ref.patient else "Unknown Patient",
            'referrerName': ref.referrer.user.name if (ref.referrer and ref.referrer.user) else "Unknown Doctor",
            'referrerSpecialty': ref.referrer.specialty if ref.referrer else "",
            'reason': ref.reason,
            'notes': ref.notes or "",
            'status': ref.status
        })

    # Outbound referrals
    outbound_records = Referral.query.filter_by(referrer_id=doctor.id).all()
    outbound = []
    for ref in outbound_records:
        outbound.append({
            'id': ref.id,
            'patientName': ref.patient.name if ref.patient else "Unknown Patient",
            'refereeName': ref.referee.user.name if (ref.referee and ref.referee.user) else "Unknown Doctor",
            'refereeSpecialty': ref.referee.specialty if ref.referee else "",
            'reason': ref.reason,
            'notes': ref.notes or "",
            'status': ref.status
        })

    # Patient choices: patients with an appointment connection to this doctor
    patients = User.query.join(Appointment, Appointment.patient_id == User.id)\
                         .filter(Appointment.doctor_id == doctor.id).all()
    patient_options = [{'id': p.id, 'name': p.name} for p in patients]

    # Referee choices: all other doctors
    referee_docs = Doctor.query.filter(Doctor.id != doctor.id).all()
    referee_options = [{'id': d.id, 'name': d.user.name if d.user else "Unknown Doctor", 'specialty': d.specialty} for d in referee_docs]

    # AI smart matches: Symptom checks matching this doctor's specialty or general symptom checking logs
    symptom_checks = SymptomCheck.query.all()
    smart_matches = []
    for chk in symptom_checks:
        symptoms_str = chk.symptoms.lower()
        match_reason = None
        if doctor.specialty.lower() == 'cardiology' and ('chest' in symptoms_str or 'breath' in symptoms_str or 'heart' in symptoms_str or 'angina' in symptoms_str):
            match_reason = "Migraine/Cardio symptoms match Cardiology"
        elif 'headache' in symptoms_str or 'migraine' in symptoms_str or 'dizzy' in symptoms_str:
            if doctor.specialty.lower() == 'neurology':
                match_reason = "Neurological symptoms match Neurology"

        if match_reason:
            patient = User.query.get(chk.patient_id)
            patient_name = patient.name if patient else "Anonymous"
            smart_matches.append({
                'patientName': patient_name,
                'symptoms': chk.symptoms,
                'reason': match_reason,
                'date': chk.created_at.strftime("%Y-%m-%d") if chk.created_at else ""
            })

    return jsonify({
        'inbound': inbound,
        'outbound': outbound,
        'patientOptions': patient_options,
        'refereeOptions': referee_options,
        'smartMatches': smart_matches
    }), 200

@app.route('/api/doctor/referrals', methods=['POST'])
@jwt_required()
def create_referral():
    doctor = get_logged_in_doctor()
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404

    data = request.json
    if not data or 'patient_id' not in data or 'referee_id' not in data or 'reason' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    ref = Referral(
        patient_id=data['patient_id'],
        referrer_id=doctor.id,
        referee_id=data['referee_id'],
        reason=data['reason'],
        notes=data.get('notes', ''),
        status='Pending'
    )
    db.session.add(ref)
    db.session.commit()

    return jsonify({'id': ref.id, 'message': 'Referral created successfully'}), 201

@app.route('/api/doctor/referrals/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_referral_status(id):
    doctor = get_logged_in_doctor()
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404

    ref = Referral.query.filter_by(id=id, referee_id=doctor.id).first()
    if not ref:
        return jsonify({'error': 'Referral request not found'}), 404

    data = request.json
    status = data.get('status')
    if not status or status not in ['Accepted', 'Declined']:
        return jsonify({'error': 'Invalid status'}), 400

    ref.status = status

    if status == 'Accepted':
        # Create a new scheduled appointment automatically
        appt = Appointment(
            patient_id=ref.patient_id,
            doctor_id=ref.referee_id,
            date=datetime.now().strftime("%Y-%m-%d"),
            time_slot="09:00 AM",
            status="scheduled"
        )
        db.session.add(appt)

    db.session.commit()
    return jsonify({'message': 'Referral status updated successfully'}), 200

@app.route('/api/doctor/schedule', methods=['GET'])
@jwt_required()
def get_doctor_schedule():
    doctor = get_logged_in_doctor()
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404

    return jsonify({
        'availability': doctor.availability or "09:00 AM - 05:00 PM",
        'schedule': doctor.schedule or "Mon-Fri",
        'blockedDates': json.loads(doctor.blocked_dates) if doctor.blocked_dates else [],
        'slotTemplates': json.loads(doctor.slot_templates) if doctor.slot_templates else {}
    }), 200

@app.route('/api/doctor/schedule', methods=['POST'])
@jwt_required()
def update_doctor_schedule():
    doctor = get_logged_in_doctor()
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404

    data = request.json
    if not data:
        return jsonify({'error': 'Missing request body'}), 400

    if 'availability' in data:
        doctor.availability = data['availability']
    if 'schedule' in data:
        doctor.schedule = data['schedule']
    if 'blockedDates' in data:
        doctor.blocked_dates = json.dumps(data['blockedDates'])
    if 'slotTemplates' in data:
        doctor.slot_templates = json.dumps(data['slotTemplates'])

    db.session.commit()
    return jsonify({'message': 'Schedule settings updated successfully'}), 200

@app.route('/api/doctor/analytics', methods=['GET'])
@jwt_required()
def get_doctor_analytics():
    doctor = get_logged_in_doctor()
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404

    completed_visits = Appointment.query.filter_by(doctor_id=doctor.id, status='completed').count()
    successful_patients = db.session.query(Appointment.patient_id)\
                                    .filter_by(doctor_id=doctor.id, status='completed')\
                                    .distinct().count()

    # Reviews parsing
    positive = 5
    negative = 0
    if doctor.reviews_json:
        try:
            reviews = json.loads(doctor.reviews_json)
            positive = sum(1 for r in reviews if r.get('rating', 5) >= 4)
            negative = sum(1 for r in reviews if r.get('rating', 5) < 4)
        except Exception:
            pass

    return jsonify({
        'completedVisits': completed_visits,
        'successfulPatients': successful_patients,
        'averageRating': doctor.rating or 4.8,
        'sentiment': {
            'positive': positive,
            'negative': negative
        }
    }), 200

@app.route('/api/doctor/profile', methods=['GET'])
@jwt_required()
def get_doctor_self_profile():
    doctor = get_logged_in_doctor()
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    user = doctor.user
    reviews = []
    if doctor.reviews_json:
        try:
            reviews = json.loads(doctor.reviews_json)
        except Exception:
            pass
            
    # Calculate total patients
    total_patients_count = db.session.query(Appointment.patient_id)\
                                     .filter_by(doctor_id=doctor.id)\
                                     .distinct().count()

    return jsonify({
        'id': doctor.id,
        'name': user.name,
        'email': user.email,
        'phone': doctor.phone or user.phone or '',
        'address': doctor.address or user.address or '',
        'dob': user.dob or '',
        'specialty': doctor.specialty,
        'location': doctor.location,
        'rating': doctor.rating or 4.5,
        'availability': doctor.availability or "09:00 AM - 05:00 PM",
        'schedule': doctor.schedule or "Mon-Fri",
        'years_experience': f"{doctor.years_experience or 5}+ Years",
        'reviews_count': doctor.reviews_count or len(reviews),
        'reviews': reviews,
        'education': doctor.education or "Harvard Medical School",
        'license': doctor.license or "MD-2023-4982",
        'specialization': doctor.specialist_type or doctor.specialty,
        'status': doctor.duty_status or "On Duty",
        'gender': 'Male' if ('albert' in user.name.lower() or 'ross' in user.name.lower()) else 'Female',
        'totalPatients': total_patients_count or 230,
        'surgeries': 90 if 'russell' in user.name.lower() else (64 if 'flores' in user.name.lower() else 12),
        'image': doctor.avatar_url or f"https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=400"
    }), 200

@app.route('/api/doctor/profile', methods=['PUT'])
@jwt_required()
def update_doctor_self_profile():
    doctor = get_logged_in_doctor()
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
        
    data = request.json or {}
    user = doctor.user
    
    if 'name' in data:
        user.name = data['name']
    if 'phone' in data:
        doctor.phone = data['phone']
        user.phone = data['phone']
    if 'address' in data:
        doctor.address = data['address']
        doctor.location = data['address']
        user.address = data['address']
    if 'specialty' in data:
        doctor.specialty = data['specialty']
    if 'specialization' in data:
        doctor.specialist_type = data['specialization']
    if 'education' in data:
        doctor.education = data['education']
    if 'license' in data:
        doctor.license = data['license']
    if 'status' in data:
        doctor.duty_status = data['status']
        
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully'}), 200

@app.route('/api/doctors', methods=['GET'])
@jwt_required()
def get_all_doctors():
    doctors = Doctor.query.all()
    result = []
    for d in doctors:
        reviews = []
        if d.reviews_json:
            try:
                reviews = json.loads(d.reviews_json)
            except Exception:
                pass
        result.append({
            'id': d.id,
            'name': d.user.name,
            'specialty': d.specialty,
            'location': d.location,
            'rating': d.rating,
            'availability': d.availability,
            'schedule': d.schedule,
            'years_experience': f"{d.years_experience or 5}+ Years",
            'avatar_url': d.avatar_url or "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
            'bio': d.description or f"Expert {d.specialty} specialist committed to patient care.",
            'reviews_count': d.reviews_count or len(reviews),
            'reviews': reviews,
            'education': d.education or "Harvard Medical School",
            'license': d.license or "MD-2023-4982"
        })
    return jsonify(result), 200

@app.route('/api/patient/appointments', methods=['GET'])
@jwt_required()
def get_patient_appointments():
    patient_id = current_user_id()
    appointments = Appointment.query.filter_by(patient_id=patient_id).all()
    result = []
    for a in appointments:
        result.append({
            'id': a.id,
            'doctor_id': a.doctor_id,
            'doctor_name': a.doctor.user.name if (a.doctor and a.doctor.user) else "Unknown Doctor",
            'specialty': a.doctor.specialty if a.doctor else "General",
            'date': a.date,
            'time_slot': a.time_slot,
            'status': a.status,
            'doctor_image': a.doctor.avatar_url or "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
            'rejection_reason': a.rejection_reason or ""
        })
    result = sorted(result, key=lambda x: x['date'], reverse=True)
    return jsonify(result), 200

@app.route('/api/doctors/<int:doctor_id>/slots', methods=['GET'])
@jwt_required()
def get_doctor_slots(doctor_id):
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'error': 'Date parameter is required'}), 400
        
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
        
    blocked_dates = []
    if doctor.blocked_dates:
        try:
            blocked_dates = json.loads(doctor.blocked_dates)
        except Exception:
            pass
            
    if date_str in blocked_dates:
        return jsonify([]), 200
        
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        day_of_week = dt.strftime("%A")
    except Exception:
        return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400
        
    slot_templates = {}
    if doctor.slot_templates:
        try:
            slot_templates = json.loads(doctor.slot_templates)
        except Exception:
            pass
            
    default_slots = ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"]
    slots = slot_templates.get(day_of_week, default_slots)
    
    booked_appts = Appointment.query.filter_by(doctor_id=doctor_id, date=date_str).filter(Appointment.status != 'cancelled').all()
    booked_slots = {a.time_slot for a in booked_appts}
    
    free_slots = [s for s in slots if s not in booked_slots]
    return jsonify(free_slots), 200

if __name__ == '__main__':
    app.run(debug=True)