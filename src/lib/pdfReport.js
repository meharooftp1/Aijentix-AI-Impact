import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PILLARS } from "./data";
import {
  computeResults,
  computeUseCaseReadiness,
  computeProductivity,
  computeTco,
  fmtMoney,
  fmtPct,
  fmtMonths,
} from "./calculations";

const BLUE = [18, 58, 115]; // #123A73
const INK = [14, 31, 60]; // #0E1F3C
const LIGHT = [228, 236, 249]; // #E4ECF9

function addSectionTitle(doc, title, y) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...BLUE);
  doc.text(title, 40, y);
  doc.setDrawColor(...LIGHT);
  doc.line(40, y + 4, 555, y + 4);
  return y + 20;
}

export function downloadReportPdf(state) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const results = computeResults(state.assessment);
  const readiness = computeUseCaseReadiness(state.useCases, results);
  const productivity = computeProductivity(state.productivity);
  const tco = computeTco(state.tco, productivity);

  // --- Cover ---
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, 595, 160, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("Aijentix", 40, 70);
  doc.setFontSize(15);
  doc.setFont("helvetica", "normal");
  doc.text("AI Value & Impact — Assessment Report", 40, 95);
  doc.setFontSize(10);
  doc.text(state.company?.name ? `Prepared for: ${state.company.name}` : "Organizational AI opportunity assessment", 40, 118);
  doc.text(state.company?.industry ? `Industry: ${state.company.industry}` : "", 40, 134);
  doc.text(`Generated ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`, 40, 150);

  let y = 190;
  doc.setTextColor(...INK);

  // --- Executive summary ---
  y = addSectionTitle(doc, "Executive Summary", y);
  const scoredCount = PILLARS.reduce((sum, p) => sum + (state.assessment?.[p.key] || []).filter((x) => x.current !== "" && x.current !== null && x.current !== undefined).length, 0);
  const totalCount = PILLARS.reduce((sum, p) => sum + p.statements.length, 0);
  const priorityPillar = [...results.rows].filter((r) => r.current !== "").sort((a,b) => (Number(b.gap)||0) - (Number(a.gap)||0))[0];
  doc.setFontSize(9);
  doc.text(`Assessment completion: ${scoredCount} of ${totalCount} current-state questions (${Math.round(scoredCount / totalCount * 100)}%).`, 40, y);
  y += 15;
  doc.text(`Overall current readiness: ${results.overall.current === "" ? "Not yet scored" : `${results.overall.current} / 5`}.`, 40, y);
  y += 15;
  const summaryText = priorityPillar ? `Priority capability gap: ${priorityPillar.name} (${priorityPillar.gap} points to target).` : "Priority capability gap: complete the assessment to identify improvement areas.";
  doc.text(summaryText, 40, y);
  y += 28;

  // --- Results ---
  y = addSectionTitle(doc, "1. Maturity Results by Capability Area", y);
  autoTable(doc, {
    startY: y,
    margin: { left: 40, right: 40 },
    head: [["Capability Area", "Current", "Target", "Gap", "Read"]],
    body: [
      ...results.rows.map((r) => [r.name, r.current === "" ? "—" : r.current, r.target === "" ? "—" : r.target, r.gap === "" ? "—" : r.gap, r.read]),
      ["Overall", results.overall.current === "" ? "—" : results.overall.current, results.overall.target === "" ? "—" : results.overall.target, results.overall.gap === "" ? "—" : results.overall.gap, ""],
    ],
    headStyles: { fillColor: BLUE, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 5 },
    didParseCell: (data) => {
      if (data.row.index === results.rows.length) data.cell.styles.fontStyle = "bold";
    },
  });
  y = doc.lastAutoTable.finalY + 30;

  // --- Recommended focus areas ---
  if (y > 650) { doc.addPage(); y = 50; }
  y = addSectionTitle(doc, "Recommended Focus Areas", y);
  const focusRows = [...results.rows].filter((r) => r.current !== "").sort((a,b) => (Number(b.gap)||0) - (Number(a.gap)||0)).slice(0, 4);
  autoTable(doc, {
    startY: y, margin: { left: 40, right: 40 },
    head: [["Priority", "Capability", "Current", "Target", "Suggested focus"]],
    body: focusRows.length ? focusRows.map((r, i) => [String(i + 1), r.name, r.current, r.target === "" ? "—" : r.target, `Close the ${r.name.toLowerCase()} gap through process ownership, controls and targeted capability building.`]) : [["—", "Assessment incomplete", "—", "—", "Complete current-state scoring before prioritizing investments."]],
    headStyles: { fillColor: BLUE, textColor: 255 }, styles: { fontSize: 8, cellPadding: 5 },
  });
  y = doc.lastAutoTable.finalY + 30;

  // --- Use Case Readiness ---
  if (y > 680) {
    doc.addPage();
    y = 50;
  }
  y = addSectionTitle(doc, "2. Use Case Readiness", y);
  autoTable(doc, {
    startY: y,
    margin: { left: 40, right: 40 },
    head: [["Use Case", "Weighted Readiness", "Weighted Gap", "Biggest Gap Pillar"]],
    body: readiness.map((r) => [
      r.name || "—",
      r.weightedReadiness === "" ? "—" : r.weightedReadiness,
      r.weightedGap === "" ? "—" : r.weightedGap,
      r.biggestGapPillar || "—",
    ]),
    headStyles: { fillColor: BLUE, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 5 },
  });
  y = doc.lastAutoTable.finalY + 30;

  // --- Productivity & Efficiency ---
  if (y > 620) {
    doc.addPage();
    y = 50;
  }
  y = addSectionTitle(doc, "3. Productivity & Efficiency", y);
  autoTable(doc, {
    startY: y,
    margin: { left: 40, right: 40 },
    head: [["Use Case", "Gross Capacity Value", "Potential Realized Value", "Actual Realized Value"]],
    body: productivity.rows.map((r) => [
      r.name || "—",
      fmtMoney(r.estCapacityValue),
      fmtMoney(r.estRealizedValue),
      fmtMoney(r.actualRealizedValue),
    ]),
    headStyles: { fillColor: BLUE, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 5 },
  });
  y = doc.lastAutoTable.finalY + 16;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Potential realized annual labour value: ${fmtMoney(productivity.totals.estRealizedValue)}`, 40, y);
  y += 14;
  doc.text(`Other quantifiable benefits: ${fmtMoney(productivity.totalOtherBenefits)}`, 40, y);
  y += 14;
  doc.setFont("helvetica", "bold");
  doc.text(`Total actual realized annual benefit: ${fmtMoney(productivity.totalRealizedAnnualBenefit)}`, 40, y);
  y += 30;

  // --- TCO & ROI ---
  if (y > 600) {
    doc.addPage();
    y = 50;
  }
  y = addSectionTitle(doc, "4. TCO & ROI", y);
  autoTable(doc, {
    startY: y,
    margin: { left: 40, right: 40 },
    head: [["Use Case", "Annual Cost", "Annual Benefit", "Net Annual", "3-Yr Net", "ROI %", "Payback"]],
    body: [
      ...tco.roiRows.map((r) => [
        r.name || "—",
        fmtMoney(r.annualCost),
        fmtMoney(r.annualBenefit),
        fmtMoney(r.netAnnual),
        fmtMoney(r.threeYrNet),
        fmtPct(r.roiPct),
        fmtMonths(r.paybackMonths),
      ]),
      [
        "Total",
        fmtMoney(tco.totals.totalCost),
        fmtMoney(tco.totals.totalBenefit),
        fmtMoney(tco.totals.totalNetAnnual),
        fmtMoney(tco.totals.total3yrNet),
        fmtPct(tco.totals.totalRoiPct),
        fmtMonths(tco.totals.totalPayback),
      ],
    ],
    headStyles: { fillColor: BLUE, textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 5 },
    didParseCell: (data) => {
      if (data.row.index === tco.roiRows.length) data.cell.styles.fontStyle = "bold";
    },
  });
  y = doc.lastAutoTable.finalY + 20;

  if (y > 700) {
    doc.addPage();
    y = 50;
  }
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`3-Year Total Cost of Ownership: ${fmtMoney(tco.summary.threeYrTco)}`, 40, y);
  y += 15;
  doc.text(`3-Year Total Benefit: ${fmtMoney(tco.summary.threeYrBenefit)}`, 40, y);
  y += 15;
  doc.setFont("helvetica", "bold");
  doc.text(`Overall 3-Year ROI: ${fmtPct(tco.summary.overallRoi)}  |  3-Year Net Value: ${fmtMoney(tco.summary.threeYrNetOverall)}`, 40, y);
  y += 28;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const caveat = "Important: Financial figures are scenario estimates based on user-entered assumptions. Released employee capacity is not automatically cash savings. Validate process baselines, achievable automation, adoption, implementation costs, security and human oversight before making investment decisions.";
  doc.text(doc.splitTextToSize(caveat, 515), 40, y);

  // --- Footer on every page ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Aijentix AI Value and Impact — Page ${i} of ${pageCount}`, 40, 812);
  }

  const dateStamp = new Date().toISOString().slice(0, 10);
  doc.save(`aijentix-ai-maturity-report-${dateStamp}.pdf`);
}
