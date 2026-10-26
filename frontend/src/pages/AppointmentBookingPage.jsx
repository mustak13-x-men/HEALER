import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  User,
  Loader2,
  AlertTriangle
} from 'lucide-react';

const AppointmentBookingPage = () => {
  const { user, isDoctor } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedDoctorId = searchParams.get('doctorId');
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(preselectedDoctorId || '');
  
  // Tomorrow's date default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [appointmentDate, setAppointmentDate] = useState(defaultDateStr);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');

  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Load all doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const res = await api.get('/doctors');
        setDoctors(res.data);
        if (!selectedDoctorId && res.data.length > 0) {
          setSelectedDoctorId(res.data[0].id.toString());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch slots whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !appointmentDate) return;

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setErrorMsg('');
        setSelectedSlot('');
        const res = await api.get(`/doctors/${selectedDoctorId}/availability`, {
          params: { date: appointmentDate },
        });
        setAvailableSlots(res.data);
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to fetch availability slots for selected date.');
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDoctorId, appointmentDate]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMsg('Please select an available time slot.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Please specify the primary reason for your consultation.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        doctor_id: parseInt(selectedDoctorId),
        appointment_date: appointmentDate,
        start_time: selectedSlot,
        reason: reason.trim(),
      };

      const res = await api.post('/appointments', payload);
      setBookingSuccess(res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        setErrorMsg('Conflict: The requested slot was just booked by another patient. Slots refreshed.');
        // Refresh slots
        const res = await api.get(`/doctors/${selectedDoctorId}/availability`, {
          params: { date: appointmentDate },
        });
        setAvailableSlots(res.data);
      } else {
        setErrorMsg(err.response?.data?.detail || 'Booking failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctorObj = doctors.find((d) => d.id.toString() === selectedDoctorId);

  if (loadingDoctors) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Preparing clinical scheduling portal...</p>
      </div>
    );
  }

  if (isDoctor) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-amber-200 shadow-md p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Doctor Account Notice</h3>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          You are currently logged in with a Doctor account (<strong>{user?.full_name}</strong>). Appointment slot reservations are strictly for <strong>Patients</strong> who need to book care with physicians.
        </p>
        <p className="text-xs text-slate-500">
          To manage your incoming patient consultations, please return to your doctor dashboard.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/dashboard/doctor"
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
          >
            Go to Doctor Dashboard
          </Link>
          <Link
            to="/appointments"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
          >
            View Assigned Patients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Book Physician Consultation
        </h2>
        <p className="text-xs text-slate-500">
          Guaranteed double-booking prevention with instant appointment confirmation
        </p>
      </div>

      {bookingSuccess ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">Appointment Confirmed!</h3>
            <p className="text-xs text-slate-500">
              Your consultation has been reserved in our system. A confirmation notification has been sent.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 max-w-md mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Physician:</span>
              <span className="font-bold text-slate-800">{bookingSuccess.doctor_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Specialization:</span>
              <span className="font-bold text-primary-700">{bookingSuccess.specialization}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span className="font-bold text-slate-800">{bookingSuccess.appointment_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Time:</span>
              <span className="font-bold text-slate-800">{bookingSuccess.start_time} - {bookingSuccess.end_time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reason:</span>
              <span className="font-bold text-slate-800">{bookingSuccess.reason}</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/appointments"
              className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-xs hover:bg-primary-700 transition-colors shadow-xs"
            >
              Go to My Appointments
            </Link>
            <button
              onClick={() => {
                setBookingSuccess(null);
                setSelectedSlot('');
                setReason('');
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Book Another
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleBookingSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Doctor Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Select Healthcare Specialist *
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.full_name} ({doc.specialization}) - ${doc.consultation_fee}
                </option>
              ))}
            </select>

            {selectedDoctorObj && (
              <div className="p-3 rounded-xl bg-primary-50/50 border border-primary-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{selectedDoctorObj.specialization}</span>
                  <p className="text-[11px] text-slate-500">{selectedDoctorObj.clinic_address || 'Main Clinic'}</p>
                </div>
                <span className="font-bold text-primary-700">${selectedDoctorObj.consultation_fee} per visit</span>
              </div>
            )}
          </div>

          {/* Step 2: Date Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Select Appointment Date *
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
            />
          </div>

          {/* Step 3: Available Slot Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Choose Time Slot (30 Mins) *
              </label>
              {loadingSlots && <span className="text-[11px] text-slate-400">Verifying live slots...</span>}
            </div>

            {loadingSlots ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedSlot === slot.time
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 ring-2 ring-primary-600'
                        : slot.available
                        ? 'bg-slate-50 hover:bg-primary-50 text-slate-700 hover:text-primary-700 border border-slate-200'
                        : 'bg-slate-100 text-slate-400 line-through cursor-not-allowed border border-slate-100'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3 italic">
                No slots available on this date. Doctor may not practice on weekends. Please pick another weekday.
              </p>
            )}
          </div>

          {/* Step 4: Reason for Visit */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              4. Reason for Consultation *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe your primary symptoms, concerns, or reason for this visit..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !selectedSlot}
            className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Securing Appointment Lock...</span>
              </>
            ) : (
              <>
                <span>Confirm & Reserve Appointment</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default AppointmentBookingPage;
