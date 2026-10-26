import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import {
  Bell,
  Clock,
  Calendar,
  Info,
  CheckCheck,
  Check,
  Filter
} from 'lucide-react';

const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [filterType, setFilterType] = useState('');

  const filteredNotifications = filterType
    ? notifications.filter((n) => n.type === filterType)
    : notifications;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Notification Center
          </h2>
          <p className="text-xs text-slate-500">
            Real-time medication alerts, appointment updates, and system alerts
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
        {[
          { label: 'All', value: '' },
          { label: 'Medication Reminders', value: 'reminder' },
          { label: 'Appointments', value: 'appointment' },
          { label: 'System', value: 'system' },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => setFilterType(tab.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterType === tab.value
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markAsRead(n.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                n.is_read
                  ? 'bg-white border-slate-200 text-slate-700'
                  : 'bg-primary-50/40 border-primary-200 shadow-xs text-slate-900'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    n.type === 'reminder'
                      ? 'bg-teal-100 text-teal-700'
                      : n.type === 'appointment'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {n.type === 'reminder' && <Clock className="w-4 h-4" />}
                  {n.type === 'appointment' && <Calendar className="w-4 h-4" />}
                  {n.type === 'system' && <Info className="w-4 h-4" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(n.id);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-white transition-colors"
                  title="Mark Read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Bell className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-bold text-sm text-slate-800">Inbox is Clear</h4>
          <p className="text-xs text-slate-500">You have no pending notifications at this time.</p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
