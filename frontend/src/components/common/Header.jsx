import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Menu, Bell, Shield, HeartPulse, User } from 'lucide-react';

const Header = ({ onMenuClick, title }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
            {title || 'Healthcare Portal'}
          </h1>
          <p className="text-[11px] text-slate-600 hidden sm:block">
            {user?.role === 'patient' && 'Patient Health Management Desk'}
            {user?.role === 'doctor' && 'Physician Practice Portal'}
            {user?.role === 'admin' && 'Central Healthcare Administration'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notifications Icon */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-xl text-slate-600 hover:text-primary-600 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Pill */}
        <Link
          to="/profile"
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
            {user?.full_name?.split(' ')[0]}
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200">
            {user?.role?.toUpperCase()}
          </span>
        </Link>
      </div>
    </header>
  );
};

export default Header;
