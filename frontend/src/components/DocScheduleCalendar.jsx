import React, { useState, useEffect } from 'react';

const INITIAL_EVENTS = [
  { id: 1, name: 'Leslie Alexander', time: '07:00 AM', rawMins: 0, lane: 0, status: 'Done', day: 9, spec: 'Diagnostic Review' },
  { id: 2, name: 'Brooklyn Simmons', time: '07:35 AM', rawMins: 35, lane: 1, status: 'Done', day: 9, spec: 'Cardio Evaluation' },
  { id: 3, name: 'Jenny Wilson', time: '07:15 AM', rawMins: 15, lane: 2, status: 'Done', day: 9, spec: 'Endocrine Intake' },
  { id: 4, name: 'Courtney Henry', time: '08:35 AM', rawMins: 95, lane: 1, status: 'Done', day: 9, spec: 'Suture Check-up' },
  { id: 5, name: 'Guy Hawkins', time: '09:00 AM', rawMins: 120, lane: 0, status: 'Join', day: 9, spec: 'Therapy Session' },
  { id: 6, name: 'Kristin Watson', time: '09:45 AM', rawMins: 165, lane: 2, status: 'Start', day: 9, spec: 'Metabolic Consultation' },
  { id: 7, name: 'Robert Fox', time: '10:30 AM', rawMins: 210, lane: 1, status: 'Start', day: 9, spec: 'Orthopedic Diagnostics' },
  { id: 8, name: 'Jacob Jones', time: '11:15 AM', rawMins: 255, lane: 0, status: 'Start', day: 9, spec: 'Post-Op Review' },
  { id: 9, name: 'Cameron Williamson', time: '11:45 AM', rawMins: 285, lane: 2, status: 'Start', day: 9, spec: 'Neurology Scan' }
];

const INITIAL_REMINDERS = [
  { title: 'Clinical Strategy Call', date: '12 August 2026', type: 'Meetings' },
  { title: 'Project Kickoff', date: '17 August 2026', type: 'Appointment' },
  { title: 'Team Check-in', date: '19 August 2026', type: 'Evaluation' },
  { title: 'Stakeholder Meeting', date: '24 August 2026', type: 'Meetings' },
  { title: 'Sprint Review', date: '26 August 2026', type: 'Meetings' },
  { title: 'Performance Review', date: '31 August 2026', type: 'Evaluation' }
];

const DocScheduleCalendar = () => {
  const [selectedDay, setSelectedDay] = useState(9);
  const [simulatedMinutes, setSimulatedMinutes] = useState(150); // 150 mins after 07:00 AM = 09:30 AM
  const [filterType, setFilterType] = useState('All');
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [reminders, setReminders] = useState(INITIAL_REMINDERS);

  // Slot Templates & Blocked Dates state syncing to backend
  const [availability, setAvailability] = useState('09:00 AM - 05:00 PM');
  const [schedulePattern, setSchedulePattern] = useState('Mon-Sat');
  const [blockedDates, setBlockedDates] = useState([]);
  const [slotTemplates, setSlotTemplates] = useState({});

  // Add Event Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventTime, setNewEventTime] = useState('09:00');
  const [newEventLane, setNewEventLane] = useState(0);
  const [newEventStatus, setNewEventStatus] = useState('Start');
  const [newEventSpec, setNewEventSpec] = useState('General checkup');

  // Load backend schedule settings
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/doctor/schedule', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setAvailability(data.availability);
          setSchedulePattern(data.schedule);
          setBlockedDates(data.blockedDates || []);
          setSlotTemplates(data.slotTemplates || {});
        }
      })
      .catch(() => {});
  }, []);

  const saveScheduleSettings = (newAvailability, newSchedule, newBlocked, newTemplates) => {
    const token = localStorage.getItem('token');
    fetch('/api/doctor/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        availability: newAvailability || availability,
        schedule: newSchedule || schedulePattern,
        blockedDates: newBlocked || blockedDates,
        slotTemplates: newTemplates || slotTemplates
      })
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          // Toast or simple state update
        }
      })
      .catch(() => {});
  };

  const getLeftOffset = (mins) => {
    // 7:00 AM to 12:00 PM is 5 Hours = 300 minutes
    const pct = (mins / 300) * 100;
    return `${Math.min(Math.max(pct, 0), 96)}%`;
  };

  const getSimulatedTimeStr = () => {
    const totalMins = 7 * 60 + parseInt(simulatedMinutes);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    return `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
  };

  const handleAddNewEvent = (e) => {
    e.preventDefault();
    if (!newEventName.trim()) {
      alert('Please enter a valid patient name.');
      return;
    }

    const [hours, mins] = newEventTime.split(':').map(Number);
    const selectedMins = hours * 60 + mins;
    const startMins = 7 * 60; // 07:00 AM
    let rawMins = selectedMins - startMins;

    if (rawMins < 0 || rawMins > 300) {
      rawMins = Math.max(0, Math.min(rawMins, 300));
    }

    const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    const displayAmpm = hours >= 12 ? 'PM' : 'AM';
    const formattedTimeStr = `${String(displayHour).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${displayAmpm}`;

    const newEvt = {
      id: Date.now(),
      name: newEventName,
      time: formattedTimeStr,
      rawMins: rawMins,
      lane: parseInt(newEventLane),
      status: newEventStatus,
      day: selectedDay,
      spec: newEventSpec
    };

    setEvents([...events, newEvt]);
    setShowAddModal(false);
    setNewEventName('');
  };

  const toggleBlockDate = (dayNumStr) => {
    const dateStr = `2026-08-${dayNumStr.padStart(2, '0')}`;
    let updated;
    if (blockedDates.includes(dateStr)) {
      updated = blockedDates.filter(d => d !== dateStr);
    } else {
      updated = [...blockedDates, dateStr];
    }
    setBlockedDates(updated);
    saveScheduleSettings(null, null, updated, null);
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Calendar Header with simulated time and add slot triggers */}
      <div className="flex justify-between items-center bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex-wrap gap-4 text-left">
        <div>
          <h3 className="text-base font-bold">Timeline & Shift Manager</h3>
          <p className="text-[11px] text-slate-450 font-semibold mt-0.5">Control recurring clinic schedules and view staggering patient allocations.</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          {/* Simulated current time slider */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl text-xs font-bold">
            <span className="text-slate-400">Simulate Shift Time:</span>
            <input 
              type="range" 
              min="0" 
              max="300" 
              value={simulatedMinutes} 
              onChange={(e) => setSimulatedMinutes(e.target.value)}
              className="w-24 accent-indigo-500 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none" 
            />
            <span className="text-brand-sidebar font-extrabold">{getSimulatedTimeStr()}</span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-brand-sidebar hover:bg-brand-sidebarHover text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
          >
            + Schedule Session
          </button>
        </div>
      </div>

      {/* Main Grid: Left calendar, Right timeline lanes */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left: Interactive calendar days & reminders (col-span-4) */}
        <div className="xl:col-span-4 space-y-6 flex flex-col">
          
          {/* August 2026 Days grid */}
          <div className="dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50 text-left">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">August 2026</span>
              <span className="text-[9px] bg-rose-50 text-rose-600 font-extrabold px-2 py-0.5 rounded-md border border-rose-100 uppercase">
                Tap day to block
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
            </div>

            {/* Calendar grid aligns starting Friday */}
            <div className="grid grid-cols-7 gap-1">
              {/* Spacers */}
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={`s-${i}`} className="h-8 flex items-center justify-center text-slate-200 text-xs font-bold">28</span>
              ))}
              
              {/* Real clickable days */}
              {Array.from({ length: 31 }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `2026-08-${dayNum.toString().padStart(2, '0')}`;
                const isBlocked = blockedDates.includes(dateStr);
                const isSelected = selectedDay === dayNum;

                return (
                  <div
                    key={dayNum}
                    onClick={() => setSelectedDay(dayNum)}
                    onDoubleClick={() => toggleBlockDate(dayNum.toString())}
                    className={`h-8 flex items-center justify-center text-xs cursor-pointer rounded-full transition-all relative font-bold ${
                      isSelected 
                        ? 'bg-brand-sidebar text-white shadow-md scale-105' 
                        : (isBlocked 
                          ? 'bg-rose-50 text-rose-600 border border-rose-150 line-through' 
                          : 'hover:bg-slate-50 text-slate-700')
                    }`}
                  >
                    <span>{dayNum}</span>
                    {dayNum === 9 && (
                      <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-brand-sidebar'}`}></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reminders widget */}
          <div className="dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 text-left">Clinical Reminders</h3>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {reminders.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50/70 border border-slate-200/50 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="text-left">
                    <h4 className="text-xs font-extrabold text-slate-800">{item.title}</h4>
                    <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{item.date}</span>
                  </div>

                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                    item.type === 'Meetings' ? 'bg-indigo-50 text-indigo-650 border-indigo-100' :
                    item.type === 'Appointment' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                    'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Timeline Lane grid mapping (col-span-8) */}
        <div className="xl:col-span-8 space-y-4">
          <div className="dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden text-left space-y-6">
            
            {/* Header controls inside timeline */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-850">
                  📅 Timeline: Saturday, {selectedDay} August 2026
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">Staggered multi-lane consultations tracking.</p>
              </div>

              {/* Status Track Filter */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-slate-400 uppercase text-[10px]">Filter Status:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold outline-none"
                >
                  <option value="All">All Events</option>
                  <option value="Start">Start</option>
                  <option value="Join">Join</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>

            {/* Timeline Canvas Staves */}
            <div className="relative pt-8 pb-4 min-h-[460px] overflow-x-auto">
              <div className="min-w-[700px] relative h-full">
                
                {/* Horizontal hours tags */}
                <div className="absolute inset-x-0 top-0 flex justify-between text-[10px] font-extrabold text-slate-400 border-b border-slate-100 pb-2 mb-1">
                  <span>07:00 AM</span>
                  <span>08:00 AM</span>
                  <span>09:00 AM</span>
                  <span>10:00 AM</span>
                  <span>11:00 AM</span>
                  <span>12:00 PM</span>
                </div>

                {/* Dotted lines */}
                <div className="absolute inset-0 pt-8 flex justify-between pointer-events-none">
                  <div className="h-full border-l border-dashed border-slate-100"></div>
                  <div className="h-full border-l border-dashed border-slate-100"></div>
                  <div className="h-full border-l border-dashed border-slate-100"></div>
                  <div className="h-full border-l border-dashed border-slate-100"></div>
                  <div className="h-full border-l border-dashed border-slate-100"></div>
                  <div className="h-full border-l border-dashed border-slate-100"></div>
                </div>

                {/* Staggered lanes */}
                <div className="relative space-y-12 pt-12 h-full">
                  <div className="h-14 border-b border-slate-50 w-full"></div>
                  <div className="h-14 border-b border-slate-50 w-full"></div>
                  <div className="h-14 border-b border-slate-50 w-full"></div>

                  {/* Plotted Events Cards */}
                  {events
                    .filter(evt => (filterType === 'All' || evt.status === filterType) && evt.day === selectedDay)
                    .map(evt => (
                      <div
                        key={evt.id}
                        style={{ left: getLeftOffset(evt.rawMins) }}
                        className={`absolute w-[170px] p-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-2.5 transition hover:scale-105 hover:shadow-md ${
                          evt.lane === 0 ? 'top-[42px]' : evt.lane === 1 ? 'top-[144px]' : 'top-[246px]'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-xs shrink-0 font-bold text-indigo-650">
                          🩺
                        </div>
                        <div className="min-w-0 flex-grow text-left">
                          <h5 className="text-[11px] font-extrabold text-slate-800 truncate">{evt.name}</h5>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[8.5px] text-slate-400 font-bold">{evt.time}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                              evt.status === 'Done' ? 'bg-slate-50 text-slate-400 border-slate-200' :
                              evt.status === 'Join' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                              'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                              {evt.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  }

                  {/* Vertical Simulated Time Marker Line */}
                  <div 
                    className="absolute inset-y-0 z-20 pointer-events-none border-l-2 border-indigo-500 transition-all duration-200"
                    style={{ left: getLeftOffset(simulatedMinutes) }}
                  >
                    <div className="absolute -top-6 -translate-x-1/2 bg-indigo-600 text-white text-[8.5px] font-extrabold px-2.5 py-0.5 rounded-full shadow flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      <span>{getSimulatedTimeStr()}</span>
                    </div>
                    <div className="absolute top-[80px] -translate-x-1/2 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full shadow"></div>
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-[#eff2ff] p-3.5 rounded-2xl border border-indigo-150/30 text-[10px] flex items-center gap-2 text-indigo-700 leading-normal">
              <i className="fa-solid fa-lightbulb"></i>
              <span>Blocked dates show as red crossings on the calendar registry. Use double clicks on dates to block or open schedules.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Booking Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative space-y-5 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <i className="fa-regular fa-calendar-plus text-indigo-500"></i> Schedule Consultation
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleAddNewEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Patient Name</label>
                <input 
                  type="text" 
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="e.g. Kristin Watson" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 outline-none transition" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Session Start Time</label>
                  <input 
                    type="time" 
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    min="07:00" 
                    max="12:00" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 outline-none" 
                  />
                  <span className="text-[9px] text-slate-400 mt-1 block">Timeline bounds: 07 AM - 12 PM</span>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Diagnosis Specialty</label>
                  <input 
                    type="text" 
                    value={newEventSpec}
                    onChange={(e) => setNewEventSpec(e.target.value)}
                    placeholder="e.g. Cardiology" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Stagger Lane</label>
                  <select 
                    value={newEventLane}
                    onChange={(e) => setNewEventLane(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="0">Lane 0 (Top)</option>
                    <option value="1">Lane 1 (Middle)</option>
                    <option value="2">Lane 2 (Bottom)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Status Action</label>
                  <select 
                    value={newEventStatus}
                    onChange={(e) => setNewEventStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="Start">Start</option>
                    <option value="Join">Join</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#5c6dfa] hover:bg-[#4e5ee6] rounded-xl shadow-md"
                >
                  Confirm Slot Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocScheduleCalendar;
