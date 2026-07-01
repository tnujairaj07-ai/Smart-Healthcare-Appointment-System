from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'patient' or 'doctor'
    created_at = db.Column(db.DateTime, default=datetime.now)

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

class SymptomCheck(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    symptoms = db.Column(db.String(500), nullable=False)
    diagnosed_conditions = db.Column(db.String(500))  # JSON
    confidence_scores = db.Column(db.String(500))     # JSON
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