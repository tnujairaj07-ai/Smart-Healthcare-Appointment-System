import React, { useState, useEffect } from 'react';

const DocSettings = () => {
  const [profile, setProfile] = useState({
    name: 'Dr. Dianne Russell',
    specialty: 'Cardiologist',
    hospital: 'St. Jude General',
    experience: 10,
    npi: '1084329011',
    languages: 'English, Spanish',
    phone: '(704) 555-0127',
    address: '6391 Elgin St. Celina, Delaware 10299',
    description: 'Specializes in clinical cardiology, stress testing, and preventive heart care interventions.'
  });

  const [preferences, setPreferences] = useState({
    defaultConsultType: 'in-person',
    emailAlerts: true,
    smsAlerts: false,
    shareWithAdminDashboard: true
  });

  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // In our Flask backend, doctors get their profile through: GET /api/doctors/<id>/profile
    // We mock fetch doctor profile from first doctor or use standard JWT endpoint
    const token = localStorage.getItem('token');
    fetch('/api/patient/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(user => {
        if (user) {
          // Now fetch doctor profile from doctor id if we are a doctor
          fetch(`/api/admin/doctors`)
            .then(res => res.ok ? res.json() : [])
            .then(docs => {
              const myDoc = docs.find(d => d.email === user.email);
              if (myDoc) {
                setProfile({
                  id: myDoc.id,
                  name: myDoc.name,
                  specialty: myDoc.specialty,
                  hospital: myDoc.hospital || 'St. Jude General',
                  experience: myDoc.years_experience || 5,
                  npi: myDoc.npi || '1000000000',
                  languages: myDoc.languages || 'English',
                  phone: myDoc.phone || '',
                  address: myDoc.address || '',
                  description: myDoc.description || ''
                });
              }
              setLoading(false);
            })
            .catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSuccessMsg('');

    // Save changes via Admin put or general update endpoint if implemented
    const token = localStorage.getItem('token');
    fetch(`/api/admin/doctors/${profile.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: profile.name,
        specialty: profile.specialty,
        phone: profile.phone,
        address: profile.address,
        description: profile.description,
        npi: profile.npi,
        languages: profile.languages,
        hospital: profile.hospital,
        years_experience: parseInt(profile.experience)
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update doctor profile settings.');
        return res.json();
      })
      .then(() => {
        setSuccessMsg('Professional profile settings successfully synchronized!');
        setTimeout(() => setSuccessMsg(''), 4500);
      })
      .catch(err => alert(err.message));
  };

  return (
    <div className="space-y-6 text-slate-850 text-left">
      
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-650 mx-auto"></div>
          <p className="text-xs text-slate-500 font-bold">Synchronizing account configurations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Edit Profile Form (col-span-8) */}
          <form onSubmit={handleSaveProfile} className="lg:col-span-8 dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Professional Profile Settings</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Configure biography details, licenses, NPI numbers, and hospital assignments.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Doctor Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Clinical Specialty</label>
                <input
                  type="text"
                  value={profile.specialty}
                  onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-400"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hospital Base</label>
                <input
                  type="text"
                  value={profile.hospital}
                  onChange={(e) => setProfile({ ...profile, hospital: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Years of Experience</label>
                <input
                  type="number"
                  value={profile.experience}
                  onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">NPI Number (10 Digit)</label>
                <input
                  type="text"
                  value={profile.npi}
                  onChange={(e) => setProfile({ ...profile, npi: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Clinic Phone</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Languages Spoken</label>
                <input
                  type="text"
                  value={profile.languages}
                  onChange={(e) => setProfile({ ...profile, languages: e.target.value })}
                  placeholder="e.g. English, Spanish"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Clinic Location Address</label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Professional Bio/About</label>
              <textarea
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                rows={3}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-850 rounded-xl outline-none focus:bg-white focus:border-indigo-400 resize-none"
              />
            </div>

            {successMsg && <p className="text-[10px] text-emerald-600 font-bold">✓ {successMsg}</p>}

            <button
              type="submit"
              className="w-full py-3 bg-brand-sidebar hover:bg-brand-sidebarHover text-white text-xs font-bold rounded-xl shadow-md transition uppercase tracking-wider"
            >
              Save Credentials Changes
            </button>
          </form>

          {/* Right Column: Preferences & Security Settings (col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Preferences */}
            <div className="dashboard-card p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">App Preferences</h3>
              
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-650">
                  <span>Default Consult Method</span>
                  <select
                    value={preferences.defaultConsultType}
                    onChange={(e) => setPreferences({ ...preferences, defaultConsultType: e.target.value })}
                    className="p-1 border border-slate-200 rounded text-[10.5px]"
                  >
                    <option value="in-person">In-Person Slot</option>
                    <option value="video">Video Call</option>
                  </select>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold text-slate-650">
                  <span>Email Alerts on Booking</span>
                  <input
                    type="checkbox"
                    checked={preferences.emailAlerts}
                    onChange={(e) => setPreferences({ ...preferences, emailAlerts: e.target.checked })}
                    className="w-4 h-4 text-indigo-650 rounded"
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-semibold text-slate-650">
                  <span>SMS Urgent Triage Flags</span>
                  <input
                    type="checkbox"
                    checked={preferences.smsAlerts}
                    onChange={(e) => setPreferences({ ...preferences, smsAlerts: e.target.checked })}
                    className="w-4 h-4 text-indigo-650 rounded"
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-semibold text-slate-650">
                  <span>Share Analytics with Admin</span>
                  <input
                    type="checkbox"
                    checked={preferences.shareWithAdminDashboard}
                    onChange={(e) => setPreferences({ ...preferences, shareWithAdminDashboard: e.target.checked })}
                    className="w-4 h-4 text-indigo-650 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Security change password Mockup */}
            <div className="dashboard-card p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Security Parameters</h3>
              
              <div className="space-y-2.5">
                <button
                  onClick={() => alert('Change password email link has been sent to your primary clinic inbox.')}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  🔒 Reset password
                </button>

                <button
                  onClick={() => alert('Two-factor SMS verification configuration successfully synced.')}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  📱 Configure 2-Factor Auth
                </button>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default DocSettings;
