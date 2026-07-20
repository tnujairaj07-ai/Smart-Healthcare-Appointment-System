import React, { useState, useEffect, useRef } from 'react';

const DocAiAssistant = ({ appointments }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Welcome to the **NovaCare CDSS (Clinical Decision Support System)**. I am MedGemma AI configured in Doctor Mode, emphasizing evidence-based medicine, guidelines, and medical department contexts.\n\nSelect a patient to load their clinical chart as prompt context, or ask guideline questions directly.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientRecord, setPatientRecord] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [guidelines, setGuidelines] = useState([]);
  const [clinicalMode, setClinicalMode] = useState('Evidence-Based CDSS');
  const chatEndRef = useRef(null);

  // Filter unique patients from appointments
  const patients = [];
  const seenIds = new Set();
  appointments.forEach(a => {
    if (a.patient && !seenIds.has(a.patient.id)) {
      seenIds.add(a.patient.id);
      patients.push(a.patient);
    }
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    // Fetch RAG guidelines from backend
    fetch('/api/admin/rag')
      .then(res => res.ok ? res.json() : [])
      .then(data => setGuidelines(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedPatientId) {
      setPatientRecord(null);
      return;
    }
    // Fetch patient record details
    const token = localStorage.getItem('token');
    fetch(`/api/doctor/patients/${selectedPatientId}/records`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => setPatientRecord(data))
      .catch(() => {});
  }, [selectedPatientId]);

  const handleSend = (textToSend) => {
    const val = textToSend || userInput;
    if (!val.trim()) return;

    const userMsg = {
      role: 'user',
      content: val,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsTyping(true);

    const token = localStorage.getItem('token');
    
    // Construct patient context prompt if loaded
    let finalQuery = val;
    if (patientRecord) {
      const p = patientRecord.profile;
      const historySummary = patientRecord.history.map(h => `${h.date}: ${h.diagnosis} (${h.medications.map(m => m.name).join(', ')})`).join('\n');
      const symptomSummary = patientRecord.symptomHistory.map(s => `${s.date}: Symptoms: ${s.symptoms} (Severity: ${s.severity}/10)`).join('\n');
      
      finalQuery = `[PATIENT CONTEXT LOADED]
Patient: ${p.name}, DOB: ${p.dob}, Blood Type: ${p.bloodType}
Allergies: ${p.allergies}, Chronic Conditions: ${p.chronic}, Past Illnesses: ${p.pastIllnesses}

Prescription History:
${historySummary || 'None'}

Symptom Check History:
${symptomSummary || 'None'}

[CLINICAL MODE: ${clinicalMode}]
Doctor Question: ${val}`;
    } else {
      finalQuery = `[CLINICAL MODE: ${clinicalMode}]
Doctor Question: ${val}`;
    }

    // Call MedGemma diagnose / chat endpoint
    fetch('/api/ai/diagnose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: finalQuery })
    })
      .then(res => {
        if (!res.ok) throw new Error('Clinical diagnostic gateway error');
        return res.json();
      })
      .then(data => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.guidance || 'I have analyzed the query within the clinical RAG database boundaries. No specific symptoms detected. Ensure symptoms match FDA/ICD standards.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      })
      .catch(err => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `⚠️ **Clinical Gateway Error:** ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      });
  };

  const handleChip = (action) => {
    if (action === 'summary') {
      if (!patientRecord) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '⚠️ Please select a patient in the sidebar context manager before requesting a chart summary.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        return;
      }
      handleSend(`Draft a structured clinical consultation summary for patient ${patientRecord.profile.name}. Summarize their history, current symptom history, and notes.`);
    } else if (action === 'interactions') {
      if (!patientRecord) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '⚠️ Please select a patient in the sidebar context manager before requesting drug-drug checks.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        return;
      }
      handleSend(`Check for drug-drug or drug-allergy interactions for ${patientRecord.profile.name} considering their allergies (${patientRecord.profile.allergies}) and chronic conditions (${patientRecord.profile.chronic}).`);
    } else if (action === 'asthma') {
      handleSend('What is the standard GINA clinical escalation protocol for acute pediatric asthma control?');
    } else if (action === 'hypertension') {
      handleSend('What are the ACC/AHA guidelines for stage 1 hypertension drug management in patients with renal chronic diseases?');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 overflow-hidden h-[calc(100vh-140px)] p-1 text-slate-800">
      {/* Sidebar: Patient context & Clinical guidelines (col-span-4) */}
      <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">
        {/* Patient Context Select */}
        <div className="dashboard-card p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-3 text-left">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Patient Context Manager</h3>
          <div className="space-y-2">
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-150"
            >
              <option value="">-- No Active Context --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            
            {patientRecord ? (
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1.5 text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">👤 {patientRecord.profile.name}</p>
                <div className="text-[10px] text-slate-500 font-semibold space-y-0.5">
                  <p>Allergies: <span className="text-rose-600 font-bold">{patientRecord.profile.allergies}</span></p>
                  <p>Chronic: <span className="text-amber-700 font-bold">{patientRecord.profile.chronic}</span></p>
                  <p>Rx History: {patientRecord.history?.length || 0} issued</p>
                </div>
                <span className="inline-block text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-150 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider mt-1">
                  Context Enabled
                </span>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic">No patient details loaded. AI answers will be generic guidance.</p>
            )}
          </div>
        </div>

        {/* AI Modes Selector */}
        <div className="dashboard-card p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-3 text-left">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Clinical Reasoning Mode</h3>
          <div className="grid grid-cols-1 gap-2">
            {['Evidence-Based CDSS', 'Differential Diagnosis helper', 'Clinical Note Drafter'].map(mode => (
              <button
                key={mode}
                onClick={() => setClinicalMode(mode)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition ${
                  clinicalMode === mode 
                    ? 'bg-brand-sidebar border-indigo-400 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                }`}
              >
                {mode === 'Evidence-Based CDSS' ? '🛡️ ' : mode === 'Differential Diagnosis helper' ? '🔍 ' : '📝 '}
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* RAG Indexed Documents */}
        <div className="dashboard-card p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-3 text-left">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Indexed Guidelines (RAG)</h3>
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            {guidelines.length > 0 ? (
              guidelines.map(doc => (
                <div key={doc.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left">
                  <p className="text-[10px] font-bold text-slate-800 truncate" title={doc.filename}>📄 {doc.filename}</p>
                  <p className="text-[8px] text-slate-400 mt-0.5">{doc.category} · {doc.fileSize}</p>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-slate-400 italic">No guideline documents indexed. MedGemma will utilize base clinical weights.</p>
            )}
          </div>
        </div>
      </div>

      {/* Main chat interface (col-span-8) */}
      <div className="flex-1 flex flex-col dashboard-card bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        {/* Chat header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-base shadow-sm">
              🤖
            </div>
            <div className="text-left">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">MedGemma Assistant</h3>
              <p className="text-[9px] text-indigo-600 font-bold mt-0.5">{clinicalMode} · Model Online</p>
            </div>
          </div>
          <button
            onClick={() => setMessages([messages[0]])}
            className="text-[9px] font-extrabold px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg transition"
          >
            Clear Chat
          </button>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 items-end ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-7.5 h-7.5 rounded-xl flex-shrink-0 flex items-center justify-center text-xs shadow-sm ${
                msg.role === 'assistant' ? 'bg-gradient-to-br from-violet-500 to-indigo-650 text-white' : 'bg-brand-sidebar text-white'
              }`}>
                {msg.role === 'assistant' ? '🤖' : '🩺'}
              </div>

              <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm text-left ${
                msg.role === 'user'
                  ? 'bg-brand-sidebar text-white rounded-br-sm'
                  : 'bg-white border border-slate-150 text-slate-700 rounded-bl-sm font-medium leading-relaxed text-xs'
              }`}>
                <p 
                  className="text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br />')
                  }}
                />
                <p className={`text-[9px] mt-1.5 font-semibold ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3 items-end">
              <div className="w-7.5 h-7.5 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-650 text-white flex-shrink-0 flex items-center justify-center text-xs">🤖</div>
              <div className="bg-white border border-slate-150 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-slate-350 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.18}s` }}
                    ></span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Shortcuts / Prompt Chips */}
        <div className="px-4 py-2 border-t border-slate-100 flex gap-2 overflow-x-auto shrink-0 bg-slate-50/20">
          <button
            onClick={() => handleChip('summary')}
            className="text-[9.5px] font-extrabold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-full flex-shrink-0 transition"
          >
            📝 Draft Case Summary
          </button>
          <button
            onClick={() => handleChip('interactions')}
            className="text-[9.5px] font-extrabold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-full flex-shrink-0 transition"
          >
            🛡️ Check Drug Interactions
          </button>
          <button
            onClick={() => handleChip('asthma')}
            className="text-[9.5px] font-extrabold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-full flex-shrink-0 transition"
          >
            🫁 Asthma Escalation Guide
          </button>
          <button
            onClick={() => handleChip('hypertension')}
            className="text-[9.5px] font-extrabold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-full flex-shrink-0 transition"
          >
            ❤️ ACC/AHA Hypertension Guide
          </button>
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-slate-100 shrink-0 bg-white">
          <div className="flex items-end gap-3 bg-slate-50 border-2 border-transparent focus-within:border-indigo-400 focus-within:bg-white rounded-2xl transition p-2 pr-2.5">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Query clinical guidelines, drug profiles, or load patient context for charts summary..."
              rows={1}
              className="flex-1 bg-transparent text-xs text-slate-700 font-medium resize-none outline-none px-2 py-2 leading-relaxed max-h-24 overflow-y-auto placeholder-slate-400"
            />
            <button
              onClick={() => handleSend()}
              disabled={!userInput.trim() || isTyping}
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                userInput.trim() && !isTyping
                  ? 'bg-gradient-to-br from-violet-600 to-indigo-650 text-white shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <i className="fa-solid fa-paper-plane text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocAiAssistant;
