import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

const PatientDashboard = () => {
  // Toast notifications
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [alertTray, setAlertTray] = useState(false);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);

  // Patient Info State
  const [patientInfo, setPatientInfo] = useState({
    name: 'Kate Prokopchuk',
    phone: '+38 (093) 23 45 678',
    email: 'katepro@gmail.com',
    dob: '23. 07. 1994',
    address: 'Lviv, Chornovola street, 67',
    regDate: 'Thursday, May 25',
    allergies: 'Nuts, pollen',
    chronic: 'Asthma',
    bloodType: 'I+',
    pastIllnesses: 'Coronavirus'
  });

  // Edited Patient Info Temp State
  const [tempInfo, setTempInfo] = useState({ ...patientInfo });

  // Visits Tab selection state
  const [activeTab, setActiveTab] = useState('future');

  // Doctor Notes State
  const [notes, setNotes] = useState([
    {
      id: 1,
      doctor: 'Dr. Helena Ross',
      date: 'June 23, 2026',
      content: 'Patient notes mild respiratory tightness in mornings. Prescribed temporary nebulizer use until follow-up allergy reports.'
    }
  ]);

  // Uploaded Files State
  const [files, setFiles] = useState([
    { id: 1, name: 'Check Up Result.pdf', size: '123kb', date: 'June 26, 2026' },
    { id: 2, name: 'Medical Prescriptions.pdf', size: '123kb', date: 'June 24, 2026' }
  ]);

  // Visits Data
  const [visits, setVisits] = useState({
    future: [
      {
        id: 1,
        time: '11.00 - 12.30',
        date: '26 Jun 2026',
        service: 'Treatment and cleaning of canals',
        doctor: 'Dr. Oksana Max',
        doctorTitle: 'Dental Surgeon',
        status: 'Scheduled',
        statusClass: 'bg-indigo-50 text-indigo-600 border-indigo-100'
      },
      {
        id: 2,
        time: '14.30 - 15.30',
        date: '27 Jul 2026',
        service: 'Teeth whitening routine session',
        doctor: 'Dr. Max Oched',
        doctorTitle: 'Aesthetic Dentistry',
        status: 'Scheduled',
        statusClass: 'bg-teal-50 text-teal-600 border-teal-100'
      }
    ],
    past: [
      {
        id: 3,
        time: '09.00 - 10.00',
        date: '14 May 2026',
        service: 'Primary Cardiology Diagnosis Consultation',
        doctor: 'Dr. Helena Ross',
        doctorTitle: 'Cardiology',
        status: 'Completed',
        statusClass: 'bg-emerald-50 text-emerald-600 border-emerald-100'
      },
      {
        id: 4,
        time: '10.00 - 11.00',
        date: '22 Apr 2026',
        service: 'Allergies Skin Scratch Pre-Test',
        doctor: 'Dr. Sarah Jenkins',
        doctorTitle: 'Immunology',
        status: 'Completed',
        statusClass: 'bg-emerald-50 text-emerald-600 border-emerald-100'
      }
    ],
    treatment: [
      {
        id: 5,
        time: 'Daily Intake',
        date: 'Active Plan',
        service: 'Antihistamine Tablet Adherence Cycles',
        doctor: 'Dr. Sarah Jenkins',
        doctorTitle: 'Immunology',
        status: 'In Progress',
        statusClass: 'bg-amber-50 text-amber-600 border-amber-100'
      }
    ]
  });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Save changes
      setPatientInfo({ ...tempInfo });
      triggerToast('Patient medical profile saved and synchronized.');
    } else {
      // Open edit mode
      setTempInfo({ ...patientInfo });
      triggerToast('Profile editing enabled. Make your modifications.');
    }
    setIsEditMode(!isEditMode);
  };

  const addNewVisit = () => {
    const futureService = prompt("Enter planned clinical service description:", "Routine Orthodontic Bracket Control");
    if (!futureService) return;

    const newVisitItem = {
      id: Date.now(),
      time: '10.00 - 11.30',
      date: '14 Aug 2026',
      service: futureService,
      doctor: 'Dr. Oksana Max',
      doctorTitle: 'Dental Surgeon',
      status: 'Scheduled',
      statusClass: 'bg-indigo-50 text-indigo-600 border-indigo-100'
    };

    setVisits({
      ...visits,
      future: [...visits.future, newVisitItem]
    });
    triggerToast("Scheduled new clinical visit successfully!");
  };

  const simulateFileUpload = () => {
    const mockFiles = [
      "CardioElectrocardiogram.pdf",
      "PollenAllergenChart.pdf",
      "RespiratoryAdherenceCheck.pdf"
    ];
    const selectedFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];

    const newFile = {
      id: Date.now(),
      name: selectedFile,
      size: '112kb',
      date: 'Today'
    };

    setFiles([newFile, ...files]);
    triggerToast(`Uploaded file: ${selectedFile}`);
  };

  const addNewNote = () => {
    const val = prompt("Type patient clinical consultation note:", "Patient shows steady recovery from sinus allergies.");
    if (!val) return;

    const newNote = {
      id: Date.now(),
      doctor: 'Dr. Helena Ross',
      date: 'Today',
      content: val
    };

    setNotes([newNote, ...notes]);
    triggerToast("Added physician consultation summary note.");
  };

  return (
    <div className="flex h-screen bg-[#f4f7fc] overflow-hidden w-full font-sans antialiased text-slate-800">
      
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN WORKSPACE CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
        
        {/* NAVBAR */}
        <Navbar 
          title="Patient Profile" 
          toggleAlerts={() => setAlertTray(!alertTray)} 
        />

        {/* WORKSPACE INNER WRAPPER */}
        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto space-y-6 flex-grow pb-16">
          
          {/* Header Controls */}
          <div className="no-print flex items-center justify-between gap-3 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-sidebar animate-pulse"></span>
              <p className="text-xs font-semibold text-slate-400">Electronic Health File synced with NovaCare Cloud</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => window.print()} 
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 uppercase tracking-wide"
              >
                🖨️ Print Profile
              </button>
              <button 
                onClick={handleEditToggle} 
                className={`px-6 py-2.5 text-white transition-all text-xs font-bold rounded-xl shadow-md flex items-center gap-2 uppercase tracking-wide ${
                  isEditMode ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' : 'bg-brand-sidebar hover:bg-brand-sidebarHover shadow-indigo-600/15'
                }`}
              >
                {isEditMode ? '💾 Save' : '✏️ Edit'}
              </button>
            </div>
          </div>

          {/* Demographic Upper Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:grid-cols-12">
            
            {/* Card 1: Avatar Demographic Card */}
            <div className="dashboard-card lg:col-span-4 p-6 flex flex-col items-center justify-center text-center relative print:col-span-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-50 shadow-md ring-4 ring-indigo-50">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300" 
                    alt={patientInfo.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="text-white text-xs font-semibold">Replace Photo</span>
                </div>
              </div>

              <div className="mt-4 space-y-2 w-full">
                {!isEditMode ? (
                  <>
                    <h2 className="text-xl font-bold text-slate-800">{patientInfo.name}</h2>
                    <p className="text-xs text-indigo-600 font-semibold tracking-wide">{patientInfo.phone}</p>
                    <p className="text-xs text-slate-400 font-medium">{patientInfo.email}</p>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <input 
                      type="text" 
                      value={tempInfo.name} 
                      onChange={(e) => setTempInfo({ ...tempInfo, name: e.target.value })}
                      className="text-center text-sm font-semibold border-2 border-indigo-500 focus:outline-none focus:border-brand-coral bg-indigo-50/50 p-1.5 rounded w-full"
                    />
                    <input 
                      type="text" 
                      value={tempInfo.phone} 
                      onChange={(e) => setTempInfo({ ...tempInfo, phone: e.target.value })}
                      className="text-center text-xs text-indigo-600 font-semibold border-2 border-indigo-500 focus:outline-none focus:border-brand-coral bg-indigo-50/50 p-1.5 rounded w-full"
                    />
                    <input 
                      type="text" 
                      value={tempInfo.email} 
                      onChange={(e) => setTempInfo({ ...tempInfo, email: e.target.value })}
                      className="text-center text-xs text-slate-400 border-2 border-indigo-500 focus:outline-none focus:border-brand-coral bg-indigo-50/50 p-1.5 rounded w-full"
                    />
                  </div>
                )}
              </div>

              <div className="w-full mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4 text-left">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">ID Code</span>
                  <span className="text-xs font-bold text-slate-700">#NC-9321-K</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Account Status</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: General Information Card */}
            <div className="dashboard-card lg:col-span-4 p-6 flex flex-col justify-between print:col-span-4">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-xs tracking-wide uppercase flex items-center gap-2">
                    <span className="text-indigo-500 font-semibold text-lg">ℹ️</span> General information
                  </h3>
                  <span className="text-slate-400 text-xs font-medium">✏️ Editable</span>
                </div>

                <div className="space-y-4 mt-5">
                  <div className="grid grid-cols-3 items-center">
                    <span className="text-xs font-semibold text-slate-400">Date of birth</span>
                    <div className="col-span-2">
                      {!isEditMode ? (
                        <span className="text-xs font-bold text-slate-700">{patientInfo.dob}</span>
                      ) : (
                        <input 
                          type="text" 
                          value={tempInfo.dob} 
                          onChange={(e) => setTempInfo({ ...tempInfo, dob: e.target.value })}
                          className="text-xs font-semibold border-b-2 border-indigo-500 focus:outline-none focus:border-brand-coral bg-indigo-50/50 p-1.5 rounded w-full"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 items-start">
                    <span className="text-xs font-semibold text-slate-400">Address</span>
                    <div className="col-span-2">
                      {!isEditMode ? (
                        <span className="text-xs font-semibold text-slate-700 block leading-relaxed">{patientInfo.address}</span>
                      ) : (
                        <textarea 
                          value={tempInfo.address} 
                          onChange={(e) => setTempInfo({ ...tempInfo, address: e.target.value })}
                          className="text-xs font-semibold border border-indigo-200 rounded p-1.5 w-full focus:outline-none focus:border-brand-coral bg-indigo-50/50"
                          rows="2"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 items-center">
                    <span className="text-xs font-semibold text-slate-400">Reg. Date</span>
                    <div className="col-span-2">
                      {!isEditMode ? (
                        <span className="text-xs font-semibold text-slate-700">{patientInfo.regDate}</span>
                      ) : (
                        <input 
                          type="text" 
                          value={tempInfo.regDate} 
                          onChange={(e) => setTempInfo({ ...tempInfo, regDate: e.target.value })}
                          className="text-xs font-semibold border-b-2 border-indigo-500 focus:outline-none bg-indigo-50/50 p-1.5 rounded w-full"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100/50 mt-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-indigo-500 font-extrabold uppercase tracking-widest block">Last Checkup Cycle</span>
                  <span className="text-xs font-bold text-slate-800">Cardiology Diagnostics</span>
                </div>
                <span className="text-xs font-extrabold text-indigo-600 bg-white px-2.5 py-1.5 rounded-xl border border-indigo-100 shadow-sm">12 Days Ago</span>
              </div>
            </div>

            {/* Card 3: Anamnesis Card */}
            <div className="dashboard-card lg:col-span-4 p-6 flex flex-col justify-between print:col-span-4">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-xs tracking-wide uppercase flex items-center gap-2">
                    <span className="text-emerald-500 text-lg">🧬</span> Anamnesis
                  </h3>
                  <span className="text-slate-400 text-xs font-medium">✏️ Editable</span>
                </div>

                <div className="space-y-4 mt-5">
                  <div className="grid grid-cols-3 items-center">
                    <span className="text-xs font-semibold text-slate-400">Allergies</span>
                    <div className="col-span-2">
                      {!isEditMode ? (
                        <span className="text-xs font-bold text-slate-700 bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded">{patientInfo.allergies}</span>
                      ) : (
                        <input 
                          type="text" 
                          value={tempInfo.allergies} 
                          onChange={(e) => setTempInfo({ ...tempInfo, allergies: e.target.value })}
                          className="text-xs font-semibold border-b-2 border-indigo-500 focus:outline-none focus:border-brand-coral bg-indigo-50/50 p-1.5 rounded w-full"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 items-center">
                    <span className="text-xs font-semibold text-slate-400">Chronic diseases</span>
                    <div className="col-span-2">
                      {!isEditMode ? (
                        <span className="text-xs font-bold text-slate-700 bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded">{patientInfo.chronic}</span>
                      ) : (
                        <input 
                          type="text" 
                          value={tempInfo.chronic} 
                          onChange={(e) => setTempInfo({ ...tempInfo, chronic: e.target.value })}
                          className="text-xs font-semibold border-b-2 border-indigo-500 focus:outline-none focus:border-brand-coral bg-indigo-50/50 p-1.5 rounded w-full"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 items-center">
                    <span className="text-xs font-semibold text-slate-400">Blood type</span>
                    <div className="col-span-2">
                      {!isEditMode ? (
                        <span className="text-xs font-extrabold text-slate-700 bg-indigo-50 border border-indigo-100 text-indigo-600 px-2.5 py-0.5 rounded">{patientInfo.bloodType}</span>
                      ) : (
                        <input 
                          type="text" 
                          value={tempInfo.bloodType} 
                          onChange={(e) => setTempInfo({ ...tempInfo, bloodType: e.target.value })}
                          className="text-xs font-semibold border-b-2 border-indigo-500 focus:outline-none focus:border-brand-coral bg-indigo-50/50 p-1.5 rounded w-full"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 items-center">
                    <span className="text-xs font-semibold text-slate-400">Past illnesses</span>
                    <div className="col-span-2">
                      {!isEditMode ? (
                        <span className="text-xs font-medium text-slate-700">{patientInfo.pastIllnesses}</span>
                      ) : (
                        <input 
                          type="text" 
                          value={tempInfo.pastIllnesses} 
                          onChange={(e) => setTempInfo({ ...tempInfo, pastIllnesses: e.target.value })}
                          className="text-xs font-semibold border-b-2 border-indigo-500 focus:outline-none focus:border-brand-coral bg-indigo-50/50 p-1.5 rounded w-full"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100/50 mt-4 text-xs flex items-center gap-2">
                <span className="text-lg">🚨</span>
                <p className="text-rose-700 font-medium leading-normal">Rescue inhaler is designated in cabinet #3.</p>
              </div>
            </div>

          </div>

          {/* Lower Grid Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Column Span 8: Visits Scheduler */}
            <div className="dashboard-card lg:col-span-8 p-6 flex flex-col justify-between print:col-span-12">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div className="flex gap-4 sm:gap-6">
                    <button 
                      onClick={() => setActiveTab('future')} 
                      className={`pb-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all ${
                        activeTab === 'future' ? 'border-brand-sidebar text-brand-sidebar' : 'border-transparent text-slate-400 hover:text-slate-650'
                      }`}
                    >
                      Future visits ({visits.future.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab('past')} 
                      className={`pb-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all ${
                        activeTab === 'past' ? 'border-brand-sidebar text-brand-sidebar' : 'border-transparent text-slate-400 hover:text-slate-650'
                      }`}
                    >
                      Past visits ({visits.past.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab('treatment')} 
                      className={`pb-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all ${
                        activeTab === 'treatment' ? 'border-brand-sidebar text-brand-sidebar' : 'border-transparent text-slate-400 hover:text-slate-650'
                      }`}
                    >
                      Planned treatments
                    </button>
                  </div>
                  
                  <button 
                    onClick={addNewVisit} 
                    className="no-print bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <span className="text-sm">+</span> Book Session
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {visits[activeTab].map((visit) => (
                    <div 
                      key={visit.id}
                      className="p-4 bg-slate-50/60 hover:bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:translate-x-1"
                    >
                      <div className="flex items-start gap-4">
                        <div className="bg-white border border-slate-200/80 p-3 rounded-xl shadow-sm text-center min-w-[100px]">
                          <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">{visit.time}</span>
                          <span className="block text-xs font-bold text-slate-800 mt-1">{visit.date}</span>
                        </div>

                        <div className="text-left">
                          <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider block">Service & Procedure</span>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{visit.service}</p>
                          
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="text-xs">🩺</span>
                            <span className="text-xs text-slate-500 font-medium">
                              {visit.doctor} <span className="text-[10px] text-slate-400">({visit.doctorTitle})</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between md:justify-end">
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${visit.statusClass}`}>
                          {visit.status}
                        </span>
                        <button 
                          onClick={() => triggerToast(`Loading medical diagnostic chart for date: ${visit.date}`)} 
                          className="no-print p-2.5 bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 rounded-xl transition-all shadow-sm text-xs font-semibold"
                        >
                          View Chart →
                        </button>
                      </div>
                    </div>
                  ))}

                  {visits[activeTab].length === 0 && (
                    <p className="text-xs text-slate-400 italic py-6">No visit logs found for this category.</p>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                  <span className="font-semibold">Treatment Compliance Target Tracker</span>
                  <span className="font-extrabold text-indigo-600">82% Completed</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-brand-sidebar to-brand-coral h-full rounded-full" style={{width: '82%'}}></div>
                </div>
              </div>
            </div>

            {/* Column Span 4: Files and Notes Stack */}
            <div className="lg:col-span-4 space-y-6 print:col-span-12">
              
              {/* Files */}
              <div className="dashboard-card p-6 flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-xs tracking-wide uppercase flex items-center gap-2">
                    📂 Patient Files
                  </h3>
                  <button 
                    onClick={simulateFileUpload} 
                    className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    Upload
                  </button>
                </div>

                <div className="mt-4 space-y-3 max-h-[195px] overflow-y-auto pr-1">
                  {files.map((file) => (
                    <div 
                      key={file.id} 
                      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition-all text-left"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="text-xl">📄</span>
                        <div>
                          <p className="text-xs font-bold text-slate-700 leading-none">{file.name}</p>
                          <p className="text-[9px] text-slate-400 mt-1">{file.size} · {file.date}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => triggerToast(`Downloading: ${file.name}`)} 
                        className="text-slate-400 hover:text-indigo-600 transition-colors text-xs"
                      >
                        📥
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="dashboard-card p-6 flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-xs tracking-wide uppercase flex items-center gap-2">
                    📝 Doctor Notes
                  </h3>
                  <button 
                    onClick={addNewNote} 
                    className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    Add Note
                  </button>
                </div>

                <div className="mt-4 space-y-3 max-h-[195px] overflow-y-auto pr-1">
                  {notes.map((note) => (
                    <div 
                      key={note.id} 
                      className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-left"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-amber-100/60">
                        <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide">{note.doctor}</span>
                        <span className="text-[9px] text-slate-400">{note.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Notifications alert panel drawer */}
      <div 
        className={`fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl border-l border-slate-100 z-50 transform transition-transform duration-300 no-print flex flex-col ${
          alertTray ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col h-full text-left">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Notifications Panel</h3>
            <button onClick={() => setAlertTray(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">CLOSE</button>
          </div>
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs font-bold text-indigo-800">New Lab Upload Available</p>
              <p className="text-[10px] text-indigo-650 mt-1">Check Up Result.pdf was updated by Cardiology Labs.</p>
            </div>
            <div className="p-3 bg-coral-50 rounded-xl border border-coral-100">
              <p className="text-xs font-bold text-brand-coral">Pending Signature</p>
              <p className="text-[10px] text-coral-600 mt-1">Teeth whitening follow-up treatment requires doctor validation signature.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Alert Banner */}
      <Toast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />

    </div>
  );
};

export default PatientDashboard;
