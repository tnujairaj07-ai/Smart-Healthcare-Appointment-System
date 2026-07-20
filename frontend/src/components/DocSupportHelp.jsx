import React, { useState, useEffect } from 'react';

const DocSupportHelp = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Support Ticket Form State
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [tag, setTag] = useState('clinical'); // 'clinical' | 'tech' | 'data'
  const [description, setDescription] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchDoctorTickets = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch('/api/support/tickets', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setTickets(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDoctorTickets();
  }, []);

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    const token = localStorage.getItem('token');
    
    // We construct a descriptive prefix for the priority or tag to fit into the subject/description if needed
    const finalSubject = `[${tag.toUpperCase()}] ${subject}`;

    fetch('/api/support/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        subject: finalSubject,
        priority: priority,
        description: description
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to submit support ticket.');
        return res.json();
      })
      .then(() => {
        setSubmitting(false);
        setSuccessMsg('Ticket logged with admin support desk!');
        setSubject('');
        setDescription('');
        setPriority('Medium');
        setTag('clinical');
        fetchDoctorTickets();
        setTimeout(() => setSuccessMsg(''), 4500);
      })
      .catch(err => {
        setSubmitting(false);
        alert(err.message);
      });
  };

  return (
    <div className="space-y-6 text-slate-850 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Help Docs & Ticket list (col-span-8) */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          
          {/* Help manuals */}
          <div className="dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Clinical Workflow Manuals</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: '📅 Slot Scheduling Guidelines', text: 'Learn to configure slot templates, recurrences, and block vacations in calendar grids.', link: '#' },
                { title: '🤖 MedGemma AI Decision Support', text: 'Optimize RAG queries, prompt in differential mode, and check drug interaction guidelines.', link: '#' },
                { title: '💊 Signing Digital Prescriptions', text: 'Build online prescriptions, trigger signatures, and download verified QR code PDFs.', link: '#' },
                { title: 'Smart Referral Allocations', text: 'Respond to incoming AI matches and file clinical transfer records to other clinics.', link: '#' }
              ].map((guide, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">{guide.title}</h4>
                  <p className="text-[11px] text-slate-500 font-semibold leading-normal">{guide.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket list */}
          <div className="dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4 flex-grow">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">My Support Tickets</h3>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {loading ? (
                <p className="text-xs text-slate-450 italic">Retrieving open support cases...</p>
              ) : tickets.length > 0 ? (
                tickets.map(ticket => (
                  <div key={ticket.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-800">{ticket.subject}</h4>
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                          ticket.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          ticket.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                          {ticket.priority} Priority
                        </span>
                      </div>
                      <p className="text-slate-500 font-semibold leading-normal">"{ticket.description}"</p>
                      <span className="block text-[9px] text-slate-400 mt-1">{ticket.createdAt}</span>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border shrink-0 ${
                      ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      ticket.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-6">No support tickets logged for this account.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Submit Ticket Form (col-span-4) */}
        <div className="lg:col-span-4 dashboard-card p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">File Support Ticket</h3>
          
          <form onSubmit={handleSubmitTicket} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ticket Department</label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-150"
              >
                <option value="clinical">Clinical Workflow Block</option>
                <option value="tech">Technical/System Error</option>
                <option value="data">Data Discrepancy/Meds error</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Inbound referrals fail to open clinical notes"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-400"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority Classification</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-150"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description of Issue</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail the issue. (e.g. When trying to load patient profile #3 from records grid, system triggers a gateway timeout...)"
                rows={4}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-400 resize-none"
                required
              />
            </div>

            {successMsg && <p className="text-[10px] text-emerald-600 font-bold">✓ {successMsg}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-brand-sidebar hover:bg-brand-sidebarHover text-white text-xs font-bold rounded-xl shadow-md transition uppercase tracking-wider"
            >
              {submitting ? 'Logging ticket...' : 'Submit Support Case'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default DocSupportHelp;
