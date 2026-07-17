import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

// Prepopulated mock calendar events
const INITIAL_EVENTS = [
  { id: 1, date: '2026-07-14', time: '09:00 AM', title: 'Cardiology Review', doctor: 'Dr. Helena Ross', type: 'Clinical' },
  { id: 2, date: '2026-07-14', time: '02:30 PM', title: 'Teeth Cleaning', doctor: 'Dr. Oksana Max', type: 'Dental' },
  { id: 3, date: '2026-07-20', time: '11:00 AM', title: 'Allergy Test Control', doctor: 'Dr. Sarah Jenkins', type: 'Immunology' },
  { id: 4, date: '2026-07-26', time: '04:15 PM', title: 'Annual General Checkup', doctor: 'Dr. Dianne Russell', type: 'Wellness' },
  { id: 5, date: '2026-07-28', time: '10:00 AM', title: 'Dermatology Follow-up', doctor: 'Dr. Savannah Nguyen', type: 'Clinical' }
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarPage = () => {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // July (0-indexed: 6)
  const [selectedDateStr, setSelectedDateStr] = useState('2026-07-14');
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [newEventModal, setNewEventModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // New Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDoctor, setEventDoctor] = useState('');
  const [eventTime, setEventTime] = useState('09:00 AM');
  const [eventType, setEventType] = useState('Clinical');

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const padZero = (n) => (n < 10 ? `0${n}` : n);

  const handleDateClick = (day) => {
    const dateStr = `${currentYear}-${padZero(currentMonth + 1)}-${padZero(day)}`;
    setSelectedDateStr(dateStr);
  };

  // Build grid blocks
  const calendarCells = [];
  // Empty blocks for padding
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="h-16 md:h-20 bg-slate-50/40 border border-slate-100"></div>);
  }
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const formattedDate = `${currentYear}-${padZero(currentMonth + 1)}-${padZero(day)}`;
    const hasEvents = events.some((ev) => ev.date === formattedDate);
    const isSelected = selectedDateStr === formattedDate;

    calendarCells.push(
      <div
        key={`day-${day}`}
        onClick={() => handleDateClick(day)}
        className={`h-16 md:h-20 p-2 border border-slate-100 flex flex-col justify-between cursor-pointer transition select-none text-left ${
          isSelected
            ? 'bg-indigo-50 border-indigo-300'
            : 'bg-white hover:bg-slate-50'
        }`}
      >
        <span className={`text-xs font-bold ${
          isSelected ? 'text-indigo-600' : 'text-slate-700'
        }`}>
          {day}
        </span>
        {hasEvents && (
          <div className="flex gap-1 flex-wrap">
            {events
              .filter((ev) => ev.date === formattedDate)
              .slice(0, 2)
              .map((ev) => (
                <span
                  key={ev.id}
                  className="w-1.5 h-1.5 rounded-full bg-brand-sidebar"
                  title={ev.title}
                />
              ))}
          </div>
        )}
      </div>
    );
  }

  const activeEvents = events.filter((ev) => ev.date === selectedDateStr);

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      triggerToast('Event description is required!', 'error');
      return;
    }

    const newEv = {
      id: Date.now(),
      date: selectedDateStr,
      time: eventTime,
      title: eventTitle,
      doctor: eventDoctor || 'Self-scheduled',
      type: eventType
    };

    setEvents([...events, newEv]);
    setNewEventModal(false);
    setEventTitle('');
    setEventDoctor('');
    triggerToast('Added schedule entry successfully.');
  };

  return (
    <div className="flex h-screen bg-[#f4f7fc] overflow-hidden w-full font-sans antialiased text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
        <Navbar title="Personal Health Calendar" />

        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto space-y-6 flex-grow pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT: CALENDAR GRID (8 cols) */}
            <div className="lg:col-span-8 dashboard-card p-6 flex flex-col justify-between">
              
              {/* Header Controls */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    {monthName} {currentYear}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={handlePrevMonth}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center border border-slate-200"
                    >
                      <i className="fa-solid fa-chevron-left text-[10px]"></i>
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center border border-slate-200"
                    >
                      <i className="fa-solid fa-chevron-right text-[10px]"></i>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">SELECTED DATE:</span>
                  <span className="text-xs font-extrabold text-brand-sidebar bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
                    {selectedDateStr}
                  </span>
                </div>
              </div>

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 text-center py-2.5 bg-slate-50 border border-slate-100 rounded-xl mt-4">
                {WEEKDAYS.map((day) => (
                  <span key={day} className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {day}
                  </span>
                ))}
              </div>

              {/* Calendar Grid cells */}
              <div className="grid grid-cols-7 mt-2 border-t border-l border-slate-100 rounded-lg overflow-hidden">
                {calendarCells}
              </div>

            </div>

            {/* RIGHT: SELECTED DATE EVENTS PANEL (4 cols) */}
            <div className="lg:col-span-4 dashboard-card p-6 flex flex-col justify-between text-left">
              
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                    Schedule for {selectedDateStr}
                  </h3>
                  <button
                    onClick={() => setNewEventModal(true)}
                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <span>+</span> Add Event
                  </button>
                </div>

                <div className="mt-5 space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {activeEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 bg-slate-50/60 border border-slate-150 rounded-2xl flex gap-3.5 relative overflow-hidden"
                    >
                      <div className="w-1.5 h-full absolute left-0 top-0 bottom-0 bg-brand-sidebar"></div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-widest block">
                          {ev.time} · {ev.type}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800">{ev.title}</h4>
                        <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-slate-500 font-semibold">
                          <span>🩺</span>
                          <span>{ev.doctor}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {activeEvents.length === 0 && (
                    <div className="py-12 text-center space-y-2">
                      <span className="text-2xl block">🕊️</span>
                      <p className="text-xs text-slate-400 italic">No events or consultations scheduled for this date.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100/50 mt-6">
                <span className="text-[9px] text-indigo-500 font-extrabold uppercase tracking-widest block">Total Scheduled</span>
                <span className="text-xs font-bold text-slate-700">{events.length} active reminders on calendar file.</span>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {newEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-slate-100 space-y-5 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Add Calendar Entry</h3>
              <button
                onClick={() => setNewEventModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className="relative">
                <label className="absolute left-4 top-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Inhaler replacement check"
                  className="w-full pt-5 pb-2 px-4 bg-[#F5F6FA] border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs font-medium outline-none transition-all placeholder-slate-300"
                />
              </div>

              <div className="relative">
                <label className="absolute left-4 top-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">Physician Name</label>
                <input
                  type="text"
                  value={eventDoctor}
                  onChange={(e) => setEventDoctor(e.target.value)}
                  placeholder="e.g. Dr. Savannah Nguyen (optional)"
                  className="w-full pt-5 pb-2 px-4 bg-[#F5F6FA] border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs font-medium outline-none transition-all placeholder-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="absolute left-4 top-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">Event Time</label>
                  <input
                    type="text"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    className="w-full pt-5 pb-2 px-4 bg-[#F5F6FA] border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs font-medium outline-none transition-all placeholder-slate-300"
                  />
                </div>

                <div className="relative">
                  <label className="absolute left-4 top-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">Category</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full pt-5 pb-2 px-4 bg-[#F5F6FA] border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs font-medium outline-none transition-all"
                  >
                    <option value="Clinical">Clinical</option>
                    <option value="Dental">Dental</option>
                    <option value="Wellness">Wellness</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewEventModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-650 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-brand-sidebar hover:bg-brand-sidebarHover rounded-xl shadow-md"
                >
                  Save Entry
                </button>
              </div>
            </form>
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

export default CalendarPage;
