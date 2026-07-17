import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const BP_DATA = [
  { date: 'Jun 1', systolic: 118, diastolic: 76 },
  { date: 'Jun 5', systolic: 122, diastolic: 80 },
  { date: 'Jun 9', systolic: 115, diastolic: 74 },
  { date: 'Jun 13', systolic: 126, diastolic: 84 },
  { date: 'Jun 17', systolic: 119, diastolic: 77 },
  { date: 'Jun 21', systolic: 121, diastolic: 79 },
  { date: 'Jun 25', systolic: 116, diastolic: 75 },
  { date: 'Jun 29', systolic: 120, diastolic: 78 },
];

const ACTIVITY_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const APPOINTMENT_COUNTS = [2, 3, 1, 4, 2, 5];
const MAX_APPT = Math.max(...APPOINTMENT_COUNTS);

const MEDICATIONS = [
  { name: 'Cetirizine 10mg', color: 'bg-indigo-500', taken: [true, true, true, false, true, true, true] },
  { name: 'Salbutamol Inhaler', color: 'bg-teal-500', taken: [true, true, false, true, true, true, false] },
  { name: 'Vitamin D 1000IU', color: 'bg-amber-500', taken: [true, false, true, true, true, false, true] },
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const HEALTH_SYSTEMS = [
  { name: 'Cardiovascular', score: 88, icon: '❤️', color: 'bg-rose-500' },
  { name: 'Respiratory', score: 72, icon: '🫁', color: 'bg-sky-500' },
  { name: 'Neurological', score: 94, icon: '🧠', color: 'bg-violet-500' },
  { name: 'Digestive', score: 65, icon: '🫀', color: 'bg-amber-500' },
  { name: 'Musculoskeletal', score: 79, icon: '🦴', color: 'bg-emerald-500' },
  { name: 'Immunological', score: 81, icon: '🛡️', color: 'bg-indigo-500' },
];

const VITALS = [
  { label: 'Heart Rate', value: '72 bpm', status: 'Normal', statusClass: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: '💓', trend: '+1.2%' },
  { label: 'Blood Pressure', value: '120/78', status: 'Normal', statusClass: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: '🩺', trend: '-0.8%' },
  { label: 'SpO₂', value: '98%', status: 'Excellent', statusClass: 'text-teal-600 bg-teal-50 border-teal-100', icon: '🌬️', trend: '+0.2%' },
  { label: 'Temperature', value: '36.8°C', status: 'Normal', statusClass: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: '🌡️', trend: '—' },
];

const AnalyticsPage = () => {
  const [selectedBPIdx, setSelectedBPIdx] = useState(null);

  return (
    <div className="flex h-screen bg-[#f4f7fc] overflow-hidden w-full font-sans antialiased text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
        <Navbar title="Health Analytics" />

        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto space-y-6 flex-1 pb-16">

          {/* Vitals Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {VITALS.map(({ label, value, status, statusClass, icon, trend }) => (
              <div key={label} className="dashboard-card p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">{label}</span>
                  <span className="text-2xl">{icon}</span>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusClass}`}>{status}</span>
                  <span className="text-[10px] font-bold text-slate-400">{trend}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* BP Chart */}
            <div className="dashboard-card lg:col-span-7 p-6 space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Blood Pressure Log</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Systolic & Diastolic — June 2026</p>
                </div>
                <div className="flex gap-4 text-[10px] font-bold">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-rose-500 inline-block"></span> Systolic</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-indigo-400 inline-block"></span> Diastolic</span>
                </div>
              </div>

              <div className="relative h-48 flex items-end justify-between gap-1">
                {BP_DATA.map((d, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                    onClick={() => setSelectedBPIdx(idx === selectedBPIdx ? null : idx)}
                  >
                    {/* Systolic bar */}
                    <div className="relative w-full flex flex-col items-center">
                      {selectedBPIdx === idx && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-lg z-10">
                          {d.systolic}/{d.diastolic} mmHg
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-slate-900 clip-triangle"></div>
                        </div>
                      )}
                      <div
                        className={`w-full rounded-t-lg transition-all ${selectedBPIdx === idx ? 'bg-rose-500' : 'bg-rose-300 group-hover:bg-rose-400'}`}
                        style={{ height: `${((d.systolic - 100) / 40) * 100}px` }}
                      ></div>
                      <div
                        className={`w-full rounded-none transition-all ${selectedBPIdx === idx ? 'bg-indigo-500' : 'bg-indigo-300 group-hover:bg-indigo-400'}`}
                        style={{ height: `${((d.diastolic - 60) / 40) * 60}px` }}
                      ></div>
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 mt-1 whitespace-nowrap">{d.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Appointment Chart */}
            <div className="dashboard-card lg:col-span-5 p-6 space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Appointments</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Monthly frequency — 2026</p>
              </div>
              <div className="flex items-end gap-2 h-40">
                {ACTIVITY_MONTHS.map((month, idx) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                    <span className="text-[9px] font-extrabold text-brand-sidebar opacity-0 group-hover:opacity-100 transition">{APPOINTMENT_COUNTS[idx]}</span>
                    <div
                      className="w-full rounded-t-xl bg-gradient-to-t from-brand-sidebar to-indigo-400 group-hover:from-brand-coral group-hover:to-orange-400 transition-all duration-300"
                      style={{ height: `${(APPOINTMENT_COUNTS[idx] / MAX_APPT) * 100}%` }}
                    ></div>
                    <span className="text-[9px] font-bold text-slate-400">{month}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Medication & Health Systems Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Medication Adherence */}
            <div className="dashboard-card lg:col-span-7 p-6 space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Medication Adherence</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Last 7 days compliance tracker</p>
              </div>

              <div className="space-y-4">
                {MEDICATIONS.map(({ name, color, taken }) => {
                  const adherence = Math.round((taken.filter(Boolean).length / taken.length) * 100);
                  return (
                    <div key={name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                          <span className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`}></span>
                          {name}
                        </div>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${adherence >= 80 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
                          {adherence}%
                        </span>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        {DAY_LABELS.map((day, idx) => (
                          <div key={day} className="flex-1 flex flex-col items-center gap-1">
                            <div className={`w-full h-7 rounded-lg flex items-center justify-center ${taken[idx] ? `${color} text-white` : 'bg-slate-100 text-slate-300'} transition`}>
                              <i className={`fa-solid ${taken[idx] ? 'fa-check' : 'fa-xmark'} text-[9px]`}></i>
                            </div>
                            <span className="text-[8px] font-bold text-slate-400">{day}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Body Systems Health Score */}
            <div className="dashboard-card lg:col-span-5 p-6 space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">System Health Scores</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">AI-evaluated clinical assessment</p>
              </div>
              <div className="space-y-3">
                {HEALTH_SYSTEMS.map(({ name, score, icon, color }) => (
                  <div key={name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-slate-700">
                        <span>{icon}</span> {name}
                      </span>
                      <span className={`font-extrabold ${score >= 85 ? 'text-emerald-600' : score >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {score}/100
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all duration-700`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
