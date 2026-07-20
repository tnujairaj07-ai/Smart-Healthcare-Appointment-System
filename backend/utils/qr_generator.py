import qrcode
from fpdf import FPDF
import os

def generate_prescription_qr(prescription_id, patient_name, doctor_name, diagnosis, medications):
    os.makedirs('qr_codes', exist_ok=True)
    os.makedirs('prescriptions', exist_ok=True)

    qr_data = f"https://yourapp.com/verify/{prescription_id}"
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_img = qr.make_image()

    qr_path = f"qr_codes/qr_{prescription_id}.png"
    qr_img.save(qr_path)

    # Format medications robustly
    med_list = []
    for med in medications:
        if isinstance(med, dict):
            name = med.get('name') or med.get('medication') or 'Unknown Med'
            dosage = med.get('dosage') or med.get('dose') or ''
            freq = med.get('frequency') or ''
            parts = [name]
            if dosage:
                parts.append(f"({dosage})")
            if freq:
                parts.append(f"- {freq}")
            med_list.append(" ".join(parts))
        else:
            med_list.append(str(med))
    
    med_str = ", ".join(med_list)

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt="Prescription", ln=1, align="C")
    pdf.cell(200, 10, txt=f"Patient: {patient_name}", ln=1)
    pdf.cell(200, 10, txt=f"Doctor: {doctor_name}", ln=1)
    pdf.cell(200, 10, txt=f"Diagnosis: {diagnosis}", ln=1)
    pdf.cell(200, 10, txt=f"Medications: {med_str}", ln=1)

    # Correct FPDF image method arguments to w and h
    pdf.image(qr_path, x=150, y=100, w=50, h=50)

    pdf_path = f"prescriptions/prescription_{prescription_id}.pdf"
    pdf.output(pdf_path)

    return qr_path, pdf_path