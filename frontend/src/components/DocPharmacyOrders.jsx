import React, { useState, useEffect } from 'react';

const DocPharmacyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pharmacyNotes, setPharmacyNotes] = useState({});
  const [noteInput, setNoteInput] = useState('');
  const [activeNoteOrderId, setActiveNoteOrderId] = useState(null);

  const fetchPharmacyOrders = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch('/api/admin/pharmacy/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPharmacyOrders();
  }, []);

  const handleOpenNoteForm = (orderId) => {
    setActiveNoteOrderId(orderId);
    setNoteInput(pharmacyNotes[orderId] || '');
  };

  const handleSaveNote = (orderId) => {
    setPharmacyNotes(prev => ({ ...prev, [orderId]: noteInput }));
    setActiveNoteOrderId(null);
  };

  return (
    <div className="space-y-6 text-slate-800 text-left">
      <div className="dashboard-card p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Pharmacy Orders & Adherence</h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Monitor prescription fills, pharmacy fulfillment logs, and patient refill schedules.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Prescribed Items</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Refill Adherence</th>
                <th className="py-3 px-4 text-right">Special Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 italic">Querying pharmacy inventory system...</td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((o) => {
                  const isEditingNote = activeNoteOrderId === o.id;
                  
                  // Compute mock compliance indicator based on order status
                  let adherenceColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                  let adherenceText = 'On Schedule';
                  if (o.status === 'Cancelled') {
                    adherenceColor = 'bg-rose-50 text-rose-700 border-rose-100';
                    adherenceText = 'Non-Compliant';
                  } else if (o.status === 'Pending') {
                    adherenceColor = 'bg-amber-50 text-amber-700 border-amber-100';
                    adherenceText = 'Refill Pending';
                  }

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-400">#RX-{o.id.toString().padStart(4, '0')}</td>
                      <td className="py-3 px-4 text-slate-900 font-bold">{o.patientName}</td>
                      <td className="py-3 px-4">
                        {o.items?.map((item, idx) => (
                          <span key={idx} className="block text-[11px] text-slate-700 font-medium">
                            {item.name} (Qty: {item.qty})
                          </span>
                        ))}
                      </td>
                      <td className="py-3 px-4 text-slate-650 font-bold">${o.totalAmount.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                          o.status === 'Shipped' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          o.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' :
                          'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase ${adherenceColor}`}>
                          {adherenceText}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="space-y-1 text-right">
                          {pharmacyNotes[o.id] && !isEditingNote && (
                            <p className="text-[10px] text-slate-500 font-semibold italic">"{pharmacyNotes[o.id]}"</p>
                          )}
                          
                          {isEditingNote ? (
                            <div className="flex gap-1 items-center justify-end">
                              <input 
                                type="text"
                                value={noteInput}
                                onChange={(e) => setNoteInput(e.target.value)}
                                placeholder="Instructions..."
                                className="p-1 border border-slate-200 text-[10px] rounded outline-none"
                              />
                              <button 
                                onClick={() => handleSaveNote(o.id)}
                                className="px-2 py-1 bg-indigo-600 text-white text-[9px] font-bold rounded"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleOpenNoteForm(o.id)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 text-[10px] font-bold rounded-lg transition"
                            >
                              {pharmacyNotes[o.id] ? 'Edit Notes' : '+ Pharmacy Note'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 italic">No pharmacy orders matching prescriptions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocPharmacyOrders;
