import React, { useEffect } from 'react';

const Toast = ({ message, show, onClose, type = 'info' }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  // Set colors based on notification type
  let iconClass = 'fa-solid fa-circle-info';
  let iconBgColor = 'bg-brand-sidebar/20 text-brand-sidebar';
  if (type === 'success') {
    iconClass = 'fa-solid fa-circle-check text-emerald-500';
    iconBgColor = 'bg-emerald-50';
  } else if (type === 'error') {
    iconClass = 'fa-solid fa-circle-exclamation text-rose-500';
    iconBgColor = 'bg-rose-50';
  } else if (type === 'heart') {
    iconClass = 'fa-solid fa-heart-pulse text-brand-sidebar';
    iconBgColor = 'bg-brand-sidebar/20';
  }

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 transition-all duration-300">
      <div className={`w-8 h-8 rounded-full ${iconBgColor} flex items-center justify-center`}>
        <i className={iconClass}></i>
      </div>
      <span className="font-bold text-xs uppercase tracking-wide text-slate-100">{message}</span>
    </div>
  );
};

export default Toast;
