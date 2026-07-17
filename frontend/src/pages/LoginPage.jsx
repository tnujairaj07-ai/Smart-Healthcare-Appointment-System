import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient'); // Default test role
  const [staySignedIn, setStaySignedIn] = useState(true);

  // Loading & notification states
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showPassword, setShowPassword] = useState(false);

  // Modals state
  const [forgotModal, setForgotModal] = useState(false);
  const [signupModal, setSignupModal] = useState(false);

  // Slides data
  const slides = [
    {
      title: "Welcome to NovaCare OS! 👋",
      desc: "Our comprehensive range of services spans primary care, preventive medicine, specialized surgeries and more. We are here to support our patients at every stage of their healthcare journey.",
      image: "/images/login-hero-1.jpg"
    },
    {
      title: "Your Health, Our Priority",
      desc: "We are dedicated to fostering a culture of continuous improvement, where feedback is valued, and we constantly strive to enhance our services and secure therapeutic workflows.",
      image: "/images/login-hero-2.jpg"
    },
    {
      title: "Care Anywhere, Anytime",
      desc: "Consult with top-tier medical specialists from the comfort of your home. Access secure virtual appointments, digital prescriptions, and instant clinical advice on any device.",
      image: "/images/login-hero-3.jpg"
    },
    {
      title: "Nurturing Mind & Body",
      desc: "True health goes beyond physical care. Explore integrated mental wellness support, detailed nutritional coaching, and physical therapy guides designed to enrich your complete lifestyle.",
      image: "/images/login-hero-4.jpg"
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // Autoplay carousel slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Form validation helper
  const isFormValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email !== '' && emailRegex.test(email) && password.length >= 4;
  };

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);

    setTimeout(() => {
      const mockUser = login(email, password, role);
      triggerToast(`Welcome back! Logged in as: ${mockUser.name}`, 'success');
      
      setTimeout(() => {
        setLoading(false);
        // Route redirection based on role
        if (mockUser.role === 'patient') {
          navigate('/patient');
        } else if (mockUser.role === 'doctor') {
          navigate('/doctor');
        } else if (mockUser.role === 'admin') {
          navigate('/admin');
        }
      }, 1000);
    }, 1200);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotModal(false);
    triggerToast("Reset instructions sent to your email!", "success");
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setSignupModal(false);
    triggerToast("Registration Completed! Your portal is active.", "success");
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex items-center justify-center p-0 md:p-6 overflow-x-hidden w-full font-sans antialiased text-slate-800">
      <div className="w-full max-w-[1400px] min-h-screen md:min-h-[850px] bg-[#F4F6FA] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
        
        {/* LEFT PANEL: LOG IN FORM */}
        <div className="w-full md:w-[50%] bg-[#F8FAFC] p-6 sm:p-10 md:p-14 flex flex-col justify-between min-h-screen md:min-h-auto relative">
          
          {/* Logo Header */}
          <div className="flex items-center gap-4 self-start mb-8 md:mb-0 cursor-pointer hover:opacity-90 transition-opacity">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/60 flex items-center justify-center overflow-hidden">
              <img src="/images/app-logo.jpg" alt="NovaCare Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1F3275]">
              NovaCare OS
            </span>
          </div>

          {/* Floating Login Card Container */}
          <div className="w-full max-w-md mx-auto bg-white rounded-[28px] p-8 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100/80 my-auto">
            <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight mb-6">Log In</h1>

            {/* Social Sign In Section */}
            <div className="space-y-3 mb-6">
              <button 
                type="button"
                onClick={() => triggerToast("Redirecting securely to Google OAuth platform...", "info")}
                className="w-full py-3 px-4 bg-[#EDF2FA] hover:bg-[#E2EAF8] active:bg-[#D3E0F4] rounded-xl flex items-center justify-center gap-3 font-semibold text-[#3C4043] transition-all duration-200 text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.03-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google
              </button>
              <button 
                type="button"
                onClick={() => triggerToast("Redirecting securely to Apple Gateway...", "info")}
                className="w-full py-3 px-4 bg-[#EDF2FA] hover:bg-[#E2EAF8] active:bg-[#D3E0F4] rounded-xl flex items-center justify-center gap-3 font-semibold text-black transition-all duration-200 text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.13.67-2.85 1.51-.62.71-1.16 1.84-1.02 2.95 1.12.09 2.18-.58 2.88-1.4"/>
                </svg>
                Continue with Apple
              </button>
            </div>

            {/* Separator */}
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-sm font-medium">Or</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Email */}
              <div className="relative">
                <label className="absolute left-4 top-1.5 text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  placeholder="name@domain.com"
                  className="w-full pt-5 pb-2 px-4 bg-[#F5F6FA] border-2 border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm font-medium outline-none transition-all placeholder-slate-300"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <label className="absolute left-4 top-1.5 text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">Password</label>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  placeholder="••••••••"
                  className="w-full pt-5 pb-2 px-4 pr-12 bg-[#F5F6FA] border-2 border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm font-medium outline-none transition-all placeholder-slate-300"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none pt-4"
                >
                  <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>

              {/* TESTING ROLE SELECTOR */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                <span className="block text-[8px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5">Select Testing Workspace Identity:</span>
                <div className="flex gap-2 text-xs font-semibold">
                  {['patient', 'doctor', 'admin'].map((r) => (
                    <label key={r} className="flex-1 flex items-center justify-center p-2 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer text-slate-600 select-none">
                      <input 
                        type="radio" 
                        name="test-role" 
                        value={r}
                        checked={role === r}
                        onChange={() => setRole(r)}
                        className="mr-1.5 accent-brand-sidebar"
                      />
                      <span className="capitalize">{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={staySignedIn} 
                    onChange={(e) => setStaySignedIn(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-slate-600 font-semibold group-hover:text-slate-800 transition-colors">Stay signed in</span>
                </label>
                <button 
                  type="button" 
                  onClick={() => setForgotModal(true)} 
                  className="text-indigo-600 hover:text-indigo-850 font-bold transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={!isFormValid() || loading}
                className={`w-full py-3.5 font-bold rounded-xl shadow-lg transition-all duration-300 text-sm flex items-center justify-center gap-2 ${
                  isFormValid() && !loading
                    ? 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white cursor-pointer'
                    : 'bg-brand-100 text-brand-700 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Log In</span>
                )}
              </button>

            </form>
          </div>

          {/* Card Footer */}
          <div className="text-center mt-8 md:mt-0">
            <p className="text-sm text-slate-500 font-semibold">
              Don’t have account?{' '}
              <button 
                onClick={() => setSignupModal(true)} 
                className="text-indigo-600 hover:text-indigo-800 font-extrabold hover:underline transition-all"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: IMAGE CAROUSEL SHOWCASE */}
        <div className="w-full md:w-[50%] bg-gradient-to-br from-medical-50 to-brand-100 p-8 sm:p-12 md:p-16 flex flex-col justify-between min-h-[550px] md:min-h-auto relative">
          
          {/* Active Image Showcase */}
          <div className="flex-grow flex items-center justify-center min-h-[250px] md:min-h-[380px] relative overflow-hidden">
            <div className="w-full h-full max-w-[420px] max-h-[420px] flex items-center justify-center rounded-2xl bg-white border border-medical-100 shadow-lg overflow-hidden transition-all duration-500">
              <img 
                src={slides[currentSlide].image} 
                alt={slides[currentSlide].title}
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
          </div>

          {/* Carousel controls, indicators and slide texts */}
          <div className="space-y-4 mt-6 text-left">
            {/* Indicators */}
            <div className="flex items-center gap-2.5 max-w-xs">
              {slides.map((_, sIdx) => (
                <button 
                  key={sIdx}
                  onClick={() => setCurrentSlide(sIdx)}
                  className={`h-[5px] rounded-full transition-all duration-300 ${
                    currentSlide === sIdx ? 'bg-brand-500 flex-1 scale-y-125' : 'bg-medical-100 opacity-60 w-3'
                  }`}
                  aria-label={`Slide ${sIdx + 1}`}
                />
              ))}
            </div>

            {/* Slide text content */}
            <div className="transition-all duration-500">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-medical-600 leading-snug">
                {slides[currentSlide].title}
              </h2>
              <p className="text-medical-700 text-sm sm:text-base leading-relaxed mt-3 font-medium">
                {slides[currentSlide].desc}
              </p>
            </div>

            {/* Navigation arrows */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                className="w-11 h-11 rounded-full border border-medical-100 flex items-center justify-center text-medical-600 bg-white/40 hover:bg-white hover:border-brand-500 active:scale-95 transition-all focus:outline-none"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button 
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                className="w-11 h-11 rounded-full border border-medical-100 flex items-center justify-center text-medical-600 bg-white/40 hover:bg-white hover:border-brand-500 active:scale-95 transition-all focus:outline-none"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MODALS LAYER */}
      
      {/* Toast popup */}
      <Toast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />

      {/* Overlay Mask */}
      {(forgotModal || signupModal) && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => { setForgotModal(false); setSignupModal(false); }}
        />
      )}

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 transition-all duration-300">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-2xl font-extrabold text-[#111827]">Reset Password</h3>
            <button onClick={() => setForgotModal(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed text-left">
            Enter your registered email address and we will immediately send you temporary instructions to securely reset your credentials.
          </p>
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="relative text-left">
              <label className="absolute left-4 top-1.5 text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">Registered Email</label>
              <input type="email" required placeholder="yourname@example.com" className="w-full pt-6 pb-2.5 px-4 bg-[#F5F6FA] border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm font-medium outline-none transition-all placeholder-slate-300" />
            </div>
            <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-lg transition-all text-sm">Send Reset Instructions</button>
          </form>
        </div>
      )}

      {/* Sign Up Modal */}
      {signupModal && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-extrabold text-[#111827]">Create Account</h3>
            <button onClick={() => setSignupModal(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-5 font-medium text-left">Join NovaCare OS to manage your customized health plan and secure remote diagnostic reviews.</p>
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="relative">
                <label className="absolute left-4 top-1.5 text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">First Name</label>
                <input type="text" required className="w-full pt-5 pb-2 px-4 bg-[#F5F6FA] border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm font-medium outline-none transition-all" />
              </div>
              <div className="relative">
                <label className="absolute left-4 top-1.5 text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">Last Name</label>
                <input type="text" required className="w-full pt-5 pb-2 px-4 bg-[#F5F6FA] border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm font-medium outline-none transition-all" />
              </div>
            </div>
            <div className="relative text-left">
              <label className="absolute left-4 top-1.5 text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">Email Address</label>
              <input type="email" required placeholder="name@domain.com" className="w-full pt-5 pb-2 px-4 bg-[#F5F6FA] border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm font-medium outline-none transition-all placeholder-slate-300" />
            </div>
            <div className="relative text-left">
              <label className="absolute left-4 top-1.5 text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">Password</label>
              <input type="password" required placeholder="Min. 8 characters" className="w-full pt-5 pb-2 px-4 bg-[#F5F6FA] border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm font-medium outline-none transition-all placeholder-slate-300" />
            </div>
            <label className="flex items-start gap-2 pt-1 cursor-pointer text-left">
              <input type="checkbox" required className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
              <span className="text-xs text-slate-500 font-medium">I explicitly agree to the NovaCare OS Terms of Service and Privacy Policy.</span>
            </label>
            <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-lg transition-all text-sm mt-2">Sign Up & Register</button>
          </form>
        </div>
      )}

    </div>
  );
};

export default LoginPage;
