import os
import json
import csv
import math
import requests

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CLASSIFIER_PATH = os.path.join(BASE_DIR, "instance", "symptom_classifier.json")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "medgemma:4b")

def get_condition_precautions(condition_name):
    """Retrieves the precautions string for a given condition from the metadata CSV."""
    meta_path = os.path.join(BASE_DIR, "..", "data", "conditions_metadata.csv")
    if os.path.exists(meta_path):
        try:
            with open(meta_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    name = row.get("condition_name") or ""
                    if name.strip().lower() == condition_name.strip().lower():
                        return row.get("precautions", "")
        except Exception:
            pass
    return "consult doctor | follow medical advice | rest | stay hydrated"


# Global variables for the trained classifier model
_model = None

def load_classifier_model():
    global _model
    if _model is not None:
        return _model
    
    if os.path.exists(CLASSIFIER_PATH):
        try:
            with open(CLASSIFIER_PATH, mode='r', encoding='utf-8') as f:
                _model = json.load(f)
            return _model
        except Exception as e:
            print(f"Error loading classifier model: {e}")
            
    # Fallback default empty model
    _model = {
        "vocab": [],
        "priors": {},
        "cond_probs": {},
        "cond_probs_absent": {}
    }
    return _model

def predict_condition(symptoms_list):
    """
    Predicts the condition based on a list of symptoms using the Bernoulli Naive Bayes model.
    Returns: (predicted_condition_name, confidence_score)
    """
    model = load_classifier_model()
    vocab = model["vocab"]
    priors = model["priors"]
    cond_probs = model["cond_probs"]
    cond_probs_absent = model["cond_probs_absent"]
    
    if not priors:
        return "Unknown", 0.0
        
    input_syms = set(symptoms_list)
    scores = {}
    
    for cls in priors.keys():
        score = priors[cls]
        for s in vocab:
            if s in input_syms:
                score += cond_probs[cls][s]
            else:
                score += cond_probs_absent[cls][s]
        scores[cls] = score
        
    # Find condition with highest log probability
    best_class = max(scores, key=scores.get)
    
    # Calculate confidence using Softmax on log probabilities
    max_score = scores[best_class]
    exp_scores = {}
    for c, s in scores.items():
        # Prevent math overflow/underflow
        try:
            exp_scores[c] = math.exp(s - max_score)
        except OverflowError:
            exp_scores[c] = 0.0
            
    sum_exp = sum(exp_scores.values())
    confidence = exp_scores[best_class] / sum_exp if sum_exp > 0 else 0.0
    
    return best_class, confidence

class OllamaClient:
    def __init__(self, url=OLLAMA_URL, model=OLLAMA_MODEL):
        self.url = url
        self.model = model

    def is_available(self):
        """Checks if the local Ollama instance is reachable."""
        try:
            # Check Ollama base endpoint
            base_url = self.url.rsplit('/api/', 1)[0]
            response = requests.get(base_url, timeout=2)
            return response.status_code == 200
        except Exception:
            return False

    def extract_symptoms(self, user_text):
        """
        Uses Ollama (MedGemma) to extract a list of standardized symptom names from natural language text.
        Falls back to keyword matching if Ollama is unavailable.
        """
        model_data = load_classifier_model()
        vocab = model_data["vocab"]
        
        if not user_text:
            return []

        if self.is_available():
            prompt = (
                f"You are a medical text processing assistant. Analyze the patient's description of their health issues "
                f"and extract a list of symptoms they are experiencing.\n"
                f"You MUST choose ONLY from the following list of valid symptom names (lowercase, with underscores):\n"
                f"{json.dumps(vocab)}\n\n"
                f"Patient Input: \"{user_text}\"\n\n"
                f"Return a JSON object with a single key \"symptoms\" containing a list of matching symptom names from the list above. "
                f"Return ONLY the JSON object, nothing else. Do not add markdown formatting or comments."
            )
            
            payload = {
                "model": self.model,
                "prompt": prompt,
                "format": "json",
                "stream": False,
                "options": {
                    "temperature": 0.1
                }
            }
            
            try:
                response = requests.post(self.url, json=payload, timeout=45)
                if response.status_code == 200:
                    res_json = response.json()
                    res_text = res_json.get("response", "").strip()
                    parsed = json.loads(res_text)
                    extracted = parsed.get("symptoms", [])
                    # Filter to ensure only valid vocab is returned
                    return [s for s in extracted if s in vocab]
            except Exception as e:
                print(f"Ollama symptom extraction failed: {e}. Falling back to keyword matching.")

        # Fallback: Simple keyword matching
        text_lower = user_text.lower()
        extracted = []
        for s in vocab:
            # Check if symptom (replacing underscores with spaces) is in user text
            s_readable = s.replace("_", " ")
            if s_readable in text_lower or s in text_lower:
                extracted.append(s)
        return extracted

    def generate_guidance(self, condition, description, precautions, patient_info, doctors_list=None):
        """
        Generates personalized clinical next steps and guidelines based on patient details, condition, and recommended doctors.
        """
        prec_list = [p.strip() for p in precautions.split("|") if p.strip()]
        prec_str = ", ".join(prec_list)

        patient_name = patient_info.get("name", "Patient")
        dob = patient_info.get("dob", "Unknown")
        allergies = patient_info.get("allergies", "None reported")
        chronic = patient_info.get("chronic", "None reported")

        # Format doctors string
        docs_str = ""
        if doctors_list:
            docs_str = "\n".join(
                f"- {d['name']} ({d['specialty']}), Rating: {d['rating']} stars, Experience: {d['years_experience']} yrs, Slots: {d['availability']}"
                for d in doctors_list
            )
        else:
            docs_str = "No specific doctors matching this specialty are currently online."

        if self.is_available():
            prompt = (
                f"You are MedGemma, a compassionate medical AI assistant based on Google's clinical LLM architectures.\n"
                f"A patient has been diagnosed with a potential case of \"{condition}\".\n"
                f"Condition Description: {description}\n"
                f"Recommended Precautions: {prec_str}\n\n"
                f"Patient Medical Profile:\n"
                f"- Name: {patient_name}\n"
                f"- DOB: {dob}\n"
                f"- Allergies: {allergies}\n"
                f"- Chronic Conditions: {chronic}\n\n"
                f"SUSPECTED DOCTOR REFERRALS from our database:\n"
                f"{docs_str}\n\n"
                f"INSTRUCTIONS:\n"
                f"1. Provide personalized, clear, and empathetic next steps and guidance for this patient.\n"
                f"2. Suggest basic self-care, home remedies, rest, and safe cures that the patient can take right now to manage the condition before consulting a physician.\n"
                f"3. Reassure the patient if it is a low-to-medium urgency concern.\n"
                f"4. If it is a concerning or urgent issue, clearly list warning signs and advise them to schedule a checkup immediately.\n"
                f"5. Mention that they can click on the recommended doctor cards listed below (such as {', '.join(d['name'] for d in doctors_list[:2]) if doctors_list else 'our specialists'}) to view their full profiles, check their years of experience, read ratings and patient testimonials, and book an appointment directly.\n"
                f"Keep the response professional, clear, and structured in 3 concise paragraphs."
            )
            
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.5
                }
            }
            
            try:
                response = requests.post(self.url, json=payload, timeout=45)
                if response.status_code == 200:
                    return response.json().get("response", "").strip()
            except Exception as e:
                print(f"Ollama guidance generation failed: {e}. Using template fallback.")

        # Fallback template guidance
        fallback_guidance = (
            f"Dear {patient_name},\n\n"
            f"Based on your symptoms, there is a potential match for **{condition}** ({description}).\n\n"
            f"**Recommended Self-Care & Cures:**\n"
            + "\n".join(f"- {p.capitalize()}" for p in prec_list) + "\n"
            f"- Ensure adequate rest, stay hydrated, and monitor temperature.\n\n"
            f"**Next Steps:**\n"
            f"Since you reported allergies ({allergies}) and chronic conditions ({chronic}), please avoid self-medicating without medical consultation. "
            f"If symptoms worsen or you experience severe pain, seek emergency medical care.\n\n"
            f"**Physician Recommendation:**\n"
            f"We recommend scheduling a follow-up. You can compare and book our recommended doctors below (such as "
            + (", ".join(d['name'] for d in doctors_list[:2]) if doctors_list else "our specialists") +
            f") directly by clicking on their cards to view their overall profile, ratings, and reviews."
        )
        return fallback_guidance

    def generate_general_chat(self, user_text, patient_info):
        """
        Generates a conversational response for general queries (non-symptom specific).
        """
        patient_name = patient_info.get("name", "Patient")
        allergies = patient_info.get("allergies", "None reported")
        chronic = patient_info.get("chronic", "None reported")
        
        if self.is_available():
            prompt = (
                f"You are MedGemma, a compassionate medical AI assistant based on Google's clinical LLM architectures.\n"
                f"Patient Name: {patient_name}\n"
                f"Allergies: {allergies}\n"
                f"Chronic Conditions: {chronic}\n\n"
                f"Patient Query: \"{user_text}\"\n\n"
                f"Respond to the patient's query in an empathetic, clear, and professional conversational manner.\n"
                f"If they are greeting you, greet them back, introduce yourself, and ask how you can help.\n"
                f"If they ask general health questions, provide accurate, helpful educational information.\n"
                f"If they need symptom assessment, gently encourage them to describe their symptoms in detail.\n"
                f"Keep it concise, friendly, and limited to 2 paragraphs."
            )
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.6
                }
            }
            try:
                response = requests.post(self.url, json=payload, timeout=45)
                if response.status_code == 200:
                    return response.json().get("response", "").strip()
            except Exception as e:
                print(f"Ollama general chat failed: {e}")
                
        return (
            f"Hello {patient_name}! I am MedGemma, your AI clinical assistant. "
            f"To help you evaluate symptoms, please describe what you are experiencing in detail "
            f"(e.g., 'I have had a mild headache and nausea for 2 days'). I can also help you find the right specialists!"
        )

    def diagnose_query(self, user_text, patient_info, reference_context):
        """
        Uses MedGemma to diagnose the patient's query.
        Returns a dictionary matching the structured JSON format or None if failed.
        """
        intake_data = patient_info.get('intake_form')
        intake_summary = "None provided"
        if intake_data:
            try:
                parts = []
                info = intake_data.get('patientInformation', {})
                if info:
                    parts.append(f"Basic Details: Name={info.get('fullName')}, DOB={info.get('dateOfBirth')}, Gender={info.get('gender')}, Phone={info.get('contactNumber')}, Address={info.get('homeAddress')}")
                    parts.append(f"Emergency Contact: {info.get('emergencyContactName')} ({info.get('emergencyContactPhone')}) - Relation: {info.get('emergencyContactRelationship')}")
                
                visit = intake_data.get('visitDetails', {})
                if visit:
                    parts.append(f"Visit Details: Reason={visit.get('reason')}, Start={visit.get('startDate')}, Type={visit.get('issueType')}")
                
                sympt = intake_data.get('currentSymptoms', {})
                if sympt:
                    parts.append(f"Symptoms Description: {sympt.get('description')}. Checklist: {', '.join(sympt.get('checklist', []))}. Severity: {sympt.get('severity')}. Pattern: {sympt.get('pattern')}")
                
                chronic = intake_data.get('currentHealthIssues', {})
                if chronic:
                    parts.append(f"Chronic Health: Diagnosed={chronic.get('hasDiagnosed')}, Conditions={chronic.get('listConditions')} (ER visit: {chronic.get('hospitalAdmitted')}, Reason: {chronic.get('hospitalReason')})")
                
                history = intake_data.get('pastMedicalHistory', {})
                if history:
                    parts.append(f"Medical History: Illnesses={history.get('pastIllnesses')}, Surgeries={history.get('pastSurgeries')}, Injuries={history.get('pastInjuries')}, Hospitalizations={history.get('previousHospitalizations')}")
                
                meds = intake_data.get('medications', {})
                if meds:
                    parts.append(f"Active Meds: {json.dumps(meds.get('medicines', []))}. Supplements: {meds.get('supplements')}")
                
                allergies = intake_data.get('allergiesSensitivities', {})
                if allergies:
                    parts.append(f"Allergies: Drug={allergies.get('drugAllergies')}, Food={allergies.get('foodAllergies')}, Other={allergies.get('otherAllergies')}, Reaction Type={allergies.get('reactionType')}")
                
                lifestyle = intake_data.get('lifestyleRiskFactors', {})
                if lifestyle:
                    parts.append(f"Lifestyle & Risks: Smoking={lifestyle.get('smokingStatus')}, Alcohol={lifestyle.get('alcoholUse')}, Activity={lifestyle.get('physicalActivity')}, Sleep={lifestyle.get('sleepHours')} hrs ({lifestyle.get('sleepQuality')}), Stress={lifestyle.get('stressStatus')} ({lifestyle.get('stressDetails')})")
                
                family = intake_data.get('familyHistory', {})
                if family:
                    parts.append(f"Family History: Checklist={', '.join(family.get('historyChecklist', []))}. Inherited={family.get('otherConditions')}. Onset Details={family.get('familyDetails')}")
                
                additional = intake_data.get('additionalInformation', {})
                if additional:
                    parts.append(f"Additional details: Pregnancy={additional.get('pregnancyStatus')}, Implants/Devices={additional.get('devicesImplants')}, Scans/Labs={additional.get('labTestsScans')}, Notes={additional.get('notes')}")
                
                intake_summary = "\n- ".join(parts)
            except Exception:
                intake_summary = "Failed to serialize intake form details."

        if self.is_available():
            prompt = (
                f"You are MedGemma, a compassionate medical AI assistant and personal health buddy. "
                f"Your goal is to genuinely understand and address all the patient's questions, health concerns, and symptoms naturally, "
                f"acting like an empathetic clinical specialist.\n\n"
                f"Patient Profile:\n"
                f"- Name: {patient_info.get('name', 'Patient')}\n"
                f"- DOB: {patient_info.get('dob', 'Unknown')}\n"
                f"- Allergies: {patient_info.get('allergies', 'None')}\n"
                f"- Chronic Conditions: {patient_info.get('chronic', 'None')}\n"
                f"- Detailed Intake Health History (User Confirmed):\n- {intake_summary}\n\n"
                f"Below is our reference list of known conditions, recommended specialties, and standard precautions. "
                f"Use this list as reference context (RAG), but synthesize it with your own clinical reasoning and do not restrict yourself solely to it:\n"
                f"{reference_context}\n\n"
                f"CLINICAL SPECIALTY MAPPING RULES:\n"
                f"- If chest pain, tightness, palpitations, or shortness of breath on exertion are reported: ALWAYS recommend 'Cardiology' (or 'Cardiologist') as the primary specialty to ensure patient safety, even if abdominal/reflux symptoms are also present.\n"
                f"- If throbbing headache, migraine, dizziness, light sensitivity, or neurological symptoms are reported: ALWAYS recommend 'Neurology' (or 'Neurologist').\n"
                f"- If skin issues, rash, redness, itching, or lesions are reported: ALWAYS recommend 'Dermatology' (or 'Dermatologist').\n"
                f"- If abdominal pain, nausea, acid reflux, or stomach issues are reported without exertional chest pain: recommend 'Gastroenterology' (or 'Gastroenterologist').\n"
                f"- If respiratory issues, chronic coughing, asthma, or wheezing are reported: recommend 'Pulmonology' (or 'Pulmonologist').\n"
                f"- If joint pain, stiffness, fractures, or bone/skeletal pain are reported: recommend 'Orthopedics' (or 'Orthopedist').\n"
                f"- If general symptoms like fever, cold, chills, or minor generalized complaints are reported: recommend 'General Medicine' (or 'General Practitioner').\n\n"
                f"Patient Query: \"{user_text}\"\n\n"
                f"INSTRUCTIONS:\n"
                f"1. Read the query thoroughly. If it is a greeting or general health question, answer it warmly, conversationally, and genuinely.\n"
                f"2. If symptoms are reported, assess them. If multiple health issues are described, address all of them carefully.\n"
                f"3. In the \"guidance\" field, write a warm, friendly, ChatGPT-style response directly to the patient. "
                f"Explain what could be happening, suggest safe home remedies/self-care precautions, guide them on what to monitor, "
                f"and advise whether they need to consult a doctor.\n"
                f"4. Determine the primary \"suspected_condition\". Select one from the reference dataset if it's a good match, or name another standard medical condition.\n"
                f"5. Set the \"urgency\" tier: 'low' (home care is enough), 'medium' (consult if symptoms persist), 'high' (see a doctor soon), or 'critical' (emergency care required).\n"
                f"6. Suggest a \"recommended_specialty\" for consultation from: Cardiology, Neurology, Dermatology, Orthopedics, Gastroenterology, Pulmonology, Pediatrics, Ophthalmology, Psychiatry, General Medicine, Endocrinology, Oncology, Rheumatology.\n"
                f"7. Provide 3-4 specific, actionable \"precautions\" in a list.\n"
                f"8. List all identified \"extracted_symptoms\" (lowercase, matching standard names if possible).\n\n"
                f"You MUST return ONLY a JSON object with the following structure (no surrounding markdown, no backticks, no text explanation outside the JSON):\n"
                f"{{\n"
                f"  \"suspected_condition\": \"string or null\",\n"
                f"  \"confidence\": number,\n"
                f"  \"description\": \"string\",\n"
                f"  \"precautions\": [\"string\", ...],\n"
                f"  \"urgency\": \"low|medium|high|critical\",\n"
                f"  \"recommended_specialty\": \"string or null\",\n"
                f"  \"guidance\": \"string\",\n"
                f"  \"extracted_symptoms\": [\"string\", ...]\n"
                f"}}"
            )
            
            payload = {
                "model": self.model,
                "prompt": prompt,
                "format": "json",
                "stream": False,
                "options": {
                    "temperature": 0.3
                }
            }
            
            try:
                response = requests.post(self.url, json=payload, timeout=60)
                if response.status_code == 200:
                    res_json = response.json()
                    res_text = res_json.get("response", "").strip()
                    parsed = json.loads(res_text)
                    return parsed
            except Exception as e:
                print(f"Ollama structured diagnosis failed: {e}")
        return None

def load_symptom_severities():
    """Loads symptom severity weights from Symptom-severity.csv."""
    severities = {}
    path = os.path.join(BASE_DIR, "..", "data", "Symptom-severity.csv")
    if os.path.exists(path):
        try:
            with open(path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    symptom = row.get("Symptom") or ""
                    weight = row.get("weight") or "1"
                    if symptom:
                        # Clean multiple spaces/underscores for consistency
                        key = " ".join(symptom.strip().lower().replace("_", " ").split())
                        severities[key] = int(weight)
        except Exception as e:
            print(f"Error loading symptom severities: {e}")
    return severities

def calculate_symptom_severity_score(symptoms_list):
    """Calculates the sum of severity weights for a list of symptoms."""
    severities = load_symptom_severities()
    total_score = 0
    for s in symptoms_list:
        # Standardize matching key to match both underscores and spaces
        key = " ".join(s.strip().lower().replace("_", " ").split())
        # Default to 1 if not found in Symptom-severity.csv
        total_score += severities.get(key, 1)
    return total_score
