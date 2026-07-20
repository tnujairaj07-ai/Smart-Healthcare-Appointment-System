import React, { useState, useEffect } from 'react';

const DocReferrals = () => {
  const [inbound, setInbound] = useState([]);
  const [outbound, setOutbound] = useState([]);
  const [refereeOptions, setRefereeOptions] = useState([]);
  const [patientOptions, setPatientOptions] = useState([]);
  const [smartMatches, setSmartMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // New referral form state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedRefereeId, setSelectedRefereeId] = useState('');
  const [referralReason, setReferralReason] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchReferralsData = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch('/api/doctor/referrals', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setInbound(data.inbound || []);
          setOutbound(data.outbound || []);
          setRefereeOptions(data.refereeOptions || []);
          setPatientOptions(data.patientOptions || []);
          setSmartMatches(data.smartMatches || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchReferralsData();
  }, []);

  const handleUpdateStatus = (id, newStatus) => {
    const token = localStorage.getItem('token');
    fetch(`/api/doctor/referrals/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update referral.');
        return res.json();
      })
      .then(() => {
        fetchReferralsData();
      })
      .catch(err => alert(err.message));
  };

  const handleCreateReferral = (e) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedRefereeId || !referralReason) {
      alert('Please fill out all required fields.');
      return;
    }

    const token = localStorage.getItem('token');
    fetch('/api/doctor/referrals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        patient_id: parseInt(selectedPatientId),
        referee_id: parseInt(selectedRefereeId),
        reason: referralReason,
        notes: referralNotes
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to create referral.');
        return res.json();
      })
      .then(() => {
        setFormSuccess('Referral successfully submitted!');
        setSelectedPatientId('');
        setSelectedRefereeId('');
        setReferralReason('');
        setReferralNotes('');
        fetchReferralsData();
        setTimeout(() => setFormSuccess(''), 4000);
      })
      .catch(err => alert(err.message));
  };

  return (
    <div className="space-y-6 text-slate-800 text-left">
      {/* Smart Matches & AI referrals matches section */}
      <div className="dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">AI-Assisted Smart Matches</h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Patients matched to your department based on AI symptom analyses logs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {smartMatches.length > 0 ? (
            smartMatches.map((match, idx) => (
              <div 
                key={idx} 
                className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-indigo-650">
                    <span>★ AI Recommended Match</span>
                    <span className="text-slate-400">{match.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{match.patientName}</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">Symptoms: <span className="text-slate-700">{match.symptoms}</span></p>
                  <p className="text-[10px] font-bold text-slate-450 mt-1">Specialty Alignment: <span className="text-emerald-700">{match.reason}</span></p>
                </div>
                
                <button
                  onClick={() => {
                    // Create mock appt
                    const token = localStorage.getItem('token');
                    fetch('/api/appointments/book', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        doctor_id: refereeOptions.find(o => o.name.includes('Flores'))?.id || 1, // fallback ID
                        date: new Date().toISOString().split('T')[0],
                        time_slot: '01:00 PM'
                      })
                    })
                      .then(() => alert('Matched patient accepted!'))
                      .catch(() => {});
                  }}
                  className="w-full py-2 bg-brand-sidebar hover:bg-brand-sidebarHover text-white text-[10px] font-extrabold rounded-lg shadow-sm transition uppercase tracking-wider"
                >
                  Accept Match & Schedule
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic py-4 col-span-full text-center">No pending AI specialty matches found.</p>
          )}
        </div>
      </div>

      {/* Referrals grid splitter: Inbound/Outbound on left, Form on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Referral Tables (col-span-8) */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          {/* Inbound Referrals */}
          <div className="dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Incoming Department Referrals</h3>
            
            <div className="space-y-3">
              {inbound.length > 0 ? (
                inbound.map(item => (
                  <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex gap-2 items-center flex-wrap">
                        <h4 className="text-xs font-bold text-slate-800">{item.patientName}</h4>
                        <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded">
                          From: {item.referrerName} ({item.referrerSpecialty})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold">Reason: <span className="text-slate-700 font-bold">{item.reason}</span></p>
                      {item.notes && <p className="text-[10px] text-slate-450 italic">Notes: "{item.notes}"</p>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'Pending' ? (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(item.id, 'Accepted')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold rounded-lg shadow-sm transition"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(item.id, 'Declined')}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-[10px] font-extrabold rounded-lg transition"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          item.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-6">No incoming referrals logged.</p>
              )}
            </div>
          </div>

          {/* Outbound Referrals */}
          <div className="dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">My Outbound Referrals</h3>
            
            <div className="space-y-3">
              {outbound.length > 0 ? (
                outbound.map(item => (
                  <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex gap-2 items-center flex-wrap">
                        <h4 className="text-xs font-bold text-slate-800">{item.patientName}</h4>
                        <span className="text-[9px] bg-slate-100 border border-slate-250 text-slate-500 font-extrabold px-1.5 py-0.5 rounded">
                          Referree: {item.refereeName} ({item.refereeSpecialty})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold">Reason: <span className="text-slate-700 font-bold">{item.reason}</span></p>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border shrink-0 ${
                      item.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      item.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-6">No outbound referrals logged.</p>
              )}
            </div>
          </div>
        </div>

        {/* Create Referral Form (col-span-4) */}
        <div className="lg:col-span-4 dashboard-card p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Refer Patient</h3>
          
          <form onSubmit={handleCreateReferral} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Patient</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-850 rounded-xl outline-none focus:ring-2 focus:ring-indigo-150"
                required
              >
                <option value="">-- Choose Patient --</option>
                {patientOptions.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Specialist</label>
              <select
                value={selectedRefereeId}
                onChange={(e) => setSelectedRefereeId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-850 rounded-xl outline-none focus:ring-2 focus:ring-indigo-150"
                required
              >
                <option value="">-- Choose Doctor --</option>
                {refereeOptions.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reason for Referral</label>
              <input
                type="text"
                value={referralReason}
                onChange={(e) => setReferralReason(e.target.value)}
                placeholder="e.g. ECG findings show suspected valvular leakage"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-850 rounded-xl outline-none focus:bg-white focus:border-indigo-400"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transition Notes</label>
              <textarea
                value={referralNotes}
                onChange={(e) => setReferralNotes(e.target.value)}
                placeholder="Add further case notes, diagnostic numbers, or escalation history..."
                rows={3}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-850 rounded-xl outline-none focus:bg-white focus:border-indigo-400 resize-none"
              />
            </div>

            {formSuccess && <p className="text-[10px] text-emerald-600 font-bold">✓ {formSuccess}</p>}

            <button
              type="submit"
              className="w-full py-3 bg-brand-sidebar hover:bg-brand-sidebarHover text-white text-xs font-bold rounded-xl shadow-md transition uppercase tracking-wider"
            >
              Submit Referral Request
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default DocReferrals;
