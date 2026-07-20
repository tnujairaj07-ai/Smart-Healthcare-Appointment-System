import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

const PRESCRIPTIONS = [
  {
    id: '#RX-9821-A',
    medicine: 'Cetirizine 10mg',
    doctor: 'Dr. Sarah Jenkins',
    doctorSpecialty: 'Immunology',
    dateIssued: 'June 24, 2026',
    expiryDate: 'Dec 24, 2026',
    dosage: '1 Tablet daily before sleeping',
    refillsLeft: 3,
    status: 'Active',
    statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-150',
    notes: 'For seasonal nasal allergy symptoms & mild sneezing control. Do not exceed prescribed dosage.',
    pdfPath: ''
  },
  {
    id: '#RX-4412-B',
    medicine: 'Salbutamol Inhaler 100mcg',
    doctor: 'Dr. Helena Ross',
    doctorSpecialty: 'Cardiology & Pulmonary',
    dateIssued: 'May 12, 2026',
    expiryDate: 'Nov 12, 2026',
    dosage: '1-2 puffs as required for breathlessness',
    refillsLeft: 1,
    status: 'Active',
    statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-150',
    notes: 'Carry at all times. Use as acute bronchospasm rescue medication. Report palpitations immediately.',
    pdfPath: ''
  },
  {
    id: '#RX-1029-C',
    medicine: 'Amoxicillin 500mg capsules',
    doctor: 'Dr. Dianne Russell',
    doctorSpecialty: 'General Practitioner',
    dateIssued: 'Jan 10, 2026',
    expiryDate: 'Jan 20, 2026',
    dosage: '1 capsule three times daily for 10 days',
    refillsLeft: 0,
    status: 'Expired',
    statusClass: 'bg-rose-50 text-rose-700 border-rose-150',
    notes: 'Take with food. Complete the full 10-day cycle even if symptom resolution occurs earlier.',
    pdfPath: ''
  }
];

const PrescriptionPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/patient/prescriptions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (data && data.length > 0) {
          setPrescriptions(data);
          setSelectedRx(data[0]);
        } else {
          setPrescriptions(PRESCRIPTIONS);
          setSelectedRx(PRESCRIPTIONS[0]);
        }
        setLoading(false);
      })
      .catch(() => {
        setPrescriptions(PRESCRIPTIONS);
        setSelectedRx(PRESCRIPTIONS[0]);
        setLoading(false);
      });
  }, []);

  const handleRequestRefill = (id) => {
    const rx = prescriptions.find((p) => p.id === id);
    if (!rx) return;
    if (rx.refillsLeft <= 0) {
      triggerToast(`No refills remaining for ${rx.medicine}. Sending renewal request to ${rx.doctor}...`, 'info');
      setTimeout(() => {
        triggerToast(`Renewal inquiry submitted to Dr. ${rx.doctor.split(' ')[1]}.`, 'success');
      }, 1500);
      return;
    }

    setPrescriptions(prescriptions.map((p) => {
      if (p.id === id) {
        return { ...p, refillsLeft: p.refillsLeft - 1 };
      }
      return p;
    }));
    triggerToast(`Refill request submitted. ${rx.refillsLeft - 1} refills remaining.`, 'success');
    if (selectedRx?.id === id) {
      setSelectedRx({ ...selectedRx, refillsLeft: selectedRx.refillsLeft - 1 });
    }
  };

  return (
    <div className="flex h-screen bg-[#f4f7fc] overflow-hidden w-full font-sans antialiased text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
        <Navbar title="Digital Prescriptions" />

        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto space-y-6 flex-grow pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT: PRESCRIPTIONS LIST (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center pb-2">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider text-left">Clinical Prescription Directory</h3>
                <span className="text-[10px] font-bold text-slate-400">TAP ROW FOR DETAILS</span>
              </div>

              <div className="space-y-3">
                {prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    onClick={() => setSelectedRx(rx)}
                    className={`p-4 bg-white border rounded-2xl cursor-pointer transition flex items-center justify-between text-left ${
                      selectedRx?.id === rx.id
                        ? 'border-indigo-500 shadow-md ring-2 ring-indigo-50'
                        : 'border-slate-200/80 hover:border-slate-350 hover:bg-slate-50/40'
                    }`}
                  >
                    <div className="space-y-1 pr-4 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400 font-semibold">{rx.id}</span>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${rx.statusClass}`}>
                          {rx.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 truncate">{rx.medicine}</h4>
                      <p className="text-[11px] text-slate-500 font-semibold truncate">Issued by: {rx.doctor}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
                        {rx.refillsLeft} Refills Left
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestRefill(rx.id);
                        }}
                        className="text-[10px] font-extrabold text-slate-500 hover:text-indigo-600 transition"
                      >
                        Request Refill →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: DETAILED FOCUS PANEL (5 cols) */}
            <div className="lg:col-span-5">
              {selectedRx ? (
                <div className="dashboard-card p-6 space-y-5 text-left relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-sidebar"></div>

                  <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 font-semibold">{selectedRx.id}</span>
                      <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{selectedRx.medicine}</h3>
                    </div>
                    {selectedRx.pdfPath ? (
                      <a
                        href={`/${selectedRx.pdfPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-bold transition flex items-center gap-1"
                      >
                        PDF 📥
                      </a>
                    ) : (
                      <button
                        onClick={() => triggerToast(`Downloading PDF document for prescription ${selectedRx.id}...`)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-150 rounded-xl text-[10px] font-bold transition flex items-center gap-1"
                      >
                        PDF 📥
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 text-xs font-semibold">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Issued Date</span>
                        <span className="text-slate-800 font-bold block mt-0.5">{selectedRx.dateIssued}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Expiry Date</span>
                        <span className="text-slate-850 font-bold block mt-0.5">{selectedRx.expiryDate}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Prescribing Physician</span>
                      <span className="text-slate-850 font-bold block mt-0.5">{selectedRx.doctor}</span>
                      <span className="text-[10px] text-indigo-600 block">{selectedRx.doctorSpecialty}</span>
                    </div>

                    <div className="bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100/50">
                      <span className="text-[9px] text-indigo-500 font-extrabold uppercase tracking-widest block">Intake & Dosage Instructions</span>
                      <p className="text-xs text-slate-800 font-bold mt-1 leading-normal">{selectedRx.dosage}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-50">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Clinical Remarks</span>
                      <p className="text-xs text-slate-650 leading-relaxed font-medium">
                        {selectedRx.notes}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    {selectedRx.status === 'Expired' ? (
                      <button
                        disabled={true}
                        className="flex-1 py-3 bg-slate-200 text-slate-450 font-bold rounded-xl text-xs tracking-wide uppercase cursor-not-allowed text-center"
                      >
                        Intake Period Ended / Expired
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRequestRefill(selectedRx.id)}
                        className="flex-1 py-3 bg-brand-sidebar hover:bg-brand-sidebarHover text-white font-bold rounded-xl shadow-md text-xs tracking-wide uppercase transition"
                      >
                        {selectedRx.refillsLeft > 0 ? 'Request Refill Dispatch' : 'Request Physician Renewal'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="dashboard-card p-12 text-center space-y-3">
                  <span className="text-3xl block">📋</span>
                  <h4 className="text-sm font-extrabold text-slate-700">No prescription selected</h4>
                  <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
                    Select a prescription checklist item from the directory to review dosage schedules, remarks, and refill options.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default PrescriptionPage;
