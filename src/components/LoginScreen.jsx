import React from "react";
import { signIn } from "../lib/authApi";
import BrandLogo from "./BrandLogo";

export default function LoginScreen() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-full rounded-xl bg-gradient-to-br from-teal-dark to-slate-950 px-5 py-4 mb-8">
          <BrandLogo className="h-9 w-auto mx-auto" />
          <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-white/60">AI Value &amp; Impact</div>
        </div>
        <p className="text-ink/70 mb-6 leading-relaxed">
          Sign in with your Microsoft work account to view and edit the shared team assessment.
        </p>
        <button
          onClick={signIn}
          className="w-full bg-teal text-paper rounded px-5 py-3 font-medium hover:bg-teal-dark transition-colors flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
}
