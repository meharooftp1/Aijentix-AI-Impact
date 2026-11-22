import React from "react";
import { computeProductivity, fmtMoney, fmtNum } from "../lib/calculations";

const NUM_FIELDS = [
  { key: "employees", label: "# Employees Affected", step: 1 },
  { key: "estHrsSaved", label: "Est. Hrs Saved / Person / Wk (gross)", step: 0.5 },
  { key: "actualHrsSaved", label: "Actual Hrs Saved / Person / Wk (gross)", step: 0.5 },
  { key: "reworkHrs", label: "Rework/Correction Hrs / Person / Wk", step: 0.5 },
  { key: "adoptionRate", label: "Adoption Rate %", step: 0.05, isPct: true },
  { key: "hourlyCost", label: "Fully-Loaded Hourly Cost", step: 1 },
  { key: "workingWeeks", label: "Working Weeks / Yr", step: 1 },
  { key: "realizationRate", label: "Realization Rate %", step: 0.05, isPct: true },
];

export default function ProductivityTab({ state, updateState }) {
  const result = computeProductivity(state.productivity);

  const addRow = () => {
    updateState((prev) => ({
      ...prev,
      productivity: {
        ...prev.productivity,
        timeBased: [
          ...prev.productivity.timeBased,
          { name: "", employees: "", estHrsSaved: "", actualHrsSaved: "", reworkHrs: "", adoptionRate: "", hourlyCost: "", workingWeeks: 48, realizationRate: "" },
        ],
      },
    }));
  };

  const removeRow = (idx) => {
    updateState((prev) => ({
      ...prev,
      productivity: { ...prev.productivity, timeBased: prev.productivity.timeBased.filter((_, i) => i !== idx) },
    }));
  };

  const setField = (idx, field, value, isPct) => {
    const v = value === "" ? "" : isPct ? Number(value) / 100 : Number(value);
    updateState((prev) => ({
      ...prev,
      productivity: {
        ...prev.productivity,
        timeBased: prev.productivity.timeBased.map((r, i) => (i === idx ? { ...r, name: field === "name" ? value : r.name, [field]: field === "name" ? r[field] : v } : r)),
      },
    }));
  };

  const setName = (idx, name) => {
    updateState((prev) => ({
      ...prev,
      productivity: {
        ...prev.productivity,
        timeBased: prev.productivity.timeBased.map((r, i) => (i === idx ? { ...r, name } : r)),
      },
    }));
  };

  const addBenefit = () => {
    updateState((prev) => ({
      ...prev,
      productivity: { ...prev.productivity, otherBenefits: [...prev.productivity.otherBenefits, { desc: "", category: "", value: "" }] },
    }));
  };
  const removeBenefit = (idx) => {
    updateState((prev) => ({
      ...prev,
      productivity: { ...prev.productivity, otherBenefits: prev.productivity.otherBenefits.filter((_, i) => i !== idx) },
    }));
  };
  const setBenefit = (idx, field, value) => {
    updateState((prev) => ({
      ...prev,
      productivity: {
        ...prev.productivity,
        otherBenefits: prev.productivity.otherBenefits.map((b, i) => (i === idx ? { ...b, [field]: field === "value" ? (value === "" ? "" : Number(value)) : value } : b)),
      },
    }));
  };

  return (
    <div>
      <p className="font-mono text-xs tracking-widest text-teal uppercase mb-3">05 — Modeling</p>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold">Productivity & Efficiency</h1>
      <p className="mt-4 max-w-xl text-ink/70 leading-relaxed">
        Model the value of each AI use case: estimate gross hours saved, net out rework time and
        apply a realization rate, then add any non-time benefits. The total carries into the Annual
        Benefit column on TCO & ROI, matched by use case name.
      </p>

      <h2 className="font-display text-xl font-semibold mt-12 mb-1">1. Time-Based Productivity</h2>
      <p className="text-sm text-ink/55 mb-5 max-w-xl">
        Enter the current workforce and estimated hours AI could save. Gross capacity value is the value of released time; the realization rate estimates the portion that becomes cash savings, avoided hiring or productive redeployment. Do not treat all released capacity as direct cash savings.
      </p>

      <div className="space-y-6">
        {state.productivity.timeBased.map((r, idx) => {
          const rr = result.rows[idx];
          return (
            <div key={idx} className="border border-ledger rounded p-5">
              <div className="flex items-center gap-3 mb-4">
                <input
                  value={r.name}
                  onChange={(e) => setName(idx, e.target.value)}
                  placeholder="Use case name (match this on TCO & ROI)"
                  className="flex-1 font-medium bg-transparent border-b border-dashed border-ink/20 focus:outline-none focus:border-teal py-1"
                />
                <button onClick={() => removeRow(idx)} className="text-ink/30 hover:text-clay px-2" aria-label="Remove row">
                  ✕
                </button>
              </div>
              <div className="grid sm:grid-cols-4 gap-4">
                {NUM_FIELDS.map((f) => (
                  <label key={f.key} className="text-xs text-ink/55">
                    {f.label}
                    <input
                      type="number"
                      step={f.step}
                      value={f.isPct ? (r[f.key] === "" ? "" : Math.round(r[f.key] * 100)) : r[f.key]}
                      onChange={(e) => setField(idx, f.key, e.target.value, f.isPct)}
                      className="mt-1 w-full rounded border border-ledger bg-paper px-2 py-1.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-4 grid sm:grid-cols-4 gap-4 text-sm border-t border-ledger pt-4">
                <div>
                  <div className="text-xs text-ink/40">Gross Capacity Value</div>
                  <div className="font-medium">{fmtMoney(rr.estCapacityValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-ink/40">Potential Realized Value</div>
                  <div className="font-semibold text-teal">{fmtMoney(rr.estRealizedValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-ink/40">Actual Net Capacity Value</div>
                  <div className="font-medium">{fmtMoney(rr.actualNetCapacityValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-ink/40">Variance vs. Estimate</div>
                  <div className="font-medium">{fmtMoney(rr.variance)}</div>
                </div>
                <div>
                  <div className="text-xs text-ink/40">Actual Realized Value</div>
                  <div className="font-semibold text-teal">{fmtMoney(rr.actualRealizedValue)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={addRow} className="mt-5 text-sm font-medium text-teal hover:text-teal-dark border border-teal rounded px-4 py-2">
        + Add use case
      </button>

      <div className="mt-6 bg-teal-light/50 rounded px-5 py-4 flex flex-wrap gap-x-10 gap-y-2 text-sm">
        <div>
          <span className="text-ink/50">Gross capacity value: </span>
          <span className="font-medium">{fmtMoney(result.totals.estCapacityValue)}</span>
        </div>
        <div>
          <span className="text-ink/50">Potential realized annual value: </span>
          <span className="font-semibold text-teal">{fmtMoney(result.totals.estRealizedValue)}</span>
        </div>
        <div>
          <span className="text-ink/50">Total actual realized: </span>
          <span className="font-semibold text-teal">{fmtMoney(result.totals.actualRealizedValue)}</span>
        </div>
      </div>

      <h2 className="font-display text-xl font-semibold mt-14 mb-1">2. Other Quantifiable Benefits</h2>
      <p className="text-sm text-ink/55 mb-5 max-w-xl">
        Benefits that aren't hours-based — error/rework cost avoidance, revenue uplift, quality
        improvements you can price directly.
      </p>
      <div className="border-t border-ledger">
        {state.productivity.otherBenefits.map((b, idx) => (
          <div key={idx} className="grid sm:grid-cols-[1fr_180px_140px_32px] gap-3 items-center py-3 border-b border-ledger">
            <input
              value={b.desc}
              onChange={(e) => setBenefit(idx, "desc", e.target.value)}
              placeholder="Benefit description"
              className="bg-transparent border-b border-dashed border-ink/20 focus:outline-none focus:border-teal py-1 text-sm"
            />
            <input
              value={b.category}
              onChange={(e) => setBenefit(idx, "category", e.target.value)}
              placeholder="Category"
              className="bg-transparent border-b border-dashed border-ink/20 focus:outline-none focus:border-teal py-1 text-sm"
            />
            <input
              type="number"
              value={b.value}
              onChange={(e) => setBenefit(idx, "value", e.target.value)}
              placeholder="Annual $"
              className="rounded border border-ledger bg-paper px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
            <button onClick={() => removeBenefit(idx)} className="text-ink/30 hover:text-clay" aria-label="Remove benefit">
              ✕
            </button>
          </div>
        ))}
      </div>
      <button onClick={addBenefit} className="mt-4 text-sm font-medium text-teal hover:text-teal-dark border border-teal rounded px-4 py-2">
        + Add benefit
      </button>
      <div className="mt-4 text-sm">
        <span className="text-ink/50">Total other benefits: </span>
        <span className="font-medium">{fmtMoney(result.totalOtherBenefits)}</span>
      </div>

      <h2 className="font-display text-xl font-semibold mt-14 mb-4">3. Total Realized Annual Benefit</h2>
      <div className="grid sm:grid-cols-3 gap-px bg-ledger border border-ledger">
        <div className="bg-paper p-5">
          <div className="text-xs font-mono uppercase text-ink/40">Time-Based Realized Value</div>
          <div className="font-display text-2xl font-semibold mt-1">{fmtMoney(result.totals.actualRealizedValue)}</div>
        </div>
        <div className="bg-paper p-5">
          <div className="text-xs font-mono uppercase text-ink/40">Other Quantifiable Benefits</div>
          <div className="font-display text-2xl font-semibold mt-1">{fmtMoney(result.totalOtherBenefits)}</div>
        </div>
        <div className="bg-teal-dark text-paper p-5">
          <div className="text-xs font-mono uppercase text-paper/60">Total Realized Annual Benefit</div>
          <div className="font-display text-2xl font-semibold mt-1">{fmtMoney(result.totalRealizedAnnualBenefit)}</div>
        </div>
      </div>
    </div>
  );
}
