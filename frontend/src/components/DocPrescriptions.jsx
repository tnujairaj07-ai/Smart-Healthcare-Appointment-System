import React, { useState, useEffect } from 'react';

const DocPrescriptions = ({ appointments }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Prescription Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [meds, setMeds] = useState([{ name: '', dosage: '', frequency: '' }]);
  
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
    // Since there isn't a direct list prescriptions endpoint for doctors in app.py yet,
    // we query doctor's appointments and filter patient prescriptions, or fall back to mock data
    const token = localStorage.getItem('token');
    fetch('/api/admin/appointments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        // Filter appointments that belong to me and have prescriptions (diagnoses / meds)
        const myRx = [];
        data.forEach(appt => {
          // If diagnosis exists, we format as prescription
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
  }, [appointments]);

  const handleAddMed = () => {
    setMeds([...meds, { name: '', dosage: '', frequency: '' }]);
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
    // Find active appointment for patient to link ID
    const activeAppt = appointments.find(a => a.patient?.id === parseInt(selectedPatientId));
    const apptId = activeAppt ? activeAppt.id : 1; // Fallback appointment ID
    const patientObj = patients.find(p => p.id === parseInt(selectedPatientId));
    
    const requestBody = {
      appointment_id: apptId,
      doctor_id: 1, // Will be read from doctor profile in backend
      patient_id: parseInt(selectedPatientId),
      patient_name: patientObj ? patientObj.name : 'Unknown Patient',
      doctor_name: 'Dr. Dianne Russell', // Mock name
      diagnosis: diagnosis,
      medications: meds,
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
        setNotes('');
        setMeds([{ name: '', dosage: '', frequency: '' }]);
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
                  <div key={idx} className="p-3 bg-slate-50/50 border border-slate-200 rounded-2xl flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                        placeholder="Drug Name (e.g. Lisinopril)"
                        className="p-2 bg-white border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none"
                        required
                      />
                      <input
                        type="text"
                        value={m.dosage}
                        onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                        placeholder="Dosage (e.g. 10mg)"
                        className="p-2 bg-white border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none"
                        required
                      />
                      <input
                        type="text"
                        value={m.frequency}
                        onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                        placeholder="Frequency (e.g. Once daily)"
                        className="p-2 bg-white border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none"
                        required
                      />
                    </div>

                    {meds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMed(idx)}
                        className="p-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-xl transition text-[10px]"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Prescription Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes for the pharmacist or patient guidelines (e.g. Take with food)..."
                rows={3}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-400 resize-none"
              />
            </div>

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
                      <p className="text-[9px] text-slate-400 font-medium">Meds: {rx.medications.map(m => m.name).join(', ')}</p>
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
