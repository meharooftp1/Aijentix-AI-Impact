import React from "react";
import { PILLARS } from "../lib/data";

function ScoreSelect({ value, onChange, accent }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      className={`w-16 rounded border px-2 py-1.5 bg-paper focus:outline-none focus:ring-2 focus:ring-teal ${
        value === "" ? "border-ledger text-ink/40" : "border-ink/20"
      }`}
      style={value !== "" ? { borderColor: accent } : {}}
    >
      <option value="">–</option>
      {[1, 2, 3, 4, 5].map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}

export default function AssessmentTab({ state, updateState }) {
  const setEntry = (pillarKey, idx, field, value) => {
    updateState((prev) => {
      const entries = prev.assessment[pillarKey].map((e, i) => (i === idx ? { ...e, [field]: value } : e));
      return { ...prev, assessment: { ...prev.assessment, [pillarKey]: entries } };
    });
  };

  return (
    <div>
      <p className="font-mono text-xs tracking-widest text-teal uppercase mb-3">01 — Input</p>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold">Assessment</h1>
      <p className="mt-4 max-w-3xl text-ink/70 leading-relaxed">
        Assess the company's current business and technology readiness, even if it has never used AI. Score each statement from 1–5 and set a realistic target. Use the notes field to record evidence, assumptions or process examples.
      </p>
      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-950"><strong>Scoring tip:</strong> Current means what is demonstrably in place today — not what you plan to implement. A company with no AI adoption can still score well on digital foundations, process ownership and data readiness.</div>

      <div className="mt-10 space-y-10">
        {PILLARS.map((p) => (
          <section key={p.key}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3"><h2 className="font-semibold text-lg text-slate-900">{p.name}</h2><span className="text-xs text-slate-500">{p.statements.length} questions</span></div>
            <p className="text-sm text-ink/55 mt-2 mb-4">{p.blurb}</p>
            <div className="hidden sm:grid grid-cols-[1fr_72px_72px] gap-4 px-1 pb-2 text-xs font-mono uppercase tracking-wide text-ink/40">
              <div>Statement</div>
              <div>Current</div>
              <div>Target</div>
            </div>
            <div className="divide-y divide-ledger border-t border-ledger">
              {p.statements.map((stmt, idx) => {
                const entry = state.assessment?.[p.key]?.[idx] || { current: "", target: "", notes: "" };
                return (
                  <div key={idx} className="py-4 grid sm:grid-cols-[1fr_72px_72px] gap-3 sm:gap-4 items-start">
                    <div>
                      <p className="text-sm leading-relaxed">{stmt}</p>
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={entry.notes}
                        onChange={(e) => setEntry(p.key, idx, "notes", e.target.value)}
                        className="mt-2 w-full text-xs bg-transparent border-b border-dashed border-ink/20 focus:outline-none focus:border-teal placeholder:text-ink/30 py-1"
                      />
                    </div>
                    <div className="flex sm:block gap-2 items-center">
                      <span className="sm:hidden text-xs font-mono text-ink/40 w-16">Current</span>
                      <ScoreSelect value={entry.current} accent="#123A73" onChange={(v) => setEntry(p.key, idx, "current", v)} />
                    </div>
                    <div className="flex sm:block gap-2 items-center">
                      <span className="sm:hidden text-xs font-mono text-ink/40 w-16">Target</span>
                      <ScoreSelect value={entry.target} accent="#2F6FE4" onChange={(v) => setEntry(p.key, idx, "target", v)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
