import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Clock,
  Pill,
  Check,
  CheckCircle,
  AlertCircle,
  Play,
  RotateCw,
  Filter,
  CheckCheck,
  Calendar,
  Loader2
} from 'lucide-react';

const MedicationReminderSettingsPage = () => {
  const [reminders, setReminders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [toast, setToast] = useState('');

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/reminders', { params });
      setReminders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [statusFilter]);

  const handleAcknowledge = async (id) => {
    try {
      await api.patch(`/reminders/${id}/acknowledge`, { status: 'acknowledged' });
      setToast('Reminder marked as acknowledged.');
      setTimeout(() => setToast(''), 4000);
      fetchReminders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerScheduler = async () => {
    try {
      setEvaluating(true);
      const res = await api.post('/reminders/trigger-check');
      setToast(res.data.message || 'Scheduler evaluated successfully.');
      setTimeout(() => setToast(''), 4000);
      fetchReminders();
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Medication Reminder Timeline
          </h2>
          <p className="text-xs text-slate-500">
            Real-time scheduled alerts, acknowledgment history, and background engine status
          </p>
        </div>

        <button
          onClick={handleTriggerScheduler}
          disabled={evaluating}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          title="Force immediate scheduler evaluation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
          <span>{evaluating ? 'Scanning...' : 'Run Scheduler Check'}</span>
        </button>
      </div>

      {toast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
        {[
          { label: 'All Reminders', value: '' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'Acknowledged', value: 'acknowledged' },
          { label: 'Missed', value: 'missed' },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === tab.value
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading reminder timeline...</p>
        </div>
      ) : reminders.length > 0 ? (
        <div className="space-y-3">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 font-bold text-xs flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {rem.scheduled_date}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {rem.scheduled_time}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      rem.status === 'acknowledged'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rem.status === 'missed'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {rem.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{rem.medication_name}</h4>
                  <span className="text-xs font-semibold text-teal-700">Dose: {rem.dosage}</span>
                </div>

                {rem.instructions && (
                  <p className="text-xs text-slate-600 italic">
                    "{rem.instructions}"
                  </p>
                )}

                {rem.acknowledged_at && (
                  <p className="text-[11px] text-slate-600 font-mono">
                    ✓ Acknowledged at: {new Date(rem.acknowledged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div>
                {rem.status === 'scheduled' ? (
                  <button
                    onClick={() => handleAcknowledge(rem.id)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Acknowledge Reminder</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                    <CheckCheck className="w-4 h-4" />
                    <span>Recorded</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Clock className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-bold text-sm text-slate-800">No Reminders Found</h4>
          <p className="text-xs text-slate-500">
            Reminders are generated automatically based on your medication schedules.
          </p>
        </div>
      )}
    </div>
  );
};

export default MedicationReminderSettingsPage;
