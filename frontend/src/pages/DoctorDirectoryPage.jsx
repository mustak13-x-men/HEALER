import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Stethoscope,
  Search,
  Star,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle,
  Loader2
} from 'lucide-react';

const DoctorDirectoryPage = () => {
  const { user, isPatient } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (specialization) params.specialization = specialization;

      const res = await api.get('/doctors', { params });
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [specialization]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const specializations = [
    'All Specializations',
    'Cardiology',
    'Neurology',
    'Pediatrics',
    'Dermatology',
    'General Medicine',
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Specialist Physician Directory
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Discover verified healthcare practitioners, view real-time open slots, and schedule consultations
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search doctor name or expertise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {specializations.map((spec) => (
            <button
              key={spec}
              onClick={() => setSpecialization(spec === 'All Specializations' ? '' : spec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                (spec === 'All Specializations' && !specialization) || specialization === spec
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Searching verified clinical roster...</p>
        </div>
      ) : doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-base border border-teal-100">
                    {doc.full_name.charAt(0)}
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {doc.rating} ({doc.total_reviews})
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900">{doc.full_name}</h3>
                  <p className="text-xs font-bold text-primary-600">{doc.specialization}</p>
                  <p className="text-[11px] text-slate-500">{doc.experience_years} years clinical practice</p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {doc.bio || 'General clinical care, preventive assessments, and treatment.'}
                </p>

                <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  {doc.clinic_address && (
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{doc.clinic_address}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-700 font-semibold pt-1">
                    <span>Consultation Fee:</span>
                    <span className="text-primary-700 font-bold">${doc.consultation_fee}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                <Link
                  to={`/doctors/${doc.id}`}
                  className={`py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs text-center transition-colors ${
                    !user || isPatient ? '' : 'col-span-2'
                  }`}
                >
                  View Profile
                </Link>
                {(!user || isPatient) && (
                  <Link
                    to={`/book-appointment?doctorId=${doc.id}`}
                    className="py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs text-center shadow-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Book Slot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-bold text-sm text-slate-800">No Specialists Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or clear your specialization filter to see all physicians.
          </p>
        </div>
      )}
    </div>
  );
};

export default DoctorDirectoryPage;
