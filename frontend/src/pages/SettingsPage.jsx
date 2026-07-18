import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

const SettingsPage = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    blood_type: '',
    allergies: '',
    chronic: '',
    past_illnesses: ''
  });

  // App Preferences State (Client-only / Simulated LocalStorage save)
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    timeFormat: '12h',
    defaultHomePage: 'dashboard',
    aiSharingConsent: true,
    clinicalResearchConsent: false
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Fetch Patient Profile details
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/patient/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load profile details.');
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        triggerToast(err.message, 'error');
        setLoading(false);
      });
  }, []);

  // Save profile updates to backend
  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('token');

    fetch('/api/patient/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profile)
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to update profile settings.');
        return res.json();
      })
      .then(() => {
        triggerToast('Medical profile configuration saved successfully.');
        setSaving(false);
      })
      .catch((err) => {
        triggerToast(err.message, 'error');
        setSaving(false);
      });
  };

  const handlePreferencesSave = () => {
    triggerToast('Application and consent preferences updated.');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      triggerToast('New passwords do not match!', 'error');
      return;
    }
    triggerToast('Password reset requested successfully.');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="flex h-screen bg-[#f4f7fc] overflow-hidden w-full font-sans antialiased text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
        <Navbar title="Account Settings" />

        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto space-y-6 flex-grow pb-16">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <span className="w-10 h-10 border-4 border-indigo-200 border-t-[#5c6dfa] rounded-full animate-spin"></span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
              {/* Profile & Demographics Form (col-span-8) */}
              <form onSubmit={handleSaveProfile} className="lg:col-span-8 space-y-6">
                <div className="dashboard-card p-6 space-y-6">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      👤 Demographics & Medical File
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold">Manage your verified patient demographics and record filters</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        value={profile.name} 
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="bg-slate-50/50 border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-semibold outline-none transition" 
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Email Address</label>
                      <input 
                        type="email" 
                        value={profile.email} 
                        disabled
                        className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-not-allowed text-slate-400" 
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Mobile Number</label>
                      <input 
                        type="text" 
                        value={profile.phone} 
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="bg-slate-50/50 border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-semibold outline-none transition" 
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Date of Birth</label>
                      <input 
                        type="text" 
                        value={profile.dob} 
                        onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                        placeholder="DD.MM.YYYY"
                        className="bg-slate-50/50 border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-semibold outline-none transition" 
                      />
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Residential Address</label>
                      <input 
                        type="text" 
                        value={profile.address} 
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        placeholder="Street Address, City, Zip Code"
                        className="bg-slate-50/50 border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-semibold outline-none transition" 
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Blood Type</label>
                      <select 
                        value={profile.blood_type} 
                        onChange={(e) => setProfile({ ...profile, blood_type: e.target.value })}
                        className="bg-slate-50/50 border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-semibold outline-none transition cursor-pointer"
                      >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Allergies</label>
                      <input 
                        type="text" 
                        value={profile.allergies} 
                        onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                        placeholder="Nuts, pollen, penicillin"
                        className="bg-slate-50/50 border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-semibold outline-none transition" 
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Chronic Conditions</label>
                      <input 
                        type="text" 
                        value={profile.chronic} 
                        onChange={(e) => setProfile({ ...profile, chronic: e.target.value })}
                        placeholder="Asthma, Diabetes"
                        className="bg-slate-50/50 border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-semibold outline-none transition" 
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Past Illnesses</label>
                      <input 
                        type="text" 
                        value={profile.past_illnesses} 
                        onChange={(e) => setProfile({ ...profile, past_illnesses: e.target.value })}
                        placeholder="Coronavirus, Chickenpox"
                        className="bg-slate-50/50 border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-semibold outline-none transition" 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving}
                    className="px-6 py-2.5 bg-brand-sidebar hover:bg-brand-sidebarHover text-white transition-all text-xs font-bold rounded-xl shadow-md disabled:opacity-50 uppercase tracking-wider"
                  >
                    {saving ? 'Saving Profile...' : 'Save Demographics'}
                  </button>
                </div>
              </form>

              {/* Preferences & Security (col-span-4) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Application Preferences Card */}
                <div className="dashboard-card p-6 space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      ⚙️ App preferences
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Toggles */}
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-700 block">Email Alerts</span>
                        <span className="text-[9px] text-slate-400 block font-semibold">Refills and booking receipts</span>
                      </div>
                      <button 
                        onClick={() => setPreferences({ ...preferences, emailNotifications: !preferences.emailNotifications })}
                        className={`w-9 h-5 rounded-full p-0.5 transition duration-200 flex items-center shrink-0 cursor-pointer ${
                          preferences.emailNotifications ? 'bg-brand-sidebar' : 'bg-slate-350'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition duration-200 ${preferences.emailNotifications ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-700 block">SMS Alerts</span>
                        <span className="text-[9px] text-slate-400 block font-semibold">Triage critical flags</span>
                      </div>
                      <button 
                        onClick={() => setPreferences({ ...preferences, smsNotifications: !preferences.smsNotifications })}
                        className={`w-9 h-5 rounded-full p-0.5 transition duration-200 flex items-center shrink-0 cursor-pointer ${
                          preferences.smsNotifications ? 'bg-brand-sidebar' : 'bg-slate-350'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition duration-200 ${preferences.smsNotifications ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <hr className="border-slate-100" />

                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-700 block">Consent to AI Analysis</span>
                        <span className="text-[9px] text-slate-400 block font-semibold">Allow LLMs to review health data</span>
                      </div>
                      <button 
                        onClick={() => setPreferences({ ...preferences, aiSharingConsent: !preferences.aiSharingConsent })}
                        className={`w-9 h-5 rounded-full p-0.5 transition duration-200 flex items-center shrink-0 cursor-pointer ${
                          preferences.aiSharingConsent ? 'bg-brand-sidebar' : 'bg-slate-350'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition duration-200 ${preferences.aiSharingConsent ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <button 
                      onClick={handlePreferencesSave}
                      className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-750 transition-all text-xs font-bold rounded-xl"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>

                {/* Password / Security Card */}
                <form onSubmit={handlePasswordChange} className="dashboard-card p-6 space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      🔒 Security
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider">Current Password</label>
                      <input 
                        type="password" 
                        value={passwordForm.currentPassword} 
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="bg-slate-50/50 border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none transition" 
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider">New Password</label>
                      <input 
                        type="password" 
                        value={passwordForm.newPassword} 
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="bg-slate-50/50 border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none transition" 
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider">Confirm New Password</label>
                      <input 
                        type="password" 
                        value={passwordForm.confirmPassword} 
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="bg-slate-50/50 border border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none transition" 
                        required
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white transition-all text-xs font-bold rounded-xl shadow-md uppercase tracking-wider"
                    >
                      Update Password
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}
        </div>
      </div>

      <Toast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
};

export default SettingsPage;
