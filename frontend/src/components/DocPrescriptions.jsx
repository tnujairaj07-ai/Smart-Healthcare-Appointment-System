import React, { useState, useEffect } from 'react';

const DocPrescriptions = ({ appointments }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Prescription Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [secondaryDiagnosis, setSecondaryDiagnosis] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [clinicDepartment, setClinicDepartment] = useState('General Outpatient');
  const [generalAdvice, setGeneralAdvice] = useState('');
  const [followUpPlan, setFollowUpPlan] = useState('');
  const [notes, setNotes] = useState('');
  
  const [meds, setMeds] = useState([{
    name: '',
    strength: '',
    form: 'tablet',
    dose_qty: '1 tablet',
    route: 'oral',
    frequency: 'twice daily',
    duration: '5 days',
    dispense_qty: '#10',
    refills_allowed: 0,
    special_instructions: ''
  }]);
  
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [qrCodePath, setQrCodePath] = useState('');
  const [pdfPath, setPdfPath] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Extract unique patients with active appointments
  const patients = [];
  const seenIds = new Set();
  appointments.forEach(a => {
    if (a.patient && !seenIds.has(a.patient.id)) {
      seenIds.add(a.patient.id);
      patients.push(a.patient);
    }
  });

  const fetchPrescriptionsList = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch('/api/admin/appointments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const myRx = [];
        data.forEach(appt => {
          if (appt.diagnosis && appt.diagnosis !== 'Pending Diagnosis' && appt.medications && appt.medications.length > 0) {
            myRx.push({
              id: appt.id,
              patientName: appt.patientName,
              date: appt.date,
              diagnosis: appt.diagnosis,
              medications: appt.medications,
              notes: appt.notes
            });
          }
        });
        setPrescriptions(myRx);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrescriptionsList();
    
    // Fetch doctor self profile
    const token = localStorage.getItem('token');
    fetch('/api/doctor/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setDoctorProfile(data);
        }
      })
      .catch(() => {});
  }, [appointments]);

  const handleAddMed = () => {
    setMeds([...meds, {
      name: '',
      strength: '',
      form: 'tablet',
      dose_qty: '1 tablet',
      route: 'oral',
      frequency: 'twice daily',
      duration: '5 days',
      dispense_qty: '#10',
      refills_allowed: 0,
      special_instructions: ''
    }]);
  };

  const handleRemoveMed = (idx) => {
    setMeds(meds.filter((_, i) => i !== idx));
  };

  const handleMedChange = (idx, field, val) => {
    const updated = [...meds];
    updated[idx][field] = val;
    setMeds(updated);
  };

  const handleCreatePrescription = (e) => {
    e.preventDefault();
    if (!selectedPatientId || !diagnosis || meds.some(m => !m.name.trim())) {
      alert('Please fill out all required fields.');
      return;
    }

    setIssuing(true);
    setSuccessMsg('');
    setQrCodePath('');
    setPdfPath('');

    const token = localStorage.getItem('token');
    const activeAppt = appointments.find(a => a.patient?.id === parseInt(selectedPatientId));
    const apptId = activeAppt ? activeAppt.id : 1;
    const patientObj = patients.find(p => p.id === parseInt(selectedPatientId));
    
    const requestBody = {
      appointment_id: apptId,
      doctor_id: doctorProfile ? doctorProfile.id : 1,
      patient_id: parseInt(selectedPatientId),
      patient_name: patientObj ? patientObj.name : 'Unknown Patient',
      doctor_name: doctorProfile ? doctorProfile.name : 'Dr. Dianne Russell',
      diagnosis: diagnosis,
      secondary_diagnosis: secondaryDiagnosis,
      chief_complaint: chiefComplaint,
      clinic_department: clinicDepartment,
      medications: meds,
      general_advice: generalAdvice,
      follow_up_plan: followUpPlan,
      notes: notes
    };

    fetch('/api/prescriptions/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to generate prescription.');
        return res.json();
      })
      .then(data => {
        setIssuing(false);
        setQrCodePath(data.qr_path);
        setPdfPath(data.pdf_path);
        setSuccessMsg('Digital Prescription Issued & Signed!');
        setSelectedPatientId('');
        setDiagnosis('');
        setSecondaryDiagnosis('');
        setChiefComplaint('');
        setGeneralAdvice('');
        setFollowUpPlan('');
        setNotes('');
        setMeds([{
          name: '',
          strength: '',
          form: 'tablet',
          dose_qty: '1 tablet',
          route: 'oral',
          frequency: 'twice daily',
          duration: '5 days',
          dispense_qty: '#10',
          refills_allowed: 0,
          special_instructions: ''
        }]);
        fetchPrescriptionsList();
      })
      .catch(err => {
        setIssuing(false);
        alert(err.message);
      });
  };

  return (
    <div className="space-y-6 text-slate-850 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Issue Prescription Form (col-span-7) */}
        <div className="lg:col-span-7 dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Issue Online Prescription</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Write medical formulas, check dosages, and sign to generate scannable QR/PDF files.</p>
          </div>

          <form onSubmit={handleCreatePrescription} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-150"
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Clinic / Department</label>
                <select
                  value={clinicDepartment}
                  onChange={(e) => setClinicDepartment(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-150"
                  required
                >
                  <option value="General Outpatient">General Outpatient</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pulmonology">Pulmonology</option>
                  <option value="Immunology">Immunology</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                </select>
              </div>
            </div>

            {selectedPatientId && (() => {
              const pObj = patients.find(p => p.id === parseInt(selectedPatientId));
              if (!pObj) return null;
              
              // Calculate age
              const dob = pObj.dob || '';
              let age = 'N/A';
              if (dob) {
                try {
                  const birthDate = new Date(dob);
                  const today = new Date();
                  age = today.getFullYear() - birthDate.getFullYear();
                  const m = today.getMonth() - birthDate.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                  }
                } catch (err) {}
              }

              // Extract gender from intakeForm if available
              let gender = 'N/A';
              if (pObj.intakeForm) {
                try {
                  const intake = typeof pObj.intakeForm === 'string' ? JSON.parse(pObj.intakeForm) : pObj.intakeForm;
                  gender = intake.patientInformation?.gender || 'N/A';
                } catch(e) {}
              }

              return (
                <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl text-xs space-y-1.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Patient Demographics (EHR Sync)</span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-semibold text-slate-700">
                    <p><span className="text-slate-400 font-medium">Name:</span> {pObj.name}</p>
                    <p><span className="text-slate-400 font-medium">ID:</span> #PT-{pObj.id.toString().padStart(3, '0')}</p>
                    <p><span className="text-slate-400 font-medium">DOB / Age:</span> {dob || 'N/A'} ({age} yrs)</p>
                    <p><span className="text-slate-400 font-medium">Gender:</span> {gender}</p>
                    <p className="col-span-2"><span className="text-slate-400 font-medium">Phone / Email:</span> {pObj.phone || 'N/A'} · {pObj.email}</p>
                    {pObj.allergies && pObj.allergies !== 'None' && (
                      <p className="col-span-2 text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 font-bold">
                        ⚠️ Allergies: {pObj.allergies}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chief Complaint</label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g. Mild chest tightness"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-400"
                  required
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Primary Diagnosis</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Essential Hypertension"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-400"
                  required
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Secondary Diagnosis</label>
                <input
                  type="text"
                  value={secondaryDiagnosis}
                  onChange={(e) => setSecondaryDiagnosis(e.target.value)}
                  placeholder="e.g. Hyperlipidemia (Optional)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Medications List */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Medications & Posology</label>
                <button
                  type="button"
                  onClick={handleAddMed}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100 transition"
                >
                  + Add Medication
                </button>
              </div>

              <div className="space-y-3">
                {meds.map((m, idx) => (
                  <div key={idx} className="p-4 bg-slate-50/40 border border-slate-150 rounded-2xl space-y-3 relative text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-extrabold">Medication #{idx + 1}</span>
                      {meds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMed(idx)}
                          className="text-[10px] font-bold text-rose-650 hover:underline"
                        >
                          Remove Row
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 text-xs">
                      <div className="md:col-span-4">
                        <input
                          type="text"
                          value={m.name}
                          onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                          placeholder="Drug Name (Generic / Brand)"
                          className="w-full p-2 bg-white border border-slate-250 font-semibold text-slate-800 rounded-xl outline-none"
                          required
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={m.strength}
                          onChange={(e) => handleMedChange(idx, 'strength', e.target.value)}
                          placeholder="Strength (e.g. 500mg)"
                          className="w-full p-2 bg-white border border-slate-250 font-semibold text-slate-800 rounded-xl outline-none"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <select
                          value={m.form}
                          onChange={(e) => handleMedChange(idx, 'form', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-250 font-semibold text-slate-800 rounded-xl outline-none"
                          required
                        >
                          <option value="tablet">Tablet</option>
                          <option value="capsule">Capsule</option>
                          <option value="syrup">Syrup</option>
                          <option value="injection">Injection</option>
                          <option value="ointment">Ointment</option>
                          <option value="inhaler">Inhaler</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={m.dose_qty}
                          onChange={(e) => handleMedChange(idx, 'dose_qty', e.target.value)}
                          placeholder="Dose (e.g. 1 tab)"
                          className="w-full p-2 bg-white border border-slate-250 font-semibold text-slate-800 rounded-xl outline-none"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <select
                          value={m.route}
                          onChange={(e) => handleMedChange(idx, 'route', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-250 font-semibold text-slate-800 rounded-xl outline-none"
                          required
                        >
                          <option value="oral">Oral</option>
                          <option value="topical">Topical</option>
                          <option value="IV">IV</option>
                          <option value="inhalation">Inhalation</option>
                          <option value="subcutaneous">Subcutaneous</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 text-xs">
                      <div className="md:col-span-3">
                        <input
                          type="text"
                          value={m.frequency}
                          onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                          placeholder="Frequency (e.g. twice daily)"
                          className="w-full p-2 bg-white border border-slate-250 font-semibold text-slate-800 rounded-xl outline-none"
                          required
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={m.duration}
                          onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                          placeholder="Duration (e.g. 5 days)"
                          className="w-full p-2 bg-white border border-slate-250 font-semibold text-slate-800 rounded-xl outline-none"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={m.dispense_qty}
                          onChange={(e) => handleMedChange(idx, 'dispense_qty', e.target.value)}
                          placeholder="Dispense Qty"
                          className="w-full p-2 bg-white border border-slate-250 font-semibold text-slate-800 rounded-xl outline-none"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <input
                          type="number"
                          value={m.refills_allowed}
                          onChange={(e) => handleMedChange(idx, 'refills_allowed', parseInt(e.target.value) || 0)}
                          placeholder="Refills"
                          min="0"
                          className="w-full p-2 bg-white border border-slate-250 font-semibold text-slate-800 rounded-xl outline-none"
                          required
                        />
                      </div>

                      <div className="md:col-span-3">
                        <input
                          type="text"
                          value={m.special_instructions}
                          onChange={(e) => handleMedChange(idx, 'special_instructions', e.target.value)}
                          placeholder="Special instructions (Take with food)"
                          className="w-full p-2 bg-white border border-slate-250 font-semibold text-slate-850 rounded-xl outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">General Advice / Lifestyle instructions</label>
                <textarea
                  value={generalAdvice}
                  onChange={(e) => setGeneralAdvice(e.target.value)}
                  placeholder="e.g. Low-salt diet, regular BP checks twice daily..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Follow-up Plan</label>
                <textarea
                  value={followUpPlan}
                  onChange={(e) => setFollowUpPlan(e.target.value)}
                  placeholder="e.g. Clinic visit review in 2 weeks, seek ER if chest pain escalates..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-400 resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Prescription Notes (For Pharmacist)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Substitution allowed, guidelines, generic alternatives..."
                rows={2}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-400 resize-none"
              />
            </div>

            {doctorProfile && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-semibold text-slate-500 flex justify-between items-center text-left">
                <div>
                  <p className="text-slate-800 font-bold uppercase tracking-wider">Authorized Prescriber Credentials</p>
                  <p className="mt-0.5">Dr. {doctorProfile.name} ({doctorProfile.education || 'MD'}) · {doctorProfile.specialty}</p>
                  <p>Registration License/NPI: {doctorProfile.license || 'NPI-2023-4982'}</p>
                </div>
                <div className="text-right">
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl font-extrabold block text-center uppercase tracking-wide">
                    🔐 SECURE SIGNATURE APPLIED
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={issuing}
              className="w-full py-3 bg-brand-sidebar hover:bg-brand-sidebarHover text-white text-xs font-bold rounded-xl shadow-md transition uppercase tracking-wider"
            >
              {issuing ? 'Generating Scannable PDF...' : 'Sign & Issue Digital Rx'}
            </button>
          </form>
        </div>

        {/* Right: Scannable PDF preview sheet (col-span-5) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          {successMsg && (
            <div className="dashboard-card p-6 bg-emerald-50 border border-emerald-150 rounded-3xl shadow-sm space-y-4 text-center">
              <span className="text-3xl">🎉</span>
              <h3 className="text-sm font-extrabold text-emerald-800">{successMsg}</h3>
              
              <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-2xl shadow-inner">
                {qrCodePath && (
                  <img 
                    src={`/${qrCodePath}`} 
                    alt="Prescription QR" 
                    className="w-36 h-36 border border-slate-200 rounded p-1"
                  />
                )}
                <p className="text-[10px] text-slate-450 mt-2 font-semibold">Scan QR code to verify & download PDF.</p>
              </div>

              {pdfPath && (
                <a
                  href={`/${pdfPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  Download PDF Prescription
                </a>
              )}
            </div>
          )}

          {/* Recently Issued prescriptions list */}
          <div className="dashboard-card p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4 flex-grow">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Recently Issued Prescriptions</h3>
            
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {loading ? (
                <p className="text-xs text-slate-400 italic">Syncing prescription database...</p>
              ) : prescriptions.length > 0 ? (
                prescriptions.map((rx) => (
                  <div key={rx.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center gap-3">
                    <div className="text-left space-y-1">
                      <h4 className="text-xs font-bold text-slate-800">{rx.patientName}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">Diagnosis: <span className="text-slate-700 font-bold">{rx.diagnosis}</span></p>
                      <p className="text-[9px] text-slate-400 font-medium">Meds: {rx.medications.map(m => (typeof m === 'object' && m !== null) ? (m.name || m.medication || 'Unknown') : String(m)).join(', ')}</p>
                    </div>

                    <a 
                      href={`/prescriptions/prescription_${rx.id}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white border border-slate-200 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-xl transition text-[10px]"
                    >
                      📄
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-6">No clinical prescriptions logged.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DocPrescriptions;
