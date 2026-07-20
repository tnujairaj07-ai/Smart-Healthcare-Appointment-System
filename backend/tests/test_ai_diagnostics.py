import os
import sys
import unittest
import json

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Force in-memory database configuration before loading Flask app to prevent dropping development db
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from app import app, db
from models import User, Condition, Doctor
from utils.ai_handler import predict_condition, get_condition_precautions
from flask_jwt_extended import create_access_token

class TestAIDiagnostics(unittest.TestCase):
    def setUp(self):
        # Configure app for testing
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        
        self.app_client = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()

        # Isolate database connection and bind to in-memory db
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
        # 1. Create conditions
        c1 = Condition(
            name="Fungal Infection",
            symptoms="itching, skin_rash, nodal_skin_eruptions, dischromic_patches",
            description="A skin infection caused by a fungus.",
            recommended_specialty="Dermatology",
            urgency="medium"
        )
        c2 = Condition(
            name="Malaria",
            symptoms="chills, vomiting, high_fever, sweating, headache, nausea",
            description="A disease caused by a plasmodium parasite, transmitted by mosquitoes.",
            recommended_specialty="General Medicine",
            urgency="high"
        )
        db.session.add_all([c1, c2])
        db.session.commit()

        # 2. Create Patient and Doctor Users
        p_user = User(name="Test Patient", email="testpatient@test.com", password="password", role="patient", dob="1995-05-10", allergies="Penicillin", chronic="None")
        d_user = User(name="Dr. Dermatologist", email="drderm@test.com", password="password", role="doctor")
        db.session.add_all([p_user, d_user])
        db.session.commit()

        # 3. Create Doctor Profile
        doc = Doctor(
            user_id=d_user.id,
            specialty="Dermatology",
            location="Test Clinic, Seattle",
            rating=4.9,
            availability="09:00 AM - 05:00 PM"
        )
        db.session.add(doc)
        db.session.commit()

        self.patient_id = p_user.id

    def test_classifier_predictions(self):
        # Test Naive Bayes prediction on real trained JSON model
        cond, conf = predict_condition(["itching", "skin_rash"])
        self.assertEqual(cond, "Fungal Infection")
        self.assertGreater(conf, 0.1)

        cond_malaria, conf_malaria = predict_condition(["chills", "high_fever", "sweating"])
        self.assertIn(cond_malaria, ["Malaria", "Anxiety"])
        self.assertGreater(conf_malaria, 0.1)

    def test_precautions_lookup(self):
        precs = get_condition_precautions("Fungal Infection")
        self.assertIn("bath twice", precs.lower())
        self.assertIn("keep infected area dry", precs.lower())

        # Test non-existing condition fallback
        precs_fallback = get_condition_precautions("NonExistingDisease")
        self.assertEqual(precs_fallback, "consult doctor | follow medical advice | rest | stay hydrated")

    def test_diagnose_endpoint(self):
        # Generate JWT token
        token = create_access_token(identity={'id': self.patient_id, 'role': 'patient'})
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

        # Send request with a query containing keywords that match Fungal Infection symptoms
        response = self.app_client.post(
            '/api/ai/diagnose',
            headers=headers,
            data=json.dumps({'query': 'I have severe itching and a skin rash on my body.'})
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Verify output keys
        self.assertIn('symptoms', data)
        self.assertIn('condition', data)
        self.assertIn('confidence', data)
        self.assertIn('description', data)
        self.assertIn('precautions', data)
        self.assertIn('recommended_specialty', data)
        self.assertIn('doctors', data)
        self.assertIn('guidance', data)

        # Verify predicted values
        self.assertEqual(data['condition'], "Fungal Infection")
        self.assertEqual(data['recommended_specialty'], "Dermatology")
        self.assertGreater(len(data['doctors']), 0)
        self.assertEqual(data['doctors'][0]['name'], "Dr. Dermatologist")

if __name__ == '__main__':
    unittest.main()
