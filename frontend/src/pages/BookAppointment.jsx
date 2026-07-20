import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

const SPECIALTIES = [
  { name: 'General Medicine', icon: 'fa-plus' },
  { name: 'Pediatrics', icon: 'fa-baby' },
  { name: 'Dermatology', icon: 'fa-hand-dots' },
  { name: 'Cardiology', icon: 'fa-heart-pulse' },
  { name: 'Neurology', icon: 'fa-brain' },
  { name: 'Orthopedics', icon: 'fa-bone' },
  { name: 'Gastroenterology', icon: 'fa-stethoscope' },
  { name: 'Pulmonology', icon: 'fa-lungs' },
  { name: 'Ophthalmology', icon: 'fa-eye' },
  { name: 'Psychiatry', icon: 'fa-head-side-virus' }
];

const BookAppointment = () => {
  // State variables
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  
  const [bookedQueue, setBookedQueue] = useState([]);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [modalDoc, setModalDoc] = useState(null);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [queueOpen, setQueueOpen] = useState(true);

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Fetch all doctors and patient appointments on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Fetch doctors
    fetch('/api/doctors', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch doctors list');
        return res.json();
      })
      .then(data => {
        setDoctors(data);
        setLoading(false);
      })
      .catch(err => {
        triggerToast(err.message, 'error');
        setLoading(false);
      });

    // Fetch patient appointments for the queue
    fetchPatientAppointments();
  }, []);

  const fetchPatientAppointments = () => {
    const token = localStorage.getItem('token');
    fetch('/api/patient/appointments', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setBookedQueue(data);
      });
  };

  // Dynamically load available slots when doctor or date changes
  useEffect(() => {
    if (!selectedDoc || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    const token = localStorage.getItem('token');
    fetch(`/api/doctors/${selectedDoc.id}/slots?date=${selectedDate}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch available time slots');
        return res.json();
      })
      .then(data => {
        setAvailableSlots(data);
      })
      .catch(err => {
        triggerToast(err.message, 'error');
      });
  }, [selectedDoc, selectedDate]);

  // Search filter matching legacy logic
  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty ? doc.specialty.toLowerCase() === selectedSpecialty.toLowerCase() : true;
    return matchesSearch && matchesSpecialty;
  });

  const handleBookSubmit = (e) => {
    e.preventDefault();
    if (!selectedDoc || !selectedDate || !selectedSlot) {
      triggerToast('Please complete all selection steps first!', 'error');
      return;
    }

    setBookingDetails({
      doctor: selectedDoc.name,
      doctor_id: selectedDoc.id,
      specialty: selectedDoc.specialty,
      date: selectedDate,
      time: selectedSlot,
      fee: '$100', // Default consult charge
      reason: reason || 'Routine wellness screening checkup'
    });
  };

  const confirmBooking = () => {
    const token = localStorage.getItem('token');
    fetch('/api/appointments/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        doctor_id: bookingDetails.doctor_id,
        date: bookingDetails.date,
        time_slot: bookingDetails.time
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Booking failed. Slot may have been taken.');
        return res.json();
      })
      .then(() => {
        triggerToast(`Appointment booked successfully with ${bookingDetails.doctor}!`, 'success');
        setBookingDetails(null);
        setSelectedDoc(null);
        setSelectedDate('');
        setSelectedSlot('');
        setReason('');
        
        // Sync active queue
        fetchPatientAppointments();
        setActiveTab('Dashboard');
      })
      .catch(err => {
        triggerToast(err.message, 'error');
      });
  };

  const openDocProfile = (doc) => {
    setModalDoc(doc);
    setIsDocModalOpen(true);
  };

  // Find upcoming appointment for banner
  const upcomingAppointment = bookedQueue.find(a => a.status !== 'cancelled') || {
    doctor_name: 'Dr. Dianne Russell',
    specialty: 'General Medicine',
    date: 'Monday, 20 Jul 2026',
    time_slot: '09:00 AM',
    id: 'A-01',
    doctor_image: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=400'
  };

  return (
    <div className="flex h-screen bg-[#f4f7fc] overflow-hidden w-full font-sans antialiased text-slate-800">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Clinical Workspace" />

        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto space-y-6 flex-grow pb-16">
          
          {/* Dashboard Mode (Booking Workspace) */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-center">
                <div>
                  {searchQuery === '' && selectedSpecialty === '' ? (
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Book Appointment</h2>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => { setSearchQuery(''); setSelectedSpecialty(''); }}
                        className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 flex items-center justify-center border border-slate-200 transition shadow-sm"
                      >
                        <i className="fa-solid fa-arrow-left text-slate-700 text-sm"></i>
                      </button>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Clinician Results</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Showing results for <span className="font-semibold text-brand-sidebar">{selectedSpecialty || 'All Specialties'}</span>
                          {searchQuery && <span> matching "{searchQuery}"</span>}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {(searchQuery !== '' || selectedSpecialty !== '') && (
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedSpecialty(''); }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-brand-sidebar text-xs font-bold transition flex items-center gap-1.5 border border-indigo-100"
                  >
                    <i className="fa-solid fa-rotate-left"></i> Reset Filter
                  </button>
                )}
              </div>

              {searchQuery === '' && selectedSpecialty === '' && (
                <div className="space-y-6">
                  {/* Hero Appointment Card */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-white shadow-xl shadow-slate-950/15 p-6 md:p-8 flex flex-col justify-between min-h-[260px]">
                    <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>

                    <div className="max-w-[100%] md:max-w-[55%] z-10 flex flex-col justify-between h-full space-y-6">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/10 rounded-full text-[10px] font-bold tracking-wider uppercase text-indigo-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Your Scheduled Appointment
                        </span>
                        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-3 text-white">{upcomingAppointment.doctor_name}</h3>
                        <p className="text-xs text-indigo-300 font-bold tracking-wide mt-1">{upcomingAppointment.specialty} Practice Specialist</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl py-2 px-3.5 border border-white/10 text-xs font-semibold text-white">
                          <i className="fa-regular fa-calendar-check text-indigo-300"></i>
                          <span>{upcomingAppointment.date} · {upcomingAppointment.time_slot}</span>
                        </span>
                        <span className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl py-2 px-3.5 border border-white/10 text-xs font-mono text-indigo-200">
                          <i className="fa-solid fa-receipt text-indigo-300"></i>
                          <span>Ref ID: {upcomingAppointment.id}</span>
                        </span>
                      </div>
                    </div>

                    <div className="absolute right-0 bottom-0 top-0 w-1/3 md:w-2/5 overflow-hidden hidden sm:block">
                      <img 
                        src={upcomingAppointment.doctor_image} 
                        className="h-full w-full object-cover object-top opacity-95 hover:scale-105 transition-transform duration-500" 
                        alt="Doctor Profile" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent pointer-events-none"></div>
                    </div>
                  </div>

                  {/* QUICK CIRCULAR ACTIONS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <button 
                      onClick={() => setActiveTab('Appointments')}
                      className="dashboard-card hover:bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all group hover:-translate-y-1"
                    >
                      <div className="w-12 h-12 rounded-full bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-lg text-brand-sidebar transition-colors shadow-inner">
                        <i className="fa-solid fa-calendar-days text-sm"></i>
                      </div>
                      <span className="text-xs font-bold text-slate-650 mt-2">Active Schedule</span>
                    </button>

                    <button 
                      onClick={() => { setSelectedSpecialty('General Medicine'); }}
                      className="dashboard-card hover:bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all group hover:-translate-y-1"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center text-lg text-emerald-650 transition-colors shadow-inner">
                        <i className="fa-solid fa-user-doctor text-sm"></i>
                      </div>
                      <span className="text-xs font-bold text-slate-650 mt-2">Book Doctor</span>
                    </button>

                    <button 
                      onClick={() => { setSelectedSpecialty('Cardiology'); }}
                      className="dashboard-card hover:bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all group hover:-translate-y-1"
                    >
                      <div className="w-12 h-12 rounded-full bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center text-lg text-rose-650 transition-colors shadow-inner">
                        <i className="fa-solid fa-heart-pulse text-sm"></i>
                      </div>
                      <span className="text-xs font-bold text-slate-650 mt-2">Cardiology</span>
                    </button>

                    <div 
                      onClick={() => { setSelectedSpecialty('Dermatology'); }}
                      className="dashboard-card hover:bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all group hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center text-lg text-amber-650 transition-colors shadow-inner">
                        <i className="fa-solid fa-hand-dots text-sm"></i>
                      </div>
                      <span className="text-xs font-bold text-slate-650 mt-2">Dermatology</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Doctors Listing & Booking Scheduler */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
                
                {/* Doctors List Column (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                  <h3 className="text-sm font-extrabold text-slate-800">Available Medical Specialists</h3>
                  
                  {loading ? (
                    <div className="py-12 text-center text-slate-400 font-semibold text-xs">
                      Loading Clinicians Profiles...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredDoctors.map(doc => (
                        <div 
                          key={doc.id}
                          onClick={() => { setSelectedDoc(doc); setSelectedSlot(''); }}
                          className={`dashboard-card p-5 flex flex-col justify-between cursor-pointer border-2 transition-all hover:translate-y-[-2px] ${
                            selectedDoc?.id === doc.id ? 'border-indigo-500 shadow-lg shadow-indigo-100' : 'border-transparent hover:border-slate-200'
                          }`}
                        >
                          <div className="flex gap-4">
                            <img 
                              src={doc.avatar_url} 
                              alt={doc.name} 
                              onClick={(e) => { e.stopPropagation(); openDocProfile(doc); }}
                              className="w-16 h-16 rounded-2xl object-cover border border-slate-100 flex-shrink-0 hover:opacity-85 transition-opacity"
                            />
                            <div className="space-y-1 flex-grow">
                              <h4 className="text-sm font-bold text-slate-900 leading-tight hover:underline decoration-slate-400" onClick={(e) => { e.stopPropagation(); openDocProfile(doc); }}>{doc.name}</h4>
                              <p className="text-[10px] font-bold text-indigo-600 tracking-wide uppercase">{doc.specialty}</p>
                              <div className="flex items-center gap-1.5 pt-1 text-[11px] font-bold text-slate-500">
                                <span className="text-amber-500">⭐</span>
                                <span>{doc.rating}</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-[10px] text-slate-400 font-semibold">{doc.reviews_count || 140} reviews</span>
                              </div>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-3 leading-relaxed">{doc.bio}</p>

                          <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-50">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Session Fee</span>
                              <span className="text-xs font-extrabold text-slate-800">$100</span>
                            </div>
                            <button
                              onClick={() => { setSelectedDoc(doc); setSelectedSlot(''); }}
                              className={`text-[10px] font-bold px-3.5 py-1 rounded-full border ${
                                selectedDoc?.id === doc.id ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {selectedDoc?.id === doc.id ? '✓ Selected' : 'Select'}
                            </button>
                          </div>
                        </div>
                      ))}

                      {filteredDoctors.length === 0 && (
                        <div className="col-span-2 text-center py-16 bg-white border border-slate-100 rounded-3xl space-y-3">
                          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100 text-slate-400 text-lg">
                            <i className="fa-solid fa-magnifying-glass"></i>
                          </div>
                          <h5 className="text-sm font-bold text-slate-800">No matching doctors found</h5>
                          <p className="text-xs text-slate-400 max-w-xs mx-auto">Try adjusting the filter keyword queries or clearing the filter.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Booking Form Scheduler Column (5 cols) */}
                <div className="lg:col-span-5">
                  <form onSubmit={handleBookSubmit} className="dashboard-card p-6 space-y-5">
                    <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                      <i className="fa-regular fa-calendar-plus text-indigo-500"></i> Slot Scheduler
                    </h3>

                    {/* Date Selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Select Date</label>
                      <input 
                        type="date"
                        required
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-xl text-xs text-slate-700 font-bold outline-none transition"
                      />
                    </div>

                    {/* Time Slot Selection */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                        Available Slots {selectedDoc && `for ${selectedDoc.name}`}
                      </label>
                      
                      {selectedDoc ? (
                        selectedDate ? (
                          availableSlots.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                              {availableSlots.map(slot => (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`py-2 rounded-lg text-[11px] border font-bold text-center transition ${
                                    selectedSlot === slot ? 'bg-brand-sidebar text-white border-indigo-500 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 bg-rose-50/50 border border-rose-100/50 rounded-xl text-center">
                              <p className="text-xs text-rose-600 font-semibold">No free time slots available on this date.</p>
                            </div>
                          )
                        ) : (
                          <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl text-center">
                            <p className="text-xs text-indigo-600 font-semibold">Please select a date to compute free slots.</p>
                          </div>
                        )
                      ) : (
                        <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl text-center">
                          <p className="text-xs text-indigo-600 font-semibold">Please select a doctor and date to load slots.</p>
                        </div>
                      )}
                    </div>

                    {/* Reason text */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Clinical Symptoms / Reason</label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Briefly state symptoms or visit reasons (e.g. chronic allergy follow-up, routine checkup)..."
                        className="w-full h-24 p-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-xl text-xs text-slate-700 font-medium resize-none outline-none transition placeholder-slate-350"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedDoc || !selectedDate || !selectedSlot}
                      className={`w-full py-3.5 font-bold rounded-xl shadow-lg text-xs tracking-wide uppercase transition-all ${
                        selectedDoc && selectedDate && selectedSlot
                          ? 'bg-brand-sidebar hover:bg-brand-sidebarHover text-white cursor-pointer hover:shadow-indigo-600/10'
                          : 'bg-indigo-50 text-indigo-400 cursor-not-allowed border border-indigo-100/40'
                      }`}
                    >
                      Book Session
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* Active Schedule Tab (List all appointments) */}
          {activeTab === 'Appointments' && (
            <div className="dashboard-card p-6 md:p-8 space-y-6 text-left">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <button 
                  onClick={() => setActiveTab('Dashboard')}
                  className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 flex items-center justify-center border border-slate-200 transition shadow-sm"
                >
                  <i className="fa-solid fa-arrow-left text-slate-700 text-sm"></i>
                </button>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Active Appointments Calendar</h3>
                  <p className="text-xs text-slate-400 font-medium">Verify your registered queues and physician details</p>
                </div>
              </div>

              <div className="space-y-4">
                {bookedQueue.map(appt => (
                  <div 
                    key={appt.id}
                    className="p-5 bg-slate-50/60 hover:bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <img 
                        src={appt.doctor_image} 
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-150 shadow-sm" 
                        alt="Doctor" 
                      />
                      <div>
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{appt.specialty}</span>
                        <h4 className="text-sm font-extrabold text-slate-800 mt-1">{appt.doctor_name}</h4>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          <i className="fa-regular fa-clock text-[10px] mr-1"></i> {appt.date} at {appt.time_slot}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-between md:justify-end">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
                        appt.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        appt.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {appt.status}
                      </span>
                      {appt.status !== 'cancelled' && (
                        <button 
                          onClick={() => {
                            if (confirm('Cancel this consultation session?')) {
                              const token = localStorage.getItem('token');
                              fetch(`/api/appointments/${appt.id}/status`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ status: 'cancelled' })
                              })
                                .then(res => {
                                  if (!res.ok) throw new Error('Cancellation failed.');
                                  return res.json();
                                })
                                .then(() => {
                                  triggerToast('Appointment cancelled successfully.');
                                  fetchPatientAppointments();
                                })
                                .catch(err => triggerToast(err.message, 'error'));
                            }
                          }}
                          className="px-3.5 py-1.5 border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 rounded-xl text-[10px] font-bold transition-all uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {bookedQueue.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No active scheduled consultations found.</p>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* RIGHT SIDEBAR: Specialty Filter & Active Queue Panel */}
      <aside className="w-full lg:w-[360px] p-6 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-col gap-6 flex-shrink-0 overflow-y-auto no-print">
        
        {/* Find a Doctor Section */}
        <div className="space-y-4 text-left">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Find a doctor</h3>
          
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-xs text-slate-400"><i className="fa-solid fa-magnifying-glass"></i></span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setActiveTab('Dashboard'); }}
              placeholder="Cari di sini..."
              className="w-full pl-9 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 rounded-2xl text-xs placeholder-slate-400 focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {SPECIALTIES.map(spec => (
              <button
                key={spec.name}
                onClick={() => { setSelectedSpecialty(spec.name); setActiveTab('Dashboard'); }}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-sm group text-center min-h-[96px] ${
                  selectedSpecialty.toLowerCase() === spec.name.toLowerCase()
                    ? 'border-indigo-500 bg-indigo-50 text-brand-sidebar scale-105 font-bold'
                    : 'border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition duration-200 bg-white ${
                  selectedSpecialty.toLowerCase() === spec.name.toLowerCase() ? 'text-brand-sidebar shadow-sm' : 'text-slate-500'
                }`}>
                  <i className={`fa-solid ${spec.icon} text-xs`}></i>
                </div>
                <span className="text-[9px] font-bold tracking-tight leading-tight">{spec.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Queue Overview Section */}
        <div className="space-y-4 border-t border-slate-100 pt-6 text-left">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setQueueOpen(!queueOpen)}>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">Appointment queue</h3>
            <i className={`fa-solid fa-chevron-down text-slate-400 text-xs transition-transform duration-200 ${queueOpen ? 'rotate-180' : ''}`}></i>
          </div>

          {queueOpen && (
            <div className="space-y-3">
              {bookedQueue.filter(q => q.status !== 'cancelled').map((q, idx) => (
                <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-bold text-brand-sidebar uppercase tracking-wider">{q.specialty}</span>
                      <h4 className="text-xs font-bold text-slate-800">{q.doctor_name}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{q.date}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white rounded-xl p-2.5 border border-slate-100">
                      <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Queue</span>
                      <strong className="text-xs text-slate-800 font-extrabold block mt-0.5">Q-{10 + idx}</strong>
                    </div>

                    <div className="bg-white rounded-xl p-2.5 border border-slate-100">
                      <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Time</span>
                      <strong className="text-[10px] text-brand-sidebar font-extrabold block mt-0.5">{q.time_slot}</strong>
                    </div>

                    <div className="bg-white rounded-xl p-2.5 border border-slate-100">
                      <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Status</span>
                      <strong className="text-[10px] text-emerald-600 font-extrabold block mt-0.5 uppercase">{q.status}</strong>
                    </div>
                  </div>
                </div>
              ))}

              {bookedQueue.filter(q => q.status !== 'cancelled').length === 0 && (
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center text-xs text-slate-400">
                  No active appointments in queue.
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Confirmation Modal */}
      {bookingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-slate-100 space-y-6 text-left">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <span className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl text-emerald-650">✓</span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Verify Booking</h3>
                <p className="text-[10px] text-slate-400 font-semibold">NovaCare OS Clinical Appointment System</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-400">Doctor</span>
                <span className="font-extrabold text-slate-800">{bookingDetails.doctor}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-400">Specialty</span>
                <span className="font-bold text-slate-700">{bookingDetails.specialty}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-400">Date</span>
                <span className="font-bold text-slate-700">{bookingDetails.date}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-400">Time Window</span>
                <span className="font-extrabold text-brand-sidebar">{bookingDetails.time}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-400">Consultation Fee</span>
                <span className="font-extrabold text-emerald-600">Free / Covered</span>
              </div>
              <div className="pt-2.5 border-t border-slate-50">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Reason Description</span>
                <p className="text-xs text-slate-650 bg-slate-50 border border-slate-100 p-2.5 rounded-lg leading-relaxed font-medium">
                  {bookingDetails.reason}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBookingDetails(null)}
                className="flex-1 py-3 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBooking}
                className="flex-1 py-3 text-xs font-bold text-white bg-brand-sidebar hover:bg-brand-sidebarHover rounded-xl shadow-md"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Profile Overlay Modal */}
      {isDocModalOpen && modalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl border border-slate-100 space-y-6 text-left relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsDocModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-250 flex items-center justify-center text-slate-500 transition-all border border-slate-150"
            >
              ✕
            </button>

            <div className="flex gap-4 pb-4 border-b border-slate-100 mt-2">
              <img 
                src={modalDoc.avatar_url} 
                className="w-20 h-20 rounded-2xl object-cover border border-slate-150 shadow-sm" 
                alt="Doctor Profile" 
              />
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase bg-indigo-50 text-indigo-600">{modalDoc.specialty}</span>
                <h3 className="text-lg font-extrabold text-slate-900">{modalDoc.name}</h3>
                <p className="text-xs text-slate-400 font-semibold">
                  <i className="fa-solid fa-graduation-cap text-[10px] mr-1"></i> {modalDoc.education}
                </p>
                <div className="flex items-center gap-1.5 pt-0.5 text-[11px] font-bold text-slate-500">
                  <span className="text-amber-500">⭐</span>
                  <span>{modalDoc.rating} ({modalDoc.reviews_count || 140} reviews)</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{modalDoc.years_experience} Experience</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Biography</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">{modalDoc.bio}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Medical License</span>
                  <span className="text-xs font-bold text-slate-700 block mt-1">{modalDoc.license}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Office Location</span>
                  <span className="text-xs font-bold text-slate-700 block mt-1">{modalDoc.location}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Availability Cycle</span>
                  <span className="text-xs font-bold text-slate-700 block mt-1">{modalDoc.schedule}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Operating Hours</span>
                  <span className="text-xs font-bold text-slate-700 block mt-1">{modalDoc.availability}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => { setSelectedDoc(modalDoc); setSelectedSlot(''); setIsDocModalOpen(false); }}
                className="w-full py-3 bg-brand-sidebar hover:bg-brand-sidebarHover text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 uppercase tracking-wider transition-all"
              >
                Select Doctor & Set Schedule
              </button>
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

export default BookAppointment;
