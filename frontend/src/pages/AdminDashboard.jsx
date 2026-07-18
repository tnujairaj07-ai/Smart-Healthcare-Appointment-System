import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

const DAYS_OF_WEEK = [
  { label: 'Mon', num: '13', month: 'Jul', fullDate: '2026-07-13' },
  { label: 'Tue', num: '14', month: 'Jul', fullDate: '2026-07-14' },
  { label: 'Wed', num: '15', month: 'Jul', fullDate: '2026-07-15' },
  { label: 'Thu', num: '16', month: 'Jul', fullDate: '2026-07-16' },
  { label: 'Fri', num: '17', month: 'Jul', fullDate: '2026-07-17' },
];

const Counter = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 60) || 1;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
};

const AdminDashboard = () => {
  // State
  const [doctors, setDoctors] = useState([]);
  const [activeDoctorId, setActiveDoctorId] = useState(null);
  const [doctorPatients, setDoctorPatients] = useState([]);
  const [patientsList, setPatientsList] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('tab') || 'overview';
  const setActiveSection = (section) => {
    setSearchParams({ tab: section });
  };
  
  // Filtering & Context States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQueueTab, setSelectedQueueTab] = useState('All');
  const [currentDateIndex, setCurrentDateIndex] = useState(2); // Monday default
  const [calendarDate, setCalendarDate] = useState('2026-07-15'); // Wed July 15 default
  const [showInactiveLicenses, setShowInactiveLicenses] = useState(true);
  
  // Modals & Popups
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [patientDetailModal, setPatientDetailModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Appointments registry states
  const [allAppointments, setAllAppointments] = useState([]);
  const [apptTimeFilter, setApptTimeFilter] = useState('all'); // 'all' | 'today' | 'upcoming' | 'past'
  const [apptPeriodFilter, setApptPeriodFilter] = useState('all'); // 'all' | 'day' | 'month' | 'year'
  const [apptPeriodKey, setApptPeriodKey] = useState('');
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [reschedDate, setReschedDate] = useState('2026-07-15');
  const [reschedTime, setReschedTime] = useState('09:00 AM');

  // Patient Registry filtering states
  const [patientSearch, setPatientSearch] = useState('');
  const [patientDateFilter, setPatientDateFilter] = useState('all'); // 'all' | 'today' | 'tomorrow' | 'custom'
  const [patientCustomDate, setPatientCustomDate] = useState('2026-07-15');
  const [patientDoctorFilter, setPatientDoctorFilter] = useState('all');

  const getFilteredPatients = () => {
    let list = [...patientsList];

    // 1. Text Search Filter (patient name, email, or doctor name)
    if (patientSearch.trim()) {
      const q = patientSearch.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.email.toLowerCase().includes(q) ||
        (p.doctor && p.doctor.toLowerCase().includes(q))
      );
    }

    // 2. Doctor Filter (Direct name match when Date Filter is 'all')
    if (patientDoctorFilter !== 'all' && patientDateFilter === 'all') {
      const selectedDoc = doctors.find(d => d.id === parseInt(patientDoctorFilter));
      if (selectedDoc) {
        // Last name of doctor (e.g. "Simmons" from "Dr. Brooklyn Simmons")
        const docLastName = selectedDoc.name.split(" ").pop().toLowerCase();
        list = list.filter(p => p.doctor && p.doctor.toLowerCase().includes(docLastName));
      }
    }

    // 3. Date Filter (optionally combined with Doctor Filter)
    if (patientDateFilter !== 'all') {
      let targetDate = '';
      if (patientDateFilter === 'today') {
        targetDate = '2026-07-15'; // Reference seeder date
      } else if (patientDateFilter === 'tomorrow') {
        targetDate = '2026-07-16';
      } else if (patientDateFilter === 'custom') {
        targetDate = patientCustomDate;
      }

      // Filter allAppointments by date and/or doctor
      const matchingAppts = allAppointments.filter(appt => {
        const dateMatch = targetDate ? appt.date === targetDate : true;
        const doctorMatch = patientDoctorFilter !== 'all' ? appt.doctorId === parseInt(patientDoctorFilter) : true;
        return dateMatch && doctorMatch;
      });

      // Get unique patient IDs
      const patientIds = new Set(matchingAppts.map(appt => appt.patientId));

      // Filter the main patient list by these IDs
      list = list.filter(p => patientIds.has(p.dbId));
    }

    return list;
  };

  const filteredPatients = getFilteredPatients();

  // AI & System Configuration settings states
  const [aiTemp, setAiTemp] = useState(0.7);
  const [aiPrompt, setAiPrompt] = useState('You are an expert clinical diagnostic assistant. Analyze the symptoms and match with primary ICD-10 diagnostic codes.');
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [aiModelVariant, setAiModelVariant] = useState('MedGemma-7B');
  const [aiMaxTokens, setAiMaxTokens] = useState(512);

  // New Admin Dashboard lists
  const [usersList, setUsersList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [ragList, setRagList] = useState([]);
  const [ticketsList, setTicketsList] = useState([]);

  // Modals / Inputs
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: 50, category: 'General', description: '' });
  const [showAddRagModal, setShowAddRagModal] = useState(false);
  const [newRagFile, setNewRagFile] = useState({ filename: '', category: 'Clinical Guidelines' });

  // Playground tester
  const [testSymptoms, setTestSymptoms] = useState('');
  const [testResult, setTestResult] = useState('');
  const [testingAi, setTestingAi] = useState(false);

  // SMTP Settings
  const [smtpConfig, setSmtpConfig] = useState({ host: 'smtp.novacare.org', port: '587', user: 'alerts@novacare.org', security: 'STARTTLS' });

  // Fetch All Appointments when activeSection is 'appointments' or 'patients'
  useEffect(() => {
    if (activeSection === 'appointments' || activeSection === 'patients') {
      fetch('/api/admin/appointments')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch appointments');
          return res.json();
        })
        .then((data) => setAllAppointments(data))
        .catch((err) => triggerToast(err.message, 'error'));
    }
  }, [activeSection]);

  // Fetch Users when activeSection === 'users'
  useEffect(() => {
    if (activeSection === 'users') {
      fetch('/api/admin/users')
        .then(res => res.json())
        .then(data => setUsersList(data))
        .catch(() => triggerToast('Failed to load users list', 'error'));
    }
  }, [activeSection]);

  // Fetch Pharmacy data when activeSection === 'pharmacy'
  const fetchPharmacyData = () => {
    fetch('/api/admin/pharmacy/products')
      .then(res => res.json())
      .then(data => setProductsList(data))
      .catch(() => triggerToast('Failed to load products', 'error'));

    fetch('/api/admin/pharmacy/orders')
      .then(res => res.json())
      .then(data => setOrdersList(data))
      .catch(() => triggerToast('Failed to load pharmacy orders', 'error'));
  };

  useEffect(() => {
    if (activeSection === 'pharmacy') {
      fetchPharmacyData();
    }
  }, [activeSection]);

  // Fetch RAG data when activeSection === 'ai-bot'
  const fetchRagData = () => {
    fetch('/api/admin/rag')
      .then(res => res.json())
      .then(data => setRagList(data))
      .catch(() => triggerToast('Failed to load RAG dataset index', 'error'));
  };

  useEffect(() => {
    if (activeSection === 'ai-bot') {
      fetchRagData();
    }
  }, [activeSection]);

  // Fetch Support tickets when activeSection === 'support'
  const fetchTicketsData = () => {
    fetch('/api/admin/support')
      .then(res => res.json())
      .then(data => setTicketsList(data))
      .catch(() => triggerToast('Failed to load helpdesk tickets', 'error'));
  };

  useEffect(() => {
    if (activeSection === 'support') {
      fetchTicketsData();
    }
  }, [activeSection]);

  // Patient grouping tab states
  const [treatedGroupingTab, setTreatedGroupingTab] = useState('day'); // 'day' | 'month' | 'year'
  const [selectedTreatedGroupKey, setSelectedTreatedGroupKey] = useState('');

  // Form States - Add Doctor
  const [newDoc, setNewDoc] = useState({
    name: '',
    email: '',
    specialty: '',
    type: 'New',
    phone: '',
    address: '',
    description: '',
    npi: '',
    specialistType: '',
    languages: 'English',
    revenue: '$0',
  });

  // Form States - Edit Doctor
  const [editDoc, setEditDoc] = useState(null);

  // Trigger Toast
  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Fetch Doctors with state synchronization
  const fetchDoctors = (newActiveId = null, fallbackToFirst = false) => {
    fetch('/api/admin/doctors')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch doctors');
        return res.json();
      })
      .then((data) => {
        setDoctors(data);
        if (newActiveId) {
          setActiveDoctorId(newActiveId);
        } else if (data.length > 0) {
          const activeExists = data.some((d) => d.id === activeDoctorId);
          if (fallbackToFirst || !activeDoctorId || !activeExists) {
            setActiveDoctorId(data[0].id);
          }
        } else {
          setActiveDoctorId(null);
        }
      })
      .catch((err) => triggerToast(err.message, 'error'));
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Fetch Patients List when activeSection is 'patients'
  useEffect(() => {
    if (activeSection === 'patients') {
      fetch('/api/admin/patients')
        .then((res) => res.json())
        .then((data) => setPatientsList(data))
        .catch((err) => triggerToast('Failed to load patient registry', 'error'));
    }
  }, [activeSection]);

  // Fetch selected doctor's patients and schedules
  useEffect(() => {
    if (activeDoctorId) {
      fetch(`/api/admin/doctors/${activeDoctorId}/patients`)
        .then((res) => res.json())
        .then((data) => setDoctorPatients(data))
        .catch((err) => triggerToast('Failed to load doctor patient schedule', 'error'));
    }
  }, [activeDoctorId]);

  // Fetch specific patient's profile details & clinical file
  useEffect(() => {
    if (selectedPatientId && patientDetailModal) {
      setLoadingPatient(true);
      fetch(`/api/admin/patients/${selectedPatientId}/details`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load patient clinical profile');
          return res.json();
        })
        .then((data) => {
          setPatientDetail(data);
          setLoadingPatient(false);
        })
        .catch((err) => {
          triggerToast(err.message, 'error');
          setLoadingPatient(false);
        });
    }
  }, [selectedPatientId, patientDetailModal]);

  // Active Doctor object
  const activeDoctor = useMemo(() => {
    return doctors.find((d) => d.id === activeDoctorId) || null;
  }, [doctors, activeDoctorId]);

  // Filter doctor queue roster
  const filteredQueue = useMemo(() => {
    return doctors.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      if (selectedQueueTab === 'All') return matchesSearch;
      return matchesSearch && d.type.toLowerCase() === selectedQueueTab.toLowerCase();
    });
  }, [doctors, searchQuery, selectedQueueTab]);

  // Schedule filtering by calendar date
  const filteredAppointments = useMemo(() => {
    return doctorPatients.filter((appt) => appt.date === calendarDate);
  }, [doctorPatients, calendarDate]);

  // Group key options for "Patients Treated" component
  const groupKeyOptions = useMemo(() => {
    if (!doctorPatients || doctorPatients.length === 0) return [];
    const keys = new Set();
    doctorPatients.forEach((appt) => {
      if (treatedGroupingTab === 'day') {
        keys.add(appt.date);
      } else if (treatedGroupingTab === 'month') {
        keys.add(appt.date.substring(0, 7)); // YYYY-MM
      } else if (treatedGroupingTab === 'year') {
        keys.add(appt.date.substring(0, 4)); // YYYY
      }
    });
    return Array.from(keys).sort().reverse();
  }, [doctorPatients, treatedGroupingTab]);

  // Set default group key when options change
  useEffect(() => {
    if (groupKeyOptions.length > 0) {
      setSelectedTreatedGroupKey(groupKeyOptions[0]);
    } else {
      setSelectedTreatedGroupKey('');
    }
  }, [groupKeyOptions]);

  // Filtered treated patients list
  const filteredTreatedPatients = useMemo(() => {
    if (!doctorPatients || !selectedTreatedGroupKey) return [];
    const matched = doctorPatients.filter((appt) => {
      if (treatedGroupingTab === 'day') {
        return appt.date === selectedTreatedGroupKey;
      } else if (treatedGroupingTab === 'month') {
        return appt.date.substring(0, 7) === selectedTreatedGroupKey;
      } else if (treatedGroupingTab === 'year') {
        return appt.date.substring(0, 4) === selectedTreatedGroupKey;
      }
      return false;
    });

    // Deduplicate by patient ID, keeping the latest appointment details
    const patientsMap = {};
    matched.forEach((appt) => {
      const pid = appt.patientId;
      if (!patientsMap[pid] || appt.date > patientsMap[pid].date) {
        patientsMap[pid] = {
          dbId: pid,
          name: appt.patientName,
          email: appt.patientEmail,
          date: appt.date,
          timeSlot: appt.timeSlot,
          diagnosis: appt.diagnosis,
          notes: appt.notes,
        };
      }
    });

    return Object.values(patientsMap);
  }, [doctorPatients, selectedTreatedGroupKey, treatedGroupingTab]);

  // --- CRUD FUNCTIONS ---

  const handleAddDoctor = (e) => {
    e.preventDefault();
    if (!newDoc.name || !newDoc.email) {
      triggerToast('Name and Email are required', 'error');
      return;
    }

    fetch('/api/admin/doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDoc),
    })
      .then((res) => {
        if (!res.ok) return res.json().then(data => { throw new Error(data.error || 'Failed to add doctor') });
        return res.json();
      })
      .then((data) => {
        triggerToast('Doctor registered successfully!');
        setAddModal(false);
        // Reset form
        setNewDoc({
          name: '',
          email: '',
          specialty: '',
          type: 'New',
          phone: '',
          address: '',
          description: '',
          npi: '',
          specialistType: '',
          languages: 'English',
          revenue: '$0',
        });
        // Reload list and set newly added doctor as active
        fetchDoctors(data.id);
      })
      .catch((err) => triggerToast(err.message, 'error'));
  };

  const handleEditDoctor = (e) => {
    e.preventDefault();
    if (!editDoc || !editDoc.name || !editDoc.email) {
      triggerToast('Name and Email are required', 'error');
      return;
    }

    fetch(`/api/admin/doctors/${editDoc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editDoc),
    })
      .then((res) => {
        if (!res.ok) return res.json().then(data => { throw new Error(data.error || 'Failed to update doctor') });
        return res.json();
      })
      .then(() => {
        triggerToast('Doctor credentials updated live!');
        setEditModal(false);
        fetchDoctors();
      })
      .catch((err) => triggerToast(err.message, 'error'));
  };

  const handleDeleteDoctor = (id) => {
    fetch(`/api/admin/doctors/${id}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to delete doctor');
        return res.json();
      })
      .then(() => {
        triggerToast('Doctor profile removed from directory.', 'error');
        setDeleteConfirm(null);
        // Re-fetch and adjust selection
        fetchDoctors(null, true);
      })
      .catch((err) => triggerToast(err.message, 'error'));
  };

  const handleToggleVerify = (id) => {
    fetch(`/api/admin/doctors/${id}/verify`, { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to verify doctor');
        return res.json();
      })
      .then((data) => {
        triggerToast(data.message, data.verified ? 'success' : 'error');
        setDoctors(
          doctors.map((d) => (d.id === id ? { ...d, verified: data.verified } : d))
        );
      })
      .catch((err) => triggerToast(err.message, 'error'));
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!rescheduleModal) return;
    
    fetch(`/api/admin/appointments/${rescheduleModal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: reschedDate,
        timeSlot: reschedTime
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to reschedule appointment');
        return res.json();
      })
      .then(() => {
        triggerToast('Appointment rescheduled successfully!');
        setRescheduleModal(null);
        // Refresh list
        fetch('/api/admin/appointments')
          .then(res => res.json())
          .then(data => setAllAppointments(data));
      })
      .catch(err => triggerToast(err.message, 'error'));
  };

  const handleCancelAppointment = (id) => {
    fetch(`/api/admin/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to cancel appointment');
        return res.json();
      })
      .then(() => {
        triggerToast('Appointment cancelled successfully!', 'error');
        // Refresh list
        fetch('/api/admin/appointments')
          .then(res => res.json())
          .then(data => setAllAppointments(data));
      })
      .catch(err => triggerToast(err.message, 'error'));
  };

  const handleToggleUserLock = (userId, currentStatus) => {
    const nextStatus = currentStatus === 'Locked' ? 'Active' : 'Locked';
    fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update user status');
        return res.json();
      })
      .then(() => {
        triggerToast(`User account ${nextStatus === 'Locked' ? 'locked successfully' : 'unlocked successfully'}`, nextStatus === 'Locked' ? 'warning' : 'success');
        setUsersList(usersList.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
      })
      .catch(err => triggerToast(err.message, 'error'));
  };

  const handleUpdateDoctorDuty = (docId, field, value) => {
    fetch(`/api/admin/doctors/${docId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update doctor shift details');
        return res.json();
      })
      .then(() => {
        triggerToast(`Doctor ${field === 'dutyStatus' ? 'Duty Shift' : 'Hospital Station'} updated successfully!`);
        fetchDoctors(docId);
      })
      .catch(err => triggerToast(err.message, 'error'));
  };

  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    fetch('/api/admin/pharmacy/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to add product');
        return res.json();
      })
      .then(() => {
        triggerToast('New pharmacy product added successfully!');
        setShowAddProductModal(false);
        setNewProduct({ name: '', price: '', stock: 50, category: 'General', description: '' });
        fetchPharmacyData();
      })
      .catch(err => triggerToast(err.message, 'error'));
  };

  const handleUpdateOrderStatus = (orderId, nextStatus) => {
    fetch(`/api/admin/pharmacy/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update order');
        return res.json();
      })
      .then(() => {
        triggerToast(`Order status updated to ${nextStatus}`, 'success');
        fetchPharmacyData();
      })
      .catch(err => triggerToast(err.message, 'error'));
  };

  const handleAddRagSubmit = (e) => {
    e.preventDefault();
    fetch('/api/admin/rag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRagFile)
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to index document');
        return res.json();
      })
      .then(() => {
        triggerToast('Clinical document indexed into RAG memory bank.');
        setShowAddRagModal(false);
        setNewRagFile({ filename: '', category: 'Clinical Guidelines' });
        fetchRagData();
      })
      .catch(err => triggerToast(err.message, 'error'));
  };

  const handleUpdateTicketStatus = (ticketId, nextStatus) => {
    fetch(`/api/admin/support/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update ticket');
        return res.json();
      })
      .then(() => {
        triggerToast(`Ticket status updated to ${nextStatus}`, 'success');
        fetchTicketsData();
      })
      .catch(err => triggerToast(err.message, 'error'));
  };

  const handleTestAiSymptom = (e) => {
    e.preventDefault();
    if (!testSymptoms.trim()) return;
    setTestingAi(true);
    setTestResult('');
    
    fetch('/api/ai-doctor/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms: testSymptoms })
    })
      .then(res => {
        if (!res.ok) throw new Error('AI Diagnostic Engine timeout');
        return res.json();
      })
      .then(data => {
        if (data.diagnosed_conditions && data.diagnosed_conditions.length > 0) {
          const formatted = data.diagnosed_conditions.map((c, i) => `${c} (${Math.round((data.confidence_scores ? data.confidence_scores[i] : 0.8) * 100)}% match)`).join(', ');
          setTestResult(`Diagnosis: ${formatted}`);
        } else {
          setTestResult("No matching clinical diagnosis. Adjust temperature or guidelines prompt.");
        }
        setTestingAi(false);
      })
      .catch(err => {
        setTestResult(`Error checking diagnostic gateway: ${err.message}`);
        setTestingAi(false);
      });
  };

  // Memoized appointment period keys
  const apptPeriodOptions = useMemo(() => {
    if (!allAppointments) return [];
    const keys = new Set();
    allAppointments.forEach((appt) => {
      if (apptPeriodFilter === 'day') {
        keys.add(appt.date);
      } else if (apptPeriodFilter === 'month') {
        keys.add(appt.date.substring(0, 7)); // YYYY-MM
      } else if (apptPeriodFilter === 'year') {
        keys.add(appt.date.substring(0, 4)); // YYYY
      }
    });
    return Array.from(keys).sort().reverse();
  }, [allAppointments, apptPeriodFilter]);

  // Set default key when period options change
  useEffect(() => {
    if (apptPeriodOptions.length > 0) {
      setApptPeriodKey(apptPeriodOptions[0]);
    } else {
      setApptPeriodKey('');
    }
  }, [apptPeriodOptions]);

  // Double-filtered appointments roster
  const filteredAppointmentsList = useMemo(() => {
    if (!allAppointments) return [];
    return allAppointments.filter((appt) => {
      // 1. Time Horizon filtering (Using July 15, 2026 as logical Today)
      const todayStr = '2026-07-15';
      if (apptTimeFilter === 'today') {
        if (appt.date !== todayStr) return false;
      } else if (apptTimeFilter === 'upcoming') {
        if (appt.date <= todayStr) return false;
      } else if (apptTimeFilter === 'past') {
        if (appt.date >= todayStr) return false;
      }

      // 2. Period scope filtering
      if (apptPeriodFilter === 'day' && apptPeriodKey) {
        return appt.date === apptPeriodKey;
      } else if (apptPeriodFilter === 'month' && apptPeriodKey) {
        return appt.date.substring(0, 7) === apptPeriodKey;
      } else if (apptPeriodFilter === 'year' && apptPeriodKey) {
        return appt.date.substring(0, 4) === apptPeriodKey;
      }

      return true;
    });
  }, [allAppointments, apptTimeFilter, apptPeriodFilter, apptPeriodKey]);

  // SVG Chart Scaling Helpers
  const chartHeightScale = useMemo(() => {
    if (!activeDoctor || !activeDoctor.patientOverview) return 1;
    const maxOld = Math.max(...activeDoctor.patientOverview.old, 1);
    const maxNew = Math.max(...activeDoctor.patientOverview.new, 1);
    return Math.max(maxOld, maxNew, 1);
  }, [activeDoctor]);

  // Overall Statistics for KPIs
  const totalPatientsCount = useMemo(() => {
    return patientsList.length || 12;
  }, [patientsList]);

  const activeDoctorsCount = useMemo(() => {
    return doctors.length;
  }, [doctors]);

  const KPI_STATS = [
    { label: 'Total Patients', value: totalPatientsCount, suffix: '', change: '+8.3% MoM', positive: true, icon: '👥' },
    { label: 'Active Doctors', value: activeDoctorsCount, suffix: '', change: '+1 Today', positive: true, icon: '🩺' },
    { label: 'Appointments Today', value: 7, suffix: '', change: '2 Rescheduled', positive: null, icon: '📅' },
    { label: 'Platform Revenue', value: 165400, suffix: '', change: '+11.2% MoM', positive: true, icon: '💰' },
  ];

  return (
    <div className="flex h-screen bg-[#f4f7fc] overflow-hidden w-full font-sans antialiased text-slate-800">
      <style>{`
        .dashboard-card {
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid #eef2f6;
          box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.06), 0 2px 8px -1px rgba(148, 163, 184, 0.04);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dashboard-card:hover {
          box-shadow: 0 12px 30px -5px rgba(148, 163, 184, 0.12), 0 4px 16px -2px rgba(148, 163, 184, 0.06);
        }
        .active-doctor-item {
          border: 2px solid #5c6dfa !important;
          background-color: #eff2ff !important;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
        <Navbar 
          title="Admin Control Centre" 
          toggleAlerts={() => triggerToast('System status check: All servers running optimally.', 'info')} 
        />

        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto space-y-6 flex-1 pb-16">
          
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="text-left">
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {activeSection === 'overview' && 'System Overview'}
                  {activeSection === 'users' && 'User Management'}
                  {activeSection === 'doctors' && 'Doctors Directory'}
                  {activeSection === 'appointments' && 'Appointment Monitor'}
                  {activeSection === 'pharmacy' && 'Pharmacy Management'}
                  {activeSection === 'ai-bot' && 'AI Bot Configuration'}
                  {activeSection === 'analytics' && 'Analytics & Reports'}
                  {activeSection === 'settings' && 'System Settings'}
                  {activeSection === 'support' && 'Support & System Logs'}
                </h1>
              </div>
              {activeSection === 'doctors' && (
                <div className="mt-1.5 inline-flex items-center gap-2 px-3 py-1 bg-slate-100/80 rounded-lg border border-slate-200 text-xs text-slate-500 font-semibold cursor-pointer hover:bg-slate-150 transition" onClick={() => triggerToast('Shift availability index updated today.', 'info')}>
                  <i className="fa-regular fa-calendar-days text-[#5c6dfa] text-xs"></i>
                  <span>Last Update: Jan 2026 - Jul 2026</span>
                </div>
              )}
            </div>
            {activeSection === 'doctors' && (
              <button 
                onClick={() => setAddModal(true)} 
                className="px-5 py-2.5 rounded-xl bg-[#5c6dfa] hover:bg-[#4e5ee6] text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-indigo-600/15 cursor-pointer"
              >
                <i className="fa-solid fa-plus text-xs"></i> <span>Add Employee</span>
              </button>
            )}
            {activeSection === 'pharmacy' && (
              <button 
                onClick={() => setShowAddProductModal(true)} 
                className="px-5 py-2.5 rounded-xl bg-[#5c6dfa] hover:bg-[#4e5ee6] text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-indigo-600/15 cursor-pointer"
              >
                <i className="fa-solid fa-plus text-xs"></i> <span>Add Product</span>
              </button>
            )}
            {activeSection === 'ai-bot' && (
              <button 
                onClick={() => setShowAddRagModal(true)} 
                className="px-5 py-2.5 rounded-xl bg-[#5c6dfa] hover:bg-[#4e5ee6] text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-indigo-600/15 cursor-pointer"
              >
                <i className="fa-solid fa-cloud-arrow-up text-xs"></i> <span>Index Document</span>
              </button>
            )}
          </div>

          {/* DOCTORS WORKSPACE (3-COLUMN LAYOUT) */}
          {activeSection === 'doctors' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
              
              {/* COLUMN 1: DOCTOR QUEUE (col-span-3) */}
              <section className="xl:col-span-3 flex flex-col gap-4">
                <div className="dashboard-card p-4 space-y-4">
                  <div className="flex justify-between items-center pb-1">
                    <h3 className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">Doctors Queue</h3>
                    <button 
                      onClick={() => setAddModal(true)} 
                      className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition flex items-center justify-center text-[#5c6dfa] cursor-pointer"
                      title="Add Doctor"
                    >
                      <i className="fa-solid fa-plus text-xs"></i>
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search queue..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-400 rounded-xl text-xs outline-none transition"
                    />
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
                  </div>

                  {/* Filter Switches */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg gap-1 border border-slate-150">
                    {['All', 'old', 'New'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSelectedQueueTab(tab)}
                        className={`flex-1 text-center py-1.5 rounded-md text-[10px] uppercase tracking-wider font-extrabold transition cursor-pointer select-none ${
                          selectedQueueTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Roster Queue list */}
                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    {filteredQueue.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => {
                          setActiveDoctorId(doc.id);
                          triggerToast(`Active context: ${doc.name}`);
                        }}
                        className={`p-3 rounded-xl bg-white hover:bg-slate-50 border transition flex items-center justify-between group cursor-pointer ${
                          activeDoctorId === doc.id ? 'active-doctor-item shadow-sm' : 'border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img src={doc.avatar} className="w-10 h-10 rounded-xl object-cover border border-slate-200" alt="Doctor avatar" />
                          <div className="text-left">
                            <h4 className="text-xs font-extrabold text-slate-800 group-hover:text-[#5c6dfa] transition">{doc.name}</h4>
                            <span className="text-[10px] text-slate-400 font-bold">{doc.specialty}</span>
                          </div>
                        </div>
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                          doc.type === 'New' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-[#5c6dfa] border border-indigo-100'
                        }`}>
                          {doc.type}
                        </span>
                      </div>
                    ))}

                    {filteredQueue.length === 0 && (
                      <div className="text-center py-10">
                        <i className="fa-regular fa-folder-open text-slate-350 text-xl block mb-2"></i>
                        <span className="text-xs text-slate-400 font-bold">No physicians found.</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* COLUMN 2: ACTIVE PROFILE & SCHEDULE (col-span-4) */}
              <section className="xl:col-span-4 flex flex-col gap-6">
                
                {activeDoctor ? (
                  <>
                    {/* Active Doctor Profile Card */}
                    <div className="dashboard-card p-6 space-y-5 relative">
                      <button 
                        onClick={() => {
                          setEditDoc({ ...activeDoctor });
                          setEditModal(true);
                        }}
                        className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 transition shadow-sm cursor-pointer"
                        title="Edit Doctor Details"
                      >
                        <i className="fa-regular fa-pen-to-square text-xs"></i>
                      </button>

                      <div className="flex flex-col items-center text-center pt-2">
                        <div className="relative">
                          <img src={activeDoctor.avatar} className="w-24 h-24 rounded-3xl object-cover border-2 border-slate-150 shadow-md mb-3" alt="Doctor face" />
                          <button
                            onClick={() => handleToggleVerify(activeDoctor.id)}
                            className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border border-white flex items-center justify-center text-[10px] shadow ${
                              activeDoctor.verified ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-800'
                            }`}
                            title={activeDoctor.verified ? 'Verified (Click to toggle)' : 'Pending (Click to toggle)'}
                          >
                            <i className={activeDoctor.verified ? 'fa-solid fa-check' : 'fa-solid fa-exclamation'}></i>
                          </button>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 leading-tight">{activeDoctor.name}</h3>
                        <p className="text-xs text-slate-500 font-bold tracking-wide mt-1">{activeDoctor.specialty}</p>
                        
                        <div className="mt-2">
                          <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full border ${
                            activeDoctor.verified 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-250' 
                              : 'bg-amber-50 text-amber-700 border-amber-250'
                          }`}>
                            {activeDoctor.verified ? '✓ VERIFIED CREDENTIALS' : '⚠ PENDING VERIFICATION'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-[#5c6dfa] shrink-0">
                            <i className="fa-solid fa-phone text-xs"></i>
                          </div>
                          <div className="text-left">
                            <span className="block text-[8px] uppercase font-extrabold text-slate-400 tracking-wider">Phone Number</span>
                            <span className="font-bold text-slate-800">{activeDoctor.phone || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-[#5c6dfa] shrink-0">
                            <i className="fa-regular fa-envelope text-xs"></i>
                          </div>
                          <div className="min-w-0 text-left">
                            <span className="block text-[8px] uppercase font-extrabold text-slate-400 tracking-wider">Email Address</span>
                            <span className="font-bold text-slate-800 break-all truncate block">{activeDoctor.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-[#5c6dfa] shrink-0">
                            <i className="fa-solid fa-location-dot text-xs"></i>
                          </div>
                          <div className="text-left">
                            <span className="block text-[8px] uppercase font-extrabold text-slate-400 tracking-wider">Office Clinic Room</span>
                            <span className="font-bold text-slate-800 text-[11px]">{activeDoctor.address || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button 
                          onClick={() => setDeleteConfirm(activeDoctor.id)}
                          className="py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150 font-bold text-xs cursor-pointer transition"
                        >
                          Delete
                        </button>
                        <button 
                          onClick={() => triggerToast(`Messenger secure gateway initiated for ${activeDoctor.name}`, 'info')}
                          className="py-2.5 rounded-xl bg-[#5c6dfa] hover:bg-[#4e5ee6] text-white font-bold text-xs cursor-pointer shadow-md shadow-indigo-600/15 transition"
                        >
                          Message
                        </button>
                      </div>
                    </div>

                    {/* Today's Schedule Card */}
                    <div className="dashboard-card p-5 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Weekly Schedule</h3>
                        <i className="fa-regular fa-calendar-check text-[#5c6dfa] text-sm"></i>
                      </div>

                      {/* Slider controls */}
                      <div className="flex justify-between bg-slate-100 p-1 rounded-xl">
                        {DAYS_OF_WEEK.map((day) => (
                          <button
                            key={day.fullDate}
                            onClick={() => {
                              setCalendarDate(day.fullDate);
                              triggerToast(`Selected schedule date: ${day.label} ${day.num} ${day.month}`);
                            }}
                            className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer flex flex-col items-center select-none ${
                              calendarDate === day.fullDate
                                ? 'bg-[#5c6dfa] text-white font-extrabold shadow-md'
                                : 'text-slate-500 hover:bg-white/40'
                            }`}
                          >
                            <span className="text-[8px] opacity-75 uppercase font-bold">{day.label}</span>
                            <span className="text-xs font-bold">{day.num}</span>
                          </button>
                        ))}
                      </div>

                      {/* Appointments List for selected date */}
                      <div className="space-y-3 max-h-[170px] overflow-y-auto pr-1">
                        {filteredAppointments.map((item, index) => (
                          <div 
                            key={index} 
                            onClick={() => {
                              setSelectedPatientId(item.patientId);
                              setPatientDetailModal(true);
                            }}
                            className="p-3 rounded-xl bg-slate-50/60 border border-slate-150 transition flex items-start justify-between hover:bg-slate-50 cursor-pointer"
                          >
                            <div className="flex gap-2">
                              <span className="w-1 h-9 rounded bg-[#5c6dfa] block shrink-0 mt-0.5"></span>
                              <div className="text-left">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-800">{item.patientName}</span>
                                  <span className="text-[8px] bg-indigo-50 text-[#5c6dfa] px-1.5 py-0.5 rounded font-extrabold">{item.timeSlot}</span>
                                </div>
                                <span className="text-[10px] text-slate-450 font-semibold block mt-0.5 truncate max-w-[170px]" title={item.notes}>
                                  {item.diagnosis}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] text-indigo-500 hover:underline pt-0.5 font-semibold">View File</span>
                          </div>
                        ))}

                        {filteredAppointments.length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-xs text-slate-450 font-bold">No visits scheduled for this date.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="dashboard-card p-10 text-center">
                    <p className="text-slate-400 text-xs font-bold">Select a physician from the roster.</p>
                  </div>
                )}
              </section>

              {/* COLUMN 3: CLINICAL ANALYTICS & LICENSES (col-span-5) */}
              <section className="xl:col-span-5 flex flex-col gap-6">
                {activeDoctor ? (
                  <>
                    {/* Patient Overview Chart */}
                    <div className="dashboard-card p-6 space-y-4">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[#5c6dfa]">
                            <i className="fa-solid fa-chart-simple text-sm"></i>
                          </div>
                          <h3 className="text-sm font-extrabold text-slate-800 tracking-wider uppercase">Patient Overview</h3>
                        </div>

                        <div className="flex items-center gap-3 text-[10px] font-semibold">
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded bg-[#5c6dfa] block"></span>
                            <span className="text-slate-500">Old</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded bg-orange-400 block"></span>
                            <span className="text-slate-500">New</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive SVG bar graph */}
                      <div className="relative pt-2 h-44">
                        <svg className="w-full h-full" viewBox="0 0 500 150">
                          {/* Grid Lines */}
                          <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeDasharray="4" />
                          <line x1="0" y1="65" x2="500" y2="65" stroke="#f1f5f9" strokeDasharray="4" />
                          <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeDasharray="4" />
                          <line x1="0" y1="135" x2="500" y2="135" stroke="#f1f5f9" strokeDasharray="4" />

                          {activeDoctor.patientOverview && activeDoctor.patientOverview.old.map((val, idx) => {
                            const x1 = 30 + idx * 70;
                            const x2 = x1 + 15;
                            const valNew = activeDoctor.patientOverview.new[idx] || 0;
                            
                            const oldH = (val / chartHeightScale) * 100;
                            const newH = (valNew / chartHeightScale) * 100;
                            
                            return (
                              <g key={idx} className="cursor-pointer" onClick={() => setCurrentDateIndex(idx)}>
                                {/* Old Patients Bar */}
                                <rect 
                                  x={x1} 
                                  y={135 - oldH} 
                                  width="12" 
                                  height={oldH} 
                                  rx="3" 
                                  fill="#5c6dfa" 
                                  opacity={currentDateIndex === idx ? '1' : '0.8'}
                                  className="transition-all duration-300"
                                />
                                {/* New Patients Bar */}
                                <rect 
                                  x={x2} 
                                  y={135 - newH} 
                                  width="12" 
                                  height={newH} 
                                  rx="3" 
                                  fill="#ff6b35" 
                                  opacity={currentDateIndex === idx ? '1' : '0.8'}
                                  className="transition-all duration-300"
                                />
                              </g>
                            );
                          })}
                        </svg>

                        {/* Interactive Tooltip Overlay */}
                        <div className="absolute top-2 right-4 bg-slate-900/95 backdrop-blur-md text-white p-2.5 rounded-xl text-[10px] space-y-0.5 shadow-xl border border-slate-800 pointer-events-none text-left">
                          <span className="block font-bold border-b border-slate-800 pb-1 text-slate-400">
                            Day {currentDateIndex + 1} Stats
                          </span>
                          <span className="block text-indigo-300 font-semibold">
                            Old Patients: <strong className="text-white text-xs ml-1">{activeDoctor.patientOverview?.old[currentDateIndex]}</strong>
                          </span>
                          <span className="block text-orange-300 font-semibold">
                            New Patients: <strong className="text-white text-xs ml-1">{activeDoctor.patientOverview?.new[currentDateIndex]}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between px-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => <span key={d}>{d}</span>)}
                      </div>
                    </div>

                    {/* About Doctor Biography */}
                    <div className="dashboard-card p-5 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[#5c6dfa]">
                            <i className="fa-regular fa-user text-sm"></i>
                          </div>
                          <h3 className="text-sm font-extrabold text-slate-800 tracking-wider uppercase">Clinical Biography</h3>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed text-left font-semibold">
                        {activeDoctor.description || 'No biography details provided.'}
                      </p>

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-150 text-left min-w-0">
                          <i className="fa-solid fa-id-card text-[#5c6dfa] text-xs mb-0.5 block"></i>
                          <span className="block text-[8px] uppercase font-bold text-slate-400">NPI Number</span>
                          <span className="text-[10px] font-extrabold text-slate-850 truncate block" title={activeDoctor.npi}>{activeDoctor.npi || 'N/A'}</span>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-150 text-left min-w-0">
                          <i className="fa-solid fa-stethoscope text-[#5c6dfa] text-xs mb-0.5 block"></i>
                          <span className="block text-[8px] uppercase font-bold text-slate-400">Specialist</span>
                          <span className="text-[10px] font-extrabold text-slate-850 truncate block" title={activeDoctor.specialistType}>{activeDoctor.specialistType}</span>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-150 text-left min-w-0">
                          <i className="fa-solid fa-language text-[#5c6dfa] text-xs mb-0.5 block"></i>
                          <span className="block text-[8px] uppercase font-bold text-slate-400">Languages</span>
                          <span className="text-[10px] font-extrabold text-slate-850 truncate block" title={activeDoctor.languages}>{activeDoctor.languages}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs font-bold text-slate-700">
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] uppercase font-bold text-slate-400 mb-1">Medical Station</span>
                          <select
                            value={activeDoctor.hospital || 'St. Jude General'}
                            onChange={(e) => handleUpdateDoctorDuty(activeDoctor.id, 'hospital', e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-800 outline-none cursor-pointer"
                          >
                            <option value="St. Jude General">St. Jude General</option>
                            <option value="Johns Hopkins Clinic">Johns Hopkins Clinic</option>
                            <option value="Mayo Medical Center">Mayo Medical Center</option>
                            <option value="City Emergency">City Emergency</option>
                          </select>
                        </div>

                        <div className="flex flex-col text-left">
                          <span className="text-[8px] uppercase font-bold text-slate-400 mb-1">Shift / Availability</span>
                          <select
                            value={activeDoctor.dutyStatus || 'On Duty'}
                            onChange={(e) => handleUpdateDoctorDuty(activeDoctor.id, 'dutyStatus', e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-800 outline-none cursor-pointer"
                          >
                            <option value="On Duty">🟢 On Duty</option>
                            <option value="On Call">🔵 On Call</option>
                            <option value="In Surgery">🟣 In Surgery</option>
                            <option value="Off Duty">⚪ Off Duty</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Patients Treated Filterable List (Crucial Request) */}
                    <div className="dashboard-card p-5 space-y-4">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[#5c6dfa]">
                            <i className="fa-solid fa-hospital-user text-sm"></i>
                          </div>
                          <h3 className="text-sm font-extrabold text-slate-800 tracking-wider uppercase">Treated Patients</h3>
                        </div>

                        {/* Group Selector Controls */}
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[9px] font-extrabold uppercase tracking-wide">
                          {[{ key: 'day', label: 'Day' }, { key: 'month', label: 'Month' }, { key: 'year', label: 'Year' }].map(({ key, label }) => (
                            <button
                              key={key}
                              onClick={() => setTreatedGroupingTab(key)}
                              className={`px-2.5 py-1 rounded cursor-pointer ${
                                treatedGroupingTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dropdown Select Box */}
                      {groupKeyOptions.length > 0 ? (
                        <div className="flex items-center justify-between gap-3 text-xs bg-slate-50 p-2 rounded-xl border border-slate-150">
                          <span className="font-bold text-slate-500 uppercase text-[9px]">Select Period:</span>
                          <select 
                            value={selectedTreatedGroupKey} 
                            onChange={(e) => setSelectedTreatedGroupKey(e.target.value)}
                            className="bg-white border border-slate-200 focus:border-indigo-400 rounded-lg px-3 py-1 font-bold text-slate-800 outline-none cursor-pointer"
                          >
                            {groupKeyOptions.map((key) => {
                              // Formatting
                              let label = key;
                              if (treatedGroupingTab === 'month') {
                                try {
                                  const dt = new Date(key + "-02"); // avoid time-zone off-by-one
                                  label = dt.toLocaleString('default', { month: 'long', year: 'numeric' });
                                } catch(e) {}
                              }
                              return (
                                <option key={key} value={key}>{label}</option>
                              );
                            })}
                          </select>
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs font-bold">No treated patients history logs.</p>
                      )}

                      {/* Grouped Treated Patients Roster */}
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {filteredTreatedPatients.map((pat) => (
                          <div 
                            key={pat.dbId}
                            onClick={() => {
                              setSelectedPatientId(pat.dbId);
                              setPatientDetailModal(true);
                            }}
                            className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition flex items-center justify-between text-left cursor-pointer group"
                          >
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-850 group-hover:text-[#5c6dfa] transition">{pat.name}</h4>
                              <p className="text-[10px] text-slate-400 font-bold">
                                Diagnosed: <strong className="text-slate-600 font-semibold">{pat.diagnosis}</strong>
                              </p>
                            </div>
                            <i className="fa-solid fa-chevron-right text-slate-350 text-[10px] group-hover:translate-x-1 transition-transform"></i>
                          </div>
                        ))}

                        {groupKeyOptions.length > 0 && filteredTreatedPatients.length === 0 && (
                          <p className="text-xs text-slate-400 font-bold text-center py-4">No patients treated in this period.</p>
                        )}
                      </div>
                    </div>

                    {/* Active Doctor Licenses */}
                    <div className="dashboard-card p-5 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-extrabold text-slate-900 tracking-wider uppercase">Active Licenses</h3>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase">Show Inactive</span>
                          <button 
                            onClick={() => {
                              setShowInactiveLicenses(!showInactiveLicenses);
                              triggerToast('Toggled inactive licenses view');
                            }}
                            className={`w-9 h-5 rounded-full p-0.5 transition duration-200 focus:outline-none flex items-center shrink-0 cursor-pointer ${
                              showInactiveLicenses ? 'bg-[#5c6dfa]' : 'bg-slate-350'
                            }`}
                          >
                            <span 
                              className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition duration-200 ${
                                showInactiveLicenses ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* License list */}
                      <div className="space-y-2.5">
                        {activeDoctor.licenses && activeDoctor.licenses.map((lic, index) => {
                          const show = lic.status === 'Active' || showInactiveLicenses;
                          if (!show) return null;
                          return (
                            <div 
                              key={index} 
                              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/60 transition flex items-center justify-between"
                            >
                              <div className="text-left space-y-0.5">
                                <h4 className="text-xs font-extrabold text-slate-800">{lic.number}</h4>
                                <span className="text-[10px] text-slate-400 font-bold block">{lic.state} · {lic.expiration}</span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                                  lic.status === 'Active' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                  {lic.status}
                                </span>
                                
                                <button 
                                  onClick={() => triggerToast(`Downloading license credential: ${lic.number}`)}
                                  className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-450 hover:text-[#5c6dfa] transition shadow-sm cursor-pointer"
                                >
                                  <i className="fa-solid fa-cloud-arrow-down text-xs"></i>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : null}
              </section>
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. SYSTEM OVERVIEW WORKSPACE */}
          {/* ======================================================== */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Service Health Vitals */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="dashboard-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3.5 w-3.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Database Service</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">SQLite Engine · 99.98% uptime</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-150 rounded px-2 py-0.5">ONLINE</span>
                </div>
                <div className="dashboard-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3.5 w-3.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">MedGemma AI Gateway</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Ollama Connection · 14ms latency</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-150 rounded px-2 py-0.5">HEALTHY</span>
                </div>
                <div className="dashboard-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3.5 w-3.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5c6dfa] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#5c6dfa]"></span>
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Pharmacy Catalog Module</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Sync state: Ready · 5 products</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-150 rounded px-2 py-0.5">SYNCED</span>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                {KPI_STATS.map(({ label, value, suffix, change, positive, icon }) => (
                  <div key={label} className="dashboard-card p-5 flex flex-col justify-between h-36">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">{label}</span>
                      <span className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-lg">{icon}</span>
                    </div>
                    <div>
                      <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                        {label === 'Platform Revenue' ? '$' : ''}<Counter target={value} suffix={suffix} />
                      </p>
                      <p className={`text-[10px] font-bold mt-1 ${positive === true ? 'text-emerald-600' : positive === false ? 'text-rose-600' : 'text-slate-400'}`}>
                        {change}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* SVG Platform Traffic & Billing Area Chart */}
              <div className="dashboard-card p-6 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2 text-left">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 tracking-wider uppercase">Platform Traffic & Billing Revenue</h3>
                    <p className="text-[10px] text-slate-450 font-bold">Monthly volume metrics for the current calendar year</p>
                  </div>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[9px] font-extrabold uppercase tracking-wide">
                    <button className="bg-white text-slate-900 shadow-sm px-2.5 py-1 rounded">Revenue ($)</button>
                    <button className="text-slate-400 hover:text-slate-700 px-2.5 py-1 rounded cursor-pointer" onClick={() => triggerToast('Platform visits counter: 14,820 clicks logged', 'info')}>Visits</button>
                  </div>
                </div>

                <div className="relative pt-4 h-48">
                  <svg className="w-full h-full" viewBox="0 0 600 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5c6dfa" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#5c6dfa" stopOpacity="0.00" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="600" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                    <line x1="0" y1="60" x2="600" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                    <line x1="0" y1="100" x2="600" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                    <line x1="0" y1="140" x2="600" y2="140" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />

                    {/* Area path */}
                    <path 
                      d="M 0 140 C 50 110, 100 120, 150 70 C 200 30, 250 80, 300 40 C 350 20, 400 90, 450 50 C 500 20, 550 40, 600 10 L 600 140 L 0 140 Z" 
                      fill="url(#areaGrad)" 
                    />

                    {/* Line path */}
                    <path 
                      d="M 0 140 C 50 110, 100 120, 150 70 C 200 30, 250 80, 300 40 C 350 20, 400 90, 450 50 C 500 20, 550 40, 600 10" 
                      fill="none" 
                      stroke="#5c6dfa" 
                      strokeWidth="3" 
                      strokeLinecap="round"
                    />

                    {/* Interactive Dot Highlights */}
                    <circle cx="150" cy="70" r="5" fill="#ffffff" stroke="#5c6dfa" strokeWidth="3" className="cursor-pointer transition-all hover:scale-125" onClick={() => triggerToast('March Billings: $122,400', 'info')} />
                    <circle cx="300" cy="40" r="5" fill="#ffffff" stroke="#5c6dfa" strokeWidth="3" className="cursor-pointer transition-all hover:scale-125" onClick={() => triggerToast('April Billings: $148,000', 'info')} />
                    <circle cx="450" cy="50" r="5" fill="#ffffff" stroke="#5c6dfa" strokeWidth="3" className="cursor-pointer transition-all hover:scale-125" onClick={() => triggerToast('May Billings: $139,200', 'info')} />
                    <circle cx="600" cy="10" r="5" fill="#ffffff" stroke="#5c6dfa" strokeWidth="3" className="cursor-pointer transition-all hover:scale-125" onClick={() => triggerToast('June Billings: $165,400', 'info')} />
                  </svg>
                </div>
                <div className="flex justify-between px-2 text-[9px] text-slate-450 font-extrabold uppercase tracking-wider">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>

              {/* System Alerts Section */}
              <div className="dashboard-card p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 text-left">System Alerts Log</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { type: 'warning', icon: '⚠️', bar: 'bg-amber-400', bg: 'bg-amber-50', border: 'border-amber-100', titleColor: 'text-amber-800', textColor: 'text-amber-700', title: 'License Expiry', desc: "Dr. Brooklyn Simmons's license #054112 requires renewal within 30 days." },
                    { type: 'error', icon: '❌', bar: 'bg-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', titleColor: 'text-rose-800', textColor: 'text-rose-700', title: 'Unverified Credentials', desc: "Dr. Jenny Wilson's credentials are pending administrator verification." },
                    { type: 'info', icon: 'ℹ️', bar: 'bg-blue-400', bg: 'bg-blue-50', border: 'border-blue-100', titleColor: 'text-blue-800', textColor: 'text-blue-700', title: 'Batch Appointment Migration', desc: 'Q3 record archival migration completed — 2,234 records synced to NovaCare Cloud.' },
                    { type: 'success', icon: '✅', bar: 'bg-emerald-400', bg: 'bg-emerald-50', border: 'border-emerald-100', titleColor: 'text-emerald-800', textColor: 'text-emerald-700', title: 'AI Diagnostic Engine Online', desc: 'MedGemma AI bot is live via Ollama Gateway. Diagnostics are available on port 11434.' }
                  ].map((alert, idx) => (
                    <div key={idx} className={`${alert.bg} border ${alert.border} rounded-2xl p-4 flex gap-3 items-start relative overflow-hidden text-left`}>
                      <div className={`w-1 h-full ${alert.bar} rounded-full flex-shrink-0 absolute left-0 top-0`}></div>
                      <div className="flex flex-col gap-0.5 pl-1.5">
                        <p className={`font-bold text-xs ${alert.titleColor} flex items-center gap-1.5`}>
                          <span>{alert.icon}</span> {alert.title}
                        </p>
                        <p className={`text-[11px] ${alert.textColor} leading-relaxed font-semibold`}>{alert.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. USER MANAGEMENT WORKSPACE */}
          {/* ======================================================== */}
          {activeSection === 'users' && (
            <div className="dashboard-card p-6 space-y-5 text-left">
              <div>
                <h3 className="text-lg font-bold text-slate-900">User Management</h3>
                <p className="text-xs text-slate-450 font-bold">Lock, unlock, and manage platform administrator, practitioner, and patient accounts</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['User ID', 'Account Name', 'Email Address', 'System Role', 'Status', 'Registered Date', 'Action'].map((h) => (
                        <th key={h} className="pb-3 pr-4 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((user) => (
                      <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                        <td className="py-3.5 pr-4 font-mono font-bold text-slate-450">#U-{String(user.id).padStart(3, '0')}</td>
                        <td className="py-3.5 pr-4 font-bold text-slate-800">{user.name}</td>
                        <td className="py-3.5 pr-4 text-slate-600 font-semibold">{user.email}</td>
                        <td className="py-3.5 pr-4 font-bold uppercase tracking-wider text-[9px]">
                          <span className={`px-2 py-0.5 rounded-full ${
                            user.role === 'admin' ? 'bg-indigo-50 text-indigo-700' : user.role === 'doctor' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className={`text-[8px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                            user.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                              : 'bg-rose-50 text-rose-700 border-rose-150'
                          }`}>
                            {user.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-slate-500 font-semibold">{user.created_at || '2026-07-15'}</td>
                        <td className="py-3.5 pr-4">
                          {user.role !== 'admin' ? (
                            <button
                              onClick={() => handleToggleUserLock(user.id, user.status)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                                user.status === 'Locked' 
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600' 
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                              }`}
                            >
                              {user.status === 'Locked' ? 'Unlock Account' : 'Lock Account'}
                            </button>
                          ) : (
                            <span className="text-slate-400 font-bold italic text-[10px]">Restricted</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. PATIENTS REGISTRY WORKSPACE */}
          {/* ======================================================== */}
          {activeSection === 'patients' && (
            <div className="dashboard-card p-6 space-y-6 text-left">
              <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Patients Registry</h3>
                  <p className="text-xs text-slate-455 font-bold">Search, filter by scheduled appointment dates, and inspect physician bookings</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap text-[10px] font-extrabold uppercase tracking-wide">
                  {/* Date quick filter */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    {[
                      { key: 'all', label: 'All Patients' },
                      { key: 'today', label: "Today's Bookings (Jul 15)" },
                      { key: 'tomorrow', label: "Tomorrow's" },
                      { key: 'custom', label: 'Choose Date' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => {
                          setPatientDateFilter(key);
                          triggerToast(`Switched registry date filter to: ${label}`, 'info');
                        }}
                        className={`px-3 py-1.5 rounded cursor-pointer transition ${
                          patientDateFilter === key 
                            ? 'bg-white text-[#5c6dfa] shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Doctor dropdown filter */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <span className="pl-2 text-slate-450 text-[9px] uppercase font-extrabold">Physician:</span>
                    <select
                      value={patientDoctorFilter}
                      onChange={(e) => {
                        setPatientDoctorFilter(e.target.value);
                        triggerToast('Filtered patients registry by physician', 'info');
                      }}
                      className="bg-white border-0 text-slate-750 font-bold px-2.5 py-1 rounded cursor-pointer outline-none text-[10px] uppercase"
                    >
                      <option value="all">ALL DOCTORS</option>
                      {doctors.map(doc => (
                        <option key={doc.id} value={doc.id}>{doc.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Custom Date selector if custom is active */}
              {patientDateFilter === 'custom' && (
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-150 w-fit text-left">
                  <span className="font-extrabold text-[9px] text-slate-455 uppercase">Target Date:</span>
                  <input
                    type="date"
                    value={patientCustomDate}
                    onChange={(e) => setPatientCustomDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1 font-bold text-slate-800 outline-none cursor-pointer text-xs"
                  />
                </div>
              )}

              {/* Patient Search and registry count banner */}
              <div className="flex justify-between items-center flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Search patients by name or email address..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 focus:border-[#5c6dfa] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition w-full max-w-sm"
                />

                <span className="text-[10px] font-extrabold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  TOTAL MATCHES: {filteredPatients.length} / {patientsList.length} PATIENTS
                </span>
              </div>

              {/* Roster list */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Patient ID', 'Patient Name', 'Email Address', 'Last Visit', 'Assigned Doctor', 'Status', 'Action'].map((h) => (
                        <th key={h} className="pb-3 pr-4 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                        <td className="py-3.5 pr-4 font-mono font-bold text-slate-450">{p.id}</td>
                        <td className="py-3.5 pr-4 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <span>{p.name}</span>
                            {p.isHighRisk && (
                              <span className="bg-rose-50 border border-rose-150 text-rose-700 font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase animate-pulse flex items-center gap-1 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Urgent
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 text-slate-600 font-semibold">{p.email}</td>
                        <td className="py-3.5 pr-4 font-semibold text-slate-700">{p.lastVisit}</td>
                        <td className="py-3.5 pr-4">
                          <span className="font-extrabold text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px]">
                            {p.doctor || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                            p.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4">
                          <button
                            onClick={() => {
                              setSelectedPatientId(p.dbId);
                              setPatientDetailModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#5c6dfa] hover:bg-[#4e5ee6] text-white text-[10px] font-bold cursor-pointer transition shadow-md shadow-indigo-600/10"
                          >
                            View File
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredPatients.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-10 text-slate-400 font-bold italic">
                          No matching records found in patient registry.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. APPOINTMENT MONITOR WORKSPACE */}
          {/* ======================================================== */}
          {activeSection === 'appointments' && (
            <div className="dashboard-card p-6 space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4 text-left border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Appointment Monitor</h3>
                  <p className="text-xs text-slate-450 font-bold">Reschedule, cancel, or search hospital bookings</p>
                </div>
                
                {/* Horizontal Filter Row */}
                <div className="flex items-center gap-3 flex-wrap text-[10px] font-extrabold uppercase tracking-wide">
                  {/* Time Horizon Filter */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    {[{ key: 'all', label: 'All Visits' }, { key: 'today', label: 'Today' }, { key: 'upcoming', label: 'Upcoming' }, { key: 'past', label: 'Past/History' }].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setApptTimeFilter(key)}
                        className={`px-3 py-1.5 rounded cursor-pointer transition ${apptTimeFilter === key ? 'bg-white text-[#5c6dfa] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Period Filter */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    {[{ key: 'all', label: 'All Periods' }, { key: 'day', label: 'Day-wise' }, { key: 'month', label: 'Month-wise' }, { key: 'year', label: 'Year-wise' }].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setApptPeriodFilter(key)}
                        className={`px-3 py-1.5 rounded cursor-pointer transition ${apptPeriodFilter === key ? 'bg-white text-[#5c6dfa] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Period Dropdown */}
              {apptPeriodFilter !== 'all' && apptPeriodOptions.length > 0 && (
                <div className="flex items-center gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-150 w-fit text-left">
                  <span className="font-extrabold text-[9px] text-slate-455 uppercase">Selected Period:</span>
                  <select
                    value={apptPeriodKey}
                    onChange={(e) => setApptPeriodKey(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1 font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    {apptPeriodOptions.map((opt) => {
                      let label = opt;
                      if (apptPeriodFilter === 'month') {
                        try {
                          const d = new Date(opt + "-02");
                          label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
                        } catch(e) {}
                      }
                      return <option key={opt} value={opt}>{label}</option>;
                    })}
                  </select>
                </div>
              )}

              {/* Appointments Grid Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Patient Context', 'Physician Context', 'Visit Date/Time', 'Diagnosis', 'Status', 'Action'].map((h) => (
                        <th key={h} className="pb-3 pr-4 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointmentsList.map((appt) => (
                      <tr key={appt.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                        <td className="py-3 pr-4 text-left">
                          <button
                            onClick={() => {
                              setSelectedPatientId(appt.patientId);
                              setPatientDetailModal(true);
                            }}
                            className="font-bold text-slate-850 hover:text-[#5c6dfa] text-xs transition cursor-pointer text-left block"
                          >
                            {appt.patientName}
                          </button>
                          <span className="text-[10px] text-slate-400 block font-semibold">{appt.patientEmail}</span>
                        </td>
                        <td className="py-3 pr-4 text-left">
                          <span className="font-bold text-slate-800 block">{appt.doctorName}</span>
                          <span className="text-[10px] text-slate-450 font-semibold block">{appt.specialty}</span>
                        </td>
                        <td className="py-3 pr-4 text-left whitespace-nowrap">
                          <span className="font-bold text-slate-700 block">{appt.date}</span>
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-extrabold text-slate-500">{appt.timeSlot}</span>
                        </td>
                        <td className="py-3 pr-4 text-left max-w-[200px] truncate" title={appt.notes}>
                          <span className="font-semibold text-slate-600 block">{appt.diagnosis}</span>
                        </td>
                        <td className="py-3 pr-4 text-left">
                          <span className={`text-[8px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                            appt.status === 'completed' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                              : appt.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-150'
                              : 'bg-amber-50 text-amber-700 border-amber-150'
                          }`}>
                            {appt.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-left">
                          {appt.status !== 'cancelled' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setRescheduleModal(appt);
                                  setReschedDate(appt.date);
                                  setReschedTime(appt.timeSlot);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#5c6dfa] text-[10px] font-bold cursor-pointer transition"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleCancelAppointment(appt.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold cursor-pointer transition"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-semibold italic text-[10px]">Cancelled</span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {filteredAppointmentsList.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400 font-bold text-xs">
                          No matching appointments found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 5. PHARMACY MANAGEMENT WORKSPACE */}
          {/* ======================================================== */}
          {activeSection === 'pharmacy' && (
            <div className="space-y-6 text-left">
              {/* Product Catalog */}
              <div className="dashboard-card p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Product Catalog</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Manage system-wide pharmacy items and pricing directories</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['ID', 'Medication Name', 'Category', 'Price', 'Stock Level', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="pb-3 pr-4 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {productsList.map((prod) => (
                        <tr key={prod.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                          <td className="py-3 pr-4 font-mono font-bold text-slate-400">#P-{String(prod.id).padStart(2, '0')}</td>
                          <td className="py-3 pr-4 font-bold text-slate-850">
                            <span className="block">{prod.name}</span>
                            <span className="text-[9px] text-slate-400 font-semibold block">{prod.description}</span>
                          </td>
                          <td className="py-3 pr-4 font-semibold text-slate-600">{prod.category}</td>
                          <td className="py-3 pr-4 font-extrabold text-slate-800">${prod.price.toFixed(2)}</td>
                          <td className="py-3 pr-4 font-bold text-slate-650">{prod.stock} units</td>
                          <td className="py-3 pr-4">
                            <span className={`text-[8px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                              prod.status === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' : 'bg-rose-50 text-rose-700 border-rose-150'
                            }`}>
                              {prod.status}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <button
                              onClick={() => {
                                const newStock = prompt('Enter new stock level:', prod.stock);
                                if (newStock !== null) {
                                  fetch(`/api/admin/pharmacy/products/${prod.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ stock: parseInt(newStock) })
                                  }).then(() => fetchPharmacyData());
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-[#5c6dfa] text-[10px] font-bold cursor-pointer transition"
                            >
                              Update Stock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pharmacy Orders */}
              <div className="dashboard-card p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Patient Prescription Orders</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Track orders checked out across the system</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['Order ID', 'Patient Name', 'Prescription Items', 'Total Bill', 'Status', 'Order Date', 'Actions'].map((h) => (
                          <th key={h} className="pb-3 pr-4 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ordersList.map((ord) => (
                        <tr key={ord.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                          <td className="py-3 pr-4 font-mono font-bold text-slate-400">#ORD-{String(ord.id).padStart(3, '0')}</td>
                          <td className="py-3 pr-4 font-bold text-slate-800">{ord.patientName}</td>
                          <td className="py-3 pr-4 font-semibold text-slate-600">
                            {ord.items.map((item, idx) => (
                              <span key={idx} className="block">{item.name} (x{item.qty})</span>
                            ))}
                          </td>
                          <td className="py-3 pr-4 font-extrabold text-slate-800">${ord.totalAmount.toFixed(2)}</td>
                          <td className="py-3 pr-4">
                            <span className={`text-[8px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                              ord.status === 'Shipped' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' : ord.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-150' : 'bg-amber-50 text-amber-700 border-amber-150'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-slate-500 font-medium">{ord.created_at}</td>
                          <td className="py-3 pr-4 whitespace-nowrap">
                            {ord.status === 'Pending' ? (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'Shipped')}
                                  className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-bold cursor-pointer transition"
                                >
                                  Ship Order
                                </button>
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'Cancelled')}
                                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold cursor-pointer transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic font-semibold text-[10px]">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 6. AI BOT CONFIGURATION WORKSPACE */}
          {/* ======================================================== */}
          {activeSection === 'ai-bot' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
              {/* Parameters Config */}
              <section className="lg:col-span-7 space-y-6">
                <div className="dashboard-card p-6 space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Model Variant & Tuning Parameters</h3>
                    <p className="text-[10px] text-slate-450 font-bold">Configure MedGemma diagnostic parameters</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider">Model Variant Selection</label>
                      <select
                        value={aiModelVariant}
                        onChange={(e) => setAiModelVariant(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 text-xs outline-none cursor-pointer"
                      >
                        <option value="MedGemma-7B">MedGemma-7B Clinical (Local)</option>
                        <option value="Llama-3-Med-8B">Llama-3-Clinical-8B (HuggingFace)</option>
                        <option value="NovaCare-Gemma-2B">NovaCare-Gemma-2B (Edge Model)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <label className="text-slate-700 uppercase text-[9px] tracking-wider font-extrabold">Temperature</label>
                          <span className="text-[#5c6dfa]">{aiTemp}</span>
                        </div>
                        <input
                          type="range" min="0.2" max="1.0" step="0.05"
                          value={aiTemp}
                          onChange={(e) => setAiTemp(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#5c6dfa]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <label className="text-slate-700 uppercase text-[9px] tracking-wider font-extrabold">Max Output Tokens</label>
                          <span className="text-[#5c6dfa]">{aiMaxTokens}</span>
                        </div>
                        <input
                          type="range" min="128" max="1024" step="64"
                          value={aiMaxTokens}
                          onChange={(e) => setAiMaxTokens(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#5c6dfa]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[9px] font-extrabold text-slate-700 uppercase tracking-wider">Guidelines System Prompt</label>
                      <textarea
                        rows="3"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                      ></textarea>
                    </div>

                    <button 
                      onClick={() => triggerToast('MedGemma AI prompt parameters updated successfully!')}
                      className="w-full py-3 bg-[#5c6dfa] hover:bg-[#4e5ee6] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer uppercase tracking-wider transition"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>

                {/* MedGemma Playground */}
                <div className="dashboard-card p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">MedGemma Prompt Playground</h3>
                    <p className="text-[10px] text-slate-450 font-bold">Test AI symptom diagnostics under current prompt rules</p>
                  </div>

                  <form onSubmit={handleTestAiSymptom} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Enter symptoms (e.g. sore throat, fever, stiff joints)..."
                      value={testSymptoms}
                      onChange={(e) => setTestSymptoms(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                    />
                    <button
                      type="submit"
                      disabled={testingAi}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-[#5c6dfa] text-slate-700 hover:text-white transition font-bold text-xs cursor-pointer disabled:opacity-50"
                    >
                      {testingAi ? 'Simulating Analysis...' : 'Test Diagnostics'}
                    </button>
                  </form>

                  {testResult && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 leading-relaxed">
                      <p className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">Playground Output</p>
                      {testResult}
                    </div>
                  )}
                </div>
              </section>

              {/* RAG Guidelines Indexer */}
              <section className="lg:col-span-5 space-y-6">
                <div className="dashboard-card p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-extrabold">RAG Clinical Datasets</h3>
                    <p className="text-[10px] text-slate-450 font-bold">Knowledge bases indexed into MedGemma diagnostics memory</p>
                  </div>

                  <div className="space-y-3">
                    {ragList.map((file) => (
                      <div key={file.id} className="p-3 bg-slate-50/60 border border-slate-150 rounded-xl flex items-center justify-between">
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-[#5c6dfa] flex items-center justify-center shrink-0">
                            <i className="fa-regular fa-file-pdf text-sm"></i>
                          </div>
                          <div className="min-w-0 text-left">
                            <h5 className="font-extrabold text-[11px] text-slate-800 truncate" title={file.filename}>{file.filename}</h5>
                            <span className="text-[8px] text-slate-400 font-bold block">{file.category} · {file.fileSize}</span>
                          </div>
                        </div>
                        <span className="text-[8px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-150 rounded px-2 py-0.5 shrink-0">INDEXED</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ======================================================== */}
          {/* 7. ANALYTICS & REPORTS WORKSPACE */}
          {/* ======================================================== */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                {/* SVG Revenue Graph */}
                <div className="dashboard-card p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Revenue Billing Trends</h4>
                    <p className="text-[10px] text-slate-450 font-bold">Simulated monthly billings inside the platform</p>
                  </div>
                  <div className="relative pt-4 h-48">
                    <svg className="w-full h-full" viewBox="0 0 600 160" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaGradAna" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#5c6dfa" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#5c6dfa" stopOpacity="0.00" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="20" x2="600" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                      <line x1="0" y1="60" x2="600" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                      <line x1="0" y1="100" x2="600" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                      <line x1="0" y1="140" x2="600" y2="140" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                      <path d="M 0 140 C 50 110, 100 120, 150 70 C 200 30, 250 80, 300 40 C 350 20, 400 90, 450 50 C 500 20, 550 40, 600 10 L 600 140 L 0 140 Z" fill="url(#areaGradAna)" />
                      <path d="M 0 140 C 50 110, 100 120, 150 70 C 200 30, 250 80, 300 40 C 350 20, 400 90, 450 50 C 500 20, 550 40, 600 10" fill="none" stroke="#5c6dfa" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="flex justify-between px-2 text-[9px] text-slate-400 font-extrabold uppercase">
                    <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                  </div>
                </div>

                {/* SVG Appointments comparative Load */}
                <div className="dashboard-card p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Clinical Appointments load</h4>
                    <p className="text-[10px] text-slate-455 font-bold">Total booked slots: Current vs. Prior Month</p>
                  </div>
                  <div className="relative pt-4 h-48 flex items-end justify-around bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                    {/* St. Jude */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-end gap-1.5 h-28">
                        <div className="w-5 bg-slate-200 rounded-t-md" style={{ height: '70%' }}></div>
                        <div className="w-5 bg-[#5c6dfa] rounded-t-md" style={{ height: '90%' }}></div>
                      </div>
                      <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider mt-1">St. Jude</span>
                    </div>
                    {/* Johns Hopkins */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-end gap-1.5 h-28">
                        <div className="w-5 bg-slate-200 rounded-t-md" style={{ height: '50%' }}></div>
                        <div className="w-5 bg-[#5c6dfa] rounded-t-md" style={{ height: '75%' }}></div>
                      </div>
                      <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider mt-1">Hopkins</span>
                    </div>
                    {/* Mayo Clinic */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-end gap-1.5 h-28">
                        <div className="w-5 bg-slate-200 rounded-t-md" style={{ height: '80%' }}></div>
                        <div className="w-5 bg-[#5c6dfa] rounded-t-md" style={{ height: '60%' }}></div>
                      </div>
                      <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider mt-1">Mayo</span>
                    </div>
                    {/* City Emergency */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-end gap-1.5 h-28">
                        <div className="w-5 bg-slate-200 rounded-t-md" style={{ height: '30%' }}></div>
                        <div className="w-5 bg-[#5c6dfa] rounded-t-md" style={{ height: '55%' }}></div>
                      </div>
                      <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider mt-1">City ER</span>
                    </div>
                  </div>
                  <div className="flex gap-4 justify-center text-[9px] font-bold text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-slate-200 rounded-sm"></span> Prior Month</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#5c6dfa] rounded-sm"></span> Current Month</span>
                  </div>
                </div>
              </div>

              {/* Summarized Reports Table */}
              <div className="dashboard-card p-6 space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Stakeholder Data Summaries</h3>
                    <p className="text-[10px] text-slate-450 font-bold">Consolidated clinical analytics outputs</p>
                  </div>
                  <button 
                    onClick={() => triggerToast('Summarized PDF report download initialized.', 'success')}
                    className="px-4 py-2 bg-[#5c6dfa] hover:bg-[#4e5ee6] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-file-export"></i> Export Report
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['Department / Clinic', 'Assigned Staff', 'Consultations Logged', 'AI Utilization Rate', 'Revenue Contribution'].map((h) => (
                          <th key={h} className="pb-3 pr-4 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { dept: 'Cardiology Clinic', staff: '2 MDs', consults: 48, aiUse: '84%', rev: '$52,400' },
                        { dept: 'Pediatrics Department', staff: '1 MD', consults: 32, aiUse: '90%', rev: '$28,900' },
                        { dept: 'Neurology Unit', staff: '1 MD', consults: 15, aiUse: '60%', rev: '$18,500' }
                      ].map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition font-semibold text-slate-700">
                          <td className="py-3 pr-4 font-bold text-slate-850">{row.dept}</td>
                          <td className="py-3 pr-4 text-slate-500">{row.staff}</td>
                          <td className="py-3 pr-4 text-slate-800 font-extrabold">{row.consults} visits</td>
                          <td className="py-3 pr-4 text-slate-650">{row.aiUse}</td>
                          <td className="py-3 pr-4 text-slate-800 font-extrabold">{row.rev}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 8. SYSTEM SETTINGS WORKSPACE */}
          {/* ======================================================== */}
          {activeSection === 'settings' && (
            <div className="dashboard-card p-6 space-y-6 text-left max-w-xl mx-auto">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">System Settings</h3>
                <p className="text-xs text-slate-455 font-bold">Configure security configurations and SMTP gateways</p>
              </div>

              <div className="space-y-5">
                {/* SMTP Email Server configurations */}
                <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">SMTP Notifier Gateway</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase mb-1">Host Domain</label>
                      <input
                        type="text"
                        value={smtpConfig.host}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-855 text-xs font-semibold focus:border-indigo-400 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase mb-1">Port</label>
                      <input
                        type="text"
                        value={smtpConfig.port}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-855 text-xs font-semibold focus:border-indigo-400 outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => triggerToast(`Connection check successful. Linked to SMTP host: ${smtpConfig.host}`, 'success')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-[#5c6dfa] text-[#5c6dfa] hover:text-white transition font-bold text-[10px] cursor-pointer"
                    >
                      Send Test Email
                    </button>
                  </div>
                </div>

                {/* Maintenance mode toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">Platform Maintenance Mode</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">Temporarily restrict patient booking capabilities</p>
                  </div>
                  <button 
                    onClick={() => {
                      setMaintenanceMode(!maintenanceMode);
                      triggerToast(`Maintenance Mode ${!maintenanceMode ? 'activated' : 'deactivated'}`);
                    }}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition duration-200 focus:outline-none flex items-center shrink-0 cursor-pointer ${
                      maintenanceMode ? 'bg-[#5c6dfa]' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transform transition duration-200 ${maintenanceMode ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Enforce MFA toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">Enforce Multi-Factor Auth (MFA)</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">Enforce phone OTP codes for all administrative logins</p>
                  </div>
                  <button 
                    onClick={() => {
                      setMfaEnforced(!mfaEnforced);
                      triggerToast(`MFA Requirement ${!mfaEnforced ? 'enforced' : 'disabled'}`);
                    }}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition duration-200 focus:outline-none flex items-center shrink-0 cursor-pointer ${
                      mfaEnforced ? 'bg-[#5c6dfa]' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transform transition duration-200 ${mfaEnforced ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Session timeout selector */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">Admin Session Timeout</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">Auto-logout duration threshold after inactivity</p>
                  </div>
                  <select className="bg-white border border-slate-200 rounded-lg px-3 py-1 font-bold text-slate-800 outline-none cursor-pointer text-xs">
                    <option value="15">15 mins</option>
                    <option value="30">30 mins</option>
                    <option value="60">1 hour</option>
                    <option value="240">4 hours</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => triggerToast('General settings saved successfully!')}
                    className="flex-1 py-3 bg-[#5c6dfa] hover:bg-[#4e5ee6] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer uppercase tracking-wider transition"
                  >
                    Save Settings
                  </button>
                  <button
                    onClick={() => {
                      triggerToast('Database backup archive download started.', 'success');
                      window.open('/api/admin/settings/backup', '_blank');
                    }}
                    className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition border border-slate-200"
                  >
                    Backup DB
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 9. SUPPORT / LOGS WORKSPACE */}
          {/* ======================================================== */}
          {activeSection === 'support' && (
            <div className="space-y-6 text-left">
              {/* Helpdesk Support Tickets */}
              <div className="dashboard-card p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-extrabold">Helpdesk Tickets Queue</h3>
                  <p className="text-[10px] text-slate-450 font-bold">Manage support requests raised by patients and practitioners</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['Ticket ID', 'Reporter', 'Subject & Details', 'Priority', 'Status', 'Logged Time', 'Actions'].map((h) => (
                          <th key={h} className="pb-3 pr-4 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ticketsList.map((tick) => (
                        <tr key={tick.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                          <td className="py-3 pr-4 font-mono font-bold text-slate-400">#TK-{String(tick.id).padStart(3, '0')}</td>
                          <td className="py-3 pr-4 font-bold text-slate-850">
                            <span className="block">{tick.creatorName}</span>
                            <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-extrabold text-slate-500 uppercase tracking-wide inline-block mt-0.5">{tick.role}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="font-bold text-slate-800 block">{tick.subject}</span>
                            <span className="text-[10px] text-slate-450 font-semibold block">{tick.description}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded border uppercase ${
                              tick.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-150' : tick.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-150' : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {tick.priority}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`text-[8px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                              tick.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' : tick.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-150' : 'bg-amber-50 text-amber-700 border-amber-150'
                            }`}>
                              {tick.status}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-slate-500 font-medium">{tick.createdAt}</td>
                          <td className="py-3 pr-4">
                            {tick.status !== 'Resolved' ? (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleUpdateTicketStatus(tick.id, 'In Progress')}
                                  className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-[#5c6dfa] text-[10px] font-bold cursor-pointer transition"
                                >
                                  In Progress
                                </button>
                                <button
                                  onClick={() => handleUpdateTicketStatus(tick.id, 'Resolved')}
                                  className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-bold cursor-pointer transition"
                                >
                                  Resolve
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-semibold italic text-[10px]">Closed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Suspicious Logs Log */}
              <div className="dashboard-card p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-extrabold">System Security Logs</h3>
                  <p className="text-[10px] text-slate-450 font-bold">Suspicious activities and system error stack traces</p>
                </div>

                <div className="space-y-2.5">
                  {[
                    { time: '11:14 PM', text: 'Suspicious login threshold reached: 4 failed attempts from IP 192.168.1.189', level: 'WARNING', bg: 'bg-amber-50 border-amber-150 text-amber-800' },
                    { time: '09:44 PM', text: 'Invalid JSON signature check failed for prescription request #18', level: 'SEVERE', bg: 'bg-rose-50 border-rose-150 text-rose-800' },
                    { time: '08:12 PM', text: 'CORS policy blocked access request from origin http://maliciousdomain.ru', level: 'INFO', bg: 'bg-slate-50 border-slate-200 text-slate-700' }
                  ].map((log, idx) => (
                    <div key={idx} className={`p-3 border rounded-xl flex items-center justify-between text-xs font-semibold ${log.bg}`}>
                      <span>{log.text}</span>
                      <span className="font-mono text-[9px] opacity-75">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- RESCHEDULE APPOINTMENT MODAL --- */}
          {rescheduleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl border border-slate-100 space-y-5 text-left">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">Reschedule Visit</h3>
                  <button onClick={() => setRescheduleModal(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-450 uppercase mb-1">Select Reschedule Date</label>
                    <input
                      type="date" required
                      value={reschedDate}
                      onChange={(e) => setReschedDate(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-455 uppercase mb-1">Select Reschedule Time Slot</label>
                    <input
                      type="text" required
                      value={reschedTime}
                      onChange={(e) => setReschedTime(e.target.value)}
                      placeholder="e.g. 09:30 AM"
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => setRescheduleModal(null)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 text-xs font-bold text-white bg-[#5c6dfa] hover:bg-[#4e5ee6] rounded-xl cursor-pointer shadow-md shadow-indigo-600/15">Update Schedule</button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
      {/* --- ADD DOCTOR MODAL --- */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Register New Practitioner</h3>
              <button onClick={() => setAddModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleAddDoctor} className="space-y-4 text-left max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Full Name</label>
                  <input
                    type="text" required value={newDoc.name}
                    onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                    placeholder="Dr. Sarah Jenkins"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Email</label>
                  <input
                    type="email" required value={newDoc.email}
                    onChange={(e) => setNewDoc({ ...newDoc, email: e.target.value })}
                    placeholder="sarah.j@novacare.com"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Specialty</label>
                  <input
                    type="text" required value={newDoc.specialty}
                    onChange={(e) => setNewDoc({ ...newDoc, specialty: e.target.value })}
                    placeholder="e.g. Neurologist"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">NPI Number</label>
                  <input
                    type="text" required value={newDoc.npi}
                    onChange={(e) => setNewDoc({ ...newDoc, npi: e.target.value })}
                    placeholder="1009845112"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Languages</label>
                  <input
                    type="text" value={newDoc.languages}
                    onChange={(e) => setNewDoc({ ...newDoc, languages: e.target.value })}
                    placeholder="English, Spanish"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Phone</label>
                  <input
                    type="text" value={newDoc.phone}
                    onChange={(e) => setNewDoc({ ...newDoc, phone: e.target.value })}
                    placeholder="+(555) 762-1144"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Office Room Address</label>
                <input
                  type="text" value={newDoc.address}
                  onChange={(e) => setNewDoc({ ...newDoc, address: e.target.value })}
                  placeholder="Room 102, Main Wing"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Biography Description</label>
                <textarea
                  value={newDoc.description} rows="3"
                  onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                  placeholder="Certifications and clinical focus..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setAddModal(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-xs font-bold text-white bg-[#5c6dfa] hover:bg-[#4e5ee6] rounded-xl cursor-pointer shadow-md shadow-indigo-600/15">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT DOCTOR MODAL --- */}
      {editModal && editDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Modify Physician Credentials</h3>
              <button onClick={() => setEditModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleEditDoctor} className="space-y-4 text-left max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Full Name</label>
                  <input
                    type="text" required value={editDoc.name}
                    onChange={(e) => setEditDoc({ ...editDoc, name: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Email</label>
                  <input
                    type="email" required value={editDoc.email}
                    onChange={(e) => setEditDoc({ ...editDoc, email: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Specialty</label>
                  <input
                    type="text" required value={editDoc.specialty}
                    onChange={(e) => setEditDoc({ ...editDoc, specialty: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">NPI Number</label>
                  <input
                    type="text" required value={editDoc.npi}
                    onChange={(e) => setEditDoc({ ...editDoc, npi: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Languages</label>
                  <input
                    type="text" value={editDoc.languages}
                    onChange={(e) => setEditDoc({ ...editDoc, languages: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Phone</label>
                  <input
                    type="text" value={editDoc.phone}
                    onChange={(e) => setEditDoc({ ...editDoc, phone: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Office Room Address</label>
                <input
                  type="text" value={editDoc.address}
                  onChange={(e) => setEditDoc({ ...editDoc, address: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Biography Description</label>
                <textarea
                  value={editDoc.description} rows="3"
                  onChange={(e) => setEditDoc({ ...editDoc, description: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditModal(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-xs font-bold text-white bg-[#5c6dfa] hover:bg-[#4e5ee6] rounded-xl cursor-pointer shadow-md shadow-indigo-600/15">Save Updates</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRM MODAL --- */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-2xl">⚠️</div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
              <p className="text-xs text-slate-500 mt-2">This doctor's profile and credentials will be permanently deleted from the directory database. This cannot be undone.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer">Cancel</button>
              <button onClick={() => handleDeleteDoctor(deleteConfirm)} className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-md cursor-pointer">Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* --- PATIENT MEDICAL FILE TIMELINE MODAL --- */}
      {patientDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-4xl shadow-2xl border border-slate-100 relative space-y-6 flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-folder-medical text-[#5c6dfa]"></i> Patient Clinical File
              </h3>
              <button onClick={() => {
                setPatientDetailModal(false);
                setPatientDetail(null);
                setSelectedPatientId(null);
              }} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {loadingPatient ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-[#5c6dfa] mb-4"></div>
                <p className="text-xs text-slate-450 font-bold">Retrieving secure diagnostic database record...</p>
              </div>
            ) : patientDetail ? (
              <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 pr-1">
                
                {/* Profile panel (col-span-4) */}
                <div className="md:col-span-4 bg-slate-50 border border-slate-150 p-5 rounded-2xl h-fit space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#5c6dfa] text-xl font-extrabold font-mono shadow-sm shrink-0">
                      {patientDetail.profile.name.charAt(0)}
                    </div>
                    <div className="text-left min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-800 truncate" title={patientDetail.profile.name}>
                        {patientDetail.profile.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                        {patientDetail.profile.id}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-200 text-xs text-left">
                    <div>
                      <span className="block text-[8px] uppercase font-bold text-slate-450">Email</span>
                      <span className="font-bold text-slate-800 block truncate">{patientDetail.profile.email}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase font-bold text-slate-450">Phone</span>
                      <span className="font-bold text-slate-800">{patientDetail.profile.phone}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-450">Age</span>
                        <span className="font-bold text-slate-800">{patientDetail.profile.age} Yrs</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-450">Gender</span>
                        <span className="font-bold text-slate-800">{patientDetail.profile.gender}</span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase font-bold text-slate-455">Registration Date</span>
                      <span className="font-bold text-slate-800">{patientDetail.profile.joined}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase font-bold text-slate-455">Address</span>
                      <span className="font-bold text-slate-800 block truncate" title={patientDetail.profile.address}>{patientDetail.profile.address}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-455">Blood Type</span>
                        <span className="font-extrabold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-[10px] w-fit block">{patientDetail.profile.blood_type}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-455">Allergies</span>
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 text-[10px] w-fit block truncate max-w-[90px]" title={patientDetail.profile.allergies}>{patientDetail.profile.allergies}</span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase font-bold text-slate-455">Chronic Illnesses</span>
                      <span className="font-bold text-slate-700 block truncate" title={patientDetail.profile.chronic}>{patientDetail.profile.chronic}</span>
                    </div>
                  </div>
                </div>

                {/* History Timeline and Records (col-span-8) */}
                <div className="md:col-span-8 space-y-6">
                  
                  {/* Timeline section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 text-left">Prescriptions & Diagnoses History</h4>
                    
                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                      {patientDetail.history.map((hnode, idx) => (
                        <div key={hnode.prescriptionId} className="flex gap-4 relative text-left">
                          {/* Vertical Connector Line */}
                          {idx !== patientDetail.history.length - 1 && (
                            <span className="absolute left-4.5 top-8 bottom-[-20px] w-0.5 bg-slate-200 block z-0"></span>
                          )}

                          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-[#5c6dfa] text-xs font-bold shrink-0 z-10 border border-indigo-100">
                            <i className="fa-solid fa-receipt"></i>
                          </div>

                          <div className="flex-1 bg-slate-50/50 border border-slate-150 p-4 rounded-xl space-y-2">
                            <div className="flex justify-between items-center flex-wrap gap-2">
                              <h5 className="font-bold text-xs text-slate-800">
                                {hnode.doctorName}
                              </h5>
                              <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-extrabold text-slate-500">
                                {hnode.date}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 font-bold">
                              Diagnosis: <span className="text-indigo-600 font-extrabold">{hnode.diagnosis}</span>
                            </p>

                            {hnode.medications.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {hnode.medications.map((med, midx) => (
                                  <span key={midx} className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-150 font-bold">
                                    💊 {med.name} ({med.dosage} - {med.frequency})
                                  </span>
                                ))}
                              </div>
                            )}

                            <p className="text-[10px] italic text-slate-450 font-semibold pt-1 border-t border-dashed border-slate-200">
                              Notes: {hnode.notes}
                            </p>
                          </div>
                        </div>
                      ))}

                      {patientDetail.history.length === 0 && (
                        <p className="text-xs text-slate-400 font-bold py-6 text-center">No prescription logs recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* Reports records section */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 text-left">Lab Reports & Medical Records</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[140px] overflow-y-auto pr-1">
                      {patientDetail.reports.map((rep) => (
                        <div 
                          key={rep.recordId}
                          className="p-3 bg-slate-50/60 hover:bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between transition text-left cursor-pointer"
                          onClick={() => triggerToast(`Viewing file: ${rep.fileName}`, 'info')}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-[#5c6dfa] flex items-center justify-center shrink-0">
                              <i className={rep.fileType === 'pdf' ? 'fa-regular fa-file-pdf text-sm' : 'fa-regular fa-image text-sm'}></i>
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-extrabold text-[11px] text-slate-800 truncate" title={rep.fileName}>
                                {rep.fileName}
                              </h5>
                              <span className="text-[8px] text-slate-400 font-bold block">{rep.uploadDate}</span>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerToast(`Downloading record: ${rep.fileName}`);
                            }}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition shrink-0 cursor-pointer shadow-sm"
                          >
                            <i className="fa-solid fa-arrow-down-long text-[10px]"></i>
                          </button>
                        </div>
                      ))}

                      {patientDetail.reports.length === 0 && (
                        <p className="text-xs text-slate-400 font-bold py-4 text-center sm:col-span-2">No clinical documents uploaded.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            ) : null}

          </div>
        </div>
      )}

      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl border border-slate-100 space-y-5 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Add Pharmacy Product</h3>
              <button onClick={() => setShowAddProductModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-450 uppercase mb-1">Product Name</label>
                <input
                  type="text" required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Lipitor 10mg"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-450 uppercase mb-1">Price ($)</label>
                  <input
                    type="number" step="0.01" required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="e.g. 19.99"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-455 uppercase mb-1">Initial Stock</label>
                  <input
                    type="number" required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                    placeholder="50"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-450 uppercase mb-1">Category</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition cursor-pointer"
                >
                  <option value="General">General Care</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-450 uppercase mb-1">Description</label>
                <textarea
                  rows="2"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Enter product description/indications..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddProductModal(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-xs font-bold text-white bg-[#5c6dfa] hover:bg-[#4e5ee6] rounded-xl cursor-pointer shadow-md shadow-indigo-600/15">Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddRagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl border border-slate-100 space-y-5 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Index RAG Guideline</h3>
              <button onClick={() => setShowAddRagModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleAddRagSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-455 uppercase mb-1">Clinical Document Filename</label>
                <input
                  type="text" required
                  value={newRagFile.filename}
                  onChange={(e) => setNewRagFile({ ...newRagFile, filename: e.target.value })}
                  placeholder="e.g. Heart_Failure_Guidelines_2026.pdf"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-450 uppercase mb-1">Knowledge Category</label>
                <select
                  value={newRagFile.category}
                  onChange={(e) => setNewRagFile({ ...newRagFile, category: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none transition cursor-pointer"
                >
                  <option value="Clinical Guidelines">Clinical Guidelines</option>
                  <option value="Drug Interactions">Drug Interactions</option>
                  <option value="Hospital Protocol">Hospital Protocol</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddRagModal(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-xs font-bold text-white bg-[#5c6dfa] hover:bg-[#4e5ee6] rounded-xl cursor-pointer shadow-md shadow-indigo-600/15">Index Document</button>
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

export default AdminDashboard;
