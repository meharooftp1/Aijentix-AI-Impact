import React from "react";
import { SCORING_GUIDE } from "../lib/data";

export default function ScoringGuideTab() {
  return (
    <div>
      <p className="font-mono text-xs tracking-widest text-teal uppercase mb-3">Reference</p>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold">Scoring Guide</h1>
      <p className="mt-4 max-w-xl text-ink/70 leading-relaxed">
        Use this as a reference for what each maturity level means before scoring the Assessment tab.
      </p>

      <div className="mt-10 border-t border-ledger">
        {SCORING_GUIDE.map((s) => (
          <div key={s.score} className="flex gap-6 py-6 border-b border-ledger">
            <div className="shrink-0 w-14 h-14 rounded-full bg-teal-light flex items-center justify-center font-display text-2xl font-semibold text-teal-dark">
              {s.score}
            </div>
            <div>
              <div className="font-display font-semibold text-lg">{s.level}</div>
              <p className="text-sm text-ink/65 mt-1 leading-relaxed max-w-xl">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-amber-light border-l-4 border-amber px-5 py-4 text-sm text-ink/80 max-w-xl">
        Tip: score Current honestly based on today's reality, not aspirations — the gap to Target is
        what drives the roadmap.
      </div>
    </div>
  );
}
