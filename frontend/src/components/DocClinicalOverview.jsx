import React, { useState, useEffect } from 'react';

const DocClinicalOverview = ({ 
  appointments, 
  stats, 
  doctorProfile, 
  onUpdateProfile, 
  onTabChange, 
  onUpdateStatus, 
  onRejectAppointment 
}) => {
  // Modal & Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Filter & Pagination states for "Today Patient"
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCheckup, setFilterCheckup] = useState(true);
  const [filterUrgent, setFilterUrgent] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 6;

  // Timeslots state
  const [timeSlots, setTimeSlots] = useState([
    { time: '09:00 AM', status: 'available' },
    { time: '09:30 AM', status: 'selected' },
    { time: '10:00 AM', status: 'available' },
    { time: '10:30 AM', status: 'available' },
    { time: '11:30 AM', status: 'available' },
    { time: '12:00 PM', status: 'available' },
    { time: '02:00 PM', status: 'available' },
    { time: '02:30 PM', status: 'available' },
    { time: '03:00 PM', status: 'available' },
    { time: '03:30 PM', status: 'selected' }
  ]);

  // Reject mismatch modal state
  const [rejectingAppt, setRejectingAppt] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fallback doctor profile details
  const activeDoc = doctorProfile || {
    name: 'Dr. Brooklyn Simmons',
    specialty: 'Cardiologist',
    status: 'On Duty',
    image: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=400',
    gender: 'Female',
    email: 'brooklyn.s@novacare.com',
    phone: '(302) 555-0194',
    address: 'Inglewood, Maine',
    years_experience: '12+ Years',
    education: 'Stanford University Medical School',
    license: 'MD-2021-8843',
    specialization: 'Cardiology Specialist',
    totalPatients: 184,
    surgeries: 64,
    rating: '4.8',
    reviews_count: 95
  };

  // Sync edit form on modal open
  useEffect(() => {
    if (showEditModal) {
      setEditForm({
        name: activeDoc.name || '',
        specialty: activeDoc.specialty || '',
        specialization: activeDoc.specialization || '',
        gender: activeDoc.gender || 'Female',
        status: activeDoc.status || 'On Duty',
        email: activeDoc.email || '',
        phone: activeDoc.phone || '',
        address: activeDoc.address || '',
        education: activeDoc.education || '',
        license: activeDoc.license || ''
      });
    }
  }, [showEditModal, doctorProfile]);

  const triggerLocalToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    onUpdateProfile(editForm);
    setShowEditModal(false);
    triggerLocalToast('Doctor Profile updated successfully!');
  };

  const toggleTimeSlot = (index) => {
    const updated = [...timeSlots];
    const targetSlot = updated[index];
    if (targetSlot.status === 'selected') {
      targetSlot.status = 'available';
      triggerLocalToast(`Removed availability slot ${targetSlot.time}`);
    } else {
      targetSlot.status = 'selected';
      triggerLocalToast(`Reserved availability slot ${targetSlot.time}`);
    }
    setTimeSlots(updated);
  };

  // Filter logic for Today's Patients
  const filteredPatients = appointments.filter(appt => {
    if (appt.status === 'rejected') return false;

    const matchesSearch = 
      appt.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase());

    const isUrgentAppt = appt.triage?.isUrgent || appt.triage?.severity > 15;
    let matchesType = false;
    if (filterCheckup && !isUrgentAppt) matchesType = true;
    if (filterUrgent && isUrgentAppt) matchesType = true;
    if (!filterCheckup && !filterUrgent) matchesType = true;

    return matchesSearch && matchesType;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage) || 1;
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * patientsPerPage,
    currentPage * patientsPerPage
  );

  const getDisplayStatus = (status) => {
    if (status === 'completed' || status === 'in_consult' || status === 'scheduled') return 'Confirm';
    if (status === 'pending') return 'Pending';
    return 'Canceled';
  };

  const handleOpenReject = (appt) => {
    setRejectingAppt(appt);
    setRejectReason('');
    setErrorMsg('');
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      setErrorMsg('Rejection reason is required.');
      return;
    }
    onRejectAppointment(rejectingAppt.id, rejectReason);
    setRejectingAppt(null);
  };

  return (
    <div className="space-y-8 text-left relative">
      {/* Toast Popup Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 animate-bounce">
          <div className="w-8 h-8 rounded-full bg-brand-sidebar/20 flex items-center justify-center text-brand-sidebar">
            <i className="fa-solid fa-circle-info text-base text-indigo-400"></i>
          </div>
          <span className="font-bold text-xs uppercase tracking-wider">{toastMessage}</span>
        </div>
      )}

      {/* CORE CONTAINER (Grid profile + details/list) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
        
        {/* LEFT COLUMN: DOCTOR PROFILE CARD (col-span-5) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Doctor Profile</h2>
          </div>

          {/* Doctor Card Panel */}
          <div className="dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 space-y-6 relative">
            {/* Edit Profile Trigger Button */}
            <button 
              className="absolute top-4 right-4 w-9 h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center transition shadow-md hover:-translate-y-0.5 active:translate-y-0"
              onClick={() => setShowEditModal(true)}
            >
              <i className="fa-regular fa-pen-to-square text-xs"></i>
            </button>

            {/* Card Header Section */}
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start pt-2">
              <div className="relative flex-shrink-0">
                <img 
                  src={activeDoc.image}
                  className="w-28 h-28 rounded-2xl object-cover border-2 border-slate-100 shadow-md"
                  alt="Active Doctor Profile"
                />
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  activeDoc.status === 'Available' || activeDoc.status === 'On Duty'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {activeDoc.status}
                </span>
                <h3 className="text-xl font-bold text-slate-900 leading-tight">{activeDoc.name}</h3>
                <p className="text-xs text-slate-500 font-semibold">{activeDoc.specialty}</p>

                {/* Profile Actions Strip */}
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-3">
                  <button 
                    className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 transition flex items-center justify-center border border-slate-200 text-slate-600 hover:text-indigo-650 shadow-sm"
                    onClick={() => triggerLocalToast(`Dialing office desk: ${activeDoc.phone}`)}
                  >
                    <i className="fa-solid fa-phone text-xs"></i>
                  </button>
                  <button 
                    className="px-4 py-2 bg-[#5c6dfa] hover:bg-[#4e5ee6] text-white text-xs font-bold rounded-full transition flex items-center gap-2 shadow-md shadow-indigo-600/15"
                    onClick={() => onTabChange('schedule')}
                  >
                    <i className="fa-regular fa-calendar text-xs"></i> Booking
                  </button>
                  <button 
                    className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 transition flex items-center justify-center border border-slate-200 text-slate-600 hover:text-indigo-650 shadow-sm"
                    onClick={() => onTabChange('ai-assistant')}
                  >
                    <i className="fa-regular fa-comment-dots text-xs"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Details List */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              {/* Gender Row */}
              <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition duration-150">
                <span className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                    <i className="fa-solid fa-venus-mars text-xs"></i>
                  </span>
                  Gender
                </span>
                <span className="text-xs font-bold text-slate-800">{activeDoc.gender}</span>
              </div>

              {/* Email Row */}
              <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition duration-150">
                <span className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                    <i className="fa-regular fa-envelope text-xs"></i>
                  </span>
                  Email
                </span>
                <span className="text-xs font-bold text-slate-800 break-all ml-4 text-right truncate max-w-[200px]" title={activeDoc.email}>{activeDoc.email}</span>
              </div>

              {/* Phone Row */}
              <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition duration-150">
                <span className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                    <i className="fa-solid fa-phone-volume text-xs"></i>
                  </span>
                  Phone Number
                </span>
                <span className="text-xs font-bold text-slate-800 text-right">{activeDoc.phone}</span>
              </div>

              {/* Address Row */}
              <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition duration-150">
                <span className="flex items-center gap-3 text-xs text-slate-500 font-semibold shrink-0">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                    <i className="fa-solid fa-location-dot text-xs"></i>
                  </span>
                  Address
                </span>
                <span className="text-[11px] font-bold text-slate-800 text-right ml-4 line-clamp-1 truncate max-w-[200px]" title={activeDoc.address}>{activeDoc.address}</span>
              </div>

              {/* Experience Row */}
              <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition duration-150">
                <span className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                    <i className="fa-solid fa-briefcase text-xs"></i>
                  </span>
                  Experience
                </span>
                <span className="text-xs font-bold text-slate-800">{activeDoc.years_experience}</span>
              </div>

              {/* Education Row */}
              <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition duration-150">
                <span className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                    <i className="fa-solid fa-graduation-cap text-xs"></i>
                  </span>
                  Education
                </span>
                <span className="text-xs font-bold text-slate-800 text-right">{activeDoc.education}</span>
              </div>

              {/* License Number Row */}
              <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition duration-150">
                <span className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                    <i className="fa-solid fa-id-card text-xs"></i>
                  </span>
                  License Number
                </span>
                <span className="text-xs font-bold text-slate-800">{activeDoc.license}</span>
              </div>

              {/* Specialization Row */}
              <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition duration-150">
                <span className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                    <i className="fa-solid fa-stethoscope text-xs"></i>
                  </span>
                  Specialization
                </span>
                <span className="text-xs font-bold text-slate-800 text-right">{activeDoc.specialization}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: METRICS GRID, TODAY PATIENTS, AVAILABILITY (col-span-7) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          
          {/* Triple Stats Header Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stat 1: Total Patients */}
            <div className="dashboard-card p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[150px]">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Patients</h4>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{activeDoc.totalPatients}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg">
                  <i className="fa-solid fa-arrow-trend-up text-[10px]"></i> +3.5%
                </span>
                <span className="text-slate-400 text-[10px] font-semibold">Since Yesterday</span>
              </div>
            </div>

            {/* Stat 2: Surgeries */}
            <div className="dashboard-card p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[150px]">
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Surgeries</h4>
                  <span className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                    <i className="fa-solid fa-syringe text-xs"></i>
                  </span>
                </div>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{activeDoc.surgeries}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal font-medium">Total operational procedures executed successfully.</p>
            </div>

            {/* Stat 3: Star Reviews */}
            <div className="dashboard-card p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[150px]">
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reviews</h4>
                  <span className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                    <i className="fa-solid fa-star text-xs"></i>
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{activeDoc.rating}</span>
                  <span className="text-slate-400 text-xs font-semibold">/5.0</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal font-medium">Based on <span className="font-bold text-slate-700">{activeDoc.reviews_count}</span> reviews from verified patients.</p>
            </div>
          </div>

          {/* Today's Patients Queue List Card */}
          <div className="dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 space-y-4">
            
            {/* Header controls panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Today Patient</h3>
                
                {/* Search bar */}
                <div className="relative">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="Search name/symptoms..."
                    className="pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all"
                  />
                  <i className="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
                </div>

                {/* Category selectors */}
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={filterCheckup} 
                      onChange={(e) => { setFilterCheckup(e.target.checked); setCurrentPage(1); }}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                    />
                    <span className="text-slate-600 font-bold">Check-up</span>
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={filterUrgent} 
                      onChange={(e) => { setFilterUrgent(e.target.checked); setCurrentPage(1); }}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                    />
                    <span className="text-slate-600 font-bold">Urgent Visit</span>
                  </label>
                </div>
              </div>

              {/* Paginator block */}
              <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                <span className="text-xs text-slate-500 font-semibold">
                  Page <span className="font-extrabold text-slate-800">{currentPage}</span> of <span className="font-extrabold text-slate-800">{totalPages}</span>
                </span>
                <div className="flex gap-1">
                  <button 
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center justify-center text-xs border border-slate-200 disabled:opacity-40"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  <button 
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center justify-center text-xs border border-slate-200 disabled:opacity-40"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Patients list dynamic grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedPatients.length > 0 ? (
                paginatedPatients.map((patient, index) => {
                  const patientStatus = getDisplayStatus(patient.status);
                  return (
                    <div 
                      key={patient.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 hover:bg-indigo-50/20 hover:border-indigo-150 transition cursor-pointer relative group flex flex-col justify-between"
                      onClick={() => onTabChange('records')}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-slate-700">{patient.timeSlot}</span>
                        
                        <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          patientStatus === 'Confirm'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : (patientStatus === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100')
                        }`}>
                          {patientStatus}
                        </span>
                      </div>

                      <div className="space-y-1 text-left">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-650 transition leading-snug">
                          {patient.diagnosis || 'Routine clinical checkup'}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold">{patient.patient?.name}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-8 text-center space-y-2">
                  <i className="fa-regular fa-folder-open text-slate-300 text-2xl block"></i>
                  <p className="text-xs text-slate-500 font-semibold">No active patient bookings match the current criteria.</p>
                </div>
              )}
            </div>
          </div>

          {/* Availability timeslots card */}
          <div className="dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Availability</h3>
              <span className="text-[9px] font-bold text-[#5c6dfa] bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg tracking-wider">
                TAP SLOTS TO TOGGLE CLINICAL BLOCKS
              </span>
            </div>

            {/* Timeslot grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {timeSlots.map((slot, idx) => (
                <button 
                  key={idx}
                  onClick={() => toggleTimeSlot(idx)}
                  className={`py-2.5 px-2 rounded-xl text-xs border text-center transition duration-200 select-none ${
                    slot.status === 'selected'
                      ? 'bg-[#5c6dfa] text-white border-indigo-500 shadow-md shadow-indigo-600/10 hover:bg-[#4e5ee6] font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-650 border-slate-200 font-semibold'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: original Clinical Overview components */}

      {/* Action Shortcuts Card */}
      <div className="dashboard-card p-6 bg-gradient-to-r from-indigo-500 to-brand-sidebar text-white rounded-3xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div className="space-y-1 relative z-10 text-left">
          <h3 className="text-base font-extrabold tracking-tight">Clinical Quick Actions</h3>
          <p className="text-xs text-indigo-100 font-medium">Launch active patient consultations, draft prescriptions, or configure schedules instantly.</p>
        </div>
        <div className="flex gap-2 relative z-10 shrink-0">
          <button 
            onClick={() => onTabChange('queue')}
            className="px-4 py-2 bg-white text-indigo-650 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-sm transition"
          >
            🏥 Start Consult
          </button>
          <button 
            onClick={() => onTabChange('prescriptions')}
            className="px-4 py-2 bg-brand-coral hover:bg-brand-coralHover text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            💊 Issue Prescription
          </button>
          <button 
            onClick={() => onTabChange('schedule')}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition"
          >
            📅 Adjust Slots
          </button>
        </div>
        <div className="absolute right-0 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* Today's Schedule Timeline & Queue */}
      <div className="dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 flex-wrap gap-2">
          <div className="text-left">
            <h3 className="text-base font-bold text-slate-900">Today's Appointment Schedule</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Prioritized by arrival time slot and triage levels.</p>
          </div>
          <button 
            onClick={() => onTabChange('queue')}
            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 border border-indigo-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            View Queue Manager <i className="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </div>

        <div className="space-y-3">
          {appointments.length > 0 ? (
            appointments.map((appt) => {
              if (appt.status === 'rejected') return null;
              
              const triageColor = appt.triage?.isUrgent 
                ? 'bg-rose-50 text-rose-700 border-rose-100' 
                : (appt.triage?.severity > 10 
                  ? 'bg-orange-50 text-orange-700 border-orange-100' 
                  : 'bg-indigo-50 text-indigo-750 border-indigo-100');
                  
              const statusClass = 
                appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                appt.status === 'in_consult' ? 'bg-purple-50 text-purple-700 border-purple-100 animate-pulse' :
                appt.status === 'no_show' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                'bg-amber-50 text-amber-700 border-amber-100';

              return (
                <div 
                  key={appt.id}
                  className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
                >
                  {/* Left demographics / schedule details */}
                  <div className="flex items-start gap-4">
                    <div className="bg-white border border-slate-200/80 p-2.5 rounded-xl shadow-sm text-center min-w-[90px] shrink-0">
                      <span className="block text-[8px] text-slate-400 font-extrabold uppercase tracking-widest">Time Slot</span>
                      <span className="block text-xs font-extrabold text-slate-800 mt-0.5">{appt.timeSlot}</span>
                    </div>

                    <div className="text-left space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-900">{appt.patient?.name}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          (Age: {appt.patient?.dob ? (new Date().getFullYear() - new Date(appt.patient.dob.split('.').reverse().join('-')).getFullYear()) || '32' : '32'})
                        </span>
                        <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border ${triageColor}`}>
                          Triage: {appt.triage?.isUrgent ? 'Critical' : (appt.triage?.severity > 10 ? 'High' : 'Normal')}
                        </span>
                      </div>
                      
                      <div className="text-xs font-medium text-slate-650 flex items-center gap-1.5 flex-wrap">
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-250 text-[10px] font-bold text-indigo-650">Reason: {appt.diagnosis || 'General Practitioner checkup'}</span>
                        {appt.patient?.chronic && appt.patient.chronic !== 'None' && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-100 rounded px-1.5 py-0.5 text-[9px] font-bold">Chronic: {appt.patient.chronic}</span>
                        )}
                        {appt.patient?.allergies && appt.patient.allergies !== 'None' && (
                          <span className="bg-rose-50 text-rose-700 border border-rose-100 rounded px-1.5 py-0.5 text-[9px] font-bold">Allergies: {appt.patient.allergies}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status indicators */}
                  <div className="flex items-center gap-2 justify-between lg:justify-end shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusClass} capitalize`}>
                      {appt.status.replace('_', ' ')}
                    </span>
                    
                    <div className="flex gap-1.5">
                      {appt.status === 'scheduled' || appt.status === 'pending' ? (
                        <>
                          <button 
                            onClick={() => onUpdateStatus(appt.id, 'in_consult')}
                            className="px-3 py-1.5 bg-brand-sidebar hover:bg-brand-sidebarHover text-white text-[10px] font-extrabold rounded-lg shadow transition-all uppercase tracking-wider"
                          >
                            Start Consult
                          </button>
                          <button 
                            onClick={() => handleOpenReject(appt)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-650 text-[10px] font-extrabold rounded-lg transition-all uppercase tracking-wider"
                          >
                            Flag Mismatch
                          </button>
                        </>
                      ) : appt.status === 'in_consult' ? (
                        <button 
                          onClick={() => onUpdateStatus(appt.id, 'completed')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold rounded-lg shadow transition-all uppercase tracking-wider"
                        >
                          Complete Consult
                        </button>
                      ) : null}
                      
                      <button 
                        onClick={() => onTabChange('records')}
                        className="p-1.5 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-500 hover:text-indigo-650 rounded-lg transition"
                        title="View Patient Health Chart"
                      >
                        <i className="fa-solid fa-address-book text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center space-y-2">
              <i className="fa-regular fa-folder-open text-slate-300 text-3xl block"></i>
              <p className="text-xs text-slate-500 font-semibold">No patient bookings scheduled for today.</p>
            </div>
          )}
        </div>
      </div>

      {/* EDIT DOCTOR PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <form 
            onSubmit={handleSaveProfile}
            className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative space-y-5"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Edit Doctor Profile <i className="fa-solid fa-user-gear text-brand-sidebar"></i>
              </h3>
              <button 
                type="button"
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
                onClick={() => setShowEditModal(false)}
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Editing Content Area */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-brand-sidebar text-sm font-semibold text-slate-800 focus:outline-none"
                  required
                />
              </div>

              {/* Specialty & Detailed Specialization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Specialty Header</label>
                  <input 
                    type="text" 
                    value={editForm.specialty}
                    onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-brand-sidebar text-sm font-semibold text-slate-800 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Detailed Specialization</label>
                  <input 
                    type="text" 
                    value={editForm.specialization}
                    onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-brand-sidebar text-sm font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Gender & Status selections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Gender</label>
                  <select 
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-brand-sidebar text-sm font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                  <select 
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-brand-sidebar text-sm font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="On Duty">On Duty</option>
                    <option value="Away">Away</option>
                  </select>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={editForm.email}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-sm font-semibold focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                  <input 
                    type="text" 
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-brand-sidebar text-sm font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Clinic Address</label>
                <input 
                  type="text" 
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-brand-sidebar text-sm font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              {/* Credentials Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Education / School</label>
                  <input 
                    type="text" 
                    value={editForm.education}
                    onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-brand-sidebar text-sm font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">License No.</label>
                  <input 
                    type="text" 
                    value={editForm.license}
                    onChange={(e) => setEditForm({ ...editForm, license: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-brand-sidebar text-sm font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button 
                type="button"
                className="px-5 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#5c6dfa] hover:bg-[#4e5ee6] rounded-xl shadow-md transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reject specialty mismatch dialog */}
      {rejectingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm text-slate-800">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation text-rose-500 animate-pulse"></i> Specialty Mismatch Alert
              </h3>
              <button 
                onClick={() => setRejectingAppt(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-normal font-medium">
                You are flagging a specialty alignment mismatch for patient <strong>{rejectingAppt.patient?.name}</strong>. 
                This appointment will be canceled, and a relocation ticket will be sent to the hospital admin to schedule another specialist at no extra cost.
              </p>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">State Reason for Mismatch Rejection</label>
                <textarea 
                  value={rejectReason}
                  onChange={(e) => { setRejectReason(e.target.value); setErrorMsg(''); }}
                  placeholder="e.g. Symptoms checked show Respiratory Asthma. Patient requires a Pulmonologist rather than Cardiologist."
                  rows="3"
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-400 rounded-xl text-xs text-slate-800 font-medium resize-none outline-none outline-transparent transition"
                />
                {errorMsg && <p className="text-[10px] text-rose-600 font-bold mt-1">⚠️ {errorMsg}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button 
                onClick={() => setRejectingAppt(null)}
                className="px-5 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Go Back
              </button>
              <button 
                onClick={handleConfirmReject}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md"
              >
                Confirm Rejection & Alert Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocClinicalOverview;
