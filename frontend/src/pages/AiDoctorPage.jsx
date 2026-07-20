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

const INTAKE_CHECKLIST_SYMPTOMS = [
  'Fever',
  'Chest pain / tightness',
  'Shortness of breath',
  'Cough',
  'Headache / migraine',
  'Abdominal pain',
  'Nausea / vomiting',
  'Skin rash / itching',
  'Joint pain / swelling',
  'Dizziness / fainting'
];

const FAMILY_HISTORY_ITEMS = [
  'Heart disease',
  'Stroke',
  'High blood pressure',
  'Diabetes',
  'Cancer'
];

const AiDoctorPage = () => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [userInput, setUserInput] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState('1–3 days');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const [selectedDoctorProfile, setSelectedDoctorProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Intake Form State
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [intakeStep, setIntakeStep] = useState(1);
  const [intakeForm, setIntakeForm] = useState({
    patientInformation: {
      fullName: '',
      dateOfBirth: '',
      gender: '',
      contactNumber: '',
      emailAddress: '',
      homeAddress: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: ''
    },
    visitDetails: {
      reason: '',
      startDate: '',
      issueType: 'New'
    },
    currentSymptoms: {
      description: '',
      checklist: [],
      severity: 'Moderate',
      pattern: 'Continuous',
      otherSymptom: ''
    },
    currentHealthIssues: {
      hasDiagnosed: 'No',
      listConditions: '',
      hospitalAdmitted: 'No',
      hospitalReason: ''
    },
    pastMedicalHistory: {
      pastIllnesses: '',
      pastSurgeries: '',
      pastInjuries: '',
      previousHospitalizations: ''
    },
    medications: {
      hasMedicines: 'No',
      medicines: [],
      supplements: ''
    },
    allergiesSensitivities: {
      drugAllergies: '',
      foodAllergies: '',
      otherAllergies: '',
      reactionType: ''
    },
    lifestyleRiskFactors: {
      smokingStatus: 'Never',
      alcoholUse: 'None',
      physicalActivity: 'Rare',
      sleepHours: '8',
      sleepQuality: 'Good',
      hasStress: 'No',
      stressDetails: ''
    },
    familyHistory: {
      historyChecklist: [],
      otherConditions: '',
      familyDetails: ''
    },
    additionalInformation: {
      pregnancyStatus: 'Not applicable',
      devicesImplants: '',
      labTestsScans: '',
      notes: ''
    },
    consentPreferences: {
      consentStoreCareAnalytics: false,
      consentAISharing: false,
      preferredCommunication: 'Email'
    }
  });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Load Intake form from LocalStorage and Cloud Database
  useEffect(() => {
    const saved = localStorage.getItem('novacare_intake_form');
    if (saved) {
      try {
        setIntakeForm(JSON.parse(saved));
      } catch (e) {}
    }

    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/patient/intake-form', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.intake_form && Object.keys(data.intake_form).length > 0) {
            setIntakeForm(data.intake_form);
            localStorage.setItem('novacare_intake_form', JSON.stringify(data.intake_form));
          }
        })
        .catch(() => {});
    }
  }, []);

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
    const bodyPayload = { query: content.trim() };
    
    // Inject intake form context if consented to AI Sharing
    if (intakeForm.consentPreferences.consentAISharing) {
      bodyPayload.intake_form = intakeForm;
    }

    fetch('/api/ai/diagnose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bodyPayload)
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
          const list = [...prev, assistantMessage];
          if (data.condition) {
            list.push(diagnosisCard);
          }
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

  // Intake Form wizard helper functions
  const handleIntakeChange = (section, field, val) => {
    setIntakeForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: val
      }
    }));
  };

  const handleIntakeChecklist = (section, field, item) => {
    const list = [...intakeForm[section][field]];
    const idx = list.indexOf(item);
    if (idx === -1) {
      list.push(item);
    } else {
      list.splice(idx, 1);
    }
    handleIntakeChange(section, field, list);
  };

  const addMedicineRow = () => {
    const list = [...intakeForm.medications.medicines, { name: '', dose: '', frequency: '', since: '' }];
    handleIntakeChange('medications', 'medicines', list);
  };

  const removeMedicineRow = (idx) => {
    const list = [...intakeForm.medications.medicines];
    list.splice(idx, 1);
    handleIntakeChange('medications', 'medicines', list);
  };

  const handleMedicineChange = (idx, key, val) => {
    const list = [...intakeForm.medications.medicines];
    list[idx] = { ...list[idx], [key]: val };
    handleIntakeChange('medications', 'medicines', list);
  };

  const handleSaveIntakeForm = () => {
    localStorage.setItem('novacare_intake_form', JSON.stringify(intakeForm));

    const token = localStorage.getItem('token');
    if (token && intakeForm.consentPreferences.consentStoreCareAnalytics) {
      fetch('/api/patient/intake-form', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ intake_form: intakeForm })
      })
        .then(res => {
          if (!res.ok) throw new Error('Could not upload history to cloud repository.');
          return res.json();
        })
        .then(() => {
          triggerToast('Intake health form synchronized successfully.', 'success');
          setIsIntakeOpen(false);
        })
        .catch(err => {
          triggerToast(err.message, 'error');
        });
    } else {
      triggerToast('Intake health form saved locally on your device.', 'success');
      setIsIntakeOpen(false);
    }
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
            <div className="dashboard-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <span className="text-xl">🤖</span>
                </div>
                <div className="text-left">
                  <h2 className="text-xs font-extrabold text-slate-900 leading-tight">MedGemma AI</h2>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Online · NovaCare Engine</p>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            {/* Intake Health Profile Card */}
            <div className="dashboard-card p-4 bg-gradient-to-tr from-indigo-50/50 to-white border border-indigo-100/60 flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Structured Intake</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Device profile for AI & Doctor reviews</p>
              </div>
              <button 
                onClick={() => { setIntakeStep(1); setIsIntakeOpen(true); }}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold border border-indigo-150 transition uppercase tracking-wider shadow-sm"
              >
                <i className="fa-solid fa-file-invoice-medical mr-1 text-[11px]"></i> Wizard
              </button>
            </div>

            {/* Body System Selector */}
            <div className="dashboard-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-left">Body System</h3>
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
                    <span className="leading-none text-[11px]">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Symptom Description */}
            <div className="dashboard-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-left">Symptom Description</h3>
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
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-left">Duration</h3>
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
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white cursor-pointer shadow-indigo-600/10'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50'
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
              <div className="flex items-center gap-2">
                {intakeForm.consentPreferences.consentAISharing && (
                  <span className="text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-extrabold px-2 py-1 rounded-lg uppercase tracking-wider">
                    ✓ History shared
                  </span>
                )}
                <button
                  onClick={() => setMessages(INITIAL_MESSAGES)}
                  className="text-[10px] font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg transition"
                >
                  Clear Chat
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 items-end ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm shadow-sm ${
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-violet-500 to-indigo-600'
                      : 'bg-brand-sidebar'
                  }`}>
                    {msg.role === 'assistant' ? '🤖' : '👤'}
                  </div>

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
                  className="text-[10px] font-bold px-3 py-1.5 bg-indigo-50 text-indigo-650 border border-indigo-100 rounded-full whitespace-nowrap hover:bg-indigo-100 transition flex-shrink-0"
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
                  className="flex-1 bg-transparent text-xs text-slate-700 font-medium resize-none outline-none px-2 py-2.5 leading-relaxed max-h-24 overflow-y-auto placeholder-slate-450"
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
              <p className="text-[9px] text-slate-450 font-semibold mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
            </div>

          </div>
        </div>
      </div>

      {/* Multi-Step Intake Wizard Modal */}
      {isIntakeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 text-left">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <i className="fa-solid fa-file-medical text-indigo-600"></i> Intake Health History Wizard
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">NovaCare Clinical Profile Portal</p>
              </div>
              <button 
                onClick={() => setIsIntakeOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all text-sm border border-slate-150"
              >
                ✕
              </button>
            </div>

            {/* Wizard Steps Navigation */}
            <div className="bg-slate-50/70 border-b border-slate-100 px-6 py-3.5 flex justify-between gap-1 overflow-x-auto flex-shrink-0">
              {[
                { step: 1, label: '1. Profile Info' },
                { step: 2, label: '2. Today\'s Visit' },
                { step: 3, label: '3. Conditions' },
                { step: 4, label: '4. Medications' },
                { step: 5, label: '5. Lifestyle' },
                { step: 6, label: '6. Consent' }
              ].map(s => (
                <button
                  key={s.step}
                  onClick={() => setIntakeStep(s.step)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${
                    intakeStep === s.step 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Step Content Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              
              {/* Step 1: Patient Information */}
              {intakeStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1">1. Patient Demographic Profile</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Full Name</label>
                      <input 
                        type="text"
                        value={intakeForm.patientInformation.fullName}
                        onChange={e => handleIntakeChange('patientInformation', 'fullName', e.target.value)}
                        placeholder="John Doe"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Date of Birth</label>
                      <input 
                        type="date"
                        value={intakeForm.patientInformation.dateOfBirth}
                        onChange={e => handleIntakeChange('patientInformation', 'dateOfBirth', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Gender</label>
                      <select 
                        value={intakeForm.patientInformation.gender}
                        onChange={e => handleIntakeChange('patientInformation', 'gender', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition font-semibold"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Contact Number</label>
                      <input 
                        type="text"
                        value={intakeForm.patientInformation.contactNumber}
                        onChange={e => handleIntakeChange('patientInformation', 'contactNumber', e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Email Address</label>
                      <input 
                        type="email"
                        value={intakeForm.patientInformation.emailAddress}
                        onChange={e => handleIntakeChange('patientInformation', 'emailAddress', e.target.value)}
                        placeholder="john.doe@example.com"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Home Address</label>
                      <input 
                        type="text"
                        value={intakeForm.patientInformation.homeAddress}
                        onChange={e => handleIntakeChange('patientInformation', 'homeAddress', e.target.value)}
                        placeholder="123 Health Ave, St. Jude, NY"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                  </div>

                  <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pt-2 border-b border-slate-50 pb-1">Emergency contact</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Contact Name</label>
                      <input 
                        type="text"
                        value={intakeForm.patientInformation.emergencyContactName}
                        onChange={e => handleIntakeChange('patientInformation', 'emergencyContactName', e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Contact Phone</label>
                      <input 
                        type="text"
                        value={intakeForm.patientInformation.emergencyContactPhone}
                        onChange={e => handleIntakeChange('patientInformation', 'emergencyContactPhone', e.target.value)}
                        placeholder="+1 (555) 111-2222"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Relationship</label>
                      <input 
                        type="text"
                        value={intakeForm.patientInformation.emergencyContactRelationship}
                        onChange={e => handleIntakeChange('patientInformation', 'emergencyContactRelationship', e.target.value)}
                        placeholder="Spouse / Parent / Sibling"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Visit & Symptom Details */}
              {intakeStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1 font-bold">2. Visit Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Reason for Today's Visit</label>
                      <input 
                        type="text"
                        value={intakeForm.visitDetails.reason}
                        onChange={e => handleIntakeChange('visitDetails', 'reason', e.target.value)}
                        placeholder="Routine physical screening checkup, symptom checking..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Onset Date / Timeline</label>
                      <input 
                        type="text"
                        value={intakeForm.visitDetails.startDate}
                        onChange={e => handleIntakeChange('visitDetails', 'startDate', e.target.value)}
                        placeholder="e.g. 3 days ago"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Issue Type</label>
                      <div className="flex gap-2">
                        {['New', 'Follow-up'].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleIntakeChange('visitDetails', 'issueType', opt)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition ${
                              intakeForm.visitDetails.issueType === opt 
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-650'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pt-2 border-b border-slate-50 pb-1">3. Current Symptoms Checklist</h5>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Symptom Description (In Your Own Words)</label>
                      <textarea 
                        value={intakeForm.currentSymptoms.description}
                        onChange={e => handleIntakeChange('currentSymptoms', 'description', e.target.value)}
                        placeholder="Explain the sensation, location, pain scale details..."
                        className="w-full h-20 p-3 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none resize-none transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Select Experienced Symptoms</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {INTAKE_CHECKLIST_SYMPTOMS.map(sym => (
                          <button
                            key={sym}
                            type="button"
                            onClick={() => handleIntakeChecklist('currentSymptoms', 'checklist', sym)}
                            className={`p-2.5 rounded-xl border text-[11px] font-semibold text-left transition flex items-center justify-between ${
                              intakeForm.currentSymptoms.checklist.includes(sym)
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                                : 'bg-slate-50 border-slate-100 text-slate-650 hover:bg-slate-100'
                            }`}
                          >
                            <span>{sym}</span>
                            {intakeForm.currentSymptoms.checklist.includes(sym) && <span className="text-indigo-600 font-extrabold text-xs">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase">Other Symptom Details</label>
                        <input 
                          type="text"
                          value={intakeForm.currentSymptoms.otherSymptom}
                          onChange={e => handleIntakeChange('currentSymptoms', 'otherSymptom', e.target.value)}
                          placeholder="List any others..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase">Symptom Severity</label>
                        <select 
                          value={intakeForm.currentSymptoms.severity}
                          onChange={e => handleIntakeChange('currentSymptoms', 'severity', e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition font-semibold"
                        >
                          <option value="Mild">Mild</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Severe">Severe</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase">Pattern</label>
                        <select 
                          value={intakeForm.currentSymptoms.pattern}
                          onChange={e => handleIntakeChange('currentSymptoms', 'pattern', e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition font-semibold"
                        >
                          <option value="Continuous">Continuous</option>
                          <option value="Comes and goes">Comes and goes</option>
                          <option value="Getting worse">Getting worse</option>
                          <option value="Getting better">Getting better</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Current & Past History */}
              {intakeStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1">4. Current Health Conditions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Diagnosed Health Conditions?</label>
                      <div className="flex gap-2">
                        {['Yes', 'No'].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleIntakeChange('currentHealthIssues', 'hasDiagnosed', opt)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition ${
                              intakeForm.currentHealthIssues.hasDiagnosed === opt 
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-650'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    {intakeForm.currentHealthIssues.hasDiagnosed === 'Yes' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase">List Diagnosed Conditions</label>
                        <input 
                          type="text"
                          value={intakeForm.currentHealthIssues.listConditions}
                          onChange={e => handleIntakeChange('currentHealthIssues', 'listConditions', e.target.value)}
                          placeholder="e.g. hypertension, type 2 diabetes"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Recent emergency or hospital admission?</label>
                      <div className="flex gap-2">
                        {['Yes', 'No'].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleIntakeChange('currentHealthIssues', 'hospitalAdmitted', opt)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition ${
                              intakeForm.currentHealthIssues.hospitalAdmitted === opt 
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-650'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    {intakeForm.currentHealthIssues.hospitalAdmitted === 'Yes' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase">Admittance Reason & Approx Date</label>
                        <input 
                          type="text"
                          value={intakeForm.currentHealthIssues.hospitalReason}
                          onChange={e => handleIntakeChange('currentHealthIssues', 'hospitalReason', e.target.value)}
                          placeholder="e.g. asthma crisis in June 2026"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                        />
                      </div>
                    )}
                  </div>

                  <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pt-2 border-b border-slate-50 pb-1">5. Past Medical History</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Past Illnesses / Major Diseases</label>
                      <input 
                        type="text"
                        value={intakeForm.pastMedicalHistory.pastIllnesses}
                        onChange={e => handleIntakeChange('pastMedicalHistory', 'pastIllnesses', e.target.value)}
                        placeholder="e.g. childhood asthma, pneumonia"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Past Surgeries or Procedures (Name & Year)</label>
                      <input 
                        type="text"
                        value={intakeForm.pastMedicalHistory.pastSurgeries}
                        onChange={e => handleIntakeChange('pastMedicalHistory', 'pastSurgeries', e.target.value)}
                        placeholder="e.g. appendectomy (2020)"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Past Injuries (Fractures, Head Trauma, etc.)</label>
                      <input 
                        type="text"
                        value={intakeForm.pastMedicalHistory.pastInjuries}
                        onChange={e => handleIntakeChange('pastMedicalHistory', 'pastInjuries', e.target.value)}
                        placeholder="e.g. broken left arm (2018)"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Previous Hospitalizations (Reason & Year)</label>
                      <input 
                        type="text"
                        value={intakeForm.pastMedicalHistory.previousHospitalizations}
                        onChange={e => handleIntakeChange('pastMedicalHistory', 'previousHospitalizations', e.target.value)}
                        placeholder="e.g. severe dehydration (2022)"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Medications & Allergies */}
              {intakeStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1">6. Medications & Supplements</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Are you taking any medications?</label>
                      <div className="flex gap-2 w-32">
                        {['Yes', 'No'].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleIntakeChange('medications', 'hasMedicines', opt)}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${
                              intakeForm.medications.hasMedicines === opt 
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-655'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {intakeForm.medications.hasMedicines === 'Yes' && (
                      <div className="space-y-2 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                        {intakeForm.medications.medicines.map((med, idx) => (
                          <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center bg-white border border-slate-200 p-2.5 rounded-xl">
                            <input 
                              type="text" 
                              value={med.name} 
                              onChange={e => handleMedicineChange(idx, 'name', e.target.value)} 
                              placeholder="Name (e.g. Paracetamol)" 
                              className="p-2 border border-slate-200 rounded-lg text-xs outline-none"
                            />
                            <input 
                              type="text" 
                              value={med.dose} 
                              onChange={e => handleMedicineChange(idx, 'dose', e.target.value)} 
                              placeholder="Dose (e.g. 500mg)" 
                              className="p-2 border border-slate-200 rounded-lg text-xs outline-none"
                            />
                            <input 
                              type="text" 
                              value={med.frequency} 
                              onChange={e => handleMedicineChange(idx, 'frequency', e.target.value)} 
                              placeholder="Frequency (e.g. Twice Daily)" 
                              className="p-2 border border-slate-200 rounded-lg text-xs outline-none"
                            />
                            <div className="flex gap-1">
                              <input 
                                type="text" 
                                value={med.since} 
                                onChange={e => handleMedicineChange(idx, 'since', e.target.value)} 
                                placeholder="Since" 
                                className="p-2 border border-slate-200 rounded-lg text-xs outline-none flex-1"
                              />
                              <button 
                                type="button" 
                                onClick={() => removeMedicineRow(idx)}
                                className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addMedicineRow}
                          className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 uppercase tracking-wider"
                        >
                          + Add Medicine
                        </button>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Over-the-counter or herbal supplements</label>
                      <input 
                        type="text"
                        value={intakeForm.medications.supplements}
                        onChange={e => handleIntakeChange('medications', 'supplements', e.target.value)}
                        placeholder="Vitamins, Ayurvedic, Homeopathic details..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                  </div>

                  <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pt-2 border-b border-slate-50 pb-1">7. Allergies & Sensitivities</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Drug Allergies (e.g. penicillin, aspirin)</label>
                      <input 
                        type="text"
                        value={intakeForm.allergiesSensitivities.drugAllergies}
                        onChange={e => handleIntakeChange('allergiesSensitivities', 'drugAllergies', e.target.value)}
                        placeholder="List allergens..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Food Allergies (e.g. peanuts, dairy)</label>
                      <input 
                        type="text"
                        value={intakeForm.allergiesSensitivities.foodAllergies}
                        onChange={e => handleIntakeChange('allergiesSensitivities', 'foodAllergies', e.target.value)}
                        placeholder="List allergens..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Other Allergies (e.g. pollen, latex)</label>
                      <input 
                        type="text"
                        value={intakeForm.allergiesSensitivities.otherAllergies}
                        onChange={e => handleIntakeChange('allergiesSensitivities', 'otherAllergies', e.target.value)}
                        placeholder="List allergens..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Type of Reaction (rash, breathing difficulty)</label>
                      <input 
                        type="text"
                        value={intakeForm.allergiesSensitivities.reactionType}
                        onChange={e => handleIntakeChange('allergiesSensitivities', 'reactionType', e.target.value)}
                        placeholder="Describe reaction details..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Lifestyle, Family & Implants */}
              {intakeStep === 5 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1">8. Lifestyle & Risk Factors</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Smoking Status</label>
                      <select 
                        value={intakeForm.lifestyleRiskFactors.smokingStatus}
                        onChange={e => handleIntakeChange('lifestyleRiskFactors', 'smokingStatus', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition font-semibold"
                      >
                        <option value="Never">Never</option>
                        <option value="Former">Former</option>
                        <option value="Current (Light)">Current (Light)</option>
                        <option value="Current (Heavy)">Current (Heavy)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Alcohol Use</label>
                      <select 
                        value={intakeForm.lifestyleRiskFactors.alcoholUse}
                        onChange={e => handleIntakeChange('lifestyleRiskFactors', 'alcoholUse', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition font-semibold"
                      >
                        <option value="None">None</option>
                        <option value="Occasional">Occasional</option>
                        <option value="Regular">Regular</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Physical Activity</label>
                      <select 
                        value={intakeForm.lifestyleRiskFactors.physicalActivity}
                        onChange={e => handleIntakeChange('lifestyleRiskFactors', 'physicalActivity', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition font-semibold"
                      >
                        <option value="Rare">Rare</option>
                        <option value="1–2 times per week">1–2 times per week</option>
                        <option value="3+ times per week">3+ times per week</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase">Sleep Hours</label>
                        <input 
                          type="number"
                          value={intakeForm.lifestyleRiskFactors.sleepHours}
                          onChange={e => handleIntakeChange('lifestyleRiskFactors', 'sleepHours', e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase">Sleep Quality</label>
                        <select 
                          value={intakeForm.lifestyleRiskFactors.sleepQuality}
                          onChange={e => handleIntakeChange('lifestyleRiskFactors', 'sleepQuality', e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition font-semibold"
                        >
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Recent Major Stress?</label>
                      <div className="flex gap-2">
                        {['Yes', 'No'].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleIntakeChange('lifestyleRiskFactors', 'hasStress', opt)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition ${
                              intakeForm.lifestyleRiskFactors.hasStress === opt 
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-655'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    {intakeForm.lifestyleRiskFactors.hasStress === 'Yes' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase">Brief Stress Explanation</label>
                        <input 
                          type="text"
                          value={intakeForm.lifestyleRiskFactors.stressDetails}
                          onChange={e => handleIntakeChange('lifestyleRiskFactors', 'stressDetails', e.target.value)}
                          placeholder="Exam pressure, job changes..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                        />
                      </div>
                    )}
                  </div>

                  <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pt-2 border-b border-slate-50 pb-1">9. Family History</h5>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Select Conditions in Family History</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {FAMILY_HISTORY_ITEMS.map(item => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleIntakeChecklist('familyHistory', 'historyChecklist', item)}
                            className={`p-2.5 rounded-xl border text-[11px] font-semibold text-left transition flex items-center justify-between ${
                              intakeForm.familyHistory.historyChecklist.includes(item)
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                                : 'bg-slate-50 border-slate-100 text-slate-650 hover:bg-slate-100'
                            }`}
                          >
                            <span>{item}</span>
                            {intakeForm.familyHistory.historyChecklist.includes(item) && <span className="text-indigo-600 font-extrabold text-xs">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase">Other Inherited Conditions</label>
                        <input 
                          type="text"
                          value={intakeForm.familyHistory.otherConditions}
                          onChange={e => handleIntakeChange('familyHistory', 'otherConditions', e.target.value)}
                          placeholder="List any others..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase">Specific Details (Relation & Onset Age)</label>
                        <input 
                          type="text"
                          value={intakeForm.familyHistory.familyDetails}
                          onChange={e => handleIntakeChange('familyHistory', 'familyDetails', e.target.value)}
                          placeholder="e.g. Father diagnosed with diabetes at 45"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pt-2 border-b border-slate-50 pb-1">10. Additional Clinical Information</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Pregnancy Status (if applicable)</label>
                      <select 
                        value={intakeForm.additionalInformation.pregnancyStatus}
                        onChange={e => handleIntakeChange('additionalInformation', 'pregnancyStatus', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition font-semibold"
                      >
                        <option value="Pregnant">Pregnant</option>
                        <option value="Planning pregnancy">Planning pregnancy</option>
                        <option value="Not applicable">Not applicable</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Devices or Implants (Pacemaker, Stents, etc.)</label>
                      <input 
                        type="text"
                        value={intakeForm.additionalInformation.devicesImplants}
                        onChange={e => handleIntakeChange('additionalInformation', 'devicesImplants', e.target.value)}
                        placeholder="List surgical implants..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Recent Lab Tests or Scans (Brief Description)</label>
                      <input 
                        type="text"
                        value={intakeForm.additionalInformation.labTestsScans}
                        onChange={e => handleIntakeChange('additionalInformation', 'labTestsScans', e.target.value)}
                        placeholder="e.g. Chest X-ray in March 2026"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Additional Notes for Clinician</label>
                      <input 
                        type="text"
                        value={intakeForm.additionalInformation.notes}
                        onChange={e => handleIntakeChange('additionalInformation', 'notes', e.target.value)}
                        placeholder="Anything else you want the doctor to know..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Consent & Preferences */}
              {intakeStep === 6 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1">11. Consent & Preferences</h4>
                  
                  <div className="space-y-4 bg-slate-50 border border-slate-200/60 p-5 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox"
                        id="consentStoreCareAnalytics"
                        checked={intakeForm.consentPreferences.consentStoreCareAnalytics}
                        onChange={e => handleIntakeChange('consentPreferences', 'consentStoreCareAnalytics', e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-indigo-650 accent-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="consentStoreCareAnalytics" className="text-xs text-slate-700 font-semibold leading-relaxed cursor-pointer selection:bg-transparent">
                        I consent to use, store, and share my health information for clinical care and internal analytics. (Required to show this details directly to your consulting doctors)
                      </label>
                    </div>

                    <div className="flex items-start gap-3 pt-2 border-t border-slate-200/50">
                      <input 
                        type="checkbox"
                        id="consentAISharing"
                        checked={intakeForm.consentPreferences.consentAISharing}
                        onChange={e => handleIntakeChange('consentPreferences', 'consentAISharing', e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-indigo-650 accent-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="consentAISharing" className="text-xs text-slate-700 font-semibold leading-relaxed cursor-pointer selection:bg-transparent">
                        I consent for my data to be used by the MedGemma AI assistant to provide diagnostic guidance and self-care recommendations.
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1 w-full sm:w-1/2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase">Preferred Communication Method</label>
                    <select 
                      value={intakeForm.consentPreferences.preferredCommunication}
                      onChange={e => handleIntakeChange('consentPreferences', 'preferredCommunication', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition font-semibold"
                    >
                      <option value="Email">Email</option>
                      <option value="Phone">Phone</option>
                      <option value="SMS">SMS</option>
                      <option value="In-app notifications">In-app notifications</option>
                    </select>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div className="p-6 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
              <button
                type="button"
                disabled={intakeStep === 1}
                onClick={() => setIntakeStep(prev => prev - 1)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  intakeStep === 1 
                    ? 'bg-slate-55 text-slate-300 cursor-not-allowed' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-650'
                }`}
              >
                Previous
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsIntakeOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Close
                </button>
                {intakeStep < 6 ? (
                  <button
                    type="button"
                    onClick={() => setIntakeStep(prev => prev + 1)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/10"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveIntakeForm}
                    className="px-6 py-2 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/10 uppercase tracking-wider"
                  >
                    ✓ Save Form
                  </button>
                )}
              </div>
            </div>

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
