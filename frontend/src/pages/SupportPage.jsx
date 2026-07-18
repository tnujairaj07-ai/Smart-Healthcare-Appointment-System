import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

const SupportPage = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'Technical Inquiry',
    priority: 'Medium',
    description: ''
  });

  // FAQ Accordion State
  const [faqOpen, setFaqOpen] = useState(null);

  const faqs = [
    {
      q: 'How does the AI Doctor Assistant work?',
      a: 'The AI Doctor Assistant is powered by clinical LLM systems (MedGemma). It parses symptoms and history to suggest primary diagnoses and matches you with a specialist. It is informational and does not replace professional medical diagnosis.'
    },
    {
      q: 'Can I cancel or reschedule my appointment?',
      a: 'Yes, upcoming visits can be rescheduled or cancelled directly from the "My Appointments" panel in your Care Overview tab up to 24 hours before the scheduled time slot.'
    },
    {
      q: 'How do I redeem my pharmacy prescription?',
      a: 'Once your doctor issues a digital prescription, it generates a unique QR code. Present this QR code at our partner physical pharmacy, or click "Order from Pharmacy" to load it into your online storefront cart for home delivery.'
    },
    {
      q: 'Is my medical data shared with third parties?',
      a: 'No. Your medical files, uploads, and AI transcripts are fully secure and locked under HIPAA-compliant directories. You can adjust which clinicians have record access in your Account Settings page.'
    }
  ];

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchTickets = () => {
    const token = localStorage.getItem('token');
    fetch('/api/support/tickets', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load support tickets.');
        return res.json();
      })
      .then((data) => {
        setTickets(data);
        setLoadingTickets(false);
      })
      .catch((err) => {
        triggerToast(err.message, 'error');
        setLoadingTickets(false);
      });
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('token');

    fetch('/api/support/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        subject: `[${ticketForm.category}] ${ticketForm.subject}`,
        description: ticketForm.description,
        priority: ticketForm.priority
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to submit support ticket.');
        return res.json();
      })
      .then(() => {
        triggerToast('Support request submitted successfully. A representative will review it.');
        setTicketForm({ subject: '', category: 'Technical Inquiry', priority: 'Medium', description: '' });
        setSubmitting(false);
        fetchTickets(); // Refresh list
      })
      .catch((err) => {
        triggerToast(err.message, 'error');
        setSubmitting(false);
      });
  };

  return (
    <div className="flex h-screen bg-[#f4f7fc] overflow-hidden w-full font-sans antialiased text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
        <Navbar title="Help & Support Center" />

        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto space-y-6 flex-grow pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
            
            {/* Left Column: FAQ & Contact Form (col-span-7) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Accordion FAQs */}
              <div className="dashboard-card p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    🙋 Frequently Asked Questions
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Common inquiries regarding appointments, AI triage, and prescriptions</p>
                </div>

                <div className="space-y-2">
                  {faqs.map((faq, idx) => (
                    <div 
                      key={idx} 
                      className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50"
                    >
                      <button
                        onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                        className="w-full p-4 flex justify-between items-center text-left font-bold text-xs text-slate-700 hover:bg-slate-50 transition"
                      >
                        <span>{faq.q}</span>
                        <span className="text-indigo-500 font-extrabold text-base">
                          {faqOpen === idx ? '−' : '+'}
                        </span>
                      </button>
                      
                      <div 
                        className={`transition-all duration-300 overflow-hidden ${
                          faqOpen === idx ? 'max-h-40 border-t border-slate-100 p-4' : 'max-h-0'
                        }`}
                      >
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Ticket Form */}
              <form onSubmit={handleSubmitTicket} className="dashboard-card p-6 space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    ✉️ Contact Helpdesk Support
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Submit a clinical or technical ticket for administrator review</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Ticket Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Cannot resolve prescription barcode"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                      className="bg-slate-50/50 border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-semibold outline-none transition"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Category Routing</label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      className="bg-slate-50/50 border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-semibold outline-none transition cursor-pointer"
                    >
                      <option value="Technical Inquiry">Technical Inquiry</option>
                      <option value="Billing & Pricing">Billing & Pricing</option>
                      <option value="Clinical Feedback">Clinical Feedback</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Urgency Priority</label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                      className="bg-slate-50/50 border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-semibold outline-none transition cursor-pointer"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Case Description Details</label>
                    <textarea
                      rows="4"
                      placeholder="Describe your issue or concern in detail..."
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                      className="bg-slate-50/50 border border-slate-200 focus:border-indigo-400 rounded-xl p-3 text-xs font-semibold outline-none transition resize-none"
                      required
                    ></textarea>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-brand-sidebar hover:bg-brand-sidebarHover text-white transition-all text-xs font-bold rounded-xl shadow-md disabled:opacity-50 uppercase tracking-wider"
                >
                  {submitting ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </form>

            </div>

            {/* Right Column: Ticket Roster & Tracking (col-span-5) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="dashboard-card p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    ⏱️ Active Case Tickets
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Track resolution timelines of your submitted requests</p>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {loadingTickets ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">Loading tickets...</p>
                  ) : tickets.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">No support tickets submitted yet.</p>
                  ) : (
                    tickets.map((t) => (
                      <div 
                        key={t.id} 
                        className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 text-left space-y-3"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[9px] font-mono font-bold text-slate-400">#TCK-{String(t.id).padStart(3, '0')}</span>
                            <h4 className="text-xs font-bold text-slate-850 mt-0.5">{t.subject}</h4>
                          </div>
                          
                          <span className={`text-[8px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase shrink-0 ${
                            t.status === 'Resolved' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                              : t.status === 'In Progress' 
                                ? 'bg-amber-50 text-amber-700 border-amber-150' 
                                : 'bg-rose-50 text-rose-700 border-rose-150'
                          }`}>
                            {t.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                          {t.description}
                        </p>

                        <div className="flex justify-between items-center text-[9px] text-slate-400 pt-2 border-t border-slate-100/50">
                          <span className="font-bold">Priority: <strong className={`font-bold ${
                            t.priority === 'High' ? 'text-rose-500' : t.priority === 'Medium' ? 'text-amber-500' : 'text-slate-500'
                          }`}>{t.priority}</strong></span>
                          <span>Submitted: {t.createdAt}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

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

export default SupportPage;
