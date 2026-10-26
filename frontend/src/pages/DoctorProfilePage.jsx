import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Stethoscope,
  Star,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle,
  Loader2
} from 'lucide-react';

const DoctorProfilePage = () => {
  const { id } = useParams();
  const { user, isPatient } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/doctors/${id}`);
        setDoctor(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading physician profile...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
        <h3 className="text-base font-bold text-slate-900">Physician Profile Not Found</h3>
        <p className="text-xs text-slate-500">The requested doctor record does not exist.</p>
        <Link to="/doctors" className="inline-block px-4 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs">
          Return to Doctor Directory
        </Link>
      </div>
    );
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-2xl border border-teal-200">
              {doctor.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{doctor.full_name}</h2>
                <ShieldCheck className="w-5 h-5 text-emerald-600" title="Verified Physician" />
              </div>
              <p className="text-sm font-bold text-primary-600">{doctor.specialization}</p>
              <p className="text-xs text-slate-500">License #{doctor.license_number} • {doctor.experience_years} Years Experience</p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {doctor.rating} ({doctor.total_reviews} verified reviews)
            </span>
            <span className="text-lg font-extrabold text-primary-700">
              ${doctor.consultation_fee} <span className="text-xs font-normal text-slate-500">/ visit</span>
            </span>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Clinical Biography</h4>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {doctor.bio || 'Board-certified medical practitioner committed to clinical excellence, evidence-based diagnoses, and patient-centered treatment plans.'}
          </p>
        </div>

        {/* Location & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          {doctor.clinic_address && (
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block">Clinic Location</span>
                <span className="text-slate-500">{doctor.clinic_address}</span>
              </div>
            </div>
          )}
          {doctor.phone && (
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block">Practice Phone</span>
                <span className="text-slate-500">{doctor.phone}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-600" />
          Standard Weekly Availability
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {doctor.availabilities?.length > 0 ? (
            doctor.availabilities.map((avail, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <span className="font-bold text-slate-800 block">{daysOfWeek[avail.day_of_week] || 'Weekday'}</span>
                <span className="text-slate-500 block">{avail.start_time} - {avail.end_time}</span>
                <span className="text-[10px] text-teal-700 font-semibold">{avail.slot_duration_minutes} min slots</span>
              </div>
            ))
          ) : (
            <div className="col-span-full py-4 text-xs text-slate-500">
              Monday through Friday: 09:00 AM - 05:00 PM (Standard Hours)
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {(!user || isPatient) ? `Ready to book an appointment with ${doctor.full_name}?` : `Physician Practice Profile: ${doctor.full_name}`}
          </p>
          {(!user || isPatient) ? (
            <Link
              to={`/book-appointment?doctorId=${doctor.id}`}
              className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <span>Proceed to Slot Booking</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
              Appointment booking is for patients
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorProfilePage;
