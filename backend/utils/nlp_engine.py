import spacy

nlp = spacy.load("en_core_web_sm")

def analyze_symptoms(patient_input, conditions_db):
    doc = nlp(patient_input.lower())

    patient_symptoms = [
        token.text for token in doc
        if token.is_alpha and not token.is_stop
    ]

    matches = []

    for condition in conditions_db:
        cond_symptoms = [s.strip() for s in condition['symptoms'].split(",")]
        overlap = len(set(patient_symptoms) & set(cond_symptoms))
        confidence = overlap / len(cond_symptoms) if cond_symptoms else 0

        if confidence >= 0.3:
            matches.append({
                "condition": condition['name'],
                "confidence": round(confidence * 100, 1),
                "description": condition.get('description'),
                "specialty": condition.get('specialty'),
                "urgency": condition.get('urgency')
            })

    return sorted(matches, key=lambda x: x['confidence'], reverse=True)[:3]