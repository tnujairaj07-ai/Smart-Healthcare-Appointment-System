import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

const DOCTORS = [
  {
    name: 'Dr. Dianne Russell',
    specialty: 'General Practitioner',
    status: 'Available',
    image: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=400',
    gender: 'Female',
    email: 'dianne.russell@novacareos.com',
    phone: '(704) 555-0127',
    address: '6391 Elgin St. Celina, Delaware 10299',
    experience: '10+ Years',
    education: 'Harvard Medical School',
    license: 'MD-2023-4982',
    specialization: 'Neurology Primary Care',
    totalPatients: 230,
    surgeries: 90,
    rating: '4.5',
    reviewsCount: 120,
  },
  {
    name: 'Dr. Albert Flores',
    specialty: 'Cardiologist',
    status: 'On Duty',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    gender: 'Male',
    email: 'albert.flores@novacareos.com',
    phone: '(302) 555-0194',
    address: '8502 Preston Rd. Inglewood, Maine 98380',
    experience: '12+ Years',
    education: 'Stanford University Medical School',
    license: 'MD-2021-8843',
    specialization: 'Cardiology Specialist',
    totalPatients: 184,
    surgeries: 64,
    rating: '4.9',
    reviewsCount: 95,
  },
  {
    name: 'Dr. Savannah Nguyen',
    specialty: 'Dermatologist',
    status: 'Available',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    gender: 'Female',
    email: 'savannah.n@novacareos.com',
    phone: '(405) 555-0128',
    address: '1901 Thornridge Cir. Shiloh, Hawaii 81063',
    experience: '18+ Years',
    education: 'Johns Hopkins School of Medicine',
    license: 'MD-2024-1102',
    specialization: 'Cosmetic Dermatology',
    totalPatients: 310,
    surgeries: 12,
    rating: '4.8',
    reviewsCount: 154,
  },
];

const PATIENTS = [
  { time: '09:40 AM', type: 'Check-up', status: 'Confirm', treatment: 'Routine check up', patientName: 'Leslie Alexander' },
  { time: '10:15 AM', type: 'Urgent visit', status: 'Pending', treatment: 'Dermatology consultation', patientName: 'Savannah Nguyen' },
  { time: '11:00 AM', type: 'Check-up', status: 'Canceled', treatment: 'Routine check up', patientName: 'Jerome Bell' },
  { time: '11:30 AM', type: 'Check-up', status: 'Confirm', treatment: 'Physical therapy', patientName: 'Dianne Russell' },
  { time: '01:15 PM', type: 'Urgent visit', status: 'Canceled', treatment: 'Routine check up', patientName: 'Kristin Watson' },
  { time: '02:00 PM', type: 'Check-up', status: 'Confirm', treatment: 'Nutrition counseling', patientName: 'Albert Flores' },
  { time: '02:30 PM', type: 'Check-up', status: 'Confirm', treatment: 'Cardio evaluation', patientName: 'Arlene McCoy' },
  { time: '03:00 PM', type: 'Urgent visit', status: 'Confirm', treatment: 'Neurology assessment', patientName: 'Bessie Cooper' },
  { time: '03:45 PM', type: 'Check-up', status: 'Pending', treatment: 'Vaccination routine', patientName: 'Devon Lane' },
  { time: '04:15 PM', type: 'Urgent visit', status: 'Canceled', treatment: 'Chronic Pain check', patientName: 'Cody Fisher' },
  { time: '05:00 PM', type: 'Check-up', status: 'Confirm', treatment: 'General consult', patientName: 'Theresa Webb' },
  { time: '05:30 PM', type: 'Check-up', status: 'Pending', treatment: 'Orthopedic follow-up', patientName: 'Eleanor Pena' },
];

const INITIAL_SLOTS = [
  { time: '09:00 AM', selected: false },
  { time: '09:30 AM', selected: true },
  { time: '10:00 AM', selected: false },
  { time: '10:30 AM', selected: false },
  { time: '11:30 AM', selected: false },
  { time: '12:00 PM', selected: false },
  { time: '02:00 PM', selected: false },
  { time: '02:30 PM', selected: false },
];

const statusClasses = {
  Confirm: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
  Canceled: 'bg-rose-50 text-rose-700 border-rose-100',
};

const DoctorDashboard = () => {
  const [toast, setToast] = useState({ show: false, message: '' });
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCheckup, setFilterCheckup] = useState(true);
  const [filterUrgent, setFilterUrgent] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeSlots, setTimeSlots] = useState(INITIAL_SLOTS);
  const [showEditModal, setShowEditModal] = useState(false);
  const patientsPerPage = 6;

  const activeDoc = DOCTORS[currentDocIndex];

  const triggerToast = (msg) => {
    setToast({ show: true, message: msg });
  };

  const filteredPatients = PATIENTS.filter((p) => {
    const matchesSearch =
      p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.treatment.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesType =
      (!filterCheckup && !filterUrgent) ||
      (filterCheckup && p.type === 'Check-up') ||
      (filterUrgent && p.type === 'Urgent visit');
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage) || 1;
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * patientsPerPage,
    currentPage * patientsPerPage
  );

  const toggleSlot = (idx) => {
    const updated = [...timeSlots];
    updated[idx].selected = !updated[idx].selected;
    setTimeSlots(updated);
    triggerToast(
      updated[idx].selected
        ? `Reserved slot: ${updated[idx].time}`
        : `Cleared slot: ${updated[idx].time}`
    );
  };

  return (
    <div className="flex h-screen bg-[#f4f7fc] overflow-hidden w-full font-sans antialiased text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
        <Navbar
          title="Doctor Management"
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          toggleAlerts={() => triggerToast('No pending notifications')}
        />

        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 pb-16">

          {/* LEFT: Doctor Profile Card */}
          <div className="xl:col-span-5 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentDocIndex((i) => (i - 1 + DOCTORS.length) % DOCTORS.length)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-slate-50 flex items-center justify-center border border-slate-200 transition shadow-sm"
                >
                  <i className="fa-solid fa-arrow-left text-slate-600 text-xs"></i>
                </button>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Doctor Profile</h2>
              </div>
              <button
                onClick={() => { setCurrentDocIndex((i) => (i + 1) % DOCTORS.length); triggerToast('Switched active doctor profile'); }}
                className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition"
              >
                <i className="fa-solid fa-rotate mr-1"></i> Switch Profile
              </button>
            </div>

            <div className="dashboard-card p-6 space-y-6 relative">
              <button
                onClick={() => setShowEditModal(true)}
                className="absolute top-4 right-4 w-9 h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center transition shadow-md"
              >
                <i className="fa-regular fa-pen-to-square text-xs"></i>
              </button>

              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start pt-2">
                <div className="relative flex-shrink-0">
                  <img
                    src={activeDoc.image}
                    className="w-28 h-28 rounded-2xl object-cover border-2 border-slate-100 shadow-md"
                    alt={activeDoc.name}
                  />
                  <span className="absolute -bottom-2 -right-2 text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full shadow">
                    {activeDoc.status}
                  </span>
                </div>

                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">{activeDoc.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{activeDoc.specialty}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-3">
                    <button
                      onClick={() => triggerToast(`Dialing: ${activeDoc.phone}`)}
                      className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600 hover:text-indigo-600 shadow-sm"
                    >
                      <i className="fa-solid fa-phone text-xs"></i>
                    </button>
                    <button
                      onClick={() => triggerToast(`Opening calendar for ${activeDoc.name}`)}
                      className="px-4 py-2 bg-brand-sidebar hover:bg-brand-sidebarHover text-white text-xs font-bold rounded-full shadow-md flex items-center gap-2"
                    >
                      <i className="fa-regular fa-calendar text-xs"></i> Booking
                    </button>
                    <button
                      onClick={() => triggerToast(`Messaging ${activeDoc.name}`)}
                      className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600 hover:text-indigo-600 shadow-sm"
                    >
                      <i className="fa-regular fa-comment-dots text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-4 border-t border-slate-100">
                {[
                  { icon: 'fa-venus-mars', label: 'Gender', value: activeDoc.gender },
                  { icon: 'fa-envelope', label: 'Email', value: activeDoc.email },
                  { icon: 'fa-phone-volume', label: 'Phone', value: activeDoc.phone },
                  { icon: 'fa-location-dot', label: 'Address', value: activeDoc.address },
                  { icon: 'fa-briefcase', label: 'Experience', value: activeDoc.experience },
                  { icon: 'fa-graduation-cap', label: 'Education', value: activeDoc.education },
                  { icon: 'fa-id-card', label: 'License', value: activeDoc.license },
                  { icon: 'fa-stethoscope', label: 'Specialization', value: activeDoc.specialization },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex justify-between items-center p-2.5 rounded-xl hover:bg-slate-50">
                    <span className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                        <i className={`fa-solid ${icon} text-xs`}></i>
                      </span>
                      {label}
                    </span>
                    <span className="text-xs font-bold text-slate-800 text-right ml-4 truncate max-w-[180px]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Stats, Patients, Slots */}
          <div className="xl:col-span-7 flex flex-col gap-6">

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Patients', value: activeDoc.totalPatients, sub: '+3.5% since yesterday', subColor: 'text-emerald-600', icon: null },
                { label: 'Surgeries', value: activeDoc.surgeries, sub: 'Total procedures completed', subColor: 'text-slate-400', icon: 'fa-syringe' },
                { label: 'Reviews', value: activeDoc.rating, sub: `Based on ${activeDoc.reviewsCount} verified patients`, subColor: 'text-slate-400', icon: 'fa-star' },
              ].map(({ label, value, sub, subColor, icon }) => (
                <div key={label} className="dashboard-card p-5 flex flex-col justify-between h-[150px]">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</h4>
                      {icon && (
                        <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                          <i className={`fa-solid ${icon} text-xs`}></i>
                        </span>
                      )}
                    </div>
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight block mt-2">{value}</span>
                  </div>
                  <p className={`text-[10px] font-semibold ${subColor}`}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Today's Patients */}
            <div className="dashboard-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <h3 className="text-lg font-bold text-slate-900">Today's Patients</h3>
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={filterCheckup} onChange={(e) => { setFilterCheckup(e.target.checked); setCurrentPage(1); }} className="w-4 h-4 rounded text-indigo-600" />
                      <span className="text-slate-600 font-bold">Check-up</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={filterUrgent} onChange={(e) => { setFilterUrgent(e.target.checked); setCurrentPage(1); }} className="w-4 h-4 rounded text-indigo-600" />
                      <span className="text-slate-600 font-bold">Urgent Visit</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-xs text-slate-500 font-semibold">
                    Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong>
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs border border-slate-200 disabled:opacity-40"
                    >
                      <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs border border-slate-200 disabled:opacity-40"
                    >
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedPatients.map((patient, index) => (
                  <div
                    key={index}
                    onClick={() => triggerToast(`Loading chart for: ${patient.patientName}`)}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100/50 transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-700">{patient.time}</span>
                      <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusClasses[patient.status]}`}>
                        {patient.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-left">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">{patient.treatment}</h4>
                      <p className="text-[11px] text-slate-400 font-semibold">{patient.patientName}</p>
                    </div>
                  </div>
                ))}

                {filteredPatients.length === 0 && (
                  <div className="col-span-full py-12 text-center space-y-2">
                    <i className="fa-regular fa-folder-open text-slate-300 text-2xl"></i>
                    <p className="text-xs text-slate-500 font-semibold">No active patient bookings match current filters.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Availability Slots */}
            <div className="dashboard-card p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Availability</h3>
                <span className="text-[9px] font-bold text-brand-sidebar bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                  TAP TO TOGGLE RESERVATION
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {timeSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleSlot(idx)}
                    className={`py-2.5 px-2 rounded-xl text-xs border text-center transition duration-200 select-none ${
                      slot.selected
                        ? 'bg-brand-sidebar text-white border-indigo-500 shadow-md font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 font-semibold'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Edit Doctor Profile <i className="fa-solid fa-user-gear text-brand-sidebar"></i>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <p className="text-xs text-slate-400">Edit functionality will be connected to backend API endpoints once integration is complete.</p>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
              <button onClick={() => { setShowEditModal(false); triggerToast('Doctor profile updated!'); }} className="px-5 py-2.5 text-xs font-bold text-white bg-brand-sidebar hover:bg-brand-sidebarHover rounded-xl shadow-md">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <Toast show={toast.show} message={toast.message} onClose={() => setToast({ show: false, message: '' })} />
    </div>
  );
};

export default DoctorDashboard;
