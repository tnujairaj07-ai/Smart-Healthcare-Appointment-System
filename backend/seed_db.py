import os
import json
import csv
from datetime import datetime
from collections import defaultdict
from app import app, db
from models import User, Doctor, Condition, Appointment, Prescription, MedicalRecord, Product

SPELLING_MAPS = {
    "peptic ulcer diseae": "Peptic Ulcer Disease",
    "peptic ulcer disease": "Peptic Ulcer Disease",
    "dimorphic hemmorhoids(piles)": "Dimorphic Hemorrhoids (Piles)",
    "dimorphic hemmorhoids (piles)": "Dimorphic Hemorrhoids (Piles)",
    "dimorphic hemorrhoids (piles)": "Dimorphic Hemorrhoids (Piles)",
    "osteoarthristis": "Osteoarthritis",
    "(vertigo) paroymsal  positional vertigo": "(Vertigo) Paroxysmal Positional Vertigo",
    "(vertigo) paroymsal positional vertigo": "(Vertigo) Paroxysmal Positional Vertigo",
    "(vertigo) paroxysmal positional vertigo": "(Vertigo) Paroxysmal Positional Vertigo",
    "hepatitis a": "Hepatitis A",
    "gerd": "GERD",
    "aids": "AIDS",
    "copd": "COPD",
}

def clean_name(name):
    n_lower = " ".join(name.strip().lower().split())
    if n_lower in SPELLING_MAPS:
        return SPELLING_MAPS[n_lower]
    return " ".join(w.capitalize() for w in n_lower.split())


def seed_database():
    print("Dropping all existing database tables...")
    try:
        db.session.remove()
        db.engine.dispose()
        db.drop_all()
        print("All tables dropped successfully.")
    except Exception as e:
        print("Failed to drop tables:", e)

    print("Re-creating all database tables...")
    db.create_all()

    # --- SEED USERS (Patients, Doctors, Admin) ---
    print("Seeding Users...")
    
    # 1. Admin User
    admin_user = User(
        name="Nola Hawkins",
        email="nola.hawkins@novacare.com",
        password="adminpassword",  # plain for mock simplicity
        role="admin"
    )
    db.session.add(admin_user)
    
    # 2. Doctor Users
    doc_users_data = [
        {
            "name": "Dr. Brooklyn Simmons",
            "email": "brooklyn.s@novacare.com",
            "password": "doctorpassword",
            "role": "doctor",
            "specialty": "Cardiologist",
            "location": "12 Emerald Road, Seattle, USA",
            "latitude": 47.6062,
            "longitude": -122.3321,
            "rating": 4.9,
            "availability": "08:00 AM - 04:00 PM",
            "schedule": "Mon-Fri",
            "phone": "+(555) 234-9871",
            "address": "12 Emerald Road, Seattle, USA",
            "description": "Dr. Brooklyn Simmons has over 10 years of experience specialized in non-invasive cardiology. She holds multi-state licenses and is deeply committed to prevention procedures.",
            "npi": "1004509187",
            "specialistType": "Cardiologist",
            "languages": "English, Spanish",
            "verified": True,
            "revenue": "$18,200",
            "avatar_url": "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=250",
            "type": "old",
            "licenses": [
                { "number": "#054112", "expiration": "2011 - 2025", "state": "Washington", "status": "Active" },
                { "number": "#14521448", "expiration": "3110 - 2024", "state": "California", "status": "Inactive" }
            ],
            "patient_overview": {
                "old": [40, 35, 45, 30, 38, 42, 35],
                "new": [15, 22, 28, 12, 19, 21, 14]
            }
        },
        {
            "name": "Dr. Farhan Ahmed",
            "email": "farhanahmed@dr.com",
            "password": "doctorpassword",
            "role": "doctor",
            "specialty": "Cardiologist Surgeon",
            "location": "123 Maple Street, Springfield, USA",
            "latitude": 39.7817,
            "longitude": -89.6501,
            "rating": 4.8,
            "availability": "09:00 AM - 05:00 PM",
            "schedule": "Mon-Sat",
            "phone": "+(555) 764-1095",
            "address": "123 Maple Street, Springfield, USA",
            "description": "I am pleased to be part of the Northwest Ohio Community since 2012. I provide Cardiologist Surgeon, medical and medication management services to reduce pain and suffering of patients.",
            "npi": "10030000126",
            "specialistType": "Cardiologist",
            "languages": "English, Urdu, Bangla",
            "verified": True,
            "revenue": "$22,800",
            "avatar_url": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250",
            "type": "New",
            "licenses": [
                { "number": "#068455", "expiration": "2008 - 2024", "state": "Maryland", "status": "Active" },
                { "number": "#563655", "expiration": "8455 - 2026", "state": "Australia", "status": "Active" },
                { "number": "#14314412", "expiration": "9081 - 2023", "state": "Ohio", "status": "Inactive" }
            ],
            "patient_overview": {
                "old": [30, 25, 40, 15, 30, 35, 40],
                "new": [20, 18, 44, 25, 22, 18, 20]
            }
        },
        {
            "name": "Dr. Dianne Russell",
            "email": "dianne.r@novacareos.com",
            "password": "doctorpassword",
            "role": "doctor",
            "specialty": "Gastroenterologist",
            "location": "456 Sapphire Blvd, Boston, USA",
            "latitude": 42.3601,
            "longitude": -71.0589,
            "rating": 4.7,
            "availability": "10:00 AM - 06:00 PM",
            "schedule": "Mon-Thu",
            "phone": "+(555) 893-1123",
            "address": "456 Sapphire Blvd, Boston, USA",
            "description": "Specializing in advanced digestive wellness programs. Over 15 years diagnosing and treating complex metabolic, esophageal, and gastrointestinal syndromes.",
            "npi": "1009845112",
            "specialistType": "Gastroenterology Expert",
            "languages": "English, French, German",
            "verified": True,
            "revenue": "$19,500",
            "avatar_url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250",
            "type": "old",
            "licenses": [
                { "number": "#021145", "expiration": "2010 - 2026", "state": "Massachusetts", "status": "Active" }
            ],
            "patient_overview": {
                "old": [25, 30, 35, 42, 28, 30, 31],
                "new": [10, 15, 20, 14, 18, 22, 19]
            }
        },
        {
            "name": "Dr. Jenny Wilson",
            "email": "jenny.wilson@novacare.com",
            "password": "doctorpassword",
            "role": "doctor",
            "specialty": "Endocrinologist",
            "location": "189 Willow Pass, Denver, USA",
            "latitude": 39.7392,
            "longitude": -104.9903,
            "rating": 4.6,
            "availability": "09:00 AM - 05:00 PM",
            "schedule": "Tue-Fri",
            "phone": "+(555) 431-8971",
            "address": "189 Willow Pass, Denver, USA",
            "description": "Dedicated endocrinologist focusing on diabetes prevention, thyroid management, and hormonal therapies. Certified clinical instructor and researcher.",
            "npi": "1006734129",
            "specialistType": "Endocrinology",
            "languages": "English, Hindi",
            "verified": False,
            "revenue": "$12,600",
            "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250",
            "type": "New",
            "licenses": [
                { "number": "#099812", "expiration": "2014 - 2025", "state": "Colorado", "status": "Active" }
            ],
            "patient_overview": {
                "old": [35, 40, 22, 33, 41, 38, 45],
                "new": [30, 25, 18, 20, 27, 24, 30]
            }
        },
        {
            "name": "Dr. Eleanor Pena",
            "email": "eleanor.p@novacare.com",
            "password": "doctorpassword",
            "role": "doctor",
            "specialty": "Rheumatologist",
            "location": "102 Oakwood Drive, Austin, USA",
            "latitude": 30.2672,
            "longitude": -97.7431,
            "rating": 4.9,
            "availability": "08:30 AM - 04:30 PM",
            "schedule": "Mon-Fri",
            "phone": "+(555) 762-1144",
            "address": "102 Oakwood Drive, Austin, USA",
            "description": "Focuses on clinical immunology and degenerative joint pathology. Published author in modern arthritis treatment breakthroughs.",
            "npi": "1004561129",
            "specialistType": "Rheumatology Specialist",
            "languages": "English, Portuguese",
            "verified": True,
            "revenue": "$24,100",
            "avatar_url": "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=250",
            "type": "old",
            "licenses": [
                { "number": "#1081190", "expiration": "2013 - 2025", "state": "Texas", "status": "Active" }
            ],
            "patient_overview": {
                "old": [45, 38, 40, 31, 39, 44, 42],
                "new": [12, 19, 21, 28, 20, 15, 18]
            }
        },
        {
            "name": "Dr. Cameron Williamson",
            "email": "cameron.w@novacare.com",
            "password": "doctorpassword",
            "role": "doctor",
            "specialty": "Neurosurgeon",
            "location": "1778 Pine Heights, Chicago, USA",
            "latitude": 41.8781,
            "longitude": -87.6298,
            "rating": 5.0,
            "availability": "08:00 AM - 05:00 PM",
            "schedule": "Mon-Wed",
            "phone": "+(555) 198-4422",
            "address": "1778 Pine Heights, Chicago, USA",
            "description": "Expert neurosurgeon skilled in minimally invasive brain surgery, spinal decompression, and advanced neuroscience diagnostics.",
            "npi": "1003112245",
            "specialistType": "Neurological Surgery",
            "languages": "English, Russian",
            "verified": True,
            "revenue": "$34,200",
            "avatar_url": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=250",
            "type": "New",
            "licenses": [
                { "number": "#041123", "expiration": "2016 - 2027", "state": "Illinois", "status": "Active" }
            ],
            "patient_overview": {
                "old": [30, 32, 28, 35, 42, 38, 40],
                "new": [18, 20, 15, 24, 25, 21, 23]
            }
        },
        {
            "name": "Dr. Courtney Henry",
            "email": "courtney.h@novacare.com",
            "password": "doctorpassword",
            "role": "doctor",
            "specialty": "Plastic Surgeon",
            "location": "190 Beachside Ave, Miami, USA",
            "latitude": 25.7617,
            "longitude": -80.1918,
            "rating": 4.8,
            "availability": "10:00 AM - 05:00 PM",
            "schedule": "Wed-Sat",
            "phone": "+(555) 881-2311",
            "address": "190 Beachside Ave, Miami, USA",
            "description": "Specializes in aesthetic restoration, burns reconstructive surgery, and clinical micro-suturing technologies.",
            "npi": "1002235612",
            "specialistType": "Plastic & Reconstructive",
            "languages": "English, Spanish, Italian",
            "verified": True,
            "revenue": "$27,500",
            "avatar_url": "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=250",
            "type": "old",
            "licenses": [
                { "number": "#055123", "expiration": "2012 - 2026", "state": "Florida", "status": "Active" }
            ],
            "patient_overview": {
                "old": [20, 25, 30, 22, 28, 35, 33],
                "new": [15, 12, 19, 18, 25, 20, 24]
            }
        }
    ]
    
    doctors_map = {}
    for item in doc_users_data:
        u = User(name=item["name"], email=item["email"], password=item["password"], role="doctor")
        db.session.add(u)
        db.session.commit() # Need ID to bind to Doctor model
        
        d = Doctor(
            user_id=u.id,
            specialty=item["specialty"],
            location=item["location"],
            latitude=item["latitude"],
            longitude=item["longitude"],
            rating=item["rating"],
            availability=item["availability"],
            schedule=item["schedule"],
            phone=item["phone"],
            address=item["address"],
            description=item["description"],
            npi=item["npi"],
            specialist_type=item["specialistType"],
            languages=item["languages"],
            verified=item["verified"],
            revenue=item["revenue"],
            avatar_url=item["avatar_url"],
            type=item["type"],
            licenses=json.dumps(item["licenses"]),
            patient_overview=json.dumps(item["patient_overview"])
        )
        db.session.add(d)
        db.session.commit()
        doctors_map[item["name"]] = d.id

    # Seed Doctors from doctors.csv (complementary to the demo doctors)
    doctors_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'data', 'doctors.csv')
    if os.path.exists(doctors_path):
        print("Seeding Doctors from doctors.csv...")
        with open(doctors_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if i >= 50:  # Seed first 50 doctors for efficiency
                    break
                name = row.get("name")
                email = name.lower().replace(" ", ".") + "@novacare.com"
                if User.query.filter_by(email=email).first():
                    continue
                u = User(name=name, email=email, password="doctorpassword", role="doctor")
                db.session.add(u)
                db.session.commit()
                
                licenses_mock = [
                    { "number": f"#{row.get('npi_number', '10029302')}", "expiration": "2024 - 2028", "state": "Washington", "status": "Active" }
                ]
                patient_overview_mock = {
                    "old": [20, 25, 30, 22, 28, 35, 33],
                    "new": [15, 12, 19, 18, 25, 20, 24]
                }
                
                d = Doctor(
                    user_id=u.id,
                    specialty=row.get("specialty", "General Medicine"),
                    location=row.get("location", "Seattle, USA"),
                    latitude=47.6062,
                    longitude=-122.3321,
                    rating=float(row.get("rating", 4.0)) if row.get("rating") else 4.0,
                    availability=row.get("availability_hours", "09:00 AM - 05:00 PM"),
                    schedule=row.get("weekly_schedule", "Mon-Fri"),
                    phone=row.get("phone", "+(555) 000-0000"),
                    address=row.get("location", "Seattle, USA"),
                    description=row.get("biography", "Specialist medical practitioner."),
                    npi=row.get("npi_number", "1000000000"),
                    specialist_type=row.get("specialty", "General Medicine"),
                    languages=row.get("languages_spoken", "English"),
                    verified=True,
                    revenue="$15,000",
                    avatar_url=row.get("avatar_url", ""),
                    type="old",
                    licenses=json.dumps(licenses_mock),
                    patient_overview=json.dumps(patient_overview_mock),
                    hospital=row.get("hospital_affiliation", "NovaCare General Hospital")
                )
                db.session.add(d)
                db.session.commit()
                doctors_map[name] = d.id

    # 3. Patient Users
    patients_data = [
        {"name": "Leslie Alexander", "email": "leslie@novacare.com", "password": "patientpassword"},
        {"name": "Devon Lane", "email": "devon@novacare.com", "password": "patientpassword"},
        {"name": "Cody Fisher", "email": "cody@novacare.com", "password": "patientpassword"},
        {"name": "Theresa Webb", "email": "theresa@novacare.com", "password": "patientpassword"},
        {"name": "Bessie Cooper", "email": "bessie@novacare.com", "password": "patientpassword"},
        {"name": "Guy Hawkins", "email": "guy@novacare.com", "password": "patientpassword"},
        {"name": "Albert Flores", "email": "albert@novacare.com", "password": "patientpassword"},
        {"name": "Ronald Richards", "email": "ronald@novacare.com", "password": "patientpassword"},
        {"name": "Jane Cooper", "email": "jane@novacare.com", "password": "patientpassword"},
        {"name": "Jerome Bell", "email": "jerome@novacare.com", "password": "patientpassword"},
        {"name": "Darlene Robertson", "email": "darlene@novacare.com", "password": "patientpassword"},
        {"name": "Kristin Watson", "email": "kristin.w@novacare.com", "password": "patientpassword"}
    ]
    
    patients_map = {}
    for idx, p in enumerate(patients_data):
        u = User(name=p["name"], email=p["email"], password=p["password"], role="patient")
        db.session.add(u)
        db.session.commit()
        patients_map[p["name"]] = u.id

    # Seed Patients from patients.csv (first 200 patients)
    patients_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'data', 'patients.csv')
    if os.path.exists(patients_path):
        print("Seeding Patients from patients.csv...")
        with open(patients_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if i >= 200:  # Seed first 200 patients for efficiency
                    break
                name = row.get("name")
                email = row.get("email")
                if User.query.filter_by(email=email).first():
                    continue
                u = User(
                    name=name,
                    email=email,
                    password="patientpassword",
                    role="patient",
                    phone=row.get("phone", ""),
                    address=row.get("address", ""),
                    dob=row.get("date_of_birth", ""),
                    allergies=row.get("allergies", "None"),
                    chronic=row.get("chronic_conditions", "None"),
                    blood_type=row.get("blood_type", "")
                )
                db.session.add(u)
                db.session.commit()
                patients_map[name] = u.id

    # Seed Products from pharmacy_catalog.csv (first 150 items)
    products_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'data', 'pharmacy_catalog.csv')
    if os.path.exists(products_path):
        print("Seeding Products from pharmacy_catalog.csv...")
        with open(products_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if i >= 150:  # Seed first 150 products for efficiency
                    break
                name = row.get("product_name")
                price = float(row.get("price", 10.0)) if row.get("price") else 10.0
                stock = int(row.get("stock_quantity", 50)) if row.get("stock_quantity") else 50
                category = row.get("category", "General")
                desc = row.get("description", "")
                
                status = "In Stock"
                if stock == 0:
                    status = "Out of Stock"
                elif stock <= 20:
                    status = "Low Stock"
                if row.get("prescription_required") == "True" or row.get("prescription_required") == "true":
                    status = "Prescription Only"
                    
                p = Product(
                    name=name,
                    price=price,
                    stock=stock,
                    category=category,
                    description=desc,
                    status=status
                )
                db.session.add(p)
            db.session.commit()

    # --- SEED APPOINTMENTS & PRESCRIPTIONS (Treated Patients History) ---
    print("Seeding Appointments & Prescriptions...")
    
    # We will generate a rich log of appointments spanning 2025 and 2026.
    # Grouped by doctor to ensure all doctors have treated patient lists.
    raw_appointments = [
        # Dr. Brooklyn Simmons
        {"doctor": "Dr. Brooklyn Simmons", "patient": "Theresa Webb", "date": "2026-07-15", "time": "08:30 AM", "issue": "Arrhythmia checkup", "status": "completed", "diagnosis": "Mild Sinus Arrhythmia", "meds": [{"name": "Metoprolol", "dosage": "25mg", "frequency": "Once daily"}], "notes": "Monitor heart rate and restrict caffeine intake."},
        {"doctor": "Dr. Brooklyn Simmons", "patient": "Jane Cooper", "date": "2026-07-15", "time": "11:15 AM", "issue": "ECG Analysis", "status": "completed", "diagnosis": "Normal sinus rhythm", "meds": [], "notes": "ECG is normal. Review in 12 months."},
        {"doctor": "Dr. Brooklyn Simmons", "patient": "Leslie Alexander", "date": "2026-07-14", "time": "09:30 AM", "issue": "Hypertension follow-up", "status": "completed", "diagnosis": "Controlled Hypertension", "meds": [{"name": "Lisinopril", "dosage": "10mg", "frequency": "Once daily"}], "notes": "Blood pressure stabilized at 120/80. Continue current dose."},
        {"doctor": "Dr. Brooklyn Simmons", "patient": "Devon Lane", "date": "2026-06-12", "time": "02:00 PM", "issue": "Palpitations", "status": "completed", "diagnosis": "PVCs (Premature Ventricular Contractions)", "meds": [{"name": "Atenolol", "dosage": "25mg", "frequency": "Once daily"}], "notes": "Advised yoga and reduction of stress factors."},
        {"doctor": "Dr. Brooklyn Simmons", "patient": "Cody Fisher", "date": "2025-11-04", "time": "10:00 AM", "issue": "Annual Cardiac Screen", "status": "completed", "diagnosis": "Healthy Heart", "meds": [], "notes": "Cardiac screening clear. Keep exercising."},
        
        # Dr. Farhan Ahmed
        {"doctor": "Dr. Farhan Ahmed", "patient": "Jerome Bell", "date": "2026-07-15", "time": "09:00 AM", "issue": "Post-Op Mitral Valve Review", "status": "completed", "diagnosis": "Optimal valve healing", "meds": [{"name": "Warfarin", "dosage": "5mg", "frequency": "Once daily"}], "notes": "INR checks required weekly. Post-op recovery is perfect."},
        {"doctor": "Dr. Farhan Ahmed", "patient": "Darlene Robertson", "date": "2026-07-15", "time": "11:00 AM", "issue": "Angina discomfort", "status": "completed", "diagnosis": "Stable Angina", "meds": [{"name": "Nitroglycerin", "dosage": "0.4mg", "frequency": "As needed"}], "notes": "Avoid sudden intense activities. Referral for stress test."},
        {"doctor": "Dr. Farhan Ahmed", "patient": "Albert Flores", "date": "2026-07-14", "time": "02:00 PM", "issue": "Post-Op Consultation", "status": "completed", "diagnosis": "Coronary artery bypass recovery", "meds": [{"name": "Clopidogrel", "dosage": "75mg", "frequency": "Once daily"}, {"name": "Atorvastatin", "dosage": "40mg", "frequency": "Once daily at night"}], "notes": "Incision looks clean. Avoid heavy lifting."},
        {"doctor": "Dr. Farhan Ahmed", "patient": "Bessie Cooper", "date": "2026-05-18", "time": "01:00 PM", "issue": "Pre-Op Evaluation", "status": "completed", "diagnosis": "Aortic Stenosis", "meds": [], "notes": "Cleared for surgery next month. Scheduled valve replacement."},
        {"doctor": "Dr. Farhan Ahmed", "patient": "Guy Hawkins", "date": "2025-08-20", "time": "10:30 AM", "issue": "Chest tightness", "status": "completed", "diagnosis": "Atherosclerotic Heart Disease", "meds": [{"name": "Aspirin", "dosage": "81mg", "frequency": "Once daily"}], "notes": "Initiated medical therapy; schedule angiogram if symptoms worsen."},

        # Dr. Dianne Russell
        {"doctor": "Dr. Dianne Russell", "patient": "Guy Hawkins", "date": "2026-07-15", "time": "10:00 AM", "issue": "Gastric Follow-up", "status": "completed", "diagnosis": "Gastroesophageal Reflux Disease (GERD)", "meds": [{"name": "Omeprazole", "dosage": "20mg", "frequency": "Before breakfast"}], "notes": "Keep elevated head of bed. Avoid late meals."},
        {"doctor": "Dr. Dianne Russell", "patient": "Albert Flores", "date": "2026-07-15", "time": "01:30 PM", "issue": "Ultrasound Scan Review", "status": "completed", "diagnosis": "Fatty Liver Grade 1", "meds": [], "notes": "Dietary modification: low carb and low fat. Aerobic exercise."},
        {"doctor": "Dr. Dianne Russell", "patient": "Jane Cooper", "date": "2026-06-25", "time": "11:00 AM", "issue": "Stomach pain", "status": "completed", "diagnosis": "Mild Gastritis", "meds": [{"name": "Famotidine", "dosage": "20mg", "frequency": "Twice daily"}], "notes": "Avoid spicy foods. Quit smoking."},
        {"doctor": "Dr. Dianne Russell", "patient": "Ronald Richards", "date": "2025-12-10", "time": "03:15 PM", "issue": "Colonoscopy Prep Consultation", "status": "completed", "diagnosis": "Routine screening candidate", "meds": [], "notes": "Prescribed Peg-3350 prep kit. Procedure scheduled for next week."},
        {"doctor": "Dr. Dianne Russell", "patient": "Leslie Alexander", "date": "2025-04-12", "time": "09:00 AM", "issue": "IBS Symptoms", "status": "completed", "diagnosis": "IBS-Diarrhea predominant", "meds": [{"name": "Dicyclomine", "dosage": "10mg", "frequency": "Three times daily before meals"}], "notes": "Low FODMAP diet recommended. Avoid dairy items."},

        # Dr. Jenny Wilson
        {"doctor": "Dr. Jenny Wilson", "patient": "Leslie Alexander", "date": "2026-07-15", "time": "09:30 AM", "issue": "Thyroid Check", "status": "completed", "diagnosis": "Hypothyroidism", "meds": [{"name": "Levothyroxine", "dosage": "75mcg", "frequency": "Once daily on empty stomach"}], "notes": "Retest TSH in 8 weeks."},
        {"doctor": "Dr. Jenny Wilson", "patient": "Wade Warren", "date": "2026-07-15", "time": "03:00 PM", "issue": "Diabetes Management", "status": "completed", "diagnosis": "Type 2 Diabetes Mellitus", "meds": [{"name": "Metformin", "dosage": "500mg", "frequency": "Twice daily with meals"}], "notes": "HBA1c is 7.2%. Targets diet and physical activity."},
        {"doctor": "Dr. Jenny Wilson", "patient": "Cody Fisher", "date": "2026-05-12", "time": "11:30 AM", "issue": "Gestational Diabetes screen", "status": "completed", "diagnosis": "Impaired glucose tolerance", "meds": [], "notes": "Meal plan adjustment. Monitor fasting glucose daily."},
        {"doctor": "Dr. Jenny Wilson", "patient": "Theresa Webb", "date": "2025-10-14", "time": "08:15 AM", "issue": "Hyperthyroidism check", "status": "completed", "diagnosis": "Graves Disease", "meds": [{"name": "Methimazole", "dosage": "10mg", "frequency": "Once daily"}], "notes": "CBC and liver profile monitored. Watch for fever/sore throat."},

        # Dr. Eleanor Pena
        {"doctor": "Dr. Eleanor Pena", "patient": "Robert Fox", "date": "2026-07-15", "time": "11:00 AM", "issue": "Joint Inflammation", "status": "completed", "diagnosis": "Rheumatoid Arthritis", "meds": [{"name": "Methotrexate", "dosage": "15mg", "frequency": "Once weekly"}, {"name": "Folic Acid", "dosage": "1mg", "frequency": "Daily except MTX day"}], "notes": "Monitor CBC and liver function panels every 2 months."},
        {"doctor": "Dr. Eleanor Pena", "patient": "Esther Howard", "date": "2026-07-15", "time": "04:15 PM", "issue": "Rheumatoid assessment", "status": "completed", "diagnosis": "Osteoarthritis of hand joints", "meds": [{"name": "Meloxicam", "dosage": "7.5mg", "frequency": "Once daily with food"}], "notes": "Recommended warm paraffin baths and hand occupational therapy."},
        {"doctor": "Dr. Eleanor Pena", "patient": "Devon Lane", "date": "2026-06-03", "time": "10:30 AM", "issue": "Gout flare-up", "status": "completed", "diagnosis": "Acute Gouty Arthritis", "meds": [{"name": "Colchicine", "dosage": "0.6mg", "frequency": "Once daily"}, {"name": "Allopurinol", "dosage": "100mg", "frequency": "Once daily"}], "notes": "Drink lots of water. Avoid shellfish, red meat, and beer."},
        {"doctor": "Dr. Eleanor Pena", "patient": "Bessie Cooper", "date": "2025-09-12", "time": "02:00 PM", "issue": "Lupus checkup", "status": "completed", "diagnosis": "Systemic Lupus Erythematosus (SLE)", "meds": [{"name": "Hydroxychloroquine", "dosage": "200mg", "frequency": "Twice daily"}], "notes": "Annual dilated eye exam required. Apply high SPF sunscreen."},

        # Dr. Cameron Williamson
        {"doctor": "Dr. Cameron Williamson", "patient": "Cody Fisher", "date": "2026-07-15", "time": "08:00 AM", "issue": "Spine Post-Op Consultation", "status": "completed", "diagnosis": "L4-L5 microdiscectomy post-op recovery", "meds": [{"name": "Gabapentin", "dosage": "300mg", "frequency": "Three times daily"}], "notes": "Incision healing fine. No bending, twisting, or heavy lifting."},
        {"doctor": "Dr. Cameron Williamson", "patient": "Kristin Watson", "date": "2026-07-15", "time": "01:00 PM", "issue": "Brain MRI Review", "status": "completed", "diagnosis": "Benign meningioma (stable)", "meds": [], "notes": "Meningioma has shown no growth. Repeat MRI in 12 months."},
        {"doctor": "Dr. Cameron Williamson", "patient": "Jerome Bell", "date": "2026-07-02", "time": "10:00 AM", "issue": "Chronic sciatica pain", "status": "completed", "diagnosis": "Herniated disc L5-S1", "meds": [{"name": "Methylprednisolone", "dosage": "4mg dose pack", "frequency": "As directed"}], "notes": "Scheduled epidural steroid injection next week."},
        {"doctor": "Dr. Cameron Williamson", "patient": "Jane Cooper", "date": "2025-07-18", "time": "03:30 PM", "issue": "Lumbar spinal stenosis", "status": "completed", "diagnosis": "Lumbar Stenosis", "meds": [], "notes": "Referred to physical therapy for core stabilization exercises."},

        # Dr. Courtney Henry
        {"doctor": "Dr. Courtney Henry", "patient": "Eleanor Pena", "date": "2026-07-15", "time": "10:30 AM", "issue": "Scar Laser treatment", "status": "completed", "diagnosis": "Hypertrophic scar", "meds": [{"name": "Silicone Gel Sheets", "dosage": "Local", "frequency": "12 hours daily"}], "notes": "First laser treatment session completed. Keep protected from UV exposure."},
        {"doctor": "Dr. Courtney Henry", "patient": "Ronald Richards", "date": "2026-07-15", "time": "02:30 PM", "issue": "Consultation", "status": "completed", "diagnosis": "Nasal fracture deformity", "meds": [], "notes": "Discussed rhinoplasty options and cost estimate. Patient thinking it over."},
        {"doctor": "Dr. Courtney Henry", "patient": "Bessie Cooper", "date": "2026-06-11", "time": "09:00 AM", "issue": "Face reconstruction post-injury", "status": "completed", "diagnosis": "Facial scar contracture", "meds": [], "notes": "Scheduled Z-plasty scar revision for next month."},
        {"doctor": "Dr. Courtney Henry", "patient": "Guy Hawkins", "date": "2025-06-25", "time": "11:30 AM", "issue": "Skin lesion excision", "status": "completed", "diagnosis": "Benign intradermal nevus", "meds": [], "notes": "Nevus excised completely. Pathology report confirms benign findings."}
    ]

    # Map raw patient names to IDs (making sure they are created in User)
    for appt in raw_appointments:
        patient_name = appt["patient"]
        if patient_name not in patients_map:
            # Create user on the fly for missing ones (like Robert Fox, Wade Warren, etc.)
            u = User(
                name=patient_name,
                email=patient_name.lower().replace(" ", "") + "@novacare.com",
                password="patientpassword",
                role="patient"
            )
            db.session.add(u)
            db.session.commit()
            patients_map[patient_name] = u.id
            
        doc_id = doctors_map[appt["doctor"]]
        pat_id = patients_map[patient_name]
        
        # Save Appointment
        a = Appointment(
            patient_id=pat_id,
            doctor_id=doc_id,
            date=appt["date"],
            time_slot=appt["time"],
            status=appt["status"]
        )
        db.session.add(a)
        db.session.commit()
        
        # Save Prescription
        p = Prescription(
            appointment_id=a.id,
            doctor_id=doc_id,
            patient_id=pat_id,
            diagnosis=appt["diagnosis"],
            medications=json.dumps(appt["meds"]),
            notes=appt["notes"]
        )
        db.session.add(p)
        db.session.commit()

    # --- SEED MEDICAL RECORDS (Patient files/reports) ---
    print("Seeding Medical Records...")
    records_data = [
        {"patient": "Leslie Alexander", "file_name": "Blood_Panel_Q2.pdf", "type": "pdf"},
        {"patient": "Leslie Alexander", "file_name": "Thyroid_Ultrasound.jpg", "type": "image"},
        {"patient": "Theresa Webb", "file_name": "ECG_September_Report.pdf", "type": "pdf"},
        {"patient": "Cody Fisher", "file_name": "Lumbar_MRI_Scan.pdf", "type": "pdf"},
        {"patient": "Albert Flores", "file_name": "Liver_Biopsy_Results.pdf", "type": "pdf"},
        {"patient": "Albert Flores", "file_name": "PostOp_Echo_Chart.jpg", "type": "image"},
        {"patient": "Jerome Bell", "file_name": "MitralValve_Echo.pdf", "type": "pdf"},
        {"patient": "Jane Cooper", "file_name": "Gastroscopy_Images.zip", "type": "zip"},
        {"patient": "Kristin Watson", "file_name": "Brain_MRI_2025.pdf", "type": "pdf"}
    ]

    for rec in records_data:
        pat_id = patients_map[rec["patient"]]
        m = MedicalRecord(
            patient_id=pat_id,
            file_path=f"uploads/records/{rec['file_name']}",
            file_type=rec["type"]
        )
        db.session.add(m)
        
    db.session.commit()

    # --- SEED CONDITIONS (from metadata & standard symptom files) ---
    print("Seeding Conditions...")
    
    # 1. Map conditions to their union of symptoms
    condition_symptoms = defaultdict(set)
    sc1_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'data', 'symptoms_conditions1.csv')
    if os.path.exists(sc1_path):
        with open(sc1_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                raw_name = row.get("condition_name")
                if not raw_name:
                    continue
                name = clean_name(raw_name)
                sympt_str = row.get("symptoms", "")
                for s in sympt_str.split(","):
                    s_clean = s.strip()
                    if s_clean:
                        condition_symptoms[name.lower()].add(s_clean)

    sc_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'data', 'symptoms_conditions.csv')
    if os.path.exists(sc_path):
        with open(sc_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                raw_name = row.get("condition_name")
                if not raw_name:
                    continue
                name = clean_name(raw_name)
                sympt_str = row.get("symptoms", "")
                for s in sympt_str.split(","):
                    s_clean = s.strip()
                    if s_clean:
                        condition_symptoms[name.lower()].add(s_clean)

    # 2. Read conditions_metadata.csv and create Condition records
    meta_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'data', 'conditions_metadata.csv')
    if os.path.exists(meta_path):
        with open(meta_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get("condition_name")
                desc = row.get("description")
                specialty = row.get("recommended_specialty")
                urgency = row.get("urgency_tier", "Low").lower()
                
                syms = condition_symptoms.get(name.lower(), set())
                syms_str = ", ".join(sorted(list(syms))) if syms else "consult doctor"
                
                c = Condition(
                    name=name,
                    symptoms=syms_str,
                    description=desc,
                    recommended_specialty=specialty,
                    urgency=urgency
                )
                db.session.add(c)
        db.session.commit()
        print("Conditions seeded successfully!")
    else:
        print("conditions_metadata.csv not found, skipping Condition seeding!")

    print("Database seeding completed successfully!")

if __name__ == '__main__':
    with app.app_context():
        seed_database()
