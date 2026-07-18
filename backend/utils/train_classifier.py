import os
import csv
import json
import math
from collections import defaultdict

DATA_DIR = r"c:\Users\LENOVO\smart_healthcare\data"
INSTANCE_DIR = r"c:\Users\LENOVO\smart_healthcare\backend\instance"

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

def train_bernoulli_nb():
    paths = [
        os.path.join(DATA_DIR, "symptoms_conditions1.csv"),
        os.path.join(DATA_DIR, "symptoms_conditions.csv")
    ]
    
    # 1. Load data
    instances = []
    vocab = set()
    class_counts = defaultdict(int)
    
    for path in paths:
        if not os.path.exists(path):
            print(f"Warning: Dataset not found at {path}, skipping.")
            continue
        
        with open(path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                raw_name = row.get("condition_name")
                if not raw_name:
                    continue
                name = clean_name(raw_name)
                syms_str = row.get("symptoms", "")
                syms = set(s.strip() for s in syms_str.split(",") if s.strip())
                
                vocab.update(syms)
                class_counts[name] += 1
                instances.append((name, syms))
            
    total_docs = len(instances)
    if total_docs == 0:
        print("No training data found!")
        return
        
    vocab = sorted(list(vocab))
    
    # 2. Calculate counts for Bernoulli NB
    count_present = defaultdict(lambda: defaultdict(int))
    for name, syms in instances:
        for s in syms:
            count_present[name][s] += 1
            
    # 3. Calculate log priors and log conditional probabilities with Laplace smoothing (alpha = 1)
    alpha = 1.0
    priors = {}
    cond_probs = {}
    cond_probs_absent = {}
    
    for name, count in class_counts.items():
        priors[name] = math.log(count / total_docs)
        cond_probs[name] = {}
        cond_probs_absent[name] = {}
        
        for s in vocab:
            c_present = count_present[name][s]
            # Bernoulli likelihood formula: (c_present + alpha) / (count + 2 * alpha)
            p_present = (c_present + alpha) / (count + 2.0 * alpha)
            p_absent = 1.0 - p_present
            
            cond_probs[name][s] = math.log(p_present)
            cond_probs_absent[name][s] = math.log(p_absent)
            
    # 4. Save model parameters
    model = {
        "vocab": vocab,
        "priors": priors,
        "cond_probs": cond_probs,
        "cond_probs_absent": cond_probs_absent
    }
    
    os.makedirs(INSTANCE_DIR, exist_ok=True)
    out_path = os.path.join(INSTANCE_DIR, "symptom_classifier.json")
    with open(out_path, mode='w', encoding='utf-8') as f:
        json.dump(model, f, indent=2)
        
    print(f"Model trained successfully on {total_docs} instances!")
    print(f"Vocabulary size: {len(vocab)} unique symptoms.")
    print(f"Number of classes: {len(class_counts)} conditions.")
    print(f"Model parameters saved to: {out_path}")

if __name__ == "__main__":
    train_bernoulli_nb()
