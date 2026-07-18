import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isTabActive = (path, tabValue = null) => {
    if (location.pathname !== path) return false;
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab');
    if (tabValue === 'overview') {
      return currentTab === 'overview' || !currentTab;
    }
    return currentTab === tabValue;
  };

  const getLinkClass = (isActive) => {
    return `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-xs font-semibold ${
      isActive ? 'bg-white/20 text-white shadow-inner font-bold' : 'text-indigo-100 hover:bg-brand-sidebarHover hover:text-white'
    }`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  // Render navigation links based on user role
  const renderNavLinks = () => {
    switch (user.role) {
      case 'patient':
        return (
          <>
            {/* My Care Section */}
            <h5 className="text-[9px] font-extrabold text-indigo-200 uppercase tracking-widest mb-1.5 px-3.5">My Care</h5>
            <NavLink 
              to="/patient" 
              end
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                  isActive && !location.search ? 'bg-white/20 text-white shadow-inner font-bold' : 'text-indigo-100 hover:bg-brand-sidebarHover hover:text-white'
                }`
              }
            >
              👤 <span>Care Overview</span>
            </NavLink>
            <NavLink 
              to="/patient?tab=future" 
              className={() => 
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                  location.search.includes('tab=future') || location.search.includes('tab=past') || location.search.includes('tab=treatment') ? 'bg-white/20 text-white shadow-inner font-bold' : 'text-indigo-100 hover:bg-brand-sidebarHover hover:text-white'
                }`
              }
            >
              📅 <span>My Appointments</span>
            </NavLink>
            <NavLink 
              to="/prescription" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                  isActive ? 'bg-white/20 text-white shadow-inner font-bold' : 'text-indigo-100 hover:bg-brand-sidebarHover hover:text-white'
                }`
              }
            >
              💊 <span>Prescriptions & QR</span>
            </NavLink>

            {/* Services Section */}
            <h5 className="text-[9px] font-extrabold text-indigo-200 uppercase tracking-widest mt-4 mb-1.5 px-3.5">Services</h5>
            <NavLink 
              to="/ai-doctor" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                  isActive ? 'bg-white/20 text-white shadow-inner font-bold' : 'text-indigo-100 hover:bg-brand-sidebarHover hover:text-white'
                }`
              }
            >
              🤖 <span>AI Doctor Assistant</span>
            </NavLink>
            <NavLink 
              to="/book-appointment" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                  isActive ? 'bg-white/20 text-white shadow-inner font-bold' : 'text-indigo-100 hover:bg-brand-sidebarHover hover:text-white'
                }`
              }
            >
              🔍 <span>Find & Book Doctors</span>
            </NavLink>
            <NavLink 
              to="/pharmacy" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                  isActive ? 'bg-white/20 text-white shadow-inner font-bold' : 'text-indigo-100 hover:bg-brand-sidebarHover hover:text-white'
                }`
              }
            >
              🏪 <span>Online Pharmacy</span>
            </NavLink>

            {/* Health Records Section */}
            <h5 className="text-[9px] font-extrabold text-indigo-200 uppercase tracking-widest mt-4 mb-1.5 px-3.5">Health Records</h5>
            <NavLink 
              to="/patient?tab=records" 
              className={() => 
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                  location.search.includes('tab=records') ? 'bg-white/20 text-white shadow-inner font-bold' : 'text-indigo-100 hover:bg-brand-sidebarHover hover:text-white'
                }`
              }
            >
              📂 <span>Medical Records</span>
            </NavLink>
            <NavLink 
              to="/analytics" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                  isActive ? 'bg-white/20 text-white shadow-inner font-bold' : 'text-indigo-100 hover:bg-brand-sidebarHover hover:text-white'
                }`
              }
            >
              📈 <span>Health Analytics</span>
            </NavLink>

            {/* Account & Support Section */}
            <h5 className="text-[9px] font-extrabold text-indigo-200 uppercase tracking-widest mt-4 mb-1.5 px-3.5">Account & Support</h5>
            <NavLink 
              to="/settings" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                  isActive ? 'bg-white/20 text-white shadow-inner font-bold' : 'text-indigo-100 hover:bg-brand-sidebarHover hover:text-white'
                }`
              }
            >
              ⚙️ <span>Settings</span>
            </NavLink>
            <NavLink 
              to="/support" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                  isActive ? 'bg-white/20 text-white shadow-inner font-bold' : 'text-indigo-100 hover:bg-brand-sidebarHover hover:text-white'
                }`
              }
            >
              🙋 <span>Support & Help</span>
            </NavLink>
          </>
        );

      case 'doctor':
        return (
          <>
            <h5 className="text-[9px] font-extrabold text-indigo-200 uppercase tracking-widest mb-2 px-3.5">Clinical Portal</h5>
            <NavLink 
              to="/doctor" 
              className={({ isActive }) => 
                `flex items-center gap-3.5 px-4.5 py-3 rounded-xl transition-all text-sm font-semibold ${
                  isActive ? 'bg-white/20 text-white shadow-inner' : 'text-indigo-100 hover:bg-brand-sidebarHover hover:text-white'
                }`
              }
            >
              <i className="fa-solid fa-table-cells-large text-sm"></i>
              <span>Dashboard</span>
            </NavLink>
            <NavLink 
              to="/calendar" 
              className={({ isActive }) => 
                `flex items-center gap-3.5 px-4.5 py-3 rounded-xl transition-all text-sm font-semibold ${
                  isActive ? 'bg-white/20 text-white shadow-inner' : 'text-indigo-100 hover:bg-brand-sidebarHover hover:text-white'
                }`
              }
            >
              <i className="fa-solid fa-calendar text-sm"></i>
              <span>Schedule Visits</span>
            </NavLink>
            <NavLink 
              to="/prescription" 
              className={({ isActive }) => 
                `flex items-center gap-3.5 px-4.5 py-3 rounded-xl transition-all text-sm font-semibold ${
                  isActive ? 'bg-white/20 text-white shadow-inner' : 'text-indigo-100 hover:bg-brand-sidebarHover hover:text-white'
                }`
              }
            >
              <i className="fa-solid fa-file-medical text-sm"></i>
              <span>Issue Prescription</span>
            </NavLink>
          </>
        );

      case 'admin':
        return (
          <>
            <h5 className="text-[9px] font-extrabold text-indigo-200 uppercase tracking-widest mb-2 px-3.5">Admin Menu</h5>
            <Link 
              to="/admin?tab=overview" 
              className={getLinkClass(isTabActive('/admin', 'overview'))}
            >
              <i className="fa-solid fa-table-cells-large text-xs w-4 shrink-0 text-center"></i>
              <span>System Overview</span>
            </Link>
            <Link 
              to="/admin?tab=users" 
              className={getLinkClass(isTabActive('/admin', 'users'))}
            >
              <i className="fa-solid fa-user-gear text-xs w-4 shrink-0 text-center"></i>
              <span>User Management</span>
            </Link>
            <Link 
              to="/admin?tab=doctors" 
              className={getLinkClass(isTabActive('/admin', 'doctors'))}
            >
              <i className="fa-solid fa-user-doctor text-xs w-4 shrink-0 text-center"></i>
              <span>Doctors Directory</span>
            </Link>
            <Link 
              to="/admin?tab=patients" 
              className={getLinkClass(isTabActive('/admin', 'patients'))}
            >
              <i className="fa-solid fa-hospital-user text-xs w-4 shrink-0 text-center"></i>
              <span>Patients Registry</span>
            </Link>
            <Link 
              to="/admin?tab=appointments" 
              className={getLinkClass(isTabActive('/admin', 'appointments'))}
            >
              <i className="fa-solid fa-calendar-check text-xs w-4 shrink-0 text-center"></i>
              <span>Appointment Monitor</span>
            </Link>
            <Link 
              to="/admin?tab=pharmacy" 
              className={getLinkClass(isTabActive('/admin', 'pharmacy'))}
            >
              <i className="fa-solid fa-prescription-bottle-medical text-xs w-4 shrink-0 text-center"></i>
              <span>Pharmacy Management</span>
            </Link>
            <Link 
              to="/admin?tab=ai-bot" 
              className={getLinkClass(isTabActive('/admin', 'ai-bot'))}
            >
              <i className="fa-solid fa-robot text-xs w-4 shrink-0 text-center"></i>
              <span>AI Bot Configuration</span>
            </Link>
            <Link 
              to="/admin?tab=analytics" 
              className={getLinkClass(isTabActive('/admin', 'analytics'))}
            >
              <i className="fa-solid fa-chart-line text-xs w-4 shrink-0 text-center"></i>
              <span>Analytics & Reports</span>
            </Link>
            <Link 
              to="/admin?tab=settings" 
              className={getLinkClass(isTabActive('/admin', 'settings'))}
            >
              <i className="fa-solid fa-sliders text-xs w-4 shrink-0 text-center"></i>
              <span>System Settings</span>
            </Link>
            <Link 
              to="/admin?tab=support" 
              className={getLinkClass(isTabActive('/admin', 'support'))}
            >
              <i className="fa-solid fa-headset text-xs w-4 shrink-0 text-center"></i>
              <span>Support / Logs</span>
            </Link>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <aside className="no-print w-64 bg-brand-sidebar flex-shrink-0 flex flex-col text-white relative shadow-xl shadow-indigo-600/10 h-screen sticky top-0">
      
      {/* Brand Logo Header */}
      <div className="p-6 flex items-center gap-3 border-b border-white/10 mb-4">
        <Link to="/" className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-sidebar font-extrabold text-xl shadow-md overflow-hidden">
          <img src="/images/app-logo.jpg" alt="NovaCare Logo" className="w-full h-full object-cover" />
        </Link>
        <div>
          <span className="font-bold text-xl tracking-tight block">NovaCare OS</span>
          <span className="text-[10px] text-indigo-100 uppercase tracking-widest font-semibold">{user.role} workspace</span>
        </div>
      </div>

      {/* Main Navigation Items */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pt-2">
        {renderNavLinks()}
        
        <div className="h-px bg-white/10 my-4"></div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-100 hover:bg-brand-sidebarHover hover:text-white transition-all text-sm font-semibold text-left"
        >
          🚪 <span>Logout</span>
        </button>
      </nav>

      {/* Upgrade to PRO Promotion Banner */}
      <div className="p-4 m-4 rounded-2xl bg-gradient-to-tr from-white/20 to-white/5 border border-white/10 relative overflow-hidden shrink-0">
        <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-white">NovaCare OS</h4>
        <p className="text-[10px] text-indigo-100 mt-1 leading-relaxed">Integrated Clinical Intelligence Workflows.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
