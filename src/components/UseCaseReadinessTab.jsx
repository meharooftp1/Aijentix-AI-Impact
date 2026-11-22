import React from "react";
import { PILLARS } from "../lib/data";
import { computeResults, computeUseCaseReadiness } from "../lib/calculations";

const emptyWeights = () => Object.fromEntries(PILLARS.map((p) => [p.key, ""]));
const STARTER_USE_CASES = [
  { name: "Customer service assistant", weights: { strategy: 2, usecases: 3, data: 2, engineering: 2, governance: 3, organization: 2, culture: 2 } },
  { name: "Invoice and document processing", weights: { strategy: 2, usecases: 3, data: 3, engineering: 2, governance: 2, organization: 1, culture: 1 } },
  { name: "Sales forecasting and demand planning", weights: { strategy: 3, usecases: 3, data: 3, engineering: 2, governance: 2, organization: 2, culture: 1 } },
  { name: "Employee HR and policy assistant", weights: { strategy: 2, usecases: 2, data: 3, engineering: 2, governance: 3, organization: 2, culture: 2 } },
  { name: "Report generation and business insights", weights: { strategy: 2, usecases: 3, data: 3, engineering: 2, governance: 2, organization: 1, culture: 1 } },
  { name: "Quality inspection and anomaly detection", weights: { strategy: 2, usecases: 3, data: 3, engineering: 3, governance: 2, organization: 2, culture: 1 } },
];

export default function UseCaseReadinessTab({ state, updateState }) {
  const results = computeResults(state.assessment);
  const readiness = computeUseCaseReadiness(state.useCases, results);

  const addRow = () => {
    updateState((prev) => ({
      ...prev,
      useCases: [...prev.useCases, { name: "", weights: emptyWeights() }],
    }));
  };

  const removeRow = (idx) => {
    updateState((prev) => ({ ...prev, useCases: prev.useCases.filter((_, i) => i !== idx) }));
  };

  const setName = (idx, name) => {
    updateState((prev) => ({
      ...prev,
      useCases: prev.useCases.map((uc, i) => (i === idx ? { ...uc, name } : uc)),
    }));
  };

  const setWeight = (idx, pillarKey, value) => {
    updateState((prev) => ({
      ...prev,
      useCases: prev.useCases.map((uc, i) =>
        i === idx ? { ...uc, weights: { ...uc.weights, [pillarKey]: value } } : uc
      ),
    }));
  };

  return (
    <div>
      <p className="font-mono text-xs tracking-widest text-teal uppercase mb-3">03 — Analysis</p>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold">Use Case Readiness</h1>
      <p className="mt-4 max-w-xl text-ink/70 leading-relaxed">
        For each AI use case, rate how much each maturity pillar matters: 0 = N/A, 1 = Minor,
        2 = Important, 3 = Critical. This is weighted against your actual Results scores to show
        which use cases are most exposed to a capability gap.
      </p>

      <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50/60 p-4"><div className="font-semibold text-blue-950 text-sm">Suggested AI opportunity library</div><p className="text-xs text-blue-900/70 mt-1">Add a starting use case, then adjust the pillar weights to reflect your company's process and risk profile.</p><div className="mt-3 flex flex-wrap gap-2">{STARTER_USE_CASES.map((item)=><button key={item.name} onClick={()=>updateState((prev)=>prev.useCases.some((u)=>u.name===item.name)?prev:{...prev,useCases:[...prev.useCases,{name:item.name,weights:item.weights}]})} className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-100">+ {item.name}</button>)}</div></div>
      <div className="mt-7 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-xs font-mono uppercase tracking-wide text-ink/40 border-b border-ledger">
              <th className="text-left py-2 pr-3 min-w-[220px]">Use Case / Process</th>
              {PILLARS.map((p) => (
                <th key={p.key} className="text-center py-2 px-1 font-normal leading-tight w-16">
                  {p.name}
                </th>
              ))}
              <th className="text-center py-2 px-2 w-20">Readiness</th>
              <th className="text-center py-2 px-2 w-20">Gap</th>
              <th className="text-left py-2 px-2 min-w-[160px]">Biggest Gap Pillar</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.useCases.map((uc, idx) => {
              const r = readiness[idx];
              return (
                <tr key={idx} className="border-b border-ledger">
                  <td className="py-2 pr-3">
                    <input
                      value={uc.name}
                      onChange={(e) => setName(idx, e.target.value)}
                      placeholder="Use case name"
                      className="w-full bg-transparent border-b border-dashed border-ink/20 focus:outline-none focus:border-teal py-1"
                    />
                  </td>
                  {PILLARS.map((p) => (
                    <td key={p.key} className="text-center px-1">
                      <select
                        value={uc.weights[p.key]}
                        onChange={(e) => setWeight(idx, p.key, e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-12 text-center rounded border border-ledger bg-paper py-1 focus:outline-none focus:ring-2 focus:ring-teal"
                      >
                        <option value="">–</option>
                        {[0, 1, 2, 3].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                  <td className="text-center font-medium">{r.weightedReadiness === "" ? "—" : r.weightedReadiness}</td>
                  <td className="text-center font-medium text-clay">{r.weightedGap === "" ? "—" : r.weightedGap}</td>
                  <td className="px-2 text-xs">{r.biggestGapPillar || "—"}</td>
                  <td>
                    <button onClick={() => removeRow(idx)} className="text-ink/30 hover:text-clay px-2" aria-label="Remove use case">
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button onClick={addRow} className="mt-5 text-sm font-medium text-blue-700 hover:text-blue-800 border border-blue-200 bg-white rounded-xl px-4 py-2">
        + Add use case
      </button>

      <p className="mt-8 text-xs text-ink/50 max-w-xl leading-relaxed">
        Any pillar not yet scored on the Assessment tab is treated as 0 maturity here, which will
        understate Weighted Readiness — complete all seven pillars for accurate results.
      </p>
    </div>
  );
}
