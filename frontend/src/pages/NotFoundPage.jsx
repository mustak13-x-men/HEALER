import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
          <HeartPulse className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <span className="text-4xl font-extrabold text-primary-600">404</span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Clinical Page Not Found</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The requested health resource or route could not be located. It may have been moved or archived.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-xs hover:bg-primary-700 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
