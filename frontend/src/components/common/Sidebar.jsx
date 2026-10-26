import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Pill,
  Bot,
  Bell,
  User,
  Users,
  Shield,
  Stethoscope,
  LogOut,
  ChevronRight,
  HeartPulse,
  PlusCircle,
  FileText,
  Sliders
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isPatient, isDoctor, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();

  const getLinks = () => {
    // 1. PATIENT MENU: Exclusively focused on booking, medication reminders, and AI health assistance
    if (isPatient) {
      return [
        { name: 'Patient Overview', path: '/dashboard/patient', icon: LayoutDashboard },
        { name: 'Find Doctors', path: '/doctors', icon: Stethoscope },
        { name: 'Book Appointment', path: '/book-appointment', icon: PlusCircle },
        { name: 'My Appointments', path: '/appointments', icon: Calendar },
        { name: 'My Medications', path: '/medications', icon: Pill },
        { name: 'Medication Reminders', path: '/medications/reminders', icon: Clock },
        { name: 'AI Health Assistant', path: '/chatbot', icon: Bot, badge: 'AI' },
        { name: 'Notifications', path: '/notifications', icon: Bell, count: unreadCount },
        { name: 'Health Record & Profile', path: '/profile', icon: User },
      ];
    }

    // 2. DOCTOR MENU: Exclusively focused on patient consultation queue, clinical notes, and availability hours
    if (isDoctor) {
      return [
        { name: 'Doctor Dashboard', path: '/dashboard/doctor', icon: LayoutDashboard },
        { name: 'Patient Appointments Queue', path: '/appointments', icon: Calendar },
        { name: 'Notifications', path: '/notifications', icon: Bell, count: unreadCount },
        { name: 'Doctor Profile & Practice', path: '/profile', icon: User },
      ];
    }

    // 3. ADMIN MENU: Hospital & clinical administration, user accounts, doctor approvals, and security logs
    if (isAdmin) {
      return [
        { name: 'Admin Operations', path: '/dashboard/admin', icon: Shield },
        { name: 'All Hospital Appointments', path: '/appointments', icon: Calendar },
        { name: 'Notifications', path: '/notifications', icon: Bell, count: unreadCount },
        { name: 'Administrator Profile', path: '/profile', icon: User },
      ];
    }

    return [];
  };

  const links = getLinks();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col justify-between ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">
                HEALER<span className="text-primary-600">.AI</span>
              </span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-semibold -mt-1">
                {user?.role === 'patient' && 'Patient Portal'}
                {user?.role === 'doctor' && 'Doctor Practice Desk'}
                {user?.role === 'admin' && 'Central Administration'}
              </span>
            </div>
          </NavLink>
        </div>

        {/* User Quick Info */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-800 truncate">{user?.full_name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700">
                    {item.badge}
                  </span>
                )}
                {item.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    {item.count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Sign-out */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={logout}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
