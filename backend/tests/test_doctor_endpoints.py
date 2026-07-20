import os
import sys
import unittest
import json
from datetime import datetime

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Force in-memory database configuration before loading Flask app to prevent dropping development db
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from app import app, db
from models import User, Doctor, Appointment, SymptomCheck, Prescription, MedicalRecord, SupportTicket, Referral
from flask_jwt_extended import create_access_token

class TestDoctorEndpoints(unittest.TestCase):
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
        self.p_user = User(
            name="Alice Smith", 
            email="alice@patient.com", 
            password="password", 
            role="patient", 
            dob="1990-04-15", 
            allergies="Nuts", 
            chronic="Asthma"
        )
        # 2. Create another Patient User (who doesn't have an appointment with doctor)
        self.p_user2 = User(
            name="Bob Jones",
            email="bob@patient.com",
            password="password",
            role="patient"
        )
        
        # 3. Create Doctor Users
        self.d_user = User(name="Dr. Dianne Flores", email="dianne@doctor.com", password="password", role="doctor")
        self.d_user2 = User(name="Dr. Albert Ross", email="albert@doctor.com", password="password", role="doctor")
        
        db.session.add_all([self.p_user, self.p_user2, self.d_user, self.d_user2])
        db.session.commit()

        # 4. Create Doctor Profiles
        self.doc = Doctor(
            user_id=self.d_user.id,
            specialty="Cardiology",
            location="Cardio Clinic, Building A",
            rating=4.8,
            availability="09:00 AM - 05:00 PM",
            years_experience=10,
            reviews_json=json.dumps([
                {"patient_name": "Alice", "rating": 5, "comment": "Great doctor, very helpful!", "date": "2026-07-10"},
                {"patient_name": "Bob", "rating": 4, "comment": "Nice, but busy", "date": "2026-07-10"},
                {"patient_name": "Charlie", "rating": 5, "comment": "Excellent care!", "date": "2026-07-10"},
                {"patient_name": "Dave", "rating": 5, "comment": "Highly recommend", "date": "2026-07-10"},
                {"patient_name": "Eva", "rating": 5, "comment": "Super professional", "date": "2026-07-10"}
            ])
        )
        self.doc2 = Doctor(
            user_id=self.d_user2.id,
            specialty="Dermatology",
            location="Skin Clinic, Building B",
            rating=4.5,
            availability="10:00 AM - 04:00 PM"
        )
        db.session.add_all([self.doc, self.doc2])
        db.session.commit()

        # 5. Create Appointment between Dr. Flores and Alice
        self.appt = Appointment(
            patient_id=self.p_user.id,
            doctor_id=self.doc.id,
            date="2026-07-20",
            time_slot="09:30 AM",
            status="scheduled"
        )
        db.session.add(self.appt)
        db.session.commit()

        # 6. Create Prescription
        self.presc = Prescription(
            appointment_id=self.appt.id,
            doctor_id=self.doc.id,
            patient_id=self.p_user.id,
            diagnosis="Mild cardiac murmur",
            medications=json.dumps([{"name": "Beta blocker", "dosage": "5mg", "qty": 1}]),
            notes="Take once daily"
        )
        db.session.add(self.presc)
        db.session.commit()

        # 7. Create SymptomCheck for Alice
        self.check = SymptomCheck(
            patient_id=self.p_user.id,
            symptoms="shortness of breath, chest pain",
            diagnosed_conditions=json.dumps(["Angina"]),
            confidence_scores=json.dumps([85]),
            severity_score=18,
            is_urgent=True
        )
        db.session.add(self.check)
        db.session.commit()

    def test_get_doctor_appointments(self):
        token = create_access_token(identity={'id': self.d_user.id, 'role': 'doctor'})
        headers = {'Authorization': f'Bearer {token}'}

        response = self.app_client.get('/api/doctor/appointments', headers=headers)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['patient']['name'], "Alice Smith")
        self.assertEqual(data[0]['triage']['severity'], 18)
        self.assertEqual(data[0]['triage']['isUrgent'], True)

    def test_update_appointment_status(self):
        token = create_access_token(identity={'id': self.d_user.id, 'role': 'doctor'})
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

        response = self.app_client.put(
            f'/api/doctor/appointments/{self.appt.id}/status',
            headers=headers,
            data=json.dumps({'status': 'in_consult'})
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'in_consult')

    def test_reject_specialty_mismatch(self):
        token = create_access_token(identity={'id': self.d_user.id, 'role': 'doctor'})
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

        reason_text = "Symptoms checked point to Asthma. Requires Pulmonologist rather than Cardiologist."
        response = self.app_client.put(
            f'/api/doctor/appointments/{self.appt.id}/reject',
            headers=headers,
            data=json.dumps({'reason': reason_text})
        )
        self.assertEqual(response.status_code, 200)

        # Verify appointment updated
        updated_appt = Appointment.query.get(self.appt.id)
        self.assertEqual(updated_appt.status, 'rejected')
        self.assertEqual(updated_appt.rejection_reason, reason_text)

        # Verify Support Ticket for Admin logged
        ticket = SupportTicket.query.filter_by(role='doctor').first()
        self.assertIsNotNone(ticket)
        self.assertEqual(ticket.creator_name, self.d_user.name)
        self.assertEqual(ticket.priority, "High")
        self.assertIn("Specialty Mismatch Reassignment", ticket.subject)
        self.assertIn(reason_text, ticket.description)

    def test_treating_relationship_ehr_access(self):
        # 1. Authorized doctor (Flores) queries Alice's chart
        token_auth = create_access_token(identity={'id': self.d_user.id, 'role': 'doctor'})
        headers_auth = {'Authorization': f'Bearer {token_auth}'}

        response_auth = self.app_client.get(f'/api/doctor/patients/{self.p_user.id}/records', headers=headers_auth)
        self.assertEqual(response_auth.status_code, 200)
        data = json.loads(response_auth.data)
        self.assertEqual(data['profile']['name'], "Alice Smith")
        self.assertEqual(data['profile']['chronic'], "Asthma")
        self.assertEqual(len(data['symptomHistory']), 1)

        # 2. Unauthorized doctor (Albert Ross) queries Alice's chart -> Denied!
        token_unauth = create_access_token(identity={'id': self.d_user2.id, 'role': 'doctor'})
        headers_unauth = {'Authorization': f'Bearer {token_unauth}'}

        response_unauth = self.app_client.get(f'/api/doctor/patients/{self.p_user.id}/records', headers=headers_unauth)
        self.assertEqual(response_unauth.status_code, 403)
        self.assertIn("Access Denied", json.loads(response_unauth.data)['error'])

        # 3. Doctor queries patient2 (Bob Jones) who has no appointments with anyone -> Denied!
        response_unauth_p2 = self.app_client.get(f'/api/doctor/patients/{self.p_user2.id}/records', headers=headers_auth)
        self.assertEqual(response_unauth_p2.status_code, 403)

    def test_upload_patient_lab_record(self):
        token = create_access_token(identity={'id': self.d_user.id, 'role': 'doctor'})
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

        # Post mock file JSON upload
        response = self.app_client.post(
            f'/api/doctor/patients/{self.p_user.id}/upload',
            headers=headers,
            data=json.dumps({'filename': 'Cardiology_ECG_Result.pdf'})
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertEqual(data['fileName'], 'Cardiology_ECG_Result.pdf')
        
        # Verify saved in db
        rec = MedicalRecord.query.get(data['recordId'])
        self.assertIsNotNone(rec)
        self.assertEqual(rec.file_path, "uploads/Cardiology_ECG_Result.pdf")
        self.assertEqual(rec.file_type, "PDF")

    def test_doctor_referrals(self):
        token = create_access_token(identity={'id': self.d_user.id, 'role': 'doctor'})
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

        # 1. Post a referral for Alice to Dr. Albert Ross (Dermatologist)
        response_post = self.app_client.post(
            '/api/doctor/referrals',
            headers=headers,
            data=json.dumps({
                'patient_id': self.p_user.id,
                'referee_id': self.doc2.id,
                'reason': 'Skin rashes developed after cardiodrug therapy.',
                'notes': 'Please evaluate skin lesion.'
            })
        )
        self.assertEqual(response_post.status_code, 201)
        ref_id = json.loads(response_post.data)['id']

        # Verify saved
        ref = Referral.query.get(ref_id)
        self.assertIsNotNone(ref)
        self.assertEqual(ref.status, "Pending")

        # 2. Get referrals for doctor Flores (Dianne)
        response_get = self.app_client.get('/api/doctor/referrals', headers=headers)
        self.assertEqual(response_get.status_code, 200)
        data = json.loads(response_get.data)
        self.assertEqual(len(data['outbound']), 1)
        self.assertEqual(data['outbound'][0]['refereeName'], "Dr. Albert Ross")

        # 3. Accept referral on behalf of doctor Ross (Albert)
        token_ross = create_access_token(identity={'id': self.d_user2.id, 'role': 'doctor'})
        headers_ross = {'Authorization': f'Bearer {token_ross}', 'Content-Type': 'application/json'}
        
        response_accept = self.app_client.put(
            f'/api/doctor/referrals/{ref_id}/status',
            headers=headers_ross,
            data=json.dumps({'status': 'Accepted'})
        )
        self.assertEqual(response_accept.status_code, 200)
        
        # Verify status is accepted and a mock appointment was auto created
        self.assertEqual(Referral.query.get(ref_id).status, 'Accepted')
        appt = Appointment.query.filter_by(doctor_id=self.doc2.id, patient_id=self.p_user.id).first()
        self.assertIsNotNone(appt)
        self.assertEqual(appt.status, 'scheduled')

    def test_schedule_settings(self):
        token = create_access_token(identity={'id': self.d_user.id, 'role': 'doctor'})
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

        # Get schedule configurations
        response_get = self.app_client.get('/api/doctor/schedule', headers=headers)
        self.assertEqual(response_get.status_code, 200)

        # Update schedule configurations
        response_put = self.app_client.post(
            '/api/doctor/schedule',
            headers=headers,
            data=json.dumps({
                'availability': '10 AM - 3 PM',
                'schedule': 'Mon-Wed-Fri',
                'blockedDates': ['2026-08-09'],
                'slotTemplates': {'Mon': ['09:00 AM', '10:00 AM']}
            })
        )
        self.assertEqual(response_put.status_code, 200)

        # Verify updated in database
        self.assertEqual(self.doc.availability, '10 AM - 3 PM')
        self.assertEqual(self.doc.schedule, 'Mon-Wed-Fri')
        self.assertEqual(json.loads(self.doc.blocked_dates), ['2026-08-09'])

    def test_doctor_performance_analytics(self):
        # Mark Alice's appointment completed to drive stats
        self.appt.status = 'completed'
        db.session.commit()

        token = create_access_token(identity={'id': self.d_user.id, 'role': 'doctor'})
        headers = {'Authorization': f'Bearer {token}'}

        response = self.app_client.get('/api/doctor/analytics', headers=headers)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertEqual(data['completedVisits'], 1)
        self.assertEqual(data['successfulPatients'], 1)
        self.assertEqual(data['averageRating'], 4.8)
        self.assertEqual(data['sentiment']['positive'], 5) # parsed reviews

if __name__ == '__main__':
    unittest.main()
