import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

// Subcomponents
import DocClinicalOverview from '../components/DocClinicalOverview';
import DocAiAssistant from '../components/DocAiAssistant';
import DocPatientQueue from '../components/DocPatientQueue';
import DocPatientRecords from '../components/DocPatientRecords';
import DocScheduleCalendar from '../components/DocScheduleCalendar';
import DocReferrals from '../components/DocReferrals';
import DocPrescriptions from '../components/DocPrescriptions';
import DocPharmacyOrders from '../components/DocPharmacyOrders';
import DocAnalytics from '../components/DocAnalytics';
import DocSettings from '../components/DocSettings';
import DocSupportHelp from '../components/DocSupportHelp';

const DoctorDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [appointments, setAppointments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchDashboardData = () => {
    const token = localStorage.getItem('token');

    // Fetch doctor profile
    fetch('/api/doctor/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setDoctorProfile(data);
        }
      })
      .catch(() => {
        // Fallback mockup
        setDoctorProfile({
          id: 1,
          name: 'Dr. Brooklyn Simmons',
          email: 'brooklyn.s@novacare.com',
          phone: '(302) 555-0194',
          address: 'Inglewood, Maine',
          specialty: 'Cardiologist',
          location: 'Inglewood, Maine',
          rating: 4.8,
          availability: '09:00 AM - 05:00 PM',
          schedule: 'Mon-Fri',
          years_experience: '12+ Years',
          reviews_count: 95,
          reviews: [],
          education: 'Stanford University Medical School',
          license: 'MD-2021-8843',
          specialization: 'Cardiology Specialist',
          status: 'On Duty',
          gender: 'Female',
          totalPatients: 184,
          surgeries: 64,
          image: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=400'
        });
      });
    
    // Fetch today's appointments
    fetch('/api/doctor/appointments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('API offline');
        return res.json();
      })
      .then(data => {
        setAppointments(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback mockup matching seed DB data
        const fallback = [
          {
            id: 1,
            date: '2026-07-15',
            timeSlot: '09:30 AM',
            status: 'scheduled',
            rejectionReason: '',
            patient: {
              id: 2,
              name: 'Leslie Alexander',
              email: 'leslie.alexander@gmail.com',
              phone: '(704) 555-0127',
              dob: '12.08.1994',
              allergies: 'Pollen',
              chronic: 'Hypertension',
              bloodType: 'A+',
              pastIllnesses: 'Flu'
            },
            triage: { severity: 8, isUrgent: false },
            hasPrescription: false,
            diagnosis: 'Routine health checkup'
          },
          {
            id: 2,
            date: '2026-07-15',
            timeSlot: '10:15 AM',
            status: 'pending',
            rejectionReason: '',
            patient: {
              id: 3,
              name: 'Savannah Nguyen',
              email: 'savannah.ng@gmail.com',
              phone: '(405) 555-0128',
              dob: '05.10.1989',
              allergies: 'Nuts',
              chronic: 'Asthma',
              bloodType: 'O-',
              pastIllnesses: 'Covid-19'
            },
            triage: { severity: 18, isUrgent: true },
            hasPrescription: false,
            diagnosis: 'Severe migraine headache'
          },
          {
            id: 3,
            date: '2026-07-15',
            timeSlot: '02:00 PM',
            status: 'completed',
            rejectionReason: '',
            patient: {
              id: 4,
              name: 'Albert Flores',
              email: 'albert.fl@gmail.com',
              phone: '(302) 555-0194',
              dob: '23.07.1990',
              allergies: 'None',
              chronic: 'None',
              bloodType: 'B+',
              pastIllnesses: 'None'
            },
            triage: { severity: 4, isUrgent: false },
            hasPrescription: true,
            diagnosis: 'Stable Angina follow-up'
          }
        ];
        setAppointments(fallback);
        setLoading(false);
      });

    // Fetch analytics
    fetch('/api/doctor/analytics', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setAnalytics(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateStatus = (apptId, newStatus) => {
    const token = localStorage.getItem('token');
    fetch(`/api/doctor/appointments/${apptId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => {
        if (!res.ok) throw new Error('Status update failed');
        return res.json();
      })
      .then(() => {
        triggerToast(`Consultation status updated to: ${newStatus.replace('_', ' ')}!`);
        fetchDashboardData();
      })
      .catch(() => {
        // Mock update if backend is offline
        setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: newStatus } : a));
        triggerToast(`Consultation status updated (simulated) to: ${newStatus.replace('_', ' ')}!`);
      });
  };

  const handleRejectAppointment = (apptId, reason) => {
    const token = localStorage.getItem('token');
    fetch(`/api/doctor/appointments/${apptId}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason })
    })
      .then(res => {
        if (!res.ok) throw new Error('Rejection request failed');
        return res.json();
      })
      .then(() => {
        triggerToast('Appointment mismatch rejected. Relocate ticket sent to Admin.');
        fetchDashboardData();
      })
      .catch(() => {
        // Mock rejection if backend is offline
        setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: 'rejected', rejectionReason: reason } : a));
        triggerToast('Appointment mismatch rejected (simulated). Admin ticket created.');
      });
  };

  const handleUpdateProfile = (updatedFields) => {
    const token = localStorage.getItem('token');
    return fetch('/api/doctor/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedFields)
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update profile');
        return res.json();
      })
      .then(() => {
        triggerToast('Doctor Profile updated successfully!');
        setDoctorProfile(prev => ({ ...prev, ...updatedFields }));
      })
      .catch(() => {
        setDoctorProfile(prev => ({ ...prev, ...updatedFields }));
        triggerToast('Profile updated (simulated offline).');
      });
  };

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <DocClinicalOverview 
            appointments={appointments}
            stats={analytics}
            doctorProfile={doctorProfile}
            onUpdateProfile={handleUpdateProfile}
            onTabChange={handleTabChange}
            onUpdateStatus={handleUpdateStatus}
            onRejectAppointment={handleRejectAppointment}
          />
        );
      case 'ai-assistant':
        return <DocAiAssistant appointments={appointments} />;
      case 'queue':
        return (
          <DocPatientQueue 
            appointments={appointments}
            onUpdateStatus={handleUpdateStatus}
            onTabChange={handleTabChange}
          />
        );
      case 'records':
        return <DocPatientRecords appointments={appointments} />;
      case 'schedule':
        return <DocScheduleCalendar />;
      case 'referrals':
        return <DocReferrals />;
      case 'prescriptions':
        return <DocPrescriptions appointments={appointments} />;
      case 'pharmacy':
        return <DocPharmacyOrders />;
      case 'analytics':
        return <DocAnalytics />;
      case 'settings':
        return <DocSettings />;
      case 'support':
        return <DocSupportHelp />;
      default:
        return (
          <DocClinicalOverview 
            appointments={appointments}
            stats={analytics}
            doctorProfile={doctorProfile}
            onUpdateProfile={handleUpdateProfile}
            onTabChange={handleTabChange}
            onUpdateStatus={handleUpdateStatus}
            onRejectAppointment={handleRejectAppointment}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#f4f7fc] overflow-hidden w-full font-sans antialiased text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
        <Navbar
          title="Clinical Management Workspace"
          toggleAlerts={() => triggerToast('No pending clinical updates')}
        />

        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto flex-1 pb-16">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-650 mx-auto"></div>
              <p className="text-sm text-slate-500 font-bold">Synchronizing doctor dashboard files...</p>
            </div>
          ) : (
            renderActiveTabContent()
          )}
        </div>
      </div>

      <Toast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, show: false }))} 
      />
    </div>
  );
};

export default DoctorDashboard;
