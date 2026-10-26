import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  XCircle,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Filter,
  PlusCircle,
  Loader2,
  CalendarDays
} from 'lucide-react';

const MyAppointmentsPage = () => {
  const { user, isPatient, isDoctor } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Reschedule modal state
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [rescheduling, setRescheduling] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/appointments', { params });
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.delete(`/appointments/${apptId}`);
      setToast('Appointment has been cancelled successfully.');
      setTimeout(() => setToast(''), 4000);
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const openRescheduleModal = async (appt) => {
    setRescheduleAppt(appt);
    setNewDate(appt.appointment_date);
    setNewSlot(appt.start_time);

    // fetch slots for this date
    try {
      setSlotsLoading(true);
      const res = await api.get(`/doctors/${appt.doctor_id}/availability?date=${appt.appointment_date}`);
      setAvailableSlots(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateChangeInModal = async (dateStr) => {
    setNewDate(dateStr);
    if (!rescheduleAppt) return;
    try {
      setSlotsLoading(true);
      const res = await api.get(`/doctors/${rescheduleAppt.doctor_id}/availability?date=${dateStr}`);
      setAvailableSlots(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!newSlot) return;
    setRescheduling(true);
    try {
      await api.patch(`/appointments/${rescheduleAppt.id}`, {
        appointment_date: newDate,
        start_time: newSlot,
      });
      setToast('Appointment rescheduled successfully.');
      setTimeout(() => setToast(''), 4000);
      setRescheduleAppt(null);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.detail || 'Reschedule conflict. Please choose another slot.');
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Clinical Appointments
          </h2>
          <p className="text-xs text-slate-500">
            {isPatient && 'Track, reschedule, or cancel your doctor consultations'}
            {isDoctor && 'Review patient appointments and diagnostic notes'}
            {!isPatient && !isDoctor && 'Central hospital appointments ledger'}
          </p>
        </div>

        {isPatient && (
          <Link
            to="/book-appointment"
            className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book New Consultation</span>
          </Link>
        )}
      </div>

      {toast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
        {[
          { label: 'All', value: '' },
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Pending', value: 'pending' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === tab.value
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointment Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Fetching appointment records...</p>
        </div>
      ) : appointments.length > 0 ? (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 font-bold text-xs flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {appt.appointment_date}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {appt.start_time} - {appt.end_time}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      appt.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : appt.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : appt.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {appt.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {isDoctor ? `Patient: ${appt.patient_name}` : appt.doctor_name}
                  </h4>
                  <p className="text-xs text-primary-700 font-semibold">{appt.doctor_specialization}</p>
                </div>

                <p className="text-xs text-slate-600">
                  <strong>Consultation Note:</strong> {appt.reason}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                  <>
                    <button
                      onClick={() => openRescheduleModal(appt)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleCancelAppointment(appt.id)}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-bold text-sm text-slate-800">No Appointments Recorded</h4>
          <p className="text-xs text-slate-500">
            {isPatient ? 'You have no scheduled consultations yet.' : 'No appointment records found.'}
          </p>
          {isPatient && (
            <Link
              to="/book-appointment"
              className="inline-block mt-2 px-4 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs"
            >
              Book Consultation Now
            </Link>
          )}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Reschedule Consultation</h3>
              <button
                onClick={() => setRescheduleAppt(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(e) => handleDateChangeInModal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Available Slot</label>
                {slotsLoading ? (
                  <div className="py-4 flex justify-center">
                    <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                    {availableSlots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setNewSlot(s.time)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          newSlot === s.time
                            ? 'bg-primary-600 text-white'
                            : s.available
                            ? 'bg-slate-50 text-slate-700 border border-slate-200'
                            : 'bg-slate-100 text-slate-400 line-through'
                        }`}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleAppt(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={rescheduling || !newSlot}
                  className="px-5 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs hover:bg-primary-700 disabled:opacity-50"
                >
                  {rescheduling ? 'Rescheduling...' : 'Confirm New Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointmentsPage;
