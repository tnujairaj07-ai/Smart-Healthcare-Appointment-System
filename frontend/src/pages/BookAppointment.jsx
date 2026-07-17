import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

const DOCTORS = [
  {
    id: 1,
    name: 'Dr. Dianne Russell',
    specialty: 'General Practitioner',
    rating: 4.8,
    reviews: 120,
    fee: '$100',
    slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'],
    image: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=250',
    availableDays: [1, 2, 3, 4, 5] // Mon-Fri
  },
  {
    id: 2,
    name: 'Dr. Albert Flores',
    specialty: 'Cardiologist',
    rating: 4.9,
    reviews: 95,
    fee: '$150',
    slots: ['09:30 AM', '11:30 AM', '02:30 PM', '04:00 PM'],
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250',
    availableDays: [1, 3, 5] // Mon, Wed, Fri
  },
  {
    id: 3,
    name: 'Dr. Savannah Nguyen',
    specialty: 'Dermatologist',
    rating: 4.7,
    reviews: 154,
    fee: '$120',
    slots: ['10:30 AM', '01:00 PM', '03:30 PM', '05:00 PM'],
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    availableDays: [2, 4] // Tue, Thu
  },
  {
    id: 4,
    name: 'Dr. Helena Ross',
    specialty: 'Cardiologist',
    rating: 4.9,
    reviews: 210,
    fee: '$160',
    slots: ['09:00 AM', '10:30 AM', '03:00 PM'],
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250',
    availableDays: [1, 2, 4, 5]
  }
];

const SPECIALTIES = ['All', 'General Practitioner', 'Cardiologist', 'Dermatologist'];

const BookAppointment = () => {
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [bookingDetails, setBookingDetails] = useState(null);

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const filteredDocs = DOCTORS.filter((doc) => {
    if (selectedSpecialty === 'All') return true;
    return doc.specialty === selectedSpecialty;
  });

  const handleBookSubmit = (e) => {
    e.preventDefault();
    if (!selectedDoc || !selectedDate || !selectedSlot) {
      triggerToast('Please complete all selection steps first!', 'error');
      return;
    }

    setBookingDetails({
      doctor: selectedDoc.name,
      specialty: selectedDoc.specialty,
      date: selectedDate,
      time: selectedSlot,
      fee: selectedDoc.fee,
      reason: reason || 'Routine wellness screening checkup'
    });
  };

  const confirmBooking = () => {
    triggerToast('Appointment booked successfully! Synced to medical calendar.', 'success');
    setBookingDetails(null);
    setSelectedDoc(null);
    setSelectedDate('');
    setSelectedSlot('');
    setReason('');
  };

  return (
    <div className="flex h-screen bg-[#f4f7fc] overflow-hidden w-full font-sans antialiased text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
        <Navbar title="Book Appointment" />

        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto space-y-6 flex-1 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT: DOCTOR SELECTION WORKSPACE (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Specialty Chips */}
              <div className="dashboard-card p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-left">Filter by Specialty</h3>
                <div className="flex flex-wrap gap-2.5">
                  {SPECIALTIES.map((spec) => (
                    <button
                      key={spec}
                      onClick={() => {
                        setSelectedSpecialty(spec);
                        setSelectedDoc(null);
                        setSelectedSlot('');
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedSpecialty === spec
                          ? 'bg-brand-sidebar text-white border-indigo-500 shadow-md'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Doctor List */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 text-left">Available Medical Professionals</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoc(doc);
                        setSelectedSlot('');
                      }}
                      className={`dashboard-card p-5 flex flex-col justify-between cursor-pointer border-2 transition-all hover:translate-y-[-2px] ${
                        selectedDoc?.id === doc.id
                          ? 'border-indigo-500 shadow-lg shadow-indigo-100'
                          : 'border-transparent hover:border-slate-200'
                      }`}
                    >
                      <div className="flex gap-4 text-left">
                        <img
                          src={doc.image}
                          alt={doc.name}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-100 flex-shrink-0"
                        />
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">{doc.name}</h4>
                          <p className="text-[10px] font-semibold text-indigo-600 tracking-wide">{doc.specialty}</p>
                          <div className="flex items-center gap-1.5 pt-1 text-[11px] font-bold text-slate-500">
                            <span className="text-amber-500">⭐</span>
                            <span>{doc.rating}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{doc.reviews} reviews</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-50">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Session Fee</span>
                          <span className="text-xs font-extrabold text-slate-800">{doc.fee}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                          selectedDoc?.id === doc.id
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {selectedDoc?.id === doc.id ? '✓ Selected' : 'Select'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT: DATE / TIME & CONFIRMATION PANEL (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              <form onSubmit={handleBookSubmit} className="dashboard-card p-6 space-y-5 text-left">
                <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span>📅</span> Slot Scheduler
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

                {/* Time Slot Grid */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    Available Slots {selectedDoc && `for ${selectedDoc.name}`}
                  </label>
                  {selectedDoc ? (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedDoc.slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 rounded-lg text-[11px] border font-bold text-center transition ${
                            selectedSlot === slot
                              ? 'bg-brand-sidebar text-white border-indigo-500 shadow-sm'
                              : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl text-center">
                      <p className="text-xs text-indigo-600 font-semibold">Please select a doctor to load available time slots.</p>
                    </div>
                  )}
                </div>

                {/* Reason Note */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Clinical Symptoms / Reason</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly state reason for visit (e.g. chronic asthma review, routine physical, throat pain)..."
                    className="w-full h-24 p-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-xl text-xs text-slate-700 font-medium resize-none outline-none transition placeholder-slate-300"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={!selectedDoc || !selectedDate || !selectedSlot}
                  className={`w-full py-3.5 font-bold rounded-xl shadow-lg text-xs tracking-wide uppercase transition-all ${
                    selectedDoc && selectedDate && selectedSlot
                      ? 'bg-brand-sidebar hover:bg-brand-sidebarHover text-white cursor-pointer'
                      : 'bg-indigo-50 text-indigo-400 cursor-not-allowed border border-indigo-100/40'
                  }`}
                >
                  Verify Scheduling Details
                </button>
              </form>

            </div>

          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {bookingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-slate-100 space-y-6 text-left">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <span className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl">✓</span>
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
                <span className="font-extrabold text-emerald-600">{bookingDetails.fee}</span>
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
                onClick={() => setBookingDetails(null)}
                className="flex-1 py-3 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={confirmBooking}
                className="flex-1 py-3 text-xs font-bold text-white bg-brand-sidebar hover:bg-brand-sidebarHover rounded-xl shadow-md"
              >
                Confirm Booking
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
