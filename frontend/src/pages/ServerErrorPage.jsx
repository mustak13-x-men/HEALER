import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home, RotateCw } from 'lucide-react';

const ServerErrorPage = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <span className="text-4xl font-extrabold text-rose-600">500</span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Service Encountered an Issue</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Our clinical telemetry logs have flagged an operational exception. Please retry in a few moments.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-xs hover:bg-primary-700 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RotateCw className="w-4 h-4" />
            <span>Reload Portal</span>
          </button>
          <Link
            to="/"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServerErrorPage;
