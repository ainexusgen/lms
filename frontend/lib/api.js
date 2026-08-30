"use client";

export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("lms_token");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(sessionStorage.getItem("lms_user") || "null"); }
  catch { return null; }
}

export function setSession(token, user) {
  sessionStorage.setItem("lms_token", token);
  sessionStorage.setItem("lms_user", JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem("lms_token");
  sessionStorage.removeItem("lms_user");
}

export async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}/api${path}`, { ...opts, headers });
  if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/auth")) {
    clearSession();
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
  return data;
}
