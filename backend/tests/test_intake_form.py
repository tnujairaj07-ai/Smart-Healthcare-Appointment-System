import os
import sys
import unittest
import json
from datetime import datetime

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Force in-memory database configuration before loading Flask app
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from app import app, db
from models import User
from flask_jwt_extended import create_access_token

class TestIntakeFormEndpoints(unittest.TestCase):
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
        # Create a test patient
        self.patient = User(
            name="Sarah Parker",
            email="sarah.p@example.com",
            password="testpassword",
            role="patient",
            phone="123-456-7890",
            address="123 Main St",
            dob="1990-05-15"
        )
        db.session.add(self.patient)
        db.session.commit()

        # Generate JWT identity matches app.py loader (JSON string mapping)
        user_identity = json.dumps({'id': self.patient.id, 'role': 'patient'})
        self.token = create_access_token(identity=user_identity)

    def test_get_empty_intake_form(self):
        # Should return an empty object/dictionary if none set
        response = self.app_client.get(
            '/api/patient/intake-form',
            headers={'Authorization': f'Bearer {self.token}'}
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['intake_form'], {})

    def test_put_and_get_intake_form(self):
        # Mock intake form payload matching step schema
        mock_form = {
            "patientInformation": {
                "fullName": "Sarah Parker-Smith",
                "dateOfBirth": "1990-05-16",
                "gender": "Female",
                "contactNumber": "999-888-7777",
                "homeAddress": "456 Wellness Blvd"
            },
            "allergiesSensitivities": {
                "drugAllergies": "Penicillin",
                "foodAllergies": "Shellfish",
                "otherAllergies": "Pollen",
                "reactionType": "Hives"
            },
            "currentHealthIssues": {
                "listConditions": "Mild asthma"
            },
            "pastMedicalHistory": {
                "pastIllnesses": "Childhood chickenpox"
            },
            "consentPreferences": {
                "consentStoreCareAnalytics": True,
                "consentAISharing": True
            }
        }

        # Put intake form
        put_response = self.app_client.put(
            '/api/patient/intake-form',
            headers={'Authorization': f'Bearer {self.token}'},
            json={'intake_form': mock_form}
        )
        self.assertEqual(put_response.status_code, 200)

        # Get intake form and assert equality
        get_response = self.app_client.get(
            '/api/patient/intake-form',
            headers={'Authorization': f'Bearer {self.token}'}
        )
        self.assertEqual(get_response.status_code, 200)
        data = get_response.get_json()
        self.assertEqual(data['intake_form']['patientInformation']['fullName'], "Sarah Parker-Smith")
        self.assertEqual(data['intake_form']['allergiesSensitivities']['drugAllergies'], "Penicillin")

        # Verify demographics sync to primary User fields
        updated_user = User.query.get(self.patient.id)
        self.assertEqual(updated_user.name, "Sarah Parker-Smith")
        self.assertEqual(updated_user.dob, "1990-05-16")
        self.assertEqual(updated_user.phone, "999-888-7777")
        self.assertEqual(updated_user.address, "456 Wellness Blvd")
        self.assertIn("Penicillin", updated_user.allergies)
        self.assertEqual(updated_user.chronic, "Mild asthma")
        self.assertEqual(updated_user.past_illnesses, "Childhood chickenpox")

    def test_unauthorized_get(self):
        # Should block if no token supplied
        response = self.app_client.get('/api/patient/intake-form')
        self.assertEqual(response.status_code, 401)

if __name__ == '__main__':
    unittest.main()
