from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'patient' or 'doctor'
    status = db.Column(db.String(20), default='Active') # 'Active' or 'Locked' or 'Pending'
    created_at = db.Column(db.DateTime, default=datetime.now)

    # Patient demographics
    phone = db.Column(db.String(30))
    address = db.Column(db.String(200))
    dob = db.Column(db.String(30))
    allergies = db.Column(db.String(200))
    chronic = db.Column(db.String(200))
    blood_type = db.Column(db.String(10))
    past_illnesses = db.Column(db.String(200))

    doctors = db.relationship('Doctor', backref='user', lazy=True)
    appointments = db.relationship('Appointment', backref='patient', lazy=True)

class Doctor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    specialty = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    rating = db.Column(db.Float, default=4.0)
    availability = db.Column(db.String(50), default="9 AM - 5 PM")
    schedule = db.Column(db.String(50), default="Mon-Sat")
    phone = db.Column(db.String(30))
    address = db.Column(db.String(200))
    description = db.Column(db.Text)
    npi = db.Column(db.String(30))
    specialist_type = db.Column(db.String(100))
    languages = db.Column(db.String(100))
    licenses = db.Column(db.Text)  # JSON-encoded array of licenses
    patient_overview = db.Column(db.Text)  # JSON-encoded patient overview stats
    verified = db.Column(db.Boolean, default=False)
    revenue = db.Column(db.String(30), default="$0")
    avatar_url = db.Column(db.String(200))
    type = db.Column(db.String(20), default="old")
    duty_status = db.Column(db.String(50), default="On Duty")
    hospital = db.Column(db.String(100), default="St. Jude General")

class Condition(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    symptoms = db.Column(db.String(500), nullable=False)
    description = db.Column(db.String(500))
    recommended_specialty = db.Column(db.String(100))
    urgency = db.Column(db.String(20), default="low")

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)
    date = db.Column(db.String(20), nullable=False)      # "2026-06-25"
    time_slot = db.Column(db.String(20), nullable=False) # "10 AM"
    status = db.Column(db.String(20), default="pending")
    created_at = db.Column(db.DateTime, default=datetime.now)

    doctor = db.relationship('Doctor', backref='appointments', lazy=True)

class SymptomCheck(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    symptoms = db.Column(db.String(500), nullable=False)
    diagnosed_conditions = db.Column(db.String(500))  # JSON
    confidence_scores = db.Column(db.String(500))     # JSON
    severity_score = db.Column(db.Integer, default=0)
    is_urgent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

class Prescription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(
        db.Integer,
        db.ForeignKey('appointment.id'),
        nullable=False
    )
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    diagnosis = db.Column(db.String(200), nullable=False)
    medications = db.Column(db.String(500), nullable=False)  # JSON
    notes = db.Column(db.String(500))
    qr_code_path = db.Column(db.String(100))
    pdf_path = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.now)

class MedicalRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    file_path = db.Column(db.String(200), nullable=False)
    file_type = db.Column(db.String(20))
    upload_date = db.Column(db.DateTime, default=datetime.now)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=50)
    category = db.Column(db.String(50), default="General")
    description = db.Column(db.String(200))
    status = db.Column(db.String(20), default="In Stock") # "In Stock" / "Out of Stock"

class PharmacyOrder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_name = db.Column(db.String(100), nullable=False)
    items = db.Column(db.String(500), nullable=False) # JSON list
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(25), default="Pending") # "Pending", "Shipped", "Cancelled"
    created_at = db.Column(db.DateTime, default=datetime.now)

class RAGDataset(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), default="Clinical Guidelines")
    status = db.Column(db.String(20), default="Indexed") # "Indexing", "Indexed"
    file_size = db.Column(db.String(20), default="12 KB")
    uploaded_at = db.Column(db.DateTime, default=datetime.now)

class SupportTicket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    creator_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default="patient") # "patient", "doctor"
    subject = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default="Medium") # "Low", "Medium", "High"
    status = db.Column(db.String(20), default="Open") # "Open", "In Progress", "Resolved"
    created_at = db.Column(db.DateTime, default=datetime.now)