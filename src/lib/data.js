// Aijentix AI Value & Impact assessment framework.
// Questions are deliberately written for organizations that may have no AI adoption yet.
export const PILLARS = [
  { key: "strategy", name: "Strategy & Business Alignment", blurb: "Are business priorities, pain points and AI opportunities understood?", statements: [
    "Our business has documented its most time-consuming, costly or error-prone processes.",
    "Senior leaders understand where AI could support the organization's business objectives.",
    "We have identified measurable business outcomes that AI initiatives should improve.",
    "We have a process to compare AI opportunities with non-AI process improvements.",
    "There is an executive sponsor willing to support a phased AI adoption roadmap.",
  ]},
  { key: "usecases", name: "Use Cases & Business Value", blurb: "Can the organization identify, prioritize and measure practical AI opportunities?", statements: [
    "We have identified repetitive tasks that could potentially be automated or AI-assisted.",
    "We understand the current time, labour and operating cost of priority processes.",
    "Potential AI use cases are ranked by expected savings, revenue impact and feasibility.",
    "We can define a baseline and success measures before implementing an AI solution.",
    "We have a process to validate expected benefits against actual results after deployment.",
  ]},
  { key: "data", name: "Data & Digital Foundations", blurb: "Is business information accessible, reliable and suitable for AI-enabled workflows?", statements: [
    "Important business information is stored digitally rather than only on paper or in manual files.",
    "Relevant data is accessible from our business systems through reports, exports or APIs.",
    "We understand data ownership, quality issues, duplication and missing information.",
    "Access to sensitive customer, employee and financial data is controlled appropriately.",
    "We have suitable backup, retention and data-sharing practices for future AI solutions.",
  ]},
  { key: "engineering", name: "Technology & Integration", blurb: "Can AI solutions be introduced safely into the existing technology environment?", statements: [
    "Our core business processes are supported by software systems that can be integrated or extended.",
    "Our network, devices and cloud or on-premises infrastructure can support modern digital services.",
    "We can connect systems using APIs, secure file exchange or approved integration methods.",
    "We have a way to test new software or AI tools before using them in live operations.",
    "We can monitor solution availability, performance, errors and ongoing operating costs.",
  ]},
  { key: "governance", name: "Governance, Privacy & Risk", blurb: "Are the policies and controls in place to adopt AI responsibly?", statements: [
    "We understand the privacy, confidentiality and regulatory requirements relevant to our data.",
    "Employees have clear guidance on which information may and may not be entered into public AI tools.",
    "We have a process to review AI outputs for accuracy, bias and inappropriate recommendations.",
    "Important decisions will retain appropriate human review and accountability.",
    "We can assess AI vendors for security, data handling, ownership and contractual risks.",
  ]},
  { key: "organization", name: "People, Skills & Ownership", blurb: "Are the right people available to select, implement and support AI-enabled processes?", statements: [
    "Business process owners can explain current workflows, exceptions and pain points.",
    "We have identified employees who can lead or coordinate AI adoption initiatives.",
    "Employees have access to basic digital and AI awareness training.",
    "We can allocate business and technical staff time to pilot and improve selected solutions.",
    "We have a plan to support employees whose roles or workflows may change through automation.",
  ]},
  { key: "culture", name: "Change Readiness & Adoption", blurb: "Will employees and managers adopt, trust and continuously improve AI-enabled ways of working?", statements: [
    "Managers are open to reviewing existing processes and changing how work is performed.",
    "Employees are encouraged to identify repetitive work and suggest improvement opportunities.",
    "We communicate the purpose and expected impact of automation before changes are introduced.",
    "We can collect employee and customer feedback during pilots and after rollout.",
    "We are prepared to measure adoption and continuously improve AI-supported workflows.",
  ]},
];

export const SCORING_GUIDE = [
  { score: 1, level: "Not in place", desc: "No defined capability or consistent practice exists today. Work is largely manual or informal." },
  { score: 2, level: "Early / Ad hoc", desc: "Some awareness or isolated activity exists, but practices are informal and depend on individuals." },
  { score: 3, level: "Partially established", desc: "Basic processes, ownership or tools exist, but coverage and consistency are limited." },
  { score: 4, level: "Established", desc: "The capability is documented, consistently applied, measured and supported by management." },
  { score: 5, level: "Optimized", desc: "The capability is integrated into normal operations and continuously improved using measurable outcomes." },
];

export function emptyAssessment() {
  return Object.fromEntries(PILLARS.map((p) => [p.key, p.statements.map(() => ({ current: "", target: "", notes: "" }))]));
}

export function emptyState() {
  return {
    company: { name: "", industry: "", employees: "", currency: "USD", assessmentDate: new Date().toISOString().slice(0, 10) },
    assessmentVersion: 2,
    assessmentNeedsReview: false,
    assessment: emptyAssessment(),
    useCases: [],
    tco: { costs: Object.fromEntries(["softwareOneTime", "implementation", "dataPrep", "training", "hardware", "softwareAnnual", "cloud", "maintenance", "staffing", "vendor"].map((k) => [k, ["", "", ""]])), roiUseCases: [] },
    productivity: { timeBased: [], otherBenefits: [] },
    lastUpdatedBy: "",
    lastUpdatedAt: "",
  };
}

export const TCO_COST_ROWS = [
  { key: "softwareOneTime", label: "Software / licensing (one-time)", annual: false },
  { key: "implementation", label: "Implementation & integration", annual: false },
  { key: "dataPrep", label: "Data preparation", annual: false },
  { key: "training", label: "Training & change management", annual: false },
  { key: "hardware", label: "Hardware / infrastructure (one-time)", annual: false },
  { key: "softwareAnnual", label: "Software / subscription (annual)", annual: true },
  { key: "cloud", label: "Cloud / compute costs (annual)", annual: true },
  { key: "maintenance", label: "Maintenance & support (annual)", annual: true },
  { key: "staffing", label: "Internal staffing (annual)", annual: true },
  { key: "vendor", label: "Vendor / consulting retainer (annual)", annual: true },
];
