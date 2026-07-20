import React, { useState, useEffect } from 'react';

const DocAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch('/api/doctor/analytics', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExport = () => {
    if (!analytics) return;
    
    // Generate simple CSV content of doctor performance metrics
    const headers = 'Metric,Value\n';
    const rows = [
      `Years of Experience,${analytics.experienceYears} Yrs`,
      `Completed Consultations,${analytics.completedVisits}`,
      `Successfully Treated Patients,${analytics.successfulPatients}`,
      `Total Bookings,${analytics.totalBooked}`,
      `No-Show Rate,${analytics.noShowRate}%`,
      `Average Rating,${analytics.averageRating} Stars`,
      `Inbound Referrals,${analytics.referrals?.inbound || 0}`,
      `Outbound Referrals,${analytics.referrals?.outbound || 0}`
    ].join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `NovaCare_Doctor_Performance_Report_2026.csv`);
    a.click();
  };

  return (
    <div className="space-y-6 text-slate-850 text-left">
      
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-650 mx-auto"></div>
          <p className="text-xs text-slate-500 font-bold">Aggregating workload & patient feedback matrices...</p>
        </div>
      ) : analytics ? (
        <>
          {/* Export Header Widget */}
          <div className="dashboard-card p-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Workload & Performance Analytics</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Dynamically updated clinical productivity and patient testimonial ratings.</p>
            </div>
            
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-brand-sidebar hover:bg-brand-sidebarHover text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              📥 Export Portfolio Report (CSV)
            </button>
          </div>

          {/* Performance Numbers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Treated Patients', value: analytics.successfulPatients, sub: 'Unique patients completed', icon: 'fa-user-check', color: 'text-emerald-500 bg-emerald-50' },
              { title: 'Completed Visits', value: analytics.completedVisits, sub: 'Consultations signed off', icon: 'fa-file-medical', color: 'text-indigo-500 bg-indigo-50' },
              { title: 'No-Show Rate', value: `${analytics.noShowRate}%`, sub: 'Missed clinical bookings', icon: 'fa-calendar-minus', color: 'text-rose-500 bg-rose-50' },
              { title: 'Overall Rating', value: `★ ${analytics.averageRating}`, sub: `Based on ${analytics.reviewsCount} reviews`, icon: 'fa-star', color: 'text-amber-500 bg-amber-50' }
            ].map((stat, idx) => (
              <div key={idx} className="dashboard-card p-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-between h-[120px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{stat.title}</span>
                  <span className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <i className={`fa-solid ${stat.icon} text-xs`}></i>
                  </span>
                </div>
                <div className="mt-2 text-left">
                  <span className="text-2xl font-extrabold text-slate-950 block leading-tight">{stat.value}</span>
                  <span className="text-[9px] text-slate-400 font-bold block mt-1">{stat.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Case mix & Feedback grid split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Case Mix and Referrals (col-span-6) */}
            <div className="lg:col-span-6 space-y-6 flex flex-col">
              
              {/* Case Mix */}
              <div className="dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Clinical Case Mix Distribution</h3>
                <div className="space-y-3.5">
                  {Object.keys(analytics.caseMix).length > 0 ? (
                    Object.entries(analytics.caseMix).map(([diagnosis, count], idx) => {
                      const total = Object.values(analytics.caseMix).reduce((a, b) => a + b, 0);
                      const percentage = Math.round((count / total) * 100);
                      return (
                        <div key={idx} className="space-y-1 text-left text-xs font-semibold">
                          <div className="flex justify-between text-slate-650">
                            <span>{diagnosis}</span>
                            <span className="font-extrabold text-slate-900">{count} cases ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 italic py-4">No diagnosis logs found to map case mix distributions.</p>
                  )}
                </div>
              </div>

              {/* Referrals flow metrics */}
              <div className="dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Referral Volume Flow</h3>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                    <span className="text-2xl block">📥</span>
                    <span className="text-lg font-extrabold text-slate-900 block mt-1">{analytics.referrals?.inbound || 0}</span>
                    <span className="text-[9px] text-slate-450 uppercase font-bold tracking-wide mt-1 block">Inbound Specialty Matches</span>
                  </div>
                  
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                    <span className="text-2xl block">📤</span>
                    <span className="text-lg font-extrabold text-slate-900 block mt-1">{analytics.referrals?.outbound || 0}</span>
                    <span className="text-[9px] text-slate-450 uppercase font-bold tracking-wide mt-1 block">Outbound Referrals Sent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Patient Feedbacks Logs (col-span-6) */}
            <div className="lg:col-span-6 dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Patient Feedbacks sentiment</h3>
                <div className="flex gap-2 text-[9px] font-bold">
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Positive: {analytics.sentiment?.positive || 0}</span>
                  <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">Negative: {analytics.sentiment?.negative || 0}</span>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {analytics.reviews?.length > 0 ? (
                  analytics.reviews.map((rev, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50/50 border border-slate-150 rounded-2xl space-y-2 text-left">
                      <div className="flex justify-between items-center flex-wrap gap-2 text-xs">
                        <div>
                          <h4 className="font-bold text-slate-800 leading-none">{rev.patient_name || 'Anonymous Patient'}</h4>
                          <span className="text-[9px] text-slate-400 mt-1 block font-semibold">{rev.date}</span>
                        </div>
                        
                        <div className="flex text-amber-500 font-bold">
                          {Array.from({ length: rev.rating }).map((_, i) => <span key={i}>★</span>)}
                          {Array.from({ length: 5 - rev.rating }).map((_, i) => <span key={i} className="text-slate-200">★</span>)}
                        </div>
                      </div>
                      <p className="text-xs text-slate-650 italic font-medium leading-normal">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-10 text-center">No patient testimonial records found.</p>
                )}
              </div>
            </div>

          </div>
        </>
      ) : (
        <p className="text-xs text-slate-400 italic">Could not load analytics profile.</p>
      )}
    </div>
  );
};

export default DocAnalytics;
