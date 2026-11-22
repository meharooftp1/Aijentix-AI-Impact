const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const TOKEN_KEY = "aijentix.accessToken";
const USER_KEY = "aijentix.user";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); };
export const getSavedUser = () => { try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; } };

async function request(path, options = {}) {
  const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 204) return null;
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    const message = payload?.message || payload?.title || (typeof payload === "string" ? payload : `Request failed (${response.status})`);
    throw new Error(message);
  }
  return payload;
}
const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const api = {
  login: async (email, password) => { const result = await request("/api/auth/login", json("POST", { email, password })); setToken(result.token); localStorage.setItem(USER_KEY, JSON.stringify(result.user)); return result; },
  logout: () => clearToken(),
  companies: (includeInactive = false) => request(`/api/companies${includeInactive ? "?includeInactive=true" : ""}`),
  createCompany: (body) => request("/api/companies", json("POST", body)),
  updateCompany: (id, body) => request(`/api/companies/${id}`, json("PUT", body)),
  deactivateCompany: (id) => request(`/api/companies/${id}`, { method: "DELETE" }),
  members: (companyId) => request(`/api/companies/${companyId}/members`),
  createUser: (companyId, body) => request(`/api/companies/${companyId}/users`, json("POST", body)),
  addMember: (companyId, body) => request(`/api/companies/${companyId}/members`, json("POST", body)),
  updateMember: (companyId, userId, body) => request(`/api/companies/${companyId}/members/${userId}`, json("PUT", body)),
  removeMember: (companyId, userId) => request(`/api/companies/${companyId}/members/${userId}`, { method: "DELETE" }),
  assessments: (companyId) => request(`/api/companies/${companyId}/assessments`),
  assessment: (companyId, id) => request(`/api/companies/${companyId}/assessments/${id}`),
  createAssessment: (companyId, body) => request(`/api/companies/${companyId}/assessments`, json("POST", body)),
  updateAssessment: (companyId, id, body) => request(`/api/companies/${companyId}/assessments/${id}`, json("PUT", body)),
  history: (companyId, id) => request(`/api/companies/${companyId}/assessments/${id}/history`),
  historyVersion: (companyId, id, version) => request(`/api/companies/${companyId}/assessments/${id}/history/${version}`),
  restoreVersion: (companyId, id, version) => request(`/api/companies/${companyId}/assessments/${id}/history/${version}/restore`, { method: "POST" }),
};
