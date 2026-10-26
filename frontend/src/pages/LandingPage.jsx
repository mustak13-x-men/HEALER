import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  Calendar,
  Clock,
  Bot,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  Stethoscope,
  Activity,
  AlertTriangle
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="space-y-20 pb-16">
      {/* Emergency Notice Ribbon */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-800 flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Emergency Notice:</strong> If you are experiencing sudden chest pain, stroke symptoms, or severe shortness of breath, please dial <strong>911</strong> or visit the nearest emergency room immediately.
        </span>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs font-semibold">
              <Activity className="w-4 h-4" />
              Next-Generation Healthcare Intelligence
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Empowered Care with <span className="bg-gradient-to-r from-primary-600 to-teal-600 bg-clip-text text-transparent">AI Precision</span> and Verified Doctors.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Seamlessly book specialist consultations, automate recurring medication reminders with proactive alerts, and get safe health education through our certified medical AI assistant.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-xl bg-primary-600 text-white font-semibold text-sm shadow-lg shadow-primary-600/30 hover:bg-primary-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
              >
                <span>Get Started as Patient</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/doctors"
                className="px-6 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-2"
              >
                <Stethoscope className="w-4 h-4 text-primary-600" />
                <span>Browse Doctors & Slots</span>
              </Link>
            </div>

            {/* Micro stats */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-6">
              <div>
                <p className="text-2xl font-bold text-slate-900">100%</p>
                <p className="text-xs text-slate-500 font-medium">Double-Booking Free</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">24/7</p>
                <p className="text-xs text-slate-500 font-medium">Safe AI Assistant</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">99.8%</p>
                <p className="text-xs text-slate-500 font-medium">Reminder Accuracy</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="relative">
            <div className="relative mx-auto max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-6">
              {/* Doctor snippet */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-lg">
                    SJ
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Dr. Sarah Jenkins, MD</h3>
                    <p className="text-xs text-teal-600 font-semibold">Cardiology Specialist</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Available Today
                </span>
              </div>

              {/* Medication Tracker sample */}
              <div className="p-4 rounded-2xl bg-primary-50/70 border border-primary-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary-600" />
                    Next Medication Reminder
                  </span>
                  <span className="text-[11px] font-bold text-primary-700">08:30 AM</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Lisinopril (10 mg)</p>
                    <p className="text-[11px] text-slate-500">Take with full glass of water</p>
                  </div>
                  <button className="px-3 py-1 rounded-lg bg-primary-600 text-white text-xs font-semibold">
                    Acknowledge
                  </button>
                </div>
              </div>

              {/* Chat snippet */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Bot className="w-4 h-4 text-teal-600" />
                  <span>AI Health Education Assistant</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "Normal blood pressure for adults is &lt; 120/80 mm Hg. Regular aerobic activity and dietary sodium reduction are proven interventions."
                </p>
                <p className="text-[10px] text-slate-600">Source: American Heart Association (AHA) Guidelines</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <h2 className="text-xs uppercase font-bold tracking-widest text-primary-600">Comprehensive Clinical Suite</h2>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">Everything You Need for Total Health Management</p>
          <p className="text-sm text-slate-600">Engineered with role-based access control, transaction-safe booking, and proactive wellness monitoring.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Conflict-Free Doctor Booking</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Real-time schedule computation. Atomic database isolation prevents double-booking while empowering patients to reschedule or cancel appointments seamlessly.
            </p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> 30-minute precise slot reservations</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Specialist filtering by discipline & rating</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Automated Medication Reminders</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Background scheduler monitors dosages, food instructions, and recurring schedules. Track acknowledgment timestamps and missed events without false claims.
            </p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Reliable background scheduler recovery</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> In-app and browser notifications</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Certified Medical AI Assistant</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              RAG-enhanced medical education grounded in CDC, WHO, and AHA guidelines. Equipped with acute emergency red-flag triggers and strict ethical guardrails.
            </p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Authentic source citations included</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Automatic emergency triage warning</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-xs uppercase font-bold tracking-widest text-primary-600">Simple 4-Step Journey</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">How HEALER Works</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
              <span className="w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center">1</span>
              <h4 className="font-bold text-base text-slate-900">Create Account</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Register securely as a patient with medical background, emergency contacts, and allergies.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
              <span className="w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center">2</span>
              <h4 className="font-bold text-base text-slate-900">Select Specialist</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Filter verified physicians by specialty, view open time slots, and confirm appointments instantly.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
              <span className="w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center">3</span>
              <h4 className="font-bold text-base text-slate-900">Sync Medications</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Input your prescribed medicines and times. Receive timely notifications and mark acknowledgment.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
              <span className="w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center">4</span>
              <h4 className="font-bold text-base text-slate-900">Consult AI Guide</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Ask health questions, explore preventive care measures, and receive cited clinical insights anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-teal-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Ready to Take Control of Your Health?</h3>
            <p className="text-sm text-primary-100 leading-relaxed">
              Join patients and medical professionals using HEALER for organized, reliable, and verified healthcare management.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-xl bg-white text-primary-700 font-bold text-sm text-center shadow-md hover:bg-primary-50 transition-colors"
            >
              Register Now
            </Link>
            <Link
              to="/login"
              className="px-6 py-3.5 rounded-xl border border-white/30 text-white font-semibold text-sm text-center hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
