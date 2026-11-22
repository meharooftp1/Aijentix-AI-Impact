import React from "react";
import { PILLARS } from "../lib/data";

export default function CoverTab({ onNavigate, state, updateState }) {
  const steps = [
    { title: "Assess the business", body: "Score current operational, data, technology and people readiness — AI adoption is not required.", tab: "assessment" },
    { title: "Reference the Scoring Guide", body: "Use it to calibrate what each maturity level actually means before you score.", tab: "guide" },
    { title: "Find AI opportunities", body: "Review readiness gaps, priority areas and where AI-enabled automation may create measurable value.", tab: "results" },
    { title: "Revisit periodically", body: "Retake the assessment every 6–12 months to track how maturity is evolving.", tab: null },
    { title: "Model cost & return", body: "Use TCO & ROI to see the cost and expected return of your AI use cases, and the overall payback.", tab: "tco" },
    { title: "Estimate productivity gains", body: "Use Productivity & Efficiency to estimate — and later measure — the hours and value each use case saves.", tab: "productivity" },
    { title: "Check use case readiness", body: "See which maturity pillars matter most for each AI use case, weighted against your actual Results scores.", tab: "usecases" },
  ];

  return (
    <div>
      <p className="font-mono text-xs tracking-widest text-teal uppercase mb-3">Shared team workspace</p>
      <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-[1.1] max-w-2xl">
        Aijentix AI Value &amp; Impact
      </h1>
      <p className="mt-5 max-w-xl text-ink/70 leading-relaxed">
        Aijentix helps organizations discover where AI can reduce operating costs, improve productivity and strengthen decision-making. Assess your current business readiness, identify practical AI opportunities, and build a measurable adoption roadmap — even if your organization has not implemented AI yet.
      </p>

      <div className="mt-8 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-7 sm:p-9 shadow-xl"><div className="text-xs uppercase tracking-[0.2em] text-blue-200">Aijentix advisory portal</div><div className="mt-3 max-w-2xl text-2xl sm:text-3xl font-semibold leading-tight">Turn everyday business challenges into measurable AI value.</div><div className="mt-4 flex flex-wrap gap-2">{["Cost reduction", "Productivity", "Process automation", "AI readiness"].map((x) => <span key={x} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-blue-50">{x}</span>)}</div></div>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Assessment profile</h2><p className="text-sm text-slate-500 mt-1">Identify the organization being assessed.</p></div><span className="text-xs text-slate-400">Optional</span></div><div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">Workspace note: this version stores one active assessment per customer workspace. If Aijentix will assess multiple client companies under the same Aijentix login, a client/workspace selector and per-client data isolation must be added before using it as a multi-client consulting portal.</div><div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{[{key:"name",label:"Company name",placeholder:"Enter company name"},{key:"industry",label:"Industry",placeholder:"e.g. Manufacturing"},{key:"employees",label:"Employee count",placeholder:"e.g. 250",type:"number"},{key:"assessmentDate",label:"Assessment date",type:"date"}].map((f)=><label key={f.key} className="text-xs font-medium text-slate-600">{f.label}<input type={f.type || "text"} value={state.company?.[f.key] || ""} placeholder={f.placeholder || ""} onChange={(e)=>updateState((prev)=>({...prev,company:{...prev.company,[f.key]:e.target.value}}))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>)}</div></section>
      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        {steps.map((s, i) => (
          <button
            key={s.title}
            onClick={() => s.tab && onNavigate(s.tab)}
            disabled={!s.tab}
            className={`text-left bg-paper p-6 ${s.tab ? "hover:bg-teal-light/40 cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-mono text-xs text-blue-600">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-display font-semibold">{s.title}</span>
            </div>
            <p className="text-sm text-ink/65 leading-relaxed">{s.body}</p>
          </button>
        ))}
      </div>

      <h2 className="font-display text-xl font-semibold mt-14 mb-4">Capability areas covered</h2>
      <div className="border-t border-ledger">
        {PILLARS.map((p) => (
          <div key={p.key} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 py-4 border-b border-ledger">
            <div className="sm:w-56 shrink-0 font-medium">{p.name}</div>
            <div className="text-sm text-ink/65">{p.blurb}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
