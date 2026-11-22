import { PILLARS } from "./data";

const n = (v) => (v === "" || v === null || v === undefined || isNaN(v) ? 0 : Number(v));
const hasVal = (v) => v !== "" && v !== null && v !== undefined;

// ---- Assessment / Results ----
export function computeResults(assessment) {
  const rows = PILLARS.map((p) => {
    const entries = assessment[p.key] || [];
    const currentVals = entries.map((e) => e.current).filter(hasVal).map(Number);
    const targetVals = entries.map((e) => e.target).filter(hasVal).map(Number);
    const avg = (arr) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : "");
    const current = avg(currentVals);
    const target = avg(targetVals);
    const gap = hasVal(current) && hasVal(target) ? Math.round((target - current) * 10) / 10 : "";
    let read = "Awaiting scores";
    if (hasVal(gap)) {
      if (gap <= 0) read = "On track";
      else if (gap < 1) read = "Minor gap";
      else if (gap < 2) read = "Moderate gap";
      else read = "Priority gap";
    }
    return { key: p.key, name: p.name, current, target, gap, read };
  });

  const validCurrent = rows.map((r) => r.current).filter(hasVal);
  const validTarget = rows.map((r) => r.target).filter(hasVal);
  const overallCurrent = validCurrent.length ? Math.round((validCurrent.reduce((a, b) => a + b, 0) / validCurrent.length) * 10) / 10 : "";
  const overallTarget = validTarget.length ? Math.round((validTarget.reduce((a, b) => a + b, 0) / validTarget.length) * 10) / 10 : "";
  const overallGap = hasVal(overallCurrent) && hasVal(overallTarget) ? Math.round((overallTarget - overallCurrent) * 10) / 10 : "";

  return { rows, overall: { current: overallCurrent, target: overallTarget, gap: overallGap } };
}

// ---- Use Case Readiness ----
export function computeUseCaseReadiness(useCases, results) {
  const currentByKey = {};
  const gapByKey = {};
  PILLARS.forEach((p) => {
    const row = results.rows.find((r) => r.key === p.key);
    currentByKey[p.key] = n(row?.current);
    gapByKey[p.key] = n(row?.gap);
  });

  return useCases.map((uc) => {
    const weightSum = PILLARS.reduce((sum, p) => sum + n(uc.weights[p.key]), 0);
    if (weightSum === 0) {
      return { name: uc.name, weightedReadiness: "", weightedGap: "", biggestGapPillar: "" };
    }
    let readinessSum = 0;
    let gapSum = 0;
    let biggestGapVal = -Infinity;
    let biggestGapPillar = "";
    PILLARS.forEach((p) => {
      const w = n(uc.weights[p.key]);
      readinessSum += w * currentByKey[p.key];
      const weightedGapContribution = w * gapByKey[p.key];
      gapSum += weightedGapContribution;
      if (weightedGapContribution > biggestGapVal) {
        biggestGapVal = weightedGapContribution;
        biggestGapPillar = p.name;
      }
    });
    return {
      name: uc.name,
      weightedReadiness: Math.round((readinessSum / weightSum) * 10) / 10,
      weightedGap: Math.round((gapSum / weightSum) * 10) / 10,
      biggestGapPillar,
    };
  });
}

// ---- Productivity & Efficiency ----
export function computeProductivity(productivity) {
  const rows = productivity.timeBased.map((r) => {
    const { employees: c, estHrsSaved: d, actualHrsSaved: e, reworkHrs: f, adoptionRate: g, hourlyCost: h, workingWeeks: i, realizationRate: j } = r;
    const canEst = hasVal(c) && hasVal(d) && hasVal(g) && hasVal(h) && hasVal(i);
    const canActual = hasVal(c) && hasVal(e) && hasVal(g) && hasVal(h) && hasVal(i);
    const estCapacityValue = canEst ? n(c) * n(d) * n(g) * n(i) * n(h) : "";
    const actualNetCapacityValue = canActual ? n(c) * Math.max(n(e) - n(f), 0) * n(g) * n(i) * n(h) : "";
    const variance = hasVal(estCapacityValue) && hasVal(actualNetCapacityValue) ? actualNetCapacityValue - estCapacityValue : "";
    const estRealizedValue = hasVal(estCapacityValue) && hasVal(j) ? estCapacityValue * n(j) : "";
    const actualRealizedValue = hasVal(actualNetCapacityValue) && hasVal(j) ? actualNetCapacityValue * n(j) : "";
    return { ...r, estCapacityValue, estRealizedValue, actualNetCapacityValue, variance, actualRealizedValue };
  });

  const totalTimeBasedRealized = rows.reduce((sum, r) => sum + n(r.actualRealizedValue), 0);
  const totalOtherBenefits = productivity.otherBenefits.reduce((sum, b) => sum + n(b.value), 0);
  const totalRealizedAnnualBenefit = totalTimeBasedRealized + totalOtherBenefits;

  return {
    rows,
    totals: {
      estCapacityValue: rows.reduce((sum, r) => sum + n(r.estCapacityValue), 0),
      estRealizedValue: rows.reduce((sum, r) => sum + n(r.estRealizedValue), 0),
      actualNetCapacityValue: rows.reduce((sum, r) => sum + n(r.actualNetCapacityValue), 0),
      variance: rows.reduce((sum, r) => sum + n(r.variance), 0),
      actualRealizedValue: totalTimeBasedRealized,
    },
    totalOtherBenefits,
    totalRealizedAnnualBenefit,
  };
}

// ---- TCO & ROI ----
export function computeTco(tco, productivityResult) {
  const yearTotal = (arr) => [0, 1, 2].map((yr) => TCO_COST_KEYS.reduce((sum, key) => sum + n(tco.costs[key]?.[yr]), 0));
  const totals = yearTotal();
  const threeYrTotal = totals.reduce((a, b) => a + b, 0);

  const rowTotals = {};
  TCO_COST_KEYS.forEach((key) => {
    const vals = tco.costs[key] || [0, 0, 0];
    rowTotals[key] = vals.reduce((a, b) => a + n(b), 0);
  });

  // Benefit lookup by use case name from productivity's actual realized value (per use case)
  const benefitByName = {};
  productivityResult.rows.forEach((r) => {
    if (hasVal(r.actualRealizedValue)) benefitByName[r.name] = r.actualRealizedValue;
  });

  const roiRows = tco.roiUseCases.map((uc) => {
    const cost = uc.annualCost;
    const benefit = benefitByName[uc.name];
    const netAnnual = hasVal(cost) && hasVal(benefit) ? n(benefit) - n(cost) : "";
    const threeYrNet = hasVal(netAnnual) ? netAnnual * 3 : "";
    const roiPct = hasVal(cost) && n(cost) !== 0 && hasVal(netAnnual) ? netAnnual / cost : "";
    const paybackMonths = hasVal(benefit) && n(benefit) !== 0 ? cost / (n(benefit) / 12) : "";
    return { name: uc.name, annualCost: cost, annualBenefit: benefit ?? "", netAnnual, threeYrNet, roiPct, paybackMonths };
  });

  const totalCost = roiRows.reduce((sum, r) => sum + n(r.annualCost), 0);
  const totalBenefit = roiRows.reduce((sum, r) => sum + n(r.annualBenefit), 0);
  const totalNetAnnual = roiRows.reduce((sum, r) => sum + n(r.netAnnual), 0);
  const total3yrNet = roiRows.reduce((sum, r) => sum + n(r.threeYrNet), 0);
  const totalRoiPct = totalCost !== 0 ? totalNetAnnual / totalCost : "";
  const totalPayback = totalBenefit !== 0 ? totalCost / (totalBenefit / 12) : "";

  const tcoYear1 = rowTotals ? [0, 1, 2].map((yr) => TCO_COST_KEYS.reduce((sum, key) => sum + n(tco.costs[key]?.[yr]), 0)) : [0, 0, 0];
  const threeYrTco = tcoYear1.reduce((a, b) => a + b, 0);
  const threeYrBenefit = totalBenefit * 3;
  const threeYrNetOverall = threeYrBenefit - threeYrTco;
  const overallRoi = threeYrTco !== 0 ? threeYrNetOverall / threeYrTco : "";

  const cumulative = [1, 2, 3].map((yr) => {
    const cumCost = tcoYear1.slice(0, yr).reduce((a, b) => a + b, 0);
    const cumBenefit = totalBenefit * yr;
    return { year: `Year ${yr}`, cumulativeCost: cumCost, cumulativeBenefit: cumBenefit };
  });

  return {
    yearTotals: tcoYear1,
    threeYrTco,
    rowTotals,
    roiRows,
    totals: { totalCost, totalBenefit, totalNetAnnual, total3yrNet, totalRoiPct, totalPayback },
    summary: { threeYrTco, threeYrBenefit, threeYrNetOverall, overallRoi },
    cumulative,
  };
}

export const TCO_COST_KEYS = [
  "softwareOneTime",
  "implementation",
  "dataPrep",
  "training",
  "hardware",
  "softwareAnnual",
  "cloud",
  "maintenance",
  "staffing",
  "vendor",
];

export const fmtMoney = (v) => (hasVal(v) ? "$" + Math.round(Number(v)).toLocaleString() : "—");
export const fmtPct = (v) => (hasVal(v) ? (Number(v) * 100).toFixed(0) + "%" : "—");
export const fmtNum = (v) => (hasVal(v) ? Number(v).toLocaleString() : "—");
export const fmtMonths = (v) => (hasVal(v) && isFinite(v) ? Number(v).toFixed(1) + " mo" : "—");
