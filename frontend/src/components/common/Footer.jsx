import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-teal-500 flex items-center justify-center text-white">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white">
                HEALER<span className="text-primary-400">.AI</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              An intelligent, patient-centric healthcare portal integrating automated medication reminders, seamless physician appointment booking, and safe medical AI guidance.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>HIPAA-Ready Security Standard</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Portal Services</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/doctors" className="hover:text-white transition-colors">Doctor Directory</Link></li>
              <li><Link to="/book-appointment" className="hover:text-white transition-colors">Book an Appointment</Link></li>
              <li><Link to="/medications" className="hover:text-white transition-colors">Medication Tracker</Link></li>
              <li><Link to="/chatbot" className="hover:text-white transition-colors">AI Health Assistant</Link></li>
            </ul>
          </div>

          {/* Clinical Roles */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Portals</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/dashboard/patient" className="hover:text-white transition-colors">Patient Portal</Link></li>
              <li><Link to="/dashboard/doctor" className="hover:text-white transition-colors">Doctor Practice Desk</Link></li>
              <li><Link to="/dashboard/admin" className="hover:text-white transition-colors">Clinical Operations</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Secure Sign-In</Link></li>
            </ul>
          </div>

          {/* Medical Notice */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Medical Disclaimer</h4>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Information provided via our AI Assistant and clinical portal is intended for health education and organizational scheduling. If you are experiencing an acute medical emergency, please dial 911 or visit the nearest emergency room immediately.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} HEALER Healthcare Management System. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Clinical Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
