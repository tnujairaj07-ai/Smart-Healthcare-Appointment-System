import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

const SYSTEM_DOMAINS = [
  { key: 'respiratory', label: 'Respiratory', icon: '🫁' },
  { key: 'cardiovascular', label: 'Cardiovascular', icon: '❤️' },
  { key: 'nervous', label: 'Neurological', icon: '🧠' },
  { key: 'digestive', label: 'Digestive', icon: '🫀' },
  { key: 'musculoskeletal', label: 'Musculoskeletal', icon: '🦴' },
  { key: 'dermatology', label: 'Dermatology', icon: '🩹' },
];

const QUICK_SYMPTOMS = ['Fever', 'Chest pain', 'Cough', 'Shortness of breath', 'Headache', 'Fatigue', 'Nausea', 'Joint pain'];

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    content: 'Hello, I am **MedGemma**, your AI clinical assistant powered by NovaCare OS. I can help you evaluate symptoms, understand clinical findings, and provide evidence-based health guidance.\n\nPlease note: This is for educational and informational purposes only. Always consult a licensed healthcare professional for diagnosis and treatment.',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

const MOCK_AI_RESPONSES = [
  "Based on the symptoms you've described, there are a few possible explanations I can explore with you. Could you clarify how long you've been experiencing these symptoms, and whether they worsen at any particular time of day?",
  "Thank you for sharing those details. The combination of symptoms you've listed may be consistent with several conditions. A thorough physical examination by a physician would be important to rule out any serious underlying causes. In the meantime, rest adequately and stay hydrated.",
  "I'm analyzing your symptom pattern now. Based on typical presentations, I would recommend monitoring your temperature, maintaining adequate fluid intake, and seeking immediate medical attention if symptoms worsen or new ones appear — particularly difficulty breathing, chest pressure, or altered consciousness.",
  "That's a helpful clarification. Your described symptoms are commonly associated with viral upper respiratory tract infections during seasonal transitions. If fever persists beyond 3 days or you develop localized pain, imaging or laboratory workup may be warranted.",
  "I understand your concern. While I cannot diagnose, I can tell you this presentation warrants a clinical consultation within 24-48 hours. Please document the timing, intensity, and any aggravating or relieving factors to share with your physician.",
];

const AiDoctorPage = () => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [userInput, setUserInput] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState('1–3 days');
  const [isTyping, setIsTyping] = useState(false);
  const [analysisMode, setAnalysisMode] = useState(false);
  const chatEndRef = useRef(null);
  const [selectedDoctorProfile, setSelectedDoctorProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const openDoctorProfile = (id) => {
    setLoadingProfile(true);
    setShowDoctorModal(true);
    const token = localStorage.getItem('token');
    fetch(`/api/doctors/${id}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load doctor profile');
        return res.json();
      })
      .then((data) => {
        setSelectedDoctorProfile(data);
        setLoadingProfile(false);
      })
      .catch((err) => {
        triggerToast(err.message, 'error');
        setLoadingProfile(false);
        setShowDoctorModal(false);
      });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (content) => {
    if (!content.trim()) return;

    const userMessage = {
      role: 'user',
      content: content.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput('');
    setIsTyping(true);

    const token = localStorage.getItem('token');
    fetch('/api/ai/diagnose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: content.trim() })
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((errData) => {
            throw new Error(errData.error || 'Diagnostic evaluation failed.');
          });
        }
        return res.json();
      })
      .then((data) => {
        setIsTyping(false);
        const assistantMessage = {
          role: 'assistant',
          content: data.guidance,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const diagnosisCard = {
          role: 'assistant',
          type: 'diagnosis_card',
          data: {
            condition: data.condition,
            confidence: data.confidence,
            urgency: data.urgency,
            description: data.description,
            precautions: data.precautions
          },
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const doctorsCard = {
          role: 'assistant',
          type: 'doctors_card',
          data: {
            specialty: data.recommended_specialty,
            doctors: data.doctors
          },
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => {
          const list = [...prev, assistantMessage, diagnosisCard];
          if (data.doctors && data.doctors.length > 0) {
            list.push(doctorsCard);
          }
          return list;
        });
      })
      .catch((err) => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ **Diagnostic Evaluation Failed:** ${err.message}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      });
  };

  const handleSymptomAnalysis = () => {
    if (!symptoms.trim()) return;
    const prompt = `I am experiencing the following symptoms for ${duration}: ${symptoms}. Severity level: ${severity}/10. ${selectedDomain ? `Affected body system: ${selectedDomain}.` : ''} Please analyze this and provide clinical guidance.`;
    setAnalysisMode(false);
    sendMessage(prompt);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(userInput);
    }
  };

  const parseMarkdown = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="flex h-screen bg-[#f4f7fc] overflow-hidden w-full font-sans antialiased text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        <Navbar title="AI Doctor Assistant" />

        {/* WORKSPACE SPLIT LAYOUT */}
        <div className="flex-1 flex overflow-hidden p-4 md:p-6 gap-5">

          {/* LEFT: SYMPTOM INPUT PANEL */}
          <div className="w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">

            {/* AI Status Header */}
            <div className="dashboard-card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl">🤖</span>
              </div>
              <div className="text-left">
                <h2 className="text-sm font-extrabold text-slate-900">MedGemma AI</h2>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">via Ollama · NovaCare Engine</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-emerald-600">Model Online</span>
                </div>
              </div>
            </div>

            {/* Body System Selector */}
            <div className="dashboard-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Body System</h3>
              <div className="grid grid-cols-2 gap-2">
                {SYSTEM_DOMAINS.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDomain(selectedDomain === key ? null : key)}
                    className={`p-3 rounded-xl text-left transition border text-xs font-semibold flex items-center gap-2 ${
                      selectedDomain === key
                        ? 'bg-brand-sidebar border-indigo-400 text-white shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-lg">{icon}</span>
                    <span className="leading-none">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Symptom Description */}
            <div className="dashboard-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Symptom Description</h3>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms in detail... (e.g., sharp chest pain when inhaling, worsening over 2 days)"
                className="w-full h-28 p-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-xl text-xs text-slate-700 font-medium resize-none outline-none transition placeholder-slate-300"
              />
              <div className="flex flex-wrap gap-2">
                {QUICK_SYMPTOMS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSymptoms((prev) => prev ? `${prev}, ${s.toLowerCase()}` : s.toLowerCase())}
                    className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Slider */}
            <div className="dashboard-card p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Severity Level</h3>
                <span className={`text-sm font-extrabold px-2 py-0.5 rounded-lg ${
                  severity <= 3 ? 'text-emerald-600 bg-emerald-50' :
                  severity <= 6 ? 'text-amber-600 bg-amber-50' :
                  'text-rose-600 bg-rose-50'
                }`}>
                  {severity}/10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-bold px-0.5">
                <span>Mild</span><span>Moderate</span><span>Severe</span>
              </div>
            </div>

            {/* Duration */}
            <div className="dashboard-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Duration</h3>
              <div className="grid grid-cols-2 gap-2">
                {['< 1 day', '1–3 days', '4–7 days', '> 1 week'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                      duration === d
                        ? 'bg-brand-sidebar border-indigo-400 text-white shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleSymptomAnalysis}
              disabled={!symptoms.trim()}
              className={`w-full py-4 font-bold text-sm rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                symptoms.trim()
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>🔬</span> Analyze with MedGemma AI
            </button>

            {/* Disclaimer */}
            <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed px-2 pb-2">
              ⚕️ AI guidance is informational only. Consult a licensed physician for diagnosis and medical decisions.
            </p>
          </div>

          {/* RIGHT: CHAT PANEL */}
          <div className="flex-1 flex flex-col dashboard-card overflow-hidden">

            {/* Chat Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <span className="text-lg">🤖</span>
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-extrabold text-slate-900">MedGemma Conversation</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">AI-powered clinical assistant</p>
                </div>
              </div>
              <button
                onClick={() => setMessages(INITIAL_MESSAGES)}
                className="text-[10px] font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
              >
                Clear Chat
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 items-end ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm shadow-sm ${
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-violet-500 to-indigo-600'
                      : 'bg-brand-sidebar'
                  }`}>
                    {msg.role === 'assistant' ? '🤖' : '👤'}
                  </div>

                  {/* Bubble / Rich Cards */}
                  {msg.type === 'diagnosis_card' ? (
                    <div className="bg-white border border-indigo-100 rounded-2xl rounded-bl-sm p-5 shadow-sm max-w-[75%] text-left space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2 flex-wrap gap-2">
                        <div>
                          <span className="text-[9px] text-indigo-500 font-extrabold uppercase tracking-wider block">Identified Condition</span>
                          <h4 className="text-sm font-extrabold text-slate-900">{msg.data.condition}</h4>
                        </div>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                          msg.data.urgency === 'critical' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          msg.data.urgency === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                          msg.data.urgency === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {msg.data.urgency} Urgency
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Clinical Match Probability</span>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${msg.data.confidence}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-slate-700">{msg.data.confidence}%</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-650 font-medium leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        {msg.data.description}
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Clinical Precautions</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                          {msg.data.precautions.map((prec, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-2 p-2 bg-indigo-50/45 rounded-lg border border-indigo-100/30 text-[10px] text-indigo-700 font-bold">
                              <span>🛡️</span>
                              <span>{prec.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-[9px] text-slate-400 font-semibold">{msg.time}</p>
                    </div>
                  ) : msg.type === 'doctors_card' ? (
                    <div className="bg-white border border-indigo-100 rounded-2xl rounded-bl-sm p-5 shadow-sm max-w-[75%] text-left space-y-4">
                      <div className="border-b border-slate-100 pb-2">
                        <span className="text-[9px] text-indigo-500 font-extrabold uppercase tracking-wider block">Recommended Referrals</span>
                        <h4 className="text-sm font-extrabold text-slate-900">{msg.data.specialty} Specialists</h4>
                      </div>

                       <div className="space-y-3">
                        {msg.data.doctors.map((doc, dIdx) => (
                          <div key={dIdx} className="flex items-center justify-between p-3 bg-slate-50/60 rounded-xl border border-slate-100 gap-4 flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">🩺</span>
                              <div>
                                <h5 className="text-xs font-bold text-slate-800">{doc.name}</h5>
                                <p className="text-[9px] text-slate-400 mt-1 font-semibold">
                                  Rating: <span className="text-amber-500">★ {doc.rating}</span> · Exp: {doc.years_experience || 8} Yrs · Slots: {doc.availability}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openDoctorProfile(doc.id)}
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded-lg border border-indigo-150 uppercase tracking-wide cursor-pointer transition whitespace-nowrap"
                              >
                                View Profile
                              </button>
                              <Link
                                to={`/book-appointment?doctor_id=${doc.id}`}
                                className="px-2.5 py-1.5 bg-brand-sidebar hover:bg-brand-sidebarHover text-white text-[9px] font-bold rounded-lg transition-all shadow-sm uppercase tracking-wide whitespace-nowrap"
                              >
                                Book Now
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <p className="text-[9px] text-slate-400 font-semibold">{msg.time}</p>
                    </div>
                  ) : (
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm text-left ${
                      msg.role === 'user'
                        ? 'bg-brand-sidebar text-white rounded-br-sm'
                        : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'
                    }`}>
                      <p
                        className="text-xs leading-relaxed font-medium"
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                      />
                      <p className={`text-[9px] mt-1.5 font-semibold ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {msg.time}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3 items-end">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex-shrink-0 flex items-center justify-center text-sm shadow-sm">🤖</div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5 items-center h-4">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.18}s` }}
                        ></span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-5 py-3 border-t border-slate-100 flex gap-2 overflow-x-auto flex-shrink-0">
              {['What are possible diagnoses?', 'When should I see a doctor?', 'What tests should I get?', 'Common home remedies?'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="text-[10px] font-bold px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full whitespace-nowrap hover:bg-indigo-100 transition flex-shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-100 flex-shrink-0">
              <div className="flex items-end gap-3 bg-slate-50 border-2 border-transparent focus-within:border-indigo-400 focus-within:bg-white rounded-2xl transition p-2 pr-2.5">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask MedGemma anything about your symptoms, medications, or health concerns..."
                  rows={1}
                  className="flex-1 bg-transparent text-xs text-slate-700 font-medium resize-none outline-none px-2 py-2.5 leading-relaxed max-h-24 overflow-y-auto placeholder-slate-400"
                />
                <button
                  onClick={() => sendMessage(userInput)}
                  disabled={!userInput.trim() || isTyping}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    userInput.trim() && !isTyping
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <i className="fa-solid fa-paper-plane text-xs"></i>
                </button>
              </div>
              <p className="text-[9px] text-slate-400 font-semibold mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
            </div>

          </div>
        </div>
      </div>

      {/* Doctor Profile Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 text-left space-y-6">
            
            {loadingProfile ? (
              <div className="py-20 text-center space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-650 mx-auto"></div>
                <p className="text-sm text-slate-500 font-bold">Retrieving medical profile & patient reviews...</p>
              </div>
            ) : selectedDoctorProfile ? (
              <>
                {/* Header */}
                <div className="flex gap-5 border-b border-slate-100 pb-5 items-start">
                  <img
                    src={selectedDoctorProfile.avatar_url || 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=250'}
                    alt={selectedDoctorProfile.name}
                    className="w-20 h-20 rounded-2xl object-cover border border-slate-150 shadow-sm flex-shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-extrabold text-slate-900 leading-tight">{selectedDoctorProfile.name}</h3>
                      {selectedDoctorProfile.verified && (
                        <span className="bg-emerald-50 border border-emerald-150 text-emerald-700 text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-indigo-650 tracking-wide">{selectedDoctorProfile.specialty}</p>
                    <p className="text-[11px] text-slate-450 font-semibold">{selectedDoctorProfile.hospital}</p>
                    <div className="flex items-center gap-2 pt-1 text-xs font-extrabold text-slate-500 flex-wrap">
                      <span className="text-amber-500">★ {selectedDoctorProfile.rating.toFixed(1)}</span>
                      <span className="text-slate-300">|</span>
                      <span>{selectedDoctorProfile.years_experience} Years Experience</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold">{selectedDoctorProfile.duty_status}</span>
                    </div>
                  </div>
                </div>

                {/* About & Bio */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Biography</h4>
                  <p className="text-xs text-slate-650 leading-relaxed font-medium bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                    {selectedDoctorProfile.description}
                  </p>
                </div>

                {/* Grid Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1 text-left">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Clinic & Contact</span>
                    <p className="font-bold text-slate-800">📍 {selectedDoctorProfile.location}</p>
                    <p className="font-semibold text-slate-650">📞 {selectedDoctorProfile.phone}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1 text-left">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Languages & NPI</span>
                    <p className="font-bold text-slate-800">🗣️ {selectedDoctorProfile.languages}</p>
                    <p className="font-semibold text-slate-650">NPI Number: {selectedDoctorProfile.npi}</p>
                  </div>
                </div>

                {/* Patient Reviews Accordion */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Patient Reviews ({selectedDoctorProfile.reviews_count})</h4>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {selectedDoctorProfile.reviews && selectedDoctorProfile.reviews.length > 0 ? (
                      selectedDoctorProfile.reviews.map((rev, rIdx) => (
                        <div key={rIdx} className="p-4 bg-white border border-slate-150 rounded-2xl space-y-2 text-left shadow-sm">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <div>
                              <h5 className="text-xs font-bold text-slate-800">{rev.patient_name}</h5>
                              <p className="text-[9px] text-slate-400 font-semibold">{rev.date}</p>
                            </div>
                            <div className="flex gap-0.5 text-xs text-amber-500 font-bold">
                              {Array.from({ length: rev.rating }).map((_, starIdx) => (
                                <span key={starIdx}>★</span>
                              ))}
                              {Array.from({ length: 5 - rev.rating }).map((_, starIdx) => (
                                <span key={starIdx} className="text-slate-200">★</span>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 italic font-medium leading-normal">
                            "{rev.comment}"
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No patient testimonials found for this practitioner yet.</p>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setShowDoctorModal(false)}
                    className="flex-1 py-3.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-center cursor-pointer transition"
                  >
                    Close Profile
                  </button>
                  <Link
                    to={`/book-appointment?doctor_id=${selectedDoctorProfile.id}`}
                    className="flex-1 py-3.5 text-xs font-bold text-white bg-brand-sidebar hover:bg-brand-sidebarHover rounded-xl text-center shadow-lg shadow-indigo-650/15 uppercase tracking-wide"
                  >
                    Schedule Consultation
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400 italic">Could not load medical profile.</div>
            )}
          </div>
        </div>
      )}

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default AiDoctorPage;
