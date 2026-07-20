import os
import sys
import unittest
import json
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Force in-memory database configuration before loading Flask app
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from app import app, db
from models import User, Doctor, Appointment, Prescription
from flask_jwt_extended import create_access_token

class TestPatientPrescriptionEndpoints(unittest.TestCase):
    def setUp(self):
        # Configure app for testing
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        
        self.app_client = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()

        db.session.remove()
        db.engine.dispose()
        
        db.create_all()
        self.seed_test_data()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.app_context.pop()

    def seed_test_data(self):
        # 1. Create Patient User
        self.patient = User(
            name="Alice Green",
            email="alice@example.com",
            password="testpassword",
            role="patient"
        )
        db.session.add(self.patient)

        # 2. Create Doctor User
        self.doctor_user = User(
            name="Dr. Jenkins",
            email="jenkins@example.com",
            password="docpassword",
            role="doctor"
        )
        db.session.add(self.doctor_user)
        db.session.commit()

        self.doctor = Doctor(
            user_id=self.doctor_user.id,
            specialty="Immunology",
            location="St. Jude General"
        )
        db.session.add(self.doctor)
        db.session.commit()

        # 3. Create active appointment
        self.appt_active = Appointment(
            patient_id=self.patient.id,
            doctor_id=self.doctor.id,
            date=(datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d"),
            time_slot="10 AM",
            status="accepted"
        )
        db.session.add(self.appt_active)
        
        # 4. Create expired appointment (older than 30 days)
        self.appt_expired = Appointment(
            patient_id=self.patient.id,
            doctor_id=self.doctor.id,
            date=(datetime.now() - timedelta(days=40)).strftime("%Y-%m-%d"),
            time_slot="11 AM",
            status="completed"
        )
        db.session.add(self.appt_expired)
        db.session.commit()

        # 5. Generate active prescription
        self.rx_active = Prescription(
            appointment_id=self.appt_active.id,
            doctor_id=self.doctor.id,
            patient_id=self.patient.id,
            diagnosis="Seasonal Allergies",
            medications=json.dumps([{'name': 'Cetirizine', 'dosage': '10mg', 'frequency': 'Daily'}]),
            notes="Take before sleeping",
            pdf_path="prescriptions/prescription_active.pdf"
        )
        db.session.add(self.rx_active)

        # 6. Generate expired prescription
        self.rx_expired = Prescription(
            appointment_id=self.appt_expired.id,
            doctor_id=self.doctor.id,
            patient_id=self.patient.id,
            diagnosis="Chronic Allergies",
            medications=json.dumps([{'name': 'Cetirizine', 'dosage': '10mg', 'frequency': 'Daily'}]),
            notes="Completed intake",
            pdf_path="prescriptions/prescription_expired.pdf"
        )
        db.session.add(self.rx_expired)
        db.session.commit()

        # Generate JWT token for Alice
        user_identity = json.dumps({'id': self.patient.id, 'role': 'patient'})
        self.token = create_access_token(identity=user_identity)

    def test_get_patient_prescriptions(self):
        response = self.app_client.get(
            '/api/patient/prescriptions',
            headers={'Authorization': f'Bearer {self.token}'}
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        
        # Should return 2 prescriptions
        self.assertEqual(len(data), 2)
        
        active_rx = next(x for x in data if x['prescription_id'] == self.rx_active.id)
        self.assertEqual(active_rx['status'], 'Active')
        self.assertEqual(active_rx['doctor'], 'Dr. Jenkins')
        self.assertEqual(active_rx['doctorSpecialty'], 'Immunology')
        self.assertEqual(active_rx['pdfPath'], 'prescriptions/prescription_active.pdf')
        self.assertEqual(active_rx['refillsLeft'], 3)

        expired_rx = next(x for x in data if x['prescription_id'] == self.rx_expired.id)
        self.assertEqual(expired_rx['status'], 'Expired')
        self.assertEqual(expired_rx['refillsLeft'], 0)

if __name__ == '__main__':
    unittest.main()
