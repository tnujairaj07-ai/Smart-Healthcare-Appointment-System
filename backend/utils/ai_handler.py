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
                response = requests.post(self.url, json=payload, timeout=10)
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

    def generate_guidance(self, condition, description, precautions, patient_info):
        """
        Generates personalized clinical next steps and guidelines based on patient details and condition.
        """
        prec_list = [p.strip() for p in precautions.split("|") if p.strip()]
        prec_str = ", ".join(prec_list)

        patient_name = patient_info.get("name", "Patient")
        dob = patient_info.get("dob", "Unknown")
        allergies = patient_info.get("allergies", "None reported")
        chronic = patient_info.get("chronic", "None reported")

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
                f"Provide personalized, clear, and empathetic next steps and guidance for this patient.\n"
                f"Acknowledge their allergies/chronic conditions if relevant (e.g. remind them to be cautious with certain drugs if they have allergies).\n"
                f"Emphasize that this is an AI suggestion and they should consult a healthcare professional. "
                f"Keep it professional and limited to 3 concise paragraphs."
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
                response = requests.post(self.url, json=payload, timeout=15)
                if response.status_code == 200:
                    return response.json().get("response", "").strip()
            except Exception as e:
                print(f"Ollama guidance generation failed: {e}. Using template fallback.")

        # Fallback template guidance
        fallback_guidance = (
            f"Dear {patient_name},\n\n"
            f"Based on your symptoms, there is a potential match for **{condition}**.\n"
            f"**About this condition:** {description}\n\n"
            f"**Immediate steps you should take:**\n"
            + "\n".join(f"- {p.capitalize()}" for p in prec_list) + "\n\n"
            f"Please note: This is an automated assessment. "
            f"Since you reported allergies ({allergies}) and chronic conditions ({chronic}), "
            f"you should discuss these with a doctor before starting any self-care or medications. "
            f"We recommend scheduling an appointment with a specialist as soon as possible."
        )
        return fallback_guidance
