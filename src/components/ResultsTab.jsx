import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { PILLARS } from "../lib/data";
import { computeResults, computeUseCaseReadiness, computeProductivity, computeTco, fmtMoney } from "../lib/calculations";

const COLORS = ["#2563eb", "#0f766e", "#f59e0b", "#8b5cf6", "#64748b", "#0891b2", "#ea580c"];
const completed = (assessment) => PILLARS.reduce((sum, p) => sum + (assessment?.[p.key] || []).filter((x) => x.current !== "" && x.current !== null && x.current !== undefined).length, 0);

function Metric({ label, value, detail, tone = "blue" }) {
  const tones = { blue: "bg-blue-50 text-blue-700", teal: "bg-teal-50 text-teal-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700" };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div><div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</div><div className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{detail}</div></div>;
}

export default function ResultsTab({ state }) {
  const results = computeResults(state.assessment || {});
  const totalQuestions = PILLARS.reduce((sum, p) => sum + p.statements.length, 0);
  const answered = completed(state.assessment || {});
  const completion = Math.round((answered / totalQuestions) * 100);
  const chartData = results.rows.map((r) => ({ name: r.name.replace(" & ", " &\n"), Current: r.current === "" ? 0 : r.current, Target: r.target === "" ? 0 : r.target }));
  const scored = results.rows.filter((r) => r.current !== "");
  const ranked = [...scored].sort((a, b) => (Number(b.gap) || 0) - (Number(a.gap) || 0));
  const strongest = [...scored].sort((a, b) => Number(b.current) - Number(a.current))[0];
  const priority = ranked[0];
  const maturityLabel = results.overall.current === "" ? "Not assessed" : results.overall.current < 2 ? "Foundational" : results.overall.current < 3 ? "Developing" : results.overall.current < 4 ? "Established" : "Advanced";
  const readiness = computeUseCaseReadiness(state.useCases || [], results);
  const productivity = computeProductivity(state.productivity || { timeBased: [], otherBenefits: [] });
  const tco = computeTco(state.tco || { costs: {}, roiUseCases: [] }, productivity);
  const estimatedCapacity = productivity.totals.estCapacityValue;
  const estimatedCostReduction = productivity.totals.estRealizedValue;
  const hasEstimate = (state.productivity?.timeBased || []).some((r) => [r.employees, r.estHrsSaved, r.adoptionRate, r.hourlyCost, r.workingWeeks, r.realizationRate].every((v) => v !== "" && v !== null && v !== undefined));
  const useCaseRanked = readiness.map((r, i) => ({ ...r, name: state.useCases?.[i]?.name || r.name })).filter((r) => r.name && r.weightedReadiness !== "").sort((a, b) => (Number(b.weightedGap) || 0) - (Number(a.weightedGap) || 0));

  return <div className="space-y-8">
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div><p className="text-xs font-semibold tracking-[0.2em] text-blue-700 uppercase mb-3">02 — Executive view</p><h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950">AI Opportunity Dashboard</h1><p className="mt-3 max-w-2xl text-slate-600 leading-relaxed">A decision-oriented view of business readiness, capability gaps and the financial value currently modeled for AI adoption.</p></div>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">{state.company?.name || "Company not specified"}<div className="font-medium text-slate-800">{state.company?.assessmentDate || "Assessment date not set"}</div></div>
    </div>

    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <Metric label="Assessment completion" value={`${completion}%`} detail={`${answered} of ${totalQuestions} current scores`} tone="blue" />
      <Metric label="Current readiness" value={results.overall.current === "" ? "—" : `${results.overall.current}/5`} detail={maturityLabel} tone="teal" />
      <Metric label="Priority capability gap" value={priority ? priority.gap : "—"} detail={priority ? priority.name : "Complete the assessment"} tone="amber" />
      <Metric label="Potential annual cost reduction" value={hasEstimate ? fmtMoney(estimatedCostReduction) : "—"} detail={hasEstimate ? "Estimated realized value from time saved" : "Add process and labour assumptions"} tone="violet" />
    </div>

    <div className="grid xl:grid-cols-[1.6fr_1fr] gap-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm min-w-0"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900 text-lg">Capability readiness</h2><p className="text-sm text-slate-500 mt-1">Current position compared with desired target (1–5).</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">7 capability areas</span></div>
        <div className="h-[340px] mt-5"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 10, left: -18, bottom: 55 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} interval={0} angle={-24} textAnchor="end" height={75} /><YAxis domain={[0, 5]} ticks={[0,1,2,3,4,5]} tick={{ fontSize: 11, fill: "#64748b" }} /><Tooltip /><Legend /><Bar dataKey="Current" fill="#2563eb" radius={[5,5,0,0]} /><Bar dataKey="Target" fill="#14b8a6" radius={[5,5,0,0]} /></BarChart></ResponsiveContainer></div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"><h2 className="font-semibold text-slate-900 text-lg">Assessment coverage</h2><p className="text-sm text-slate-500 mt-1">How much of the current-state assessment is complete.</p><div className="h-52 mt-3"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{name:"Answered",value:answered},{name:"Remaining",value:totalQuestions-answered}]} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={4}><Cell fill="#2563eb"/><Cell fill="#e2e8f0"/></Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="text-center -mt-1"><div className="text-3xl font-semibold text-slate-950">{completion}%</div><div className="text-xs text-slate-500">questions scored</div></div><div className="mt-5 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-blue-600" style={{width:`${completion}%`}} /></div></section>
    </div>

    <div className="grid lg:grid-cols-2 gap-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"><h2 className="font-semibold text-slate-900 text-lg">Where to focus first</h2><p className="text-sm text-slate-500 mt-1">Largest current-to-target gaps indicate capability areas to strengthen before scaling AI.</p><div className="mt-5 space-y-4">{ranked.slice(0,4).map((r,i)=><div key={r.key}><div className="flex justify-between gap-3 text-sm"><span className="font-medium text-slate-800">{i+1}. {r.name}</span><span className="font-semibold text-amber-700">{r.gap} gap</span></div><div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-amber-500" style={{width:`${Math.max(0,Math.min(100,(Number(r.gap)||0)/4*100))}%`}} /></div><div className="mt-1 text-xs text-slate-500">Current {r.current}/5 · Target {r.target}/5 · {r.read}</div></div>)}{!ranked.length && <p className="text-sm text-slate-500 py-6">Score the assessment to reveal the priority capability gaps.</p>}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"><h2 className="font-semibold text-slate-900 text-lg">Executive observations</h2><div className="mt-4 space-y-3">{priority ? <div className="rounded-xl bg-amber-50 border border-amber-100 p-4"><div className="text-xs font-semibold uppercase tracking-wider text-amber-800">Priority improvement area</div><p className="mt-1 text-sm text-amber-950">{priority.name} has the largest target gap ({priority.gap}). Validate the underlying process constraints and define a practical improvement plan.</p></div> : <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-950">Complete current-state scores to generate evidence-based observations.</div>}{strongest && <div className="rounded-xl bg-teal-50 border border-teal-100 p-4"><div className="text-xs font-semibold uppercase tracking-wider text-teal-800">Existing strength</div><p className="mt-1 text-sm text-teal-950">{strongest.name} is currently the strongest area at {strongest.current}/5. Consider using this capability to support early AI pilots.</p></div>}<div className="rounded-xl bg-slate-50 border border-slate-200 p-4"><div className="text-xs font-semibold uppercase tracking-wider text-slate-600">Financial model status</div><p className="mt-1 text-sm text-slate-700">{hasEstimate ? `Modeled annual labour cost reduction is ${fmtMoney(estimatedCostReduction)} after applying the realization assumption. Gross released-capacity value is ${fmtMoney(estimatedCapacity)}; neither figure is guaranteed cash savings.` : "No productivity assumptions have been entered yet. Add employee counts, hours saved, adoption, loaded hourly cost and realization rate to model potential value."}</p></div></div></section>
    </div>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"><div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2"><div><h2 className="font-semibold text-slate-900 text-lg">AI use-case readiness</h2><p className="text-sm text-slate-500 mt-1">Weighted readiness and capability gaps for the opportunities you have entered.</p></div><div className="text-xs text-slate-500">3-year modeled TCO: <strong className="text-slate-800">{fmtMoney(tco.summary.threeYrTco)}</strong></div></div>{useCaseRanked.length ? <div className="mt-4 grid md:grid-cols-2 xl:grid-cols-3 gap-3">{useCaseRanked.slice(0,6).map((u,i)=><div key={`${u.name}-${i}`} className="rounded-xl border border-slate-200 p-4"><div className="text-xs uppercase tracking-wider text-slate-500">Opportunity {i+1}</div><div className="mt-1 font-semibold text-slate-900">{u.name}</div><div className="mt-3 flex gap-5 text-sm"><div><div className="text-xs text-slate-500">Readiness</div><strong>{u.weightedReadiness}/5</strong></div><div><div className="text-xs text-slate-500">Weighted gap</div><strong className="text-amber-700">{u.weightedGap}</strong></div></div><div className="mt-2 text-xs text-slate-500">Key dependency: {u.biggestGapPillar || "Not identified"}</div></div>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">Add candidate processes in Use Case Readiness to compare which AI opportunities are best aligned with current capabilities.</div>}</section>
    <p className="text-xs text-slate-400 leading-relaxed">Potential cost reduction is estimated from employee count × hours saved per week × adoption rate × working weeks × loaded hourly cost × realization rate. It is a scenario, not guaranteed cash savings. Validate process baselines, achievable automation, adoption, implementation costs and human-review requirements before investment decisions.</p>
  </div>;
}
