import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ title, onSearch, searchQuery, toggleAlerts }) => {
  const { user } = useAuth();

  if (!user) return null;

  // Determine avatar and label based on user role
  const getProfileMeta = () => {
    switch (user.role) {
      case 'patient':
        return {
          name: 'Kate Prokopchuk',
          role: 'Patient Profile',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
        };
      case 'doctor':
        return {
          name: 'Dr. Helen Ross',
          role: 'Cardiology Lead',
          avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150'
        };
      case 'admin':
        return {
          name: 'Nola Hawkins',
          role: 'System Admin',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
        };
      default:
        return {
          name: user.name,
          role: user.role,
          avatar: 'https://placehold.co/150x150/5c6dfa/ffffff?text=U'
        };
    }
  };

  const meta = getProfileMeta();

  return (
    <header className="no-print bg-white/75 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title || 'Clinical Dashboard'}</h1>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
        {/* Search Bar (optional parameter toggle) */}
        {onSearch && (
          <div className="relative w-full max-w-[280px]">
            <input 
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search in workspace..."
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-300 rounded-xl text-xs placeholder-slate-400 focus:outline-none transition-all shadow-inner"
            />
            <i className="fa-solid fa-magnifying-glass absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          </div>
        )}

        <div className="flex items-center gap-4 shrink-0">
          {/* Notification bell */}
          <button 
            onClick={toggleAlerts}
            className="relative p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-coral animate-pulse"></span>
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200"></div>

          {/* User Profile Badge */}
          <div className="flex items-center gap-3 bg-slate-50 p-1.5 px-4 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-100 transition shadow-sm">
            <img 
              src={meta.avatar} 
              alt={meta.name} 
              className="w-8 h-8 rounded-full object-cover border border-white"
              onError={(e) => { e.target.src = 'https://placehold.co/150x150/5c6dfa/ffffff?text=U'; }}
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-none">{meta.name}</p>
              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{meta.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
