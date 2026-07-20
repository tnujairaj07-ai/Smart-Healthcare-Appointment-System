import React, { useState } from 'react';

const DocPatientQueue = ({ appointments, onUpdateStatus, onTabChange }) => {
  const [activeSubTab, setActiveSubTab] = useState('upcoming');
  const [sessionNotes, setSessionNotes] = useState({});
  const [notesInput, setNotesInput] = useState('');
  const [activeNotesApptId, setActiveNotesApptId] = useState(null);

  const upcomingAppts = appointments.filter(a => a.status === 'scheduled' || a.status === 'pending' || a.status === 'in_consult');
  const pastAppts = appointments.filter(a => a.status === 'completed' || a.status === 'no_show' || a.status === 'rejected');
  
  // Treatments compliance mockup
  const treatments = appointments.filter(a => a.status !== 'rejected').map(a => ({
    ...a,
    treatmentName: a.diagnosis || 'General Clinical Review',
    progress: a.patient?.id % 2 === 0 ? 82 : (a.patient?.id % 3 === 0 ? 65 : 45)
  }));

  const handleOpenNotes = (apptId) => {
    setActiveNotesApptId(apptId);
    setNotesInput(sessionNotes[apptId] || '');
  };

  const handleSaveNotes = (apptId) => {
    setSessionNotes(prev => ({ ...prev, [apptId]: notesInput }));
    setActiveNotesApptId(null);
  };

  const getTriageClass = (isUrgent, severity) => {
    if (isUrgent) return 'bg-rose-50 text-rose-700 border-rose-100';
    if (severity > 10) return 'bg-orange-50 text-orange-700 border-orange-100';
    return 'bg-indigo-50 text-indigo-700 border-indigo-100';
  };

  const renderQueueCard = (appt) => {
    const isEditingNotes = activeNotesApptId === appt.id;
    const triageClass = getTriageClass(appt.triage?.isUrgent, appt.triage?.severity);
    const statusClass = 
      appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
      appt.status === 'in_consult' ? 'bg-purple-50 text-purple-700 border-purple-100 animate-pulse' :
      appt.status === 'no_show' ? 'bg-slate-100 text-slate-500 border-slate-200' :
      appt.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
      'bg-amber-50 text-amber-700 border-amber-100';

    return (
      <div 
        key={appt.id}
        className="p-5 bg-white border border-slate-200/80 hover:border-indigo-150 rounded-2xl shadow-sm text-left flex flex-col justify-between gap-4"
      >
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
              ⏱️ {appt.timeSlot} · {appt.date}
            </span>
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusClass}`}>
              {appt.status.replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-bold text-slate-900 leading-none">{appt.patient?.name}</h4>
              <span className="text-[9.5px] text-slate-450 font-semibold">(DOB: {appt.patient?.dob || '23.07.1994'})</span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold">Reason: <span className="text-slate-700">{appt.diagnosis || 'Routine Checkup'}</span></p>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className={`text-[8.5px] font-extrabold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${triageClass}`}>
              Triage: {appt.triage?.isUrgent ? 'Critical' : (appt.triage?.severity > 10 ? 'High' : 'Normal')}
            </span>
            {appt.rejectionReason && (
              <p className="text-[10px] text-rose-600 font-bold leading-normal">Rejection Reason: "{appt.rejectionReason}"</p>
            )}
          </div>

          {/* Compliance targets progress tracking */}
          <div className="pt-2 space-y-1 border-t border-slate-50">
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
              <span>Treatment Adherence Tracker</span>
              <span className="font-extrabold text-indigo-600">
                {appt.patient?.id % 2 === 0 ? 82 : (appt.patient?.id % 3 === 0 ? 65 : 45)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full" 
                style={{ width: `${appt.patient?.id % 2 === 0 ? 82 : (appt.patient?.id % 3 === 0 ? 65 : 45)}%` }}
              ></div>
            </div>
          </div>

          {/* Consultation Notes area */}
          {sessionNotes[appt.id] && !isEditingNotes && (
            <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl mt-2 text-left">
              <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block">Doctor Consultation Summary:</span>
              <p className="text-[11px] text-slate-650 italic mt-1 leading-normal font-medium">"{sessionNotes[appt.id]}"</p>
            </div>
          )}

          {isEditingNotes && (
            <div className="space-y-2 mt-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Edit Consultation Notes</label>
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Write consult diagnosis, medications prescribed, or follow-up timelines..."
                rows={2}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-800 focus:border-indigo-400 rounded-xl outline-none transition"
              />
              <div className="flex gap-1 justify-end">
                <button 
                  onClick={() => setActiveNotesApptId(null)}
                  className="px-2.5 py-1 text-[9px] font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-md"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleSaveNotes(appt.id)}
                  className="px-2.5 py-1 text-[9px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-md"
                >
                  Save Notes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action triggers */}
        <div className="flex justify-between items-center gap-1.5 border-t border-slate-100 pt-3 flex-wrap">
          <div className="flex gap-1">
            {appt.status === 'scheduled' || appt.status === 'pending' ? (
              <>
                <button 
                  onClick={() => onUpdateStatus(appt.id, 'in_consult')}
                  className="px-3 py-1.5 bg-brand-sidebar hover:bg-brand-sidebarHover text-white text-[10px] font-extrabold rounded-lg shadow-sm transition uppercase tracking-wider"
                >
                  Start Consult
                </button>
                <button 
                  onClick={() => onUpdateStatus(appt.id, 'no_show')}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-[10px] font-extrabold rounded-lg transition"
                >
                  No-Show
                </button>
              </>
            ) : appt.status === 'in_consult' ? (
              <>
                <button 
                  onClick={() => onUpdateStatus(appt.id, 'completed')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold rounded-lg shadow-sm transition uppercase tracking-wider"
                >
                  Mark Completed
                </button>
                <button 
                  onClick={() => handleOpenNotes(appt.id)}
                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 text-[10px] font-extrabold rounded-lg transition"
                >
                  + Add Notes
                </button>
              </>
            ) : appt.status === 'completed' && !isEditingNotes ? (
              <button 
                onClick={() => handleOpenNotes(appt.id)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-extrabold rounded-lg transition"
              >
                📝 Edit Notes
              </button>
            ) : null}
          </div>
          
          <button 
            onClick={() => onTabChange('prescriptions')}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-700 text-[10px] font-extrabold rounded-lg transition uppercase tracking-wider whitespace-nowrap"
          >
            Create Rx
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs Toggle */}
      <div className="flex justify-between items-center border-b border-slate-150 pb-2 flex-wrap gap-3">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveSubTab('upcoming')}
            className={`pb-2.5 border-b-2 text-xs font-bold uppercase tracking-wider transition-all ${
              activeSubTab === 'upcoming' 
                ? 'border-brand-sidebar text-brand-sidebar font-extrabold' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Future Visits ({upcomingAppts.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('past')}
            className={`pb-2.5 border-b-2 text-xs font-bold uppercase tracking-wider transition-all ${
              activeSubTab === 'past' 
                ? 'border-brand-sidebar text-brand-sidebar font-extrabold' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Past Visits ({pastAppts.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('treatment')}
            className={`pb-2.5 border-b-2 text-xs font-bold uppercase tracking-wider transition-all ${
              activeSubTab === 'treatment' 
                ? 'border-brand-sidebar text-brand-sidebar font-extrabold' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Planned Treatments ({treatments.length})
          </button>
        </div>
        
        <p className="text-[10px] font-bold text-slate-400">Queue active for: Today</p>
      </div>

      {/* Cards Queue Grid */}
      {activeSubTab === 'upcoming' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingAppts.length > 0 ? (
            upcomingAppts.map(renderQueueCard)
          ) : (
            <div className="col-span-full py-12 text-center bg-white border border-slate-100 rounded-3xl space-y-2">
              <i className="fa-solid fa-user-clock text-slate-300 text-3xl"></i>
              <p className="text-xs text-slate-500 font-semibold">No active patient bookings in queue.</p>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'past' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pastAppts.length > 0 ? (
            pastAppts.map(renderQueueCard)
          ) : (
            <div className="col-span-full py-12 text-center bg-white border border-slate-100 rounded-3xl space-y-2">
              <i className="fa-solid fa-folder-closed text-slate-300 text-3xl"></i>
              <p className="text-xs text-slate-500 font-semibold">No past consult logs found.</p>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'treatment' && (
        <div className="space-y-3">
          {treatments.length > 0 ? (
            treatments.map(t => (
              <div 
                key={t.id} 
                className="p-4 bg-white border border-slate-150 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left shadow-sm"
              >
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">{t.treatmentName}</h4>
                  <p className="text-[10px] text-slate-450 font-semibold">Patient: <span className="text-slate-650">{t.patient?.name}</span> · Assigned Doctor: Me</p>
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-[250px] shrink-0">
                  <div className="flex-1 space-y-1">
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-sidebar h-full rounded-full" style={{ width: `${t.progress}%` }}></div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Compliance: {t.progress}%</span>
                  </div>
                  <button 
                    onClick={() => onTabChange('pharmacy')}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 border border-indigo-150 text-[9px] font-bold rounded-lg transition"
                  >
                    View Refills
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center bg-white border border-slate-100 rounded-3xl space-y-2">
              <p className="text-xs text-slate-500 font-semibold">No active treatment plans logged.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocPatientQueue;
