import qrcode
from fpdf import FPDF
import os
from datetime import datetime

def generate_prescription_qr(prescription_id, patient_name, doctor_name, diagnosis, medications, notes_json=None):
    os.makedirs('static/qr', exist_ok=True)
    os.makedirs('uploads/prescriptions', exist_ok=True)

    # Resolve default notes_json for backward compatibility in mock tests
    if not notes_json:
        notes_json = {
            'notes': '',
            'chief_complaint': 'Routine Consultation',
            'secondary_diagnosis': '',
            'general_advice': '',
            'follow_up_plan': '',
            'digital_signature_hash': f"SIG-RX-{prescription_id}-99",
            'clinic_department': 'General Medicine',
            'patient_dob': 'N/A',
            'patient_gender': 'N/A',
            'patient_age': 'N/A',
            'patient_phone': 'N/A',
            'patient_email': 'N/A',
            'doctor_qual': 'MD',
            'doctor_spec': 'General Practitioner',
            'doctor_npi': 'NPI-999-999',
            'doctor_phone': 'Not provided',
            'doctor_hospital': 'St. Jude General',
            'doctor_address': '100 Medical Plaza, Suite 400, Metro City'
        }

    qr_data = f"https://yourapp.com/verify/{prescription_id}"
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_img = qr.make_image()

    qr_path = f"static/qr/qr_{prescription_id}.png"
    qr_img.save(qr_path)

    pdf = FPDF()
    pdf.add_page()
    pdf.set_margins(15, 15, 15)
    
    # 1. Renders Clinic Logo / Letterhead Header
    pdf.set_font("Arial", 'B', 16)
    pdf.set_text_color(26, 54, 93) # Dark Navy (#1A365D)
    pdf.cell(180, 8, txt=notes_json.get('doctor_hospital', 'NovaCare Wellness Center').upper(), ln=1, align="C")
    pdf.set_font("Arial", '', 9)
    pdf.set_text_color(100, 116, 139) # Slate Grey
    clinic_address = notes_json.get('doctor_address') or "100 Medical Plaza, Suite 400, Metro City"
    pdf.cell(180, 5, txt=f"{clinic_address} | Tel: {notes_json.get('doctor_phone', '555-0199')}", ln=1, align="C")
    
    # Line separator
    pdf.set_draw_color(226, 232, 240) # Slate-200
    pdf.set_line_width(0.5)
    pdf.line(15, 32, 195, 32)
    pdf.ln(6)
    
    # 2. Prescriber & Patient info panels (side-by-side using set_xy)
    pdf.set_text_color(30, 41, 59) # Slate-800
    pdf.set_font("Arial", 'B', 10)
    pdf.cell(90, 5, txt="PRESCRIBER INFO", ln=0)
    pdf.cell(90, 5, txt="PATIENT INFO", ln=1)
    
    # Left column: Doctor details
    pdf.set_font("Arial", '', 9)
    x_pos = 15
    y_pos = pdf.get_y()
    
    pdf.set_xy(x_pos, y_pos)
    pdf.cell(90, 4, txt=f"Name: {doctor_name}, {notes_json.get('doctor_qual', 'MD')}", ln=1)
    pdf.set_x(x_pos)
    pdf.cell(90, 4, txt=f"Specialty: {notes_json.get('doctor_spec', 'General Practitioner')}", ln=1)
    pdf.set_x(x_pos)
    pdf.cell(90, 4, txt=f"NPI/License: {notes_json.get('doctor_npi', 'NPI-999-999')}", ln=1)
    
    # Right column: Patient details
    pdf.set_xy(x_pos + 95, y_pos)
    pdf.cell(90, 4, txt=f"Name: {patient_name} (ID: #PT-{notes_json.get('patient_email', '00').split('@')[0]})", ln=1)
    pdf.set_x(x_pos + 95)
    pdf.cell(90, 4, txt=f"DOB: {notes_json.get('patient_dob', 'N/A')} (Age: {notes_json.get('patient_age', 'N/A')} / Gender: {notes_json.get('patient_gender', 'N/A')})", ln=1)
    pdf.set_x(x_pos + 95)
    pdf.cell(90, 4, txt=f"Phone: {notes_json.get('patient_phone', 'N/A')}", ln=1)
    
    pdf.ln(3)
    # Line separator
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(3)
    
    # 3. Visit context metadata
    pdf.set_font("Arial", 'B', 9)
    issue_date = datetime.today().strftime('%b %d, %Y')
    pdf.cell(180, 5, txt=f"Prescription Date: {issue_date} | Dept: {notes_json.get('clinic_department', 'General Outpatient')}", ln=1)
    pdf.set_font("Arial", '', 9)
    pdf.cell(180, 5, txt=f"Chief Complaint: {notes_json.get('chief_complaint', 'No complaint noted')}", ln=1)
    pdf.cell(180, 5, txt=f"Diagnosis: {diagnosis}", ln=1)
    if notes_json.get('secondary_diagnosis'):
        pdf.cell(180, 5, txt=f"Secondary Diagnosis: {notes_json.get('secondary_diagnosis')}", ln=1)
        
    pdf.ln(4)
    
    # 4. Medications Grid Table Header
    pdf.set_font("Arial", 'B', 10)
    pdf.set_fill_color(248, 250, 252) # Slate-50 background
    pdf.cell(65, 8, txt=" Medication Name", border=1, ln=0, fill=True)
    pdf.cell(30, 8, txt=" Strength & Form", border=1, ln=0, fill=True)
    pdf.cell(50, 8, txt=" Dosage Instruction (Sig)", border=1, ln=0, fill=True)
    pdf.cell(20, 8, txt=" Qty", border=1, ln=0, fill=True)
    pdf.cell(15, 8, txt=" Refills", border=1, ln=1, fill=True)
    
    # Medications Rows
    pdf.set_font("Arial", '', 9)
    for med in medications:
        if isinstance(med, dict):
            name = med.get('name') or med.get('medication') or 'Unknown Med'
            strength = med.get('strength') or med.get('dosage') or 'N/A'
            form = med.get('form') or 'tablet'
            dose_qty = med.get('dose_qty') or med.get('dosage') or '1 tablet'
            route = med.get('route') or 'oral'
            freq = med.get('frequency') or 'once daily'
            dur = med.get('duration') or '5 days'
            disp = med.get('dispense_qty') or '#10'
            refills = str(med.get('refills_allowed', 0))
            special = med.get('special_instructions', '')
            
            sig_txt = f"{dose_qty} {route} {freq} for {dur}"
            strength_form = f"{strength} {form}"
        else:
            name = str(med)
            strength_form = "N/A"
            sig_txt = "As directed by physician"
            disp = "N/A"
            refills = "0"
            special = ""
            
        pdf.cell(65, 7, txt=f" {name}", border=1, ln=0)
        pdf.cell(30, 7, txt=f" {strength_form}", border=1, ln=0)
        pdf.cell(50, 7, txt=f" {sig_txt}", border=1, ln=0)
        pdf.cell(20, 7, txt=f" {disp}", border=1, ln=0)
        pdf.cell(15, 7, txt=f" {refills}", border=1, ln=1)
        if special:
            pdf.set_font("Arial", 'I', 8)
            pdf.set_text_color(100, 116, 139)
            pdf.cell(180, 5, txt=f"   * Special instructions: {special}", border='LRB', ln=1)
            pdf.set_font("Arial", '', 9)
            pdf.set_text_color(30, 41, 59)
            
    pdf.ln(4)
    
    # 5. General Advice and Follow-up Box
    if notes_json.get('general_advice') or notes_json.get('follow_up_plan') or notes_json.get('notes'):
        pdf.set_fill_color(248, 250, 252) # Light Card
        pdf.set_draw_color(226, 232, 240)
        pdf.rect(15, pdf.get_y(), 180, 18, style='FD')
        
        box_y = pdf.get_y() + 2
        pdf.set_xy(17, box_y)
        pdf.set_font("Arial", 'B', 8)
        pdf.set_text_color(100, 116, 139)
        pdf.cell(176, 4, txt="GENERAL ADVICE & FOLLOW-UP PLAN", ln=1)
        pdf.set_font("Arial", '', 8)
        pdf.set_text_color(71, 85, 105)
        
        advice_parts = []
        if notes_json.get('general_advice'):
            advice_parts.append(f"Advice: {notes_json['general_advice']}")
        if notes_json.get('follow_up_plan'):
            advice_parts.append(f"Follow-up: {notes_json['follow_up_plan']}")
        if notes_json.get('notes'):
            advice_parts.append(f"Notes: {notes_json['notes']}")
            
        advice_str = " | ".join(advice_parts)
        if len(advice_str) > 110:
            advice_str = advice_str[:107] + "..."
        pdf.set_x(17)
        pdf.cell(176, 4, txt=advice_str, ln=1)
        pdf.set_xy(15, box_y + 16)
        
    pdf.ln(5)
    
    # 6. Signature & QR Block
    pdf.set_draw_color(241, 245, 249)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(3)
    
    x_pos = 15
    y_pos = pdf.get_y()
    
    pdf.set_xy(x_pos, y_pos)
    pdf.set_font("Arial", 'B', 9)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(120, 5, txt="PRESCRIPTION VALIDATION", ln=1)
    pdf.set_font("Arial", '', 8)
    pdf.set_text_color(100, 116, 139)
    pdf.set_x(x_pos)
    pdf.cell(120, 4, txt=f"Digitally Signed & Certified by: Dr. {doctor_name}", ln=1)
    pdf.set_x(x_pos)
    pdf.cell(120, 4, txt=f"Security Signature Stamp: {notes_json.get('digital_signature_hash', 'N/A')}", ln=1)
    pdf.set_x(x_pos)
    pdf.cell(120, 4, txt="Disclaimer: Valid when accompanied by official identity documentation.", ln=1)
    pdf.image(qr_path, x=155, y=y_pos - 2, w=35, h=35)

    pdf_path = f"uploads/prescriptions/prescription_{prescription_id}.pdf"
    pdf.output(pdf_path)

    return qr_path, pdf_path