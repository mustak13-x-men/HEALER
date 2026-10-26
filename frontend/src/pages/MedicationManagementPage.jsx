import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Pill,
  Clock,
  PlusCircle,
  Trash2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Calendar,
  User,
  Loader2
} from 'lucide-react';

const MedicationManagementPage = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Medication Form
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: 'Once daily',
    instructions: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    prescribing_doctor: '',
    reminder_times: '08:00', // comma-separated
  });

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/medications');
      setMedications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medication regimen?')) return;
    try {
      await api.delete(`/medications/${id}`);
      setToast('Medication deleted.');
      setTimeout(() => setToast(''), 4000);
      fetchMedications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const times = newMed.reminder_times
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const schedules = times.map((t) => ({
        reminder_time: t,
        days_of_week: '0,1,2,3,4,5,6',
      }));

      const payload = {
        name: newMed.name,
        dosage: newMed.dosage,
        frequency: newMed.frequency,
        instructions: newMed.instructions,
        start_date: newMed.start_date,
        end_date: newMed.end_date || null,
        prescribing_doctor: newMed.prescribing_doctor || null,
        schedules: schedules,
      };

      await api.post('/medications', payload);
      setToast('Medication and scheduled reminders added successfully.');
      setTimeout(() => setToast(''), 4000);
      setShowAddModal(false);
      setNewMed({
        name: '',
        dosage: '',
        frequency: 'Once daily',
        instructions: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        prescribing_doctor: '',
        reminder_times: '08:00',
      });
      fetchMedications();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add medication.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Prescription & Medication Regimens
          </h2>
          <p className="text-xs text-slate-500">
            Track prescribed medicines, dosages, food instructions, and recurring schedules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/medications/reminders"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Reminder Timeline</span>
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Medication</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Medication Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your prescription list...</p>
        </div>
      ) : medications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {medications.map((med) => (
            <div
              key={med.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{med.name}</h4>
                      <span className="text-xs font-semibold text-teal-700">Dosage: {med.dosage}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(med.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove Medication"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <p className="text-slate-700">
                    <strong>Frequency:</strong> {med.frequency}
                  </p>
                  {med.instructions && (
                    <p className="text-slate-600 italic">
                      "{med.instructions}"
                    </p>
                  )}
                  {med.prescribing_doctor && (
                    <p className="text-[11px] text-slate-500 pt-1">
                      Prescribed by: {med.prescribing_doctor}
                    </p>
                  )}
                </div>

                {/* Reminder times chips */}
                {med.schedules && med.schedules.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" /> Reminder Times:
                    </span>
                    {med.schedules.map((sch) => (
                      <span
                        key={sch.id}
                        className="px-2 py-0.5 rounded-lg bg-teal-100/70 text-teal-800 text-[11px] font-bold"
                      >
                        {sch.reminder_time}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Start: {med.start_date}</span>
                <span>{med.end_date ? `Until: ${med.end_date}` : 'Continuous'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Pill className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-bold text-sm text-slate-800">No Medications Recorded</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add your prescriptions to receive automated reminders and track your dosage instructions accurately.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
          >
            Add First Medication
          </button>
        </div>
      )}

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Medication Regimen</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medication Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin, Metformin"
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dosage *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 mg, 1 tablet"
                    value={newMed.dosage}
                    onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Frequency</label>
                  <input
                    type="text"
                    placeholder="e.g. Twice daily"
                    value={newMed.frequency}
                    onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reminder Times (24h, comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="08:00, 20:00"
                  value={newMed.reminder_times}
                  onChange={(e) => setNewMed({ ...newMed, reminder_times: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dietary / Intake Instructions</label>
                <input
                  type="text"
                  placeholder="Take after meals with water"
                  value={newMed.instructions}
                  onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={newMed.start_date}
                    onChange={(e) => setNewMed({ ...newMed, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={newMed.end_date}
                    onChange={(e) => setNewMed({ ...newMed, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prescribing Doctor (Optional)</label>
                <input
                  type="text"
                  placeholder="Dr. Sarah Jenkins"
                  value={newMed.prescribing_doctor}
                  onChange={(e) => setNewMed({ ...newMed, prescribing_doctor: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Medication & Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationManagementPage;
