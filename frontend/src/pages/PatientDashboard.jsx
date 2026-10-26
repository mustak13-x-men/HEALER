import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Calendar,
  Clock,
  Pill,
  Bot,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  ArrowRight,
  Stethoscope,
  Heart,
  Bell,
  Check,
  Loader2
} from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [apptsRes, remsRes, medsRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/reminders'),
        api.get('/medications'),
      ]);
      setAppointments(apptsRes.data);
      setReminders(remsRes.data);
      setMedications(medsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcknowledgeReminder = async (reminderId) => {
    try {
      await api.patch(`/reminders/${reminderId}/acknowledge`, { status: 'acknowledged' });
      setActionSuccess('Medication reminder acknowledged.');
      setTimeout(() => setActionSuccess(''), 4000);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Find next upcoming confirmed appointment
  const nextAppointment = appointments.find(
    (a) => a.status === 'confirmed' || a.status === 'pending'
  );

  // Find next pending medication reminder
  const nextReminder = reminders.find((r) => r.status === 'scheduled');

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading your clinical health dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert toast */}
      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-700 via-primary-600 to-teal-700 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
            Patient Health Desk
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name}!
          </h2>
          <p className="text-xs sm:text-sm text-primary-100 leading-relaxed">
            Your personalized clinical overview: track doctor appointments, acknowledge daily medication schedules, and explore verified health guidance.
          </p>
        </div>
        <div className="absolute -right-6 -bottom-6 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link
          to="/book-appointment"
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-primary-400 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Book Doctor</h4>
            <p className="text-[10px] text-slate-500">Pick date & slot</p>
          </div>
        </Link>

        <Link
          to="/medications"
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">My Medications</h4>
            <p className="text-[10px] text-slate-500">{medications.length} active regimens</p>
          </div>
        </Link>

        <Link
          to="/chatbot"
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">AI Health Guide</h4>
            <p className="text-[10px] text-slate-500">Evidence-based QA</p>
          </div>
        </Link>

        <Link
          to="/appointments"
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">History</h4>
            <p className="text-[10px] text-slate-500">{appointments.length} consultations</p>
          </div>
        </Link>
      </div>

      {/* Priority Cards: Next Appointment & Next Medication */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Appointment Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-600" />
                Next Upcoming Consultation
              </span>
              {nextAppointment && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {nextAppointment.status}
                </span>
              )}
            </div>

            {nextAppointment ? (
              <div className="p-4 rounded-2xl bg-primary-50/50 border border-primary-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary-600 text-white font-bold flex items-center justify-center text-sm">
                    {nextAppointment.doctor_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{nextAppointment.doctor_name}</h4>
                    <p className="text-xs text-primary-700 font-semibold">{nextAppointment.doctor_specialization}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-primary-100">
                  <div>
                    <span className="text-slate-600 block text-[10px]">Date</span>
                    <span className="font-bold text-slate-800">{nextAppointment.appointment_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 block text-[10px]">Time Slot</span>
                    <span className="font-bold text-slate-800">{nextAppointment.start_time} - {nextAppointment.end_time}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 italic">
                  "{nextAppointment.reason}"
                </p>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-medium text-slate-500">No pending appointments scheduled</p>
                <Link
                  to="/book-appointment"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700"
                >
                  Book with a doctor now <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <Link to="/appointments" className="text-xs font-semibold text-slate-600 hover:text-primary-600 flex items-center gap-1">
              <span>View all appointments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/doctors"
              className="text-xs font-bold text-primary-600 hover:text-primary-700"
            >
              Browse specialists
            </Link>
          </div>
        </div>

        {/* Next Medication Reminder Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                Pending Medication Reminder
              </span>
              {nextReminder && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                  Scheduled
                </span>
              )}
            </div>

            {nextReminder ? (
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{nextReminder.medication_name}</h4>
                    <span className="text-xs font-semibold text-teal-700">Dose: {nextReminder.dosage}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-slate-800 block">{nextReminder.scheduled_time}</span>
                    <span className="text-[10px] text-slate-500">{nextReminder.scheduled_date}</span>
                  </div>
                </div>

                {nextReminder.instructions && (
                  <p className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-xl border border-teal-100">
                    <strong>Instructions:</strong> {nextReminder.instructions}
                  </p>
                )}

                <button
                  onClick={() => handleAcknowledgeReminder(nextReminder.id)}
                  className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark Reminder Acknowledged</span>
                </button>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-xs font-medium text-slate-500">All scheduled medication reminders are acknowledged</p>
                <Link
                  to="/medications"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700"
                >
                  Manage prescriptions <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <Link to="/medications/reminders" className="text-xs font-semibold text-slate-600 hover:text-teal-600 flex items-center gap-1">
              <span>View full reminder timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link to="/medications" className="text-xs font-bold text-teal-600 hover:text-teal-700">
              Add new medication
            </Link>
          </div>
        </div>
      </div>

      {/* Patient Health Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" />
          Clinical Record Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-600 block text-[10px]">Blood Group</span>
            <span className="font-bold text-slate-800">{user?.patient_profile?.blood_group || 'Not recorded'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-600 block text-[10px]">Documented Allergies</span>
            <span className="font-bold text-rose-600">{user?.patient_profile?.allergies || 'None reported'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-600 block text-[10px]">Emergency Contact</span>
            <span className="font-bold text-slate-800">{user?.patient_profile?.emergency_contact_name || 'Not provided'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-600 block text-[10px]">Emergency Phone</span>
            <span className="font-bold text-slate-800">{user?.patient_profile?.emergency_contact_phone || 'Not provided'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
