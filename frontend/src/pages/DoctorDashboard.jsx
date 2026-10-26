import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  Stethoscope,
  Star,
  Users,
  Settings,
  Loader2,
  CalendarDays,
  Sliders,
  ShieldCheck
} from 'lucide-react';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Working Hours State
  const [availabilities, setAvailabilities] = useState([
    { day_of_week: 0, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, is_available: true },
    { day_of_week: 1, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, is_available: true },
    { day_of_week: 2, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, is_available: true },
    { day_of_week: 3, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, is_available: true },
    { day_of_week: 4, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, is_available: true },
  ]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      await api.patch(`/appointments/${appointmentId}`, { status: newStatus });
      setStatusMessage(`Patient consultation marked as ${newStatus}.`);
      setTimeout(() => setStatusMessage(''), 4000);
      loadAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveWorkingHours = async () => {
    try {
      setSavingSchedule(true);
      await api.post('/doctors/availability', availabilities);
      setStatusMessage('Your weekly availability schedule has been updated for patient bookings.');
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSchedule(false);
    }
  };

  const todayAppointments = appointments.filter((a) => a.appointment_date === selectedDate);
  const totalCompleted = appointments.filter((a) => a.status === 'completed').length;
  const totalPending = appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length;

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading clinical consultations queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Doctor Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-800 via-teal-700 to-primary-800 p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
            Physician Practice Desk
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {user?.full_name}
          </h2>
          <p className="text-xs sm:text-sm text-teal-100 font-medium">
            {user?.doctor_profile?.specialization || 'Clinical Specialist'} • Medical License #{user?.doctor_profile?.license_number || 'N/A'}
          </p>
          <p className="text-[11px] text-teal-200">
            Consultation Fee: <strong>${user?.doctor_profile?.consultation_fee || '50'}</strong> per encounter
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 text-center border border-white/20">
            <span className="text-xl font-bold block">{user?.doctor_profile?.rating || '5.0'}</span>
            <span className="text-[10px] text-teal-200 flex items-center justify-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Rating
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 text-center border border-white/20">
            <span className="text-xl font-bold block">{appointments.length}</span>
            <span className="text-[10px] text-teal-200">Patient Visits</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-medium">Patient Visits Today</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{todayAppointments.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-medium">Upcoming / Active Consultations</span>
            <h3 className="text-2xl font-bold text-primary-600 mt-1">{totalPending}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-medium">Completed Encounters</span>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{totalCompleted}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Patient Appointments Queue (Patients who booked visits with this doctor) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Assigned Patient Queue</h3>
            <p className="text-xs text-slate-500">
              Patients who booked consultations with you. Review their symptoms, confirm attendance, or complete encounters.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Filter Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {todayAppointments.length > 0 ? (
            todayAppointments.map((appt) => (
              <div key={appt.id} className="p-5 sm:p-6 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 font-bold text-xs flex items-center gap-1">
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

                  <h4 className="text-sm font-bold text-slate-900">
                    Patient: {appt.patient_name}
                  </h4>
                  <p className="text-xs text-slate-600">
                    <strong>Reported Symptoms / Reason:</strong> "{appt.reason}"
                  </p>
                  {appt.patient_phone && (
                    <p className="text-[11px] text-slate-500">Patient Contact: {appt.patient_phone}</p>
                  )}
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {appt.status !== 'completed' && (
                    <button
                      onClick={() => handleUpdateStatus(appt.id, 'completed')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark Completed
                    </button>
                  )}
                  {appt.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Confirm Visit
                    </button>
                  )}
                  {appt.status !== 'cancelled' && (
                    <button
                      onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Visit
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center space-y-2">
              <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-medium text-slate-500">
                No patient consultations scheduled for {selectedDate}.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Doctor Availability Configuration (Defines when patients can book) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              Configure Your Practice Working Hours (Generates Available Patient Booking Slots)
            </h3>
            <p className="text-xs text-slate-500">
              When patients book consultations with you, available 30-minute slots are generated based on these working hours.
            </p>
          </div>
          <button
            onClick={handleSaveWorkingHours}
            disabled={savingSchedule}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {savingSchedule ? 'Saving...' : 'Save Availability Schedule'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          {availabilities.map((avail, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-900 block">{daysOfWeek[avail.day_of_week]}</span>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold block">Start Time</label>
                <input
                  type="time"
                  value={avail.start_time}
                  onChange={(e) => {
                    const updated = [...availabilities];
                    updated[idx].start_time = e.target.value;
                    setAvailabilities(updated);
                  }}
                  className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold block">End Time</label>
                <input
                  type="time"
                  value={avail.end_time}
                  onChange={(e) => {
                    const updated = [...availabilities];
                    updated[idx].end_time = e.target.value;
                    setAvailabilities(updated);
                  }}
                  className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
