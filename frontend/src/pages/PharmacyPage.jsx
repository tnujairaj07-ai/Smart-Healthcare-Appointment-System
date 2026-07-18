import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

const MEDICINES = [
  { id: 1, name: 'Cetirizine 10mg', category: 'Allergy', price: 12.50, stock: 'In Stock', stockCount: 45, image: '💊', desc: 'Antihistamine for seasonal allergy symptoms relief' },
  { id: 2, name: 'Salbutamol Inhaler', category: 'Respiratory', price: 24.00, stock: 'In Stock', stockCount: 18, image: '🌬️', desc: 'Relief of bronchospasm in asthma or COPD patients' },
  { id: 3, name: 'Ibuprofen 400mg', category: 'Pain Relief', price: 8.99, stock: 'Low Stock', stockCount: 5, image: '💊', desc: 'Nonsteroidal anti-inflammatory drug (NSAID)' },
  { id: 4, name: 'Amoxicillin 500mg', category: 'Antibiotics', price: 18.50, stock: 'Prescription Only', stockCount: 30, image: '🧪', desc: 'Penicillin-type antibiotic that fights bacterial infections' },
  { id: 5, name: 'Vitamin D3 1000IU', category: 'Vitamins', price: 14.25, stock: 'In Stock', stockCount: 88, image: '☀️', desc: 'Supports immune health, calcium absorption & bone density' },
  { id: 6, name: 'Paracetamol 500mg', category: 'Pain Relief', price: 4.50, stock: 'In Stock', stockCount: 120, image: '💊', desc: 'Analgesic and antipyretic for pain and fever reducer' }
];

const CATEGORIES = ['All', 'Allergy', 'Respiratory', 'Pain Relief', 'Antibiotics', 'Vitamins'];

const PharmacyPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showCheckout, setShowCheckout] = useState(false);

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const filteredMedicines = MEDICINES.filter((med) => {
    const matchesCategory = selectedCategory === 'All' || med.category === selectedCategory;
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (med) => {
    if (med.stock === 'Prescription Only') {
      triggerToast(`Prescription verification required for ${med.name}. Added conditionally.`, 'info');
    }

    const existing = cart.find((item) => item.id === med.id);
    if (existing) {
      setCart(cart.map((item) => item.id === med.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...med, qty: 1 }]);
    }
    triggerToast(`Added ${med.name} to pharmacy cart.`);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
    triggerToast('Item removed from cart.', 'error');
  };

  const updateQty = (id, amount) => {
    setCart(cart.map((item) => {
      if (item.id === id) {
        const newQty = item.qty + amount;
        return { ...item, qty: newQty < 1 ? 1 : newQty };
      }
      return item;
    }));
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const prescriptionNeeded = cart.some((item) => item.stock === 'Prescription Only');

  const handleCheckout = () => {
    if (cart.length === 0) {
      triggerToast('Pharmacy cart is empty!', 'error');
      return;
    }
    setShowCheckout(true);
  };

  const confirmCheckout = () => {
    triggerToast('Pharmacy order submitted successfully! Virtual invoice generated.', 'success');
    setCart([]);
    setShowCheckout(false);
  };

  return (
    <div className="flex h-screen bg-[#f4f7fc] overflow-hidden w-full font-sans antialiased text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
        <Navbar
          title="NovaCare Pharmacy Portal"
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
        />

        <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto space-y-6 flex-1 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* LEFT: PRODUCTS DIRECTORY (8 cols) */}
            <div className="lg:col-span-8 space-y-6">

              {/* Categories Navigation */}
              <div className="dashboard-card p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-left">Browse Medicine Categories</h3>
                <div className="flex flex-wrap gap-2.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedCategory === cat
                          ? 'bg-brand-sidebar text-white border-indigo-500 shadow-md'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medicine Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredMedicines.map((med) => (
                  <div key={med.id} className="dashboard-card p-5 flex flex-col justify-between text-left relative overflow-hidden group hover:shadow-lg transition duration-300">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-3xl bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-center justify-center">{med.image}</span>
                        <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${med.stock === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                            med.stock === 'Low Stock' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                          {med.stock} ({med.stockCount})
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-brand-sidebar transition leading-snug">{med.name}</h4>
                      <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase mt-0.5">{med.category}</p>
                      <p className="text-[11px] text-slate-450 mt-2 leading-relaxed font-medium">{med.desc}</p>
                    </div>

                    <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-50">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Price</span>
                        <span className="text-xs font-extrabold text-slate-800">${med.price.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => addToCart(med)}
                        className="px-4 py-2 bg-indigo-50 hover:bg-brand-sidebar text-brand-sidebar hover:text-white border border-indigo-100/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        Add to Cart 🛒
                      </button>
                    </div>
                  </div>
                ))}

                {filteredMedicines.length === 0 && (
                  <div className="col-span-full py-12 text-center space-y-2">
                    <span className="text-2xl block">🔍</span>
                    <p className="text-xs text-slate-500 font-semibold">No pharmacy items found matching current filters.</p>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT: SHOPPING CART (4 cols) */}
            <div className="lg:col-span-4 dashboard-card p-6 flex flex-col justify-between min-h-[450px] text-left">

              <div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span>🛒</span> Cart ({cart.reduce((acc, item) => acc + item.qty, 0)})
                  </h3>
                  {cart.length > 0 && (
                    <button
                      onClick={() => { setCart([]); triggerToast('Cleared shopping cart.', 'error'); }}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-800">{item.name}</h4>
                        <p className="text-[10px] text-slate-450">${item.price.toFixed(2)} each</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden">
                          <button onClick={() => updateQty(item.id, -1)} className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 font-bold">-</button>
                          <span className="px-2 text-xs font-bold text-slate-700">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 font-bold">+</button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-rose-500 text-xs transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  {cart.length === 0 && (
                    <div className="py-12 text-center space-y-2">
                      <span className="text-2xl block">🧺</span>
                      <p className="text-xs text-slate-400 italic">Your pharmacy basket is currently empty.</p>
                    </div>
                  )}
                </div>
              </div>

              {cart.length > 0 && (
                <div className="space-y-4 mt-6 pt-5 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-400">Subtotal</span>
                    <span className="font-extrabold text-slate-800">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-400">Shipping</span>
                    <span className="font-bold text-emerald-600">FREE</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-50 pt-2.5">
                    <span className="font-extrabold text-slate-800">Total Price</span>
                    <span className="font-extrabold text-slate-900 text-sm">${cartSubtotal.toFixed(2)}</span>
                  </div>

                  {prescriptionNeeded && (
                    <div className="bg-indigo-50 border border-indigo-100/50 rounded-xl p-3 text-[10px] text-indigo-700 flex gap-2 items-center leading-normal">
                      <span>⚠️</span>
                      <p className="font-semibold">Requires uploaded digital physician signature verification before dispatch.</p>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    className="w-full py-3.5 bg-brand-sidebar hover:bg-brand-sidebarHover text-white font-bold rounded-xl shadow-lg text-xs tracking-wide uppercase transition"
                  >
                    Proceed to Delivery Checkout
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-slate-100 space-y-6 text-left">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <span className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl">💳</span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delivery Address</h3>
                <p className="text-[10px] text-slate-400 font-semibold">NovaCare OS Checkout Services</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Standard Delivery Location</span>
                <p className="text-xs text-slate-700 font-bold leading-relaxed">Lviv, Chornovola street, 67, Apt 14</p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-400">Total Items</span>
                  <span className="font-extrabold text-slate-800">{cart.reduce((acc, item) => acc + item.qty, 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-400">Estimated Delivery Date</span>
                  <span className="font-extrabold text-indigo-600">Tomorrow by 5:00 PM</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 py-3 text-xs font-bold text-slate-650 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={confirmCheckout}
                className="flex-1 py-3 text-xs font-bold text-white bg-brand-sidebar hover:bg-brand-sidebarHover rounded-xl shadow-md"
              >
                Place Order
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

export default PharmacyPage;
