import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  // Countdown Timer state
  const [countdown, setCountdown] = useState({ days: '00', hours: '00', mins: '00', secs: '00' });

  // Comparison Tabs state
  const [comparisonTab, setComparisonTab] = useState('clinical');

  // Intake Simulator state
  const [simPatient, setSimPatient] = useState('chest'); // default selected Patient A

  // Notice Modal state
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  // Countdown timer logic
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 12);
    targetDate.setHours(targetDate.getHours() + 4);

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference <= 0) {
        clearInterval(interval);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        mins: String(minutes).padStart(2, '0'),
        secs: String(seconds).padStart(2, '0'),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const comparisonData = {
    clinical: {
      title: "Intake & Symptoms Flow Comparison",
      leftTitle: "NovaCare Health OS Workflow",
      leftPoints: [
        "Interactive intake: guiding users through structured symptom metrics.",
        "Dynamic risk tier score algorithm updates instantly upon patient intake.",
        "Automatic HIPAA compliant clinical pre-check logs compiled for matching physicians."
      ],
      rightTitle: "Legacy EHR Systems",
      rightPoints: [
        "Inconvenient paper-based intake clipboards or outdated unresponsive portals.",
        "No risk-tier calculation; staff must manually review stack of records.",
        "Doctors walk into consultations with no prior organized context."
      ]
    },
    booking: {
      title: "Clinical Matching & Booking Flow",
      leftTitle: "NovaCare Health OS Workflow",
      leftPoints: [
        "Match specialist recommendations automatically based on patient symptoms.",
        "Synchronized online scheduler: book visits in 2 simple taps.",
        "Continuous text & portal automated notifications with active intake instructions."
      ],
      rightTitle: "Legacy EHR Systems",
      rightPoints: [
        "Manual search lists with dozens of names and complex medical terms.",
        "Must call clinic hotlines during specific hours to coordinate booking calendar.",
        "Infrequent notifications leading to up to 28% consultation no-shows."
      ]
    },
    records: {
      title: "Vitals & Prescription System",
      leftTitle: "NovaCare Health OS Workflow",
      leftPoints: [
        "Integrated IoT vital feeds (Heart rate, SpO2, sleep cycle trends).",
        "One-touch QR-based prescription generation ready for immediate pharmacy pick-up.",
        "Family portal integration for sharing care prescriptions securely."
      ],
      rightTitle: "Legacy EHR Systems",
      rightPoints: [
        "Vitals are siloed on different hardware and never compiled contextually.",
        "Traditional paper slips or difficult portal downloads.",
        "Care records remain completely inaccessible to patient family caregivers."
      ]
    },
    analytics: {
      title: "Analytics & Clinical Insights",
      leftTitle: "NovaCare Health OS Workflow",
      leftPoints: [
        "Continuous health metric trend tracking across all visits.",
        "Interactive charting showing patient symptom adherence timelines.",
        "High-risk anomaly alert popups dynamically generated."
      ],
      rightTitle: "Legacy EHR Systems",
      rightPoints: [
        "Data logs are flat text formats with no comparative trend charts.",
        "Adherence tracking is purely anecdotal and relies on patient memory.",
        "No early alerts for physiological trend anomalies."
      ]
    }
  };

  const intakeSims = {
    chest: {
      badge: "Emergency Tier 1",
      badgeColor: "bg-rose-500 text-white",
      triage: "🔥 Critical High Alert (Score: 92/100)",
      match: "Dr. Catherine Ross (Consultant Cardiologist)",
      summary: "Patient reported acute chest tightness and radiating left arm pain over last 2 hours. Auto-assigned to critical cardiology triage queue. Telehealth pre-consult active. FHIR JSON payload packet broadcasted to local emergency clinical unit immediately."
    },
    migraine: {
      badge: "Tier 2 Clinical Urgent",
      badgeColor: "bg-amber-500 text-white",
      triage: "⚠️ Urgent Care Required (Score: 68/100)",
      match: "Dr. Marcus Vance (Neurology Lead)",
      summary: "Severe migraine with aura and high light sensitivity. Intake system triggered medication compliance evaluation logs and pre-reserved a neurology consultation slot within next 2 hours."
    },
    allergy: {
      badge: "Tier 3 Standard Care",
      badgeColor: "bg-sky-500 text-white",
      triage: "✓ Stable Routine Action (Score: 35/100)",
      match: "Dr. Sarah Jenkins (Immunology Resident)",
      summary: "Mild skin itching and seasonal allergic flareup. Intake system matched matching physician, suggested standard antihistamine records, and generated a QR prescription draft waiting for doctor signature."
    }
  };

  return (
    <div className="font-sans antialiased text-slate-800 premium-bg min-h-screen relative overflow-x-hidden">
      
      {/* TOP PROMOTIONAL TIMER BANNER */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs sm:text-sm py-2 px-4 text-center font-medium flex items-center justify-center gap-3">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          NovaCare OS v2.0 Beta launches in:
        </span>
        <div className="flex gap-2 font-mono bg-white/15 px-2 py-0.5 rounded text-white text-xs">
          <span>{countdown.days}</span>d : 
          <span>{countdown.hours}</span>h : 
          <span>{countdown.mins}</span>m : 
          <span>{countdown.secs}</span>s
        </div>
        <a href="#demo-sandbox" className="underline hover:text-indigo-100 transition-colors hidden md:inline-block">Try Live Sandbox ↓</a>
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-10 md:h-10 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/60 flex items-center justify-center overflow-hidden">
              <span className="text-xl font-extrabold text-brand-500 font-serif">N</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-lg">NovaCare</span>
              <span className="text-xs block text-slate-500 -mt-1 font-semibold tracking-wider">HEALTH OS</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#overview" className="hover:text-brand-600 transition-colors">Overview</a>
            <Link to="/patient" className="hover:text-brand-600 transition-colors">Patient Portal</Link>
            <Link to="/doctor" className="hover:text-brand-600 transition-colors">Doctor Portal</Link>
            <Link to="/analytics" className="hover:text-brand-600 transition-colors">Analytics</Link>
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline-block text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 uppercase tracking-wide">
              🏥 System Active
            </span>
            <Link to="/login" className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-brand-500/20 transition-all transform hover:-translate-y-0.5">
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="overview" className="relative pt-12 pb-24 lg:pt-20">
        <div className="absolute inset-0 bg-slate-900/5 -z-10 bg-radial-gradient"></div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Copy */}
            <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping"></span>
                Intelligent Clinical Workspace
              </div>
            
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-slate-900 leading-[1.15] font-semibold">
                One calm workspace <br className="hidden sm:inline" />
                for patients, doctors, <br className="hidden sm:inline" />
                <span className="text-brand-600 italic font-normal">and clinical insights.</span>
              </h1>
            
              <p className="text-slate-600 text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                NovaCare OS brings symptom analysis, scheduling, live vitals tracking, and prescription management into a beautiful unified application. Built to reduce patient anxiety and clinical burnout.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to="/patient" className="w-full sm:w-auto text-center bg-brand-500 hover:bg-brand-600 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-0.5">
                  Open patient dashboard
                </Link>
                <Link to="/analytics" className="w-full sm:w-auto text-center bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-8 py-4 rounded-2xl shadow-sm transition-all">
                  View analytics
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-slate-500 pt-4">
                <span className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> HIPAA Compliant Cloud
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> FHIR API Integration
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> EHR Compatibility
                </span>
              </div>
            </div>

            {/* Hero Visuals Collage */}
            <div className="lg:col-span-6 relative h-[450px] sm:h-[550px] w-full mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-100/40 to-medical-50/60 rounded-full blur-3xl filter -z-10 transform scale-90"></div>

              {/* Float Card 1: Main Patient Dashboard Preview */}
              <div className="absolute top-0 left-0 w-[78%] bg-white rounded-2xl floating-shadow border border-slate-100/80 p-5 transform hover:scale-[1.02] transition-transform duration-300 z-20">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm">👤</div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800">Alexander Vance</h4>
                      <p className="text-[10px] text-slate-400">ID: #NV-83029</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 uppercase">Stable</span>
                </div>
              
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Heart Rate</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-extrabold text-slate-800 tracking-tight">72</span>
                      <span className="text-xs font-semibold text-slate-400">bpm</span>
                    </div>
                    <svg className="w-full h-5 mt-2 text-rose-500" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M0 10 h20 l5 -10 l5 20 l5 -15 l3 5 h42" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Oxygen Sat</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-extrabold text-slate-800 tracking-tight">98%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{width: '98%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Float Card 2: Interactive Appointment Booking Tool */}
              <div className="absolute right-0 top-1/4 w-[65%] bg-white rounded-2xl floating-shadow border border-slate-100 p-5 transform hover:scale-[1.02] transition-transform duration-300 z-30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-lg">🩺</div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">Primary Care Matching</h4>
                    <p className="text-[10px] text-slate-400">Next slots tomorrow</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-brand-50/50 border border-brand-100/50">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Dr. Helena Ross</p>
                      <p className="text-[9px] text-slate-400">Cardiology Specialist</p>
                    </div>
                    <button className="text-[10px] bg-brand-500 text-white px-2.5 py-1 rounded font-extrabold">Book</button>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Dr. Marcus Vance</p>
                      <p className="text-[9px] text-slate-400">Family Medicine</p>
                    </div>
                    <button className="text-[10px] bg-slate-200 text-slate-600 px-2.5 py-1 rounded font-extrabold">Book</button>
                  </div>
                </div>
              </div>

              {/* Float Card 3: Secure QR Prescription */}
              <div className="absolute bottom-4 left-6 w-[55%] bg-white rounded-2xl floating-shadow border border-slate-100/80 p-4 transform hover:scale-[1.02] transition-transform duration-300 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-sm">💊</div>
                  <div className="flex-1">
                    <div className="h-2 bg-slate-200 rounded-full w-20 mb-1"></div>
                    <div className="h-1.5 bg-slate-100 rounded-full w-28"></div>
                  </div>
                  <div className="w-8 h-8 bg-slate-900 rounded p-0.5 flex flex-wrap gap-[2px]">
                    <div className="w-2.5 h-2.5 bg-white m-0.5"></div>
                    <div className="w-2.5 h-2.5 bg-white m-0.5"></div>
                    <div className="w-2.5 h-2.5 bg-white m-0.5"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* COMPARISON SECTION */}
      <section id="comparison" className="bg-slate-50 border-y border-slate-100 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-brand-600 text-xs font-bold uppercase tracking-widest">A Better Architecture</p>
            <h2 className="text-3xl sm:text-4xl font-serif text-slate-900 mt-2 font-semibold">
              How does NovaCare OS compare to legacy medical systems?
            </h2>
            <p className="text-slate-500 mt-4 text-sm sm:text-base">
              Legacy platforms are cluttered and slow down patient-provider interactions. Here is how NovaCare OS completely redefines the clinical journey.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar Navigation Tabs */}
            <div className="lg:col-span-4 space-y-2">
              {Object.keys(comparisonData).map((key) => (
                <button 
                  key={key}
                  onClick={() => setComparisonTab(key)} 
                  className={`w-full text-left p-4 rounded-xl font-bold transition-all border text-sm flex justify-between items-center ${
                    comparisonTab === key 
                      ? 'bg-white border-slate-200 text-slate-800 shadow-sm' 
                      : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{key === 'clinical' ? 'Symptom Checker & Intake' : key === 'booking' ? 'Doctor Matching & Booking' : key === 'records' ? 'Prescriptions & Vitals' : 'Outcomes & Analytics'}</span>
                  <span className={comparisonTab === key ? 'text-brand-600' : 'opacity-0'}>→</span>
                </button>
              ))}
            </div>

            {/* Comparative Display Card */}
            <div className="lg:col-span-8 bg-white rounded-3xl soft-shadow border border-slate-100 p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 pb-2 mb-2 border-b border-slate-100">
                  <h4 className="text-lg font-bold text-slate-900">{comparisonData[comparisonTab].title}</h4>
                </div>
                
                {/* Left Side: NovaCare */}
                <div className="space-y-4">
                  <h5 className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {comparisonData[comparisonTab].leftTitle}
                  </h5>
                  <ul className="space-y-3">
                    {comparisonData[comparisonTab].leftPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right Side: Legacy */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
                  <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    {comparisonData[comparisonTab].rightTitle}
                  </h5>
                  <ul className="space-y-3">
                    {comparisonData[comparisonTab].rightPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
                        <span className="text-rose-400 font-bold mt-0.5">✕</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE LIVE SIMULATOR SANDBOX */}
      <section id="demo-sandbox" className="py-24 max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-tr from-slate-900 to-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>

          <div className="relative p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left side info */}
            <div className="lg:col-span-5 text-white space-y-6">
              <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-indigo-400 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                ⚡ Live Interactive Preview
              </div>
              <h3 className="text-3xl sm:text-4xl font-serif font-semibold leading-tight">
                See the intake intelligence in action
              </h3>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Select an onboarding symptom on the right. See how NovaCare's intelligent router calculates patient status scores, schedules clinicians, and logs pre-screens.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-xs text-indigo-400">1</span>
                  Patient enters symptoms in dynamic questionnaire.
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-xs text-indigo-400">2</span>
                  System grades risk score & prioritizes clinician queue.
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-xs text-indigo-400">3</span>
                  Clean charts automatically populate doctor records.
                </div>
              </div>
            </div>

            {/* Right Side Sandbox Simulator widget */}
            <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-inner relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <span className="text-xs font-mono text-slate-500">Intelligent Routing Terminal</span>
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
              </div>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Choose Simulated Patient Intake:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <button 
                  onClick={() => setSimPatient('chest')} 
                  className={`p-3 rounded-xl border text-left transition-all ${
                    simPatient === 'chest' 
                      ? 'border-brand-coral bg-brand-500/10' 
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-brand-500'
                  }`}
                >
                  <span className="block text-xs font-bold text-rose-400">Patient A</span>
                  <span className="block text-xs mt-1 text-slate-100 font-semibold">Chest Tightness</span>
                </button>
                <button 
                  onClick={() => setSimPatient('migraine')} 
                  className={`p-3 rounded-xl border text-left transition-all ${
                    simPatient === 'migraine' 
                      ? 'border-brand-coral bg-brand-500/10' 
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-brand-500'
                  }`}
                >
                  <span className="block text-xs font-bold text-amber-400">Patient B</span>
                  <span className="block text-xs mt-1 text-slate-100 font-semibold">Severe Migraine</span>
                </button>
                <button 
                  onClick={() => setSimPatient('allergy')} 
                  className={`p-3 rounded-xl border text-left transition-all ${
                    simPatient === 'allergy' 
                      ? 'border-brand-coral bg-brand-500/10' 
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-brand-500'
                  }`}
                >
                  <span className="block text-xs font-bold text-sky-400">Patient C</span>
                  <span className="block text-xs mt-1 text-slate-100 font-semibold">Allergic Reaction</span>
                </button>
              </div>

              {/* Console display outputs */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Router Output Status</span>
                  <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs bg-slate-800 ${
                    simPatient === 'chest' ? 'text-rose-400' : simPatient === 'migraine' ? 'text-amber-400' : 'text-sky-400'
                  }`}>
                    {intakeSims[simPatient].badge}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Risk Triage Tier</span>
                    <span className="text-sm font-bold text-slate-300 mt-1 block">{intakeSims[simPatient].triage}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Intelligent Provider Match</span>
                    <span className="text-sm font-bold text-slate-300 mt-1 block">{intakeSims[simPatient].match}</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-2">Automated Clinician Hand-off Summary</span>
                  <p className="text-xs text-slate-400 italic leading-relaxed">{intakeSims[simPatient].summary}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* BENEFITS / FEATURES GRID */}
      <section id="features" className="bg-white py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <p className="text-brand-600 text-xs font-bold uppercase tracking-widest">Designed for Excellence</p>
            <h2 className="text-3xl sm:text-4xl font-serif text-slate-900 mt-2 font-semibold">Benefits of deploying NovaCare OS</h2>
            <p className="text-slate-500 mt-4 text-sm sm:text-base">
              A patient-centered user interface helps you scale clinical outcomes, ensure patient follow-through, and elevate medical practice satisfaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50/50 hover:bg-white rounded-3xl p-8 border border-slate-100 hover:border-brand-coral transition-all duration-300 hover:shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-brand-sidebar flex items-center justify-center text-xl font-bold mb-6 transition-transform group-hover:scale-110">
                📊
              </div>
              <h3 className="text-xl font-bold text-slate-900">Patient-first Simplicity</h3>
              <p className="text-slate-500 mt-3 text-sm leading-relaxed">
                Eliminate complex portals. Patients see clear upcoming timelines, symptom timelines, and QR code active prescriptions in an unified timeline dashboard.
              </p>
            </div>

            <div className="bg-slate-50/50 hover:bg-white rounded-3xl p-8 border border-slate-100 hover:border-brand-coral transition-all duration-300 hover:shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl font-bold mb-6 transition-transform group-hover:scale-110">
                🧬
              </div>
              <h3 className="text-xl font-bold text-slate-900">Clinician Calm Workspace</h3>
              <p className="text-slate-500 mt-3 text-sm leading-relaxed">
                Doctors get automated summaries of symptoms before patients walk in. Clinical charting, diagnostic logs, and script generator tools on one page.
              </p>
            </div>

            <div className="bg-slate-50/50 hover:bg-white rounded-3xl p-8 border border-slate-100 hover:border-brand-coral transition-all duration-300 hover:shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center text-xl font-bold mb-6 transition-transform group-hover:scale-110">
                📈
              </div>
              <h3 className="text-xl font-bold text-slate-900">Intelligent Real-time Insights</h3>
              <p className="text-slate-500 mt-3 text-sm leading-relaxed">
                Securely monitor treatment adherence, overall clinical health metrics, daily consultation workloads, and critical diagnostic risk signals in unified, clear analytics panels.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM FOOTER */}
      <footer className="bg-slate-900 text-white py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-extrabold font-serif">
                N
              </div>
              <span className="font-bold text-white tracking-tight text-lg">NovaCare OS</span>
            </div>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              An intuitive clinical operation system designed to deliver high-quality, continuous, and stress-free medical workflows for patients and healthcare providers.
            </p>
            <p className="text-xs text-slate-500">
              © 2026 NovaCare OS Inc. All rights reserved. Built for modern health workspaces.
            </p>
          </div>

          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Platform Navigation</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#overview" className="hover:text-brand-600 transition-colors">Overview</a></li>
              <li><a href="#comparison" className="hover:text-brand-600 transition-colors">How It Works</a></li>
              <li><a href="#demo-sandbox" className="hover:text-brand-600 transition-colors">Intake Simulator</a></li>
              <li><a href="#features" className="hover:text-brand-600 transition-colors">System Features</a></li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Medical Disclaimer</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              NovaCare OS is a conceptual framework demonstration for healthcare platform optimization. This interface is for demonstrational, UI/UX prototyping, and software sandbox evaluation purposes only. No real clinical diagnoses are made.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
