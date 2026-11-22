import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TCO_COST_ROWS } from "../lib/data";
import { computeTco, computeProductivity, fmtMoney, fmtPct, fmtMonths } from "../lib/calculations";

export default function TcoRoiTab({ state, updateState }) {
  const productivityResult = computeProductivity(state.productivity);
  const tco = computeTco(state.tco, productivityResult);

  const setCost = (key, yearIdx, value) => {
    updateState((prev) => {
      const vals = [...(prev.tco.costs[key] || [0, 0, 0])];
      vals[yearIdx] = value === "" ? "" : Number(value);
      return { ...prev, tco: { ...prev.tco, costs: { ...prev.tco.costs, [key]: vals } } };
    });
  };

  const addUseCase = () => {
    updateState((prev) => ({ ...prev, tco: { ...prev.tco, roiUseCases: [...prev.tco.roiUseCases, { name: "", annualCost: "" }] } }));
  };
  const removeUseCase = (idx) => {
    updateState((prev) => ({ ...prev, tco: { ...prev.tco, roiUseCases: prev.tco.roiUseCases.filter((_, i) => i !== idx) } }));
  };
  const setUseCase = (idx, field, value) => {
    updateState((prev) => ({
      ...prev,
      tco: {
        ...prev.tco,
        roiUseCases: prev.tco.roiUseCases.map((u, i) =>
          i === idx ? { ...u, [field]: field === "annualCost" ? (value === "" ? "" : Number(value)) : value } : u
        ),
      },
    }));
  };

  return (
    <div>
      <p className="font-mono text-xs tracking-widest text-teal uppercase mb-3">04 — Modeling</p>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold">TCO & ROI Calculator</h1>
      <p className="mt-4 max-w-xl text-ink/70 leading-relaxed">
        A high-level 3-year Total Cost of Ownership and Return on Investment view for your AI
        initiatives.
      </p>

      <h2 className="font-display text-xl font-semibold mt-12 mb-4">1. Total Cost of Ownership (3-Year)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-xs font-mono uppercase tracking-wide text-ink/40 border-b border-ledger">
              <th className="text-left py-2">Cost Category</th>
              <th className="text-right py-2 px-2 w-28">Year 1</th>
              <th className="text-right py-2 px-2 w-28">Year 2</th>
              <th className="text-right py-2 px-2 w-28">Year 3</th>
              <th className="text-right py-2 pl-2 w-28">3-Yr Total</th>
            </tr>
          </thead>
          <tbody>
            {TCO_COST_ROWS.map((row) => (
              <tr key={row.key} className="border-b border-ledger">
                <td className="py-2">
                  {row.label}
                  {row.annual && <span className="ml-1 text-[10px] text-ink/35">(annual)</span>}
                </td>
                {[0, 1, 2].map((yr) => (
                  <td key={yr} className="text-right px-2 py-1">
                    <input
                      type="number"
                      value={state.tco.costs[row.key]?.[yr] ?? ""}
                      disabled={row.annual && yr > 0}
                      onChange={(e) => setCost(row.key, yr, e.target.value)}
                      className={`w-full text-right rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal ${
                        row.annual && yr > 0 ? "bg-ledger/40 border-transparent text-ink/40" : "bg-paper border-ledger"
                      }`}
                    />
                  </td>
                ))}
                <td className="text-right pl-2 font-medium">{fmtMoney(tco.rowTotals[row.key])}</td>
              </tr>
            ))}
            <tr className="font-semibold border-t-2 border-ink/20">
              <td className="py-2">Total TCO</td>
              {tco.yearTotals.map((v, i) => (
                <td key={i} className="text-right px-2">
                  {fmtMoney(v)}
                </td>
              ))}
              <td className="text-right pl-2">{fmtMoney(tco.threeYrTco)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink/40 mt-2">Annual line items repeat Year 1's value automatically for Years 2–3.</p>

      <h2 className="font-display text-xl font-semibold mt-14 mb-1">2. ROI by Use Case</h2>
      <p className="text-sm text-ink/55 mb-5 max-w-xl">
        Annual Cost is manual input. Annual Benefit is auto-linked from Productivity & Efficiency's
        Actual Realized Value, matched by exact use case name.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-xs font-mono uppercase tracking-wide text-ink/40 border-b border-ledger">
              <th className="text-left py-2">AI Use Case</th>
              <th className="text-right py-2 px-2 w-28">Annual Cost</th>
              <th className="text-right py-2 px-2 w-32">Annual Benefit</th>
              <th className="text-right py-2 px-2 w-32">Net Annual</th>
              <th className="text-right py-2 px-2 w-28">3-Yr Net</th>
              <th className="text-right py-2 px-2 w-20">ROI %</th>
              <th className="text-right py-2 pl-2 w-24">Payback</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tco.roiRows.map((r, idx) => (
              <tr key={idx} className="border-b border-ledger">
                <td className="py-2">
                  <input
                    value={state.tco.roiUseCases[idx].name}
                    onChange={(e) => setUseCase(idx, "name", e.target.value)}
                    placeholder="Must match Productivity tab name"
                    className="w-full bg-transparent border-b border-dashed border-ink/20 focus:outline-none focus:border-teal py-1"
                  />
                </td>
                <td className="text-right px-2">
                  <input
                    type="number"
                    value={state.tco.roiUseCases[idx].annualCost}
                    onChange={(e) => setUseCase(idx, "annualCost", e.target.value)}
                    className="w-full text-right rounded border border-ledger bg-paper px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </td>
                <td className="text-right px-2 text-teal font-medium">{fmtMoney(r.annualBenefit)}</td>
                <td className="text-right px-2">{fmtMoney(r.netAnnual)}</td>
                <td className="text-right px-2">{fmtMoney(r.threeYrNet)}</td>
                <td className="text-right px-2">{fmtPct(r.roiPct)}</td>
                <td className="text-right pl-2">{fmtMonths(r.paybackMonths)}</td>
                <td>
                  <button onClick={() => removeUseCase(idx)} className="text-ink/30 hover:text-clay px-2" aria-label="Remove use case">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            <tr className="font-semibold border-t-2 border-ink/20">
              <td className="py-2">Total (all use cases)</td>
              <td className="text-right px-2">{fmtMoney(tco.totals.totalCost)}</td>
              <td className="text-right px-2">{fmtMoney(tco.totals.totalBenefit)}</td>
              <td className="text-right px-2">{fmtMoney(tco.totals.totalNetAnnual)}</td>
              <td className="text-right px-2">{fmtMoney(tco.totals.total3yrNet)}</td>
              <td className="text-right px-2">{fmtPct(tco.totals.totalRoiPct)}</td>
              <td className="text-right pl-2">{fmtMonths(tco.totals.totalPayback)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <button onClick={addUseCase} className="mt-4 text-sm font-medium text-teal hover:text-teal-dark border border-teal rounded px-4 py-2">
        + Add use case
      </button>

      <h2 className="font-display text-xl font-semibold mt-14 mb-4">3. Overall Summary</h2>
      <div className="grid sm:grid-cols-4 gap-px bg-ledger border border-ledger">
        <div className="bg-paper p-5">
          <div className="text-xs font-mono uppercase text-ink/40">3-Yr Total Cost</div>
          <div className="font-display text-2xl font-semibold mt-1">{fmtMoney(tco.summary.threeYrTco)}</div>
        </div>
        <div className="bg-paper p-5">
          <div className="text-xs font-mono uppercase text-ink/40">3-Yr Total Benefit</div>
          <div className="font-display text-2xl font-semibold mt-1 text-teal">{fmtMoney(tco.summary.threeYrBenefit)}</div>
        </div>
        <div className="bg-paper p-5">
          <div className="text-xs font-mono uppercase text-ink/40">3-Yr Net Value</div>
          <div className="font-display text-2xl font-semibold mt-1">{fmtMoney(tco.summary.threeYrNetOverall)}</div>
        </div>
        <div className="bg-teal-dark text-paper p-5">
          <div className="text-xs font-mono uppercase text-paper/60">Overall 3-Yr ROI</div>
          <div className="font-display text-2xl font-semibold mt-1">{fmtPct(tco.summary.overallRoi)}</div>
        </div>
      </div>

      <div className="mt-8 h-72 bg-paper border border-ledger rounded p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={tco.cumulative} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D9E3F2" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => "$" + (v / 1000) + "k"} />
            <Tooltip formatter={(v) => fmtMoney(v)} />
            <Legend />
            <Line type="monotone" dataKey="cumulativeCost" name="Cumulative Cost" stroke="#123A73" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 4 }} />
            <Line type="monotone" dataKey="cumulativeBenefit" name="Cumulative Benefit" stroke="#2F6FE4" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
