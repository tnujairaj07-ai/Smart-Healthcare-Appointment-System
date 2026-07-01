def match_doctors(patient_location, doctors_list):
    matches = []

    for doctor in doctors_list:
        location_score = 1.0 if doctor['location'] == patient_location else 0.5
        rating_score = doctor['rating'] / 5.0
        availability_score = 1.0 if "9 AM" in doctor['availability'] else 0.7

        total_score = (location_score * 0.4) + (rating_score * 0.4) + (availability_score * 0.2)

        matches.append({
            "id": doctor['id'],
            "name": doctor['name'],
            "specialty": doctor['specialty'],
            "location": doctor['location'],
            "rating": doctor['rating'],
            "availability": doctor['availability'],
            "score": round(total_score, 2)
        })

    return sorted(matches, key=lambda x: x['score'], reverse=True)[:5]