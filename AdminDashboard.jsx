import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5001";
const SESSION_KEY = "ad_tok";
const SESSION_SIG = "ad_sig";
const SESSION_EXP = "ad_exp";
const SESSION_TTL = 30 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const ATTEMPT_KEY = "ad_att";
const LOCKOUT_KEY = "ad_lck";

async function sha256(msg) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(msg),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateNonce(len = 32) {
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  return Array.from(a)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function sessionValid() {
  const token = sessionStorage.getItem(SESSION_KEY);
  const sig = sessionStorage.getItem(SESSION_SIG);
  const exp = sessionStorage.getItem(SESSION_EXP);
  if (!token || !sig || !exp) return false;
  if (Date.now() > parseInt(exp, 10)) {
    clearSession();
    return false;
  }
  return token.length === 64 && sig === btoa(token.slice(0, 16));
}

async function createSession() {
  const token = generateNonce(32);
  const hash = await sha256(token + navigator.userAgent);
  sessionStorage.setItem(SESSION_KEY, hash);
  sessionStorage.setItem(SESSION_SIG, btoa(hash.slice(0, 16)));
  sessionStorage.setItem(SESSION_EXP, String(Date.now() + SESSION_TTL));
}

function clearSession() {
  [SESSION_KEY, SESSION_SIG, SESSION_EXP].forEach((k) =>
    sessionStorage.removeItem(k),
  );
}

function isLockedOut() {
  const lck = localStorage.getItem(LOCKOUT_KEY);
  if (!lck) return false;
  if (Date.now() > parseInt(lck, 10)) {
    localStorage.removeItem(LOCKOUT_KEY);
    localStorage.removeItem(ATTEMPT_KEY);
    return false;
  }
  return true;
}

function recordFailedAttempt() {
  const n = parseInt(localStorage.getItem(ATTEMPT_KEY) || "0", 10) + 1;
  localStorage.setItem(ATTEMPT_KEY, String(n));
  if (n >= MAX_ATTEMPTS) {
    localStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_MS));
    localStorage.removeItem(ATTEMPT_KEY);
  }
  return n;
}

function clearAttempts() {
  localStorage.removeItem(ATTEMPT_KEY);
  localStorage.removeItem(LOCKOUT_KEY);
}

function remainingLockout() {
  const lck = localStorage.getItem(LOCKOUT_KEY);
  return lck
    ? Math.max(0, Math.ceil((parseInt(lck, 10) - Date.now()) / 60000))
    : 0;
}

const authClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true,
});
authClient.interceptors.request.use((cfg) => {
  const tok = sessionStorage.getItem(SESSION_KEY);
  if (tok) cfg.headers["X-Admin-Token"] = tok;
  cfg.headers["X-Requested-With"] = "XMLHttpRequest";
  return cfg;
});
authClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) clearSession();
    return Promise.reject(err);
  },
);

function mediaUrl(path) {
  if (path == null || path === "") return "";
  let p = String(path).trim();
  if (/^https?:\/\//i.test(p)) return p;
  p = p.replace(/\\/g, "/");
  const absStorage = p.search(/[/]storage[/]/i);
  if (absStorage >= 0) {
    p = p.slice(absStorage + "/storage/".length).replace(/^\/+/, "");
  } else {
    p = p.replace(/^\/+/, "");
  }
  if (!p) return "";
  if (p.startsWith("storage/")) return `${API_BASE}/${p}`;
  return `${API_BASE}/storage/${p}`;
}

function fileExtensionFromPath(p) {
  if (p == null || p === "") return "";
  const m = String(p).trim().match(/\.([a-z0-9]{2,8})$/i);
  return m ? `.${m[1].toLowerCase()}` : "";
}

function preferredDownloadName(path, filename) {
  const ext = fileExtensionFromPath(path);
  if (!ext) return filename;
  const base = String(filename).replace(/\.[a-z0-9]+$/i, "");
  return base + ext;
}

/** All identity document slots for the grid (includes missing uploads). */
function buildDocumentSlots(sel) {
  if (!sel) return [];
  const slots = [];
  if (sel.proof_status !== "Not Required") {
    slots.push({ title: "Purpose Proof", path: sel.purpose_proof_path });
  }
  slots.push(
    { title: "Live Selfie", path: sel.path_selfie_live },
    { title: "Aadhaar Front", path: sel.path_aadhaar_front },
    { title: "Aadhaar Back", path: sel.path_aadhaar_back },
    { title: "PAN Card", path: sel.path_pan_card },
  );
  return slots;
}

/** Only uploads with a resolvable URL — used for the lightbox carousel. */
function buildDocumentItems(sel) {
  return buildDocumentSlots(sel).filter((item) => mediaUrl(item.path));
}

function badgeClass(val, type) {
  if (type === "proof") {
    if (val === "Approved") return "badge-green";
    if (val === "Rejected") return "badge-red";
    if (val === "Not Required") return "badge-gray";
    return "badge-amber";
  }
  if (val === "Verified") return "badge-green";
  if (val === "Rejected") return "badge-red";
  return "badge-amber";
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --blue:      #2563eb;
  --blue-dk:   #1d4ed8;
  --blue-bg:   #eff6ff;
  --green:     #16a34a;
  --green-bg:  #f0fdf4;
  --amber:     #d97706;
  --amber-bg:  #fffbeb;
  --red:       #dc2626;
  --red-bg:    #fef2f2;
  --gray:      #64748b;
  --gray-bg:   #f1f5f9;
  --gray-text: #94a3b8;
  --navy:      #0f172a;
  --slate:     #1e293b;
  --border:    #e2e8f0;
  --surface:   #f8fafc;
  --white:     #ffffff;
  --font:      'Inter', -apple-system, sans-serif;
  --r:         12px;
  --sh-sm:     0 1px 3px rgba(0,0,0,0.07);
  --sh:        0 4px 16px rgba(0,0,0,0.09);
  --sh-lg:     0 20px 48px rgba(0,0,0,0.18);
}

body { font-family: var(--font); background: #f1f5f9; -webkit-font-smoothing: antialiased; }

.lp-root {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  font-family: var(--font);
}
@media (max-width: 768px) {
  .lp-root { grid-template-columns: 1fr; min-height: 100dvh; }
  .lp-left { display: none !important; }
  .lp-right { padding: 28px 20px 40px; }
  .lp-card h1 { font-size: 24px; }
}

.lp-left {
  background: linear-gradient(145deg, #0b1224 0%, #1a3560 55%, #0b1224 100%);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 56px 48px; position: relative; overflow: hidden;
}
.lp-left::before {
  content: '';
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 25% 35%, rgba(37,99,235,0.28) 0%, transparent 55%),
    radial-gradient(circle at 78% 72%, rgba(37,99,235,0.14) 0%, transparent 45%);
}
.lp-left-inner { position: relative; z-index: 1; max-width: 340px; }
.lp-logo-wrap {
  width: 68px; height: 68px; border-radius: 20px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 28px;
  box-shadow: 0 8px 32px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.15);
}
.lp-left h2 {
  font-size: 34px; font-weight: 800; color: #fff;
  letter-spacing: -0.025em; line-height: 1.15; margin-bottom: 14px;
}
.lp-left p { font-size: 15px; color: rgba(255,255,255,0.5); line-height: 1.65; }
.lp-features { margin-top: 44px; display: flex; flex-direction: column; gap: 16px; }
.lp-feat {
  display: flex; align-items: center; gap: 14px;
  color: rgba(255,255,255,0.7); font-size: 13.5px; font-weight: 500;
}
.lp-feat-icon {
  width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
}
.lp-dots {
  display: flex; gap: 8px; margin-top: 52px;
}
.lp-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(255,255,255,0.2);
}
.lp-dot.active { background: var(--blue); width: 24px; border-radius: 4px; }

.lp-right {
  background: var(--white);
  display: flex; align-items: center; justify-content: center;
  padding: 40px 32px;
}
.lp-card { width: 100%; max-width: 408px; }

.lp-top-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 20px;
  background: var(--blue-bg); border: 1px solid #bfdbfe;
  color: var(--blue); font-size: 11px; font-weight: 600;
  letter-spacing: 0.05em; text-transform: uppercase;
  margin-bottom: 26px;
}
.lp-card h1 {
  font-size: 29px; font-weight: 800; color: var(--navy);
  letter-spacing: -0.025em; margin-bottom: 8px;
}
.lp-card .lp-sub {
  font-size: 14px; color: var(--gray); margin-bottom: 30px; line-height: 1.55;
}

.lp-field { margin-bottom: 18px; }
.lp-label {
  display: block; font-size: 13px; font-weight: 600;
  color: var(--slate); margin-bottom: 7px;
}
.lp-input-wrap { position: relative; }
.lp-icon {
  position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
  color: #94a3b8; pointer-events: none; display: flex; align-items: center;
}
.lp-input {
  width: 100% !important;
  height: 50px !important;
  display: block !important;
  padding: 0 14px 0 42px !important;
  background: var(--surface) !important;
  border: 1.5px solid var(--border) !important;
  border-radius: var(--r) !important;
  font-size: 14.5px !important;
  font-family: var(--font) !important;
  color: var(--slate) !important;
  outline: none !important;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s !important;
  -webkit-appearance: none;
  appearance: none;
  box-sizing: border-box !important;
}
.lp-input::placeholder { color: #b0bec5 !important; }
.lp-input:focus {
  border-color: var(--blue) !important;
  box-shadow: 0 0 0 3.5px rgba(37,99,235,0.13) !important;
  background: var(--white) !important;
}
.lp-input:disabled { opacity: 0.5; cursor: not-allowed; }
.lp-input.with-eye { padding-right: 46px !important; }

.lp-eye {
  position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: #94a3b8; display: flex; align-items: center; padding: 4px;
  border-radius: 6px; transition: color 0.15s;
}
.lp-eye:hover { color: var(--slate); }

.lp-submit {
  width: 100% !important; height: 50px !important; margin-top: 6px !important;
  background: var(--blue) !important; color: #fff !important;
  border: none !important; border-radius: var(--r) !important;
  cursor: pointer !important; font-family: var(--font) !important;
  font-size: 14.5px !important; font-weight: 700 !important;
  letter-spacing: 0.01em !important;
  display: flex !important; align-items: center !important; justify-content: center !important;
  gap: 8px !important;
  box-shadow: 0 4px 16px rgba(37,99,235,0.38) !important;
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s !important;
}
.lp-submit:hover:not(:disabled) {
  background: var(--blue-dk) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 20px rgba(37,99,235,0.42) !important;
}
.lp-submit:active:not(:disabled) { transform: translateY(0) !important; }
.lp-submit:disabled { background: var(--border) !important; color: #94a3b8 !important; box-shadow: none !important; cursor: not-allowed !important; }

.lp-alert {
  border-radius: var(--r); padding: 12px 14px;
  font-size: 13px; margin-bottom: 18px;
  display: flex; align-items: flex-start; gap: 10px; line-height: 1.5;
}
.lp-alert.err  { background: var(--red-bg);   border: 1px solid #fecaca; color: #b91c1c; }
.lp-alert.warn { background: var(--amber-bg); border: 1px solid #fde68a; color: #92400e; }

.lp-footer {
  margin-top: 26px; padding-top: 20px; border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center; gap: 7px;
  font-size: 12px; color: #94a3b8;
}

.d-root { min-height: 100vh; background: #f1f5f9; font-family: var(--font); min-height: 100dvh; }

.d-session-bar {
  background: var(--amber-bg); border-bottom: 1px solid #fde68a;
  padding: 9px 16px; font-size: 12.5px; font-weight: 500; color: #92400e;
  display: flex; align-items: center; gap: 8px; justify-content: center;
  text-align: center; line-height: 1.45;
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
}

.d-header {
  position: sticky; top: 0; z-index: 100;
  background: rgba(255,255,255,0.93); backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  padding: 0 max(16px, env(safe-area-inset-left)) 0 max(16px, env(safe-area-inset-right));
  min-height: 62px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  flex-wrap: wrap;
  padding-top: max(0px, env(safe-area-inset-top));
}
.d-brand {
  display: flex; align-items: center; gap: 10px; flex-shrink: 0;
  font-size: 15px; font-weight: 800; color: var(--navy); letter-spacing: -0.01em;
}
.d-brand-dot {
  width: 34px; height: 34px; border-radius: 10px;
  background: linear-gradient(135deg, var(--blue), var(--blue-dk));
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(37,99,235,0.35);
}
.d-brand-accent { color: var(--blue); }
.d-header-r {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  flex: 1; justify-content: flex-end; min-width: 0;
}
.d-header-actions {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
}

.d-search-wrap { position: relative; }
.d-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #94a3b8; display: flex; }
.d-search {
  height: 40px; background: var(--surface); border: 1.5px solid var(--border);
  border-radius: 10px; padding: 0 14px 0 36px;
  font-size: 13px; font-family: var(--font); color: var(--slate);
  outline: none; width: min(280px, 100%); max-width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.d-search:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); background: #fff; }
.d-search::placeholder { color: #b0bec5; }

.hbtn {
  height: 37px; padding: 0 14px; border-radius: 9px; border: none; cursor: pointer;
  font-family: var(--font); font-size: 12.5px; font-weight: 600;
  display: flex; align-items: center; gap: 6px;
  transition: background 0.15s, transform 0.1s;
}
.hbtn:active { transform: scale(0.97); }
.hbtn.ghost  { background: var(--surface); color: var(--slate); border: 1.5px solid var(--border); }
.hbtn.ghost:hover { background: #edf0f5; }
.hbtn.danger { background: #fef2f2; color: var(--red); border: 1.5px solid #fecaca; }
.hbtn.danger:hover { background: #fee2e2; }
.hbtn.primary { background: var(--blue); color: #fff; box-shadow: 0 2px 8px rgba(37,99,235,0.25); }
.hbtn.primary:hover { background: var(--blue-dk); }
.hbtn:disabled { opacity: 0.45; cursor: not-allowed; }

.d-tabbar {
  display: flex; gap: 4px; padding: 0 16px;
  background: var(--surface); border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.d-tab {
  padding: 12px 16px; border: none; background: transparent;
  font-family: var(--font); font-size: 13px; font-weight: 600;
  color: var(--gray); cursor: pointer;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
}
.d-tab:hover { color: var(--slate); }
.d-tab.active { color: var(--blue); border-bottom-color: var(--blue); }

.ib-root { max-width: 1100px; margin: 0 auto; }
.ib-hero {
  background: linear-gradient(135deg, #eff6ff 0%, #fff 100%);
  border: 1px solid var(--border); border-radius: var(--r);
  padding: 22px 24px; margin-bottom: 20px; box-shadow: var(--sh-sm);
}
.ib-hero h2 { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 8px; }
.ib-hero p { font-size: 13.5px; color: var(--gray); line-height: 1.55; max-width: 760px; }
.ib-form-wrap {
  background: var(--white); border: 1px solid var(--border);
  border-radius: var(--r); padding: 22px; box-shadow: var(--sh-sm); margin-bottom: 22px;
}
.ib-section { margin-bottom: 22px; }
.ib-section h3 {
  font-size: 13px; font-weight: 700; color: var(--navy);
  margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;
}
.ib-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px 16px;
}
.ib-field label {
  display: block; font-size: 11.5px; font-weight: 600;
  color: var(--slate); margin-bottom: 6px;
}
.ib-field input, .ib-field textarea {
  width: 100%; padding: 10px 12px;
  border: 1.5px solid var(--border); border-radius: 10px;
  font-family: var(--font); font-size: 13px; color: var(--navy);
}
.ib-field textarea { min-height: 72px; resize: vertical; }
.ib-field input:focus, .ib-field textarea:focus {
  outline: none; border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
}
.ib-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
.ib-list-card {
  background: var(--white); border: 1px solid var(--border);
  border-radius: var(--r); overflow: hidden; box-shadow: var(--sh-sm);
}
.ib-list-card h3 {
  padding: 16px 18px; font-size: 14px; font-weight: 700;
  border-bottom: 1px solid var(--border);
}
.ib-table-wrap { overflow-x: auto; }
.ib-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.ib-table th, .ib-table td {
  padding: 12px 14px; text-align: left; border-bottom: 1px solid var(--border);
}
.ib-table th { background: var(--gray-bg); font-weight: 600; color: var(--slate); }
.ib-table tr:hover td { background: #fafbfd; }
.ib-small { font-size: 12px; color: var(--gray); }
.ib-btn-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.ib-btn-del {
  padding: 6px 10px; font-size: 12px; font-weight: 600;
  border: none; border-radius: 8px;
  background: #fef2f2; color: var(--red); cursor: pointer; font-family: var(--font);
}
.ib-btn-del:hover { background: #fee2e2; }
.ib-btn-dl {
  padding: 6px 10px; font-size: 12px; font-weight: 600;
  border: none; border-radius: 8px;
  background: var(--blue-bg); color: var(--blue); cursor: pointer; font-family: var(--font);
}
.ib-btn-dl:hover { background: #dbeafe; }

.pm-select {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  font-family: var(--font);
  font-size: 13px;
  color: var(--navy);
  background: #fff;
}
.pm-select:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.d-body {
  max-width: 1440px; margin: 0 auto;
  padding: 24px max(16px, env(safe-area-inset-left)) 56px max(16px, env(safe-area-inset-right));
  padding-bottom: max(56px, env(safe-area-inset-bottom));
}

.d-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;
}
@media (max-width: 900px) { .d-stats { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .d-stats { grid-template-columns: 1fr; gap: 12px; } }

.d-stat {
  background: var(--white); border: 1px solid var(--border); border-radius: 16px;
  padding: 20px 22px; display: flex; align-items: center; gap: 16px;
  box-shadow: var(--sh-sm); transition: box-shadow 0.2s, transform 0.2s;
}
.d-stat:hover { box-shadow: var(--sh); transform: translateY(-1px); }
.d-stat-ic {
  width: 46px; height: 46px; border-radius: 13px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.d-stat-ic.blue  { background: var(--blue-bg); color: var(--blue); }
.d-stat-ic.green { background: var(--green-bg); color: var(--green); }
.d-stat-ic.amber { background: var(--amber-bg); color: var(--amber); }
.d-stat-ic.red   { background: var(--red-bg); color: var(--red); }
.d-stat-val { font-size: 28px; font-weight: 800; color: var(--navy); line-height: 1; }
.d-stat-lbl { font-size: 12px; color: var(--gray); margin-top: 3px; font-weight: 500; }

.d-tcard {
  background: var(--white); border: 1px solid var(--border);
  border-radius: 16px; overflow: hidden; box-shadow: var(--sh-sm);
}
.d-tcard-head {
  padding: 18px 22px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
}
.d-tcard-title-wrap { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.d-tcard-title { font-size: 15px; font-weight: 700; color: var(--navy); }
.d-table-hint {
  font-size: 11px; font-weight: 500; color: var(--gray-text);
  display: none; align-items: center; gap: 6px;
}
.d-table-hint svg { flex-shrink: 0; opacity: 0.85; }
.d-tcard-count {
  font-size: 12px; background: var(--blue-bg); color: var(--blue);
  border-radius: 20px; padding: 3px 11px; font-weight: 600;
  flex-shrink: 0;
}
.d-twrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scrollbar-color: #cbd5e1 var(--surface);
}
.d-twrap::-webkit-scrollbar { height: 8px; }
.d-twrap::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
table.d-table { width: 100%; border-collapse: collapse; min-width: 720px; }
.d-table th {
  padding: 11px 16px; font-size: 10.5px; font-weight: 700; color: #94a3b8;
  letter-spacing: 0.08em; text-transform: uppercase; text-align: left;
  border-bottom: 1px solid var(--border); background: var(--surface); white-space: nowrap;
}
.d-table td {
  padding: 14px 16px; font-size: 13.5px; color: #374151;
  border-bottom: 1px solid var(--border); vertical-align: middle;
}
.d-table tr:last-child td { border-bottom: none; }
.d-table tr:hover td { background: #fafbfd; }

.ref-chip {
  background: var(--blue-bg); color: #1d4ed8; border-radius: 6px;
  padding: 3px 9px; font-size: 11.5px; font-weight: 600; letter-spacing: 0.03em;
}
.badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 600; white-space: nowrap;
}
.badge::before { content:''; width:6px; height:6px; border-radius:50%; background:currentColor; flex-shrink:0; }
.badge-green { background:#dcfce7; color:#15803d; }
.badge-amber { background:#fef3c7; color:#92400e; }
.badge-red   { background:#fee2e2; color:#b91c1c; }
.badge-gray  { background:#f1f5f9; color:#64748b; }

.open-btn {
  padding: 9px 16px; min-height: 40px; background: var(--blue); color: #fff;
  border: none; border-radius: 10px; cursor: pointer;
  font-family: var(--font); font-size: 12px; font-weight: 600;
  transition: background 0.15s, transform 0.1s;
  white-space: nowrap;
}
.open-btn:hover { background: var(--blue-dk); }
.open-btn:active { transform: scale(0.97); }

.d-empty { padding: 60px 20px; text-align: center; font-size: 14px; color: #94a3b8; }

.d-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:64px; gap:14px; }
.d-spinner { width:36px; height:36px; border-radius:50%; border:3px solid #dbeafe; border-top-color:var(--blue); animation:spin 0.75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.d-spinner-lbl { font-size:12px; color:#94a3b8; font-weight:500; }

.d-detail { background:var(--white); border:1px solid var(--border); border-radius:16px; overflow:hidden; box-shadow:var(--sh-sm); }
.d-dhead {
  padding:18px 24px; border-bottom:1px solid var(--border);
  display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;
}
.d-dhead-l { display:flex; align-items:center; gap:14px; }
.d-back {
  width:38px; height:38px; border-radius:10px; background:var(--surface);
  border:1.5px solid var(--border); cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:background 0.15s; flex-shrink:0;
}
.d-back:hover { background:var(--border); }
.d-dname { font-size:18px; font-weight:800; color:var(--navy); }
.d-dmeta { font-size:12.5px; color:var(--gray); margin-top:3px; }
.d-dmeta b { color:var(--slate); }
.d-dactions { display:flex; gap:8px; flex-wrap:wrap; }
.dl-btn {
  height:36px; padding:0 14px; border:none; border-radius:9px; cursor:pointer;
  font-family:var(--font); font-size:12px; font-weight:600;
  display:flex; align-items:center; gap:6px; transition:opacity 0.15s, transform 0.1s;
}
.dl-btn:active { transform:scale(0.97); }
.dl-btn.blue { background:var(--blue); color:#fff; }
.dl-btn.blue:hover { background:var(--blue-dk); }
.dl-btn.dark { background:var(--navy); color:#fff; }
.dl-btn.dark:hover { background:var(--slate); }

.d-dbody { display:grid; grid-template-columns:1fr 320px; }
@media (max-width:1024px) { .d-dbody { grid-template-columns:1fr; } }

.d-media { padding:22px 24px; border-right:1px solid var(--border); }
@media (max-width:1024px) { .d-media { border-right:none; border-bottom:1px solid var(--border); } }

.sec-label {
  font-size:10.5px; font-weight:700; color:var(--blue);
  letter-spacing:0.1em; text-transform:uppercase; margin-bottom:14px;
}
.d-mgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,168px),1fr)); gap:14px; }
.d-mbox { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.d-mbox-lbl {
  padding:8px 12px; font-size:10px; font-weight:700;
  color:var(--gray); letter-spacing:0.07em; text-transform:uppercase;
  border-bottom:1px solid var(--border);
}
.d-mimg-wrap { height:150px; background:#e5e7eb; position:relative; overflow:hidden; }
.d-mimg { width:100%; height:100%; object-fit:cover; cursor:zoom-in; display:block; transition:transform 0.2s; }
.d-mimg:hover { transform:scale(1.04); }
.d-mmark {
  position:absolute; bottom:0; left:0; right:0;
  background:rgba(15,23,42,0.62); padding:5px 10px;
  font-size:9px; color:rgba(255,255,255,0.65);
  letter-spacing:0.07em; text-transform:uppercase; text-align:center;
  pointer-events:none;
}
.d-mempty {
  height:100%; display:flex; align-items:center; justify-content:center;
  font-size:12px; color:#94a3b8; flex-direction:column; gap:8px;
}
.d-video-sec { margin-top:22px; }
.d-video { width:100%; border-radius:12px; background:#000; max-height:280px; display:block; box-shadow:var(--sh); }
.d-video-empty {
  height:180px; background:var(--surface); border:1px solid var(--border);
  border-radius:12px; display:flex; align-items:center; justify-content:center;
  font-size:13px; color:#94a3b8;
}

.d-sidebar { padding:22px; }
.d-icard {
  background:var(--surface); border:1px solid var(--border); border-radius:12px;
  padding:16px; margin-bottom:14px;
}
.d-irow {
  display:flex; justify-content:space-between; align-items:flex-start;
  padding:8px 0; border-bottom:1px solid var(--border); font-size:13px; gap:10px;
}
.d-irow:last-child { border-bottom:none; }
.d-ikey { color:#94a3b8; font-size:11.5px; font-weight:600; flex-shrink:0; }
.d-ival { color:var(--slate); font-weight:500; text-align:right; word-break:break-all; }
.d-amt  { font-size:23px; font-weight:800; color:var(--blue); }

.d-acard { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px; }
.d-atitle { font-size:10.5px; font-weight:700; color:var(--gray); letter-spacing:0.1em; text-transform:uppercase; margin-bottom:12px; }
.abtn {
  width:100%; padding:11px 16px; border-radius:10px; border:none; cursor:pointer;
  font-family:var(--font); font-size:12.5px; font-weight:600;
  letter-spacing:0.01em; margin-bottom:8px;
  display:flex; align-items:center; justify-content:center; gap:7px;
  transition:opacity 0.15s, transform 0.1s;
}
.abtn:last-child { margin-bottom:0; }
.abtn:active { transform:scale(0.99); }
.abtn.green     { background:var(--green); color:#fff; }
.abtn.green:hover { opacity:0.88; }
.abtn.soft-red  { background:#fee2e2; color:#b91c1c; border:1px solid #fecaca; }
.abtn.soft-red:hover { background:#fecaca; }
.abtn.hard-red  { background:var(--red); color:#fff; }
.abtn.hard-red:hover { opacity:0.88; }
.a-div { height:1px; background:var(--border); margin:10px 0; }

.d-doc-overlay {
  position:fixed; inset:0; z-index:800;
  background:rgba(2,6,23,0.78); backdrop-filter:blur(6px);
  display:flex; align-items:center; justify-content:center;
  padding:max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
  animation:d-doc-fade 0.2s ease;
}
@keyframes d-doc-fade { from { opacity:0; } to { opacity:1; } }
.d-doc-sheet {
  background:#0f172a; border-radius:16px; border:1px solid rgba(255,255,255,0.08);
  max-width:min(960px, 100%); width:100%; max-height:min(92dvh, 92vh);
  display:flex; flex-direction:column; overflow:hidden;
  box-shadow:0 24px 64px rgba(0,0,0,0.45);
}
.d-doc-top {
  display:flex; align-items:flex-start; justify-content:space-between; gap:12px;
  padding:14px 16px; border-bottom:1px solid rgba(255,255,255,0.08);
  flex-shrink:0;
}
.d-doc-title { font-size:14px; font-weight:700; color:#f8fafc; letter-spacing:0.02em; }
.d-doc-sub { font-size:11px; color:#94a3b8; margin-top:3px; font-weight:500; }
.d-doc-top-actions { display:flex; align-items:center; gap:6px; flex-shrink:0; }
.d-doc-iconbtn {
  width:38px; height:38px; border-radius:10px; border:1px solid rgba(255,255,255,0.12);
  background:rgba(255,255,255,0.06); color:#e2e8f0; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:background 0.15s;
}
.d-doc-iconbtn:hover { background:rgba(255,255,255,0.12); }
.d-doc-close {
  width:38px; height:38px; border-radius:10px; border:none;
  background:rgba(255,255,255,0.08); color:#f1f5f9; font-size:22px; line-height:1;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:background 0.15s;
}
.d-doc-close:hover { background:rgba(239,68,68,0.35); color:#fff; }
.d-doc-imgwrap {
  position:relative; flex:1; min-height:200px;
  display:flex; align-items:center; justify-content:center;
  background:#020617; padding:12px;
}
.d-doc-img {
  max-width:100%; max-height:min(72dvh, 72vh); width:auto; height:auto;
  object-fit:contain; border-radius:8px; display:block;
}
.d-doc-arrow {
  position:absolute; top:50%; transform:translateY(-50%);
  width:44px; height:44px; border-radius:50%; border:1px solid rgba(255,255,255,0.15);
  background:rgba(15,23,42,0.85); color:#f8fafc; font-size:26px; line-height:1;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  z-index:2; transition:background 0.15s;
}
.d-doc-arrow:hover { background:rgba(37,99,235,0.55); border-color:rgba(37,99,235,0.5); }
.d-doc-prev { left:10px; }
.d-doc-next { right:10px; }
@media (max-width:640px) {
  .d-doc-arrow { width:38px; height:38px; font-size:22px; }
  .d-doc-prev { left:6px; }
  .d-doc-next { right:6px; }
  .d-doc-img { max-height:min(62dvh, 62vh); }
}

.d-overlay {
  position:fixed; inset:0; z-index:500;
  background:rgba(2,6,23,0.62); backdrop-filter:blur(4px);
  display:flex; align-items:center; justify-content:center; padding:20px;
}
.d-modal {
  background:#fff; border-radius:18px; padding:28px;
  max-width:380px; width:100%; box-shadow:var(--sh-lg);
  animation:modal-in 0.2s ease;
}
@keyframes modal-in { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:none; } }
.d-modal-ic {
  width:48px; height:48px; border-radius:14px; background:#fef2f2;
  display:flex; align-items:center; justify-content:center; margin-bottom:16px;
}
.d-modal-title { font-size:17px; font-weight:800; color:var(--navy); margin-bottom:8px; }
.d-modal-desc  { font-size:13.5px; color:var(--gray); line-height:1.6; margin-bottom:22px; }
.d-modal-btns  { display:flex; gap:10px; }
.d-modal-cancel {
  flex:1; padding:12px; border:1.5px solid var(--border); border-radius:10px;
  background:#fff; cursor:pointer; font-family:var(--font);
  font-size:13px; font-weight:600; color:var(--slate); transition:background 0.15s;
}
.d-modal-cancel:hover { background:var(--surface); }
.d-modal-ok {
  flex:1; padding:12px; border:none; border-radius:10px;
  background:var(--red); cursor:pointer; font-family:var(--font);
  font-size:13px; font-weight:700; color:#fff; transition:background 0.15s;
}
.d-modal-ok:hover { background:#b91c1c; }

.d-toast {
  position:fixed; bottom:24px; right:24px; z-index:600;
  border-radius:12px; padding:13px 18px;
  font-family:var(--font); font-size:13.5px; font-weight:500;
  box-shadow:0 8px 28px rgba(0,0,0,0.22);
  display:flex; align-items:center; gap:10px; max-width:340px;
  animation:toast-in 0.25s ease;
}
@keyframes toast-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
.d-toast.green { background:#15803d; color:#fff; }
.d-toast.red   { background:var(--red); color:#fff; }

@media (max-width: 900px) {
  .d-header {
    min-height: auto;
    padding: 12px 14px;
    gap: 12px;
    flex-direction: column;
    align-items: stretch;
  }
  .d-header-r {
    flex: none;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .d-search-wrap { width: 100%; max-width: none; }
  .d-search { width: 100% !important; }
  .d-header-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    width: 100%;
  }
  .d-header-actions .hbtn { justify-content: center; min-height: 42px; }
}

@media (max-width: 640px) {
  .d-table-hint { display: flex; }
  .d-tcard-head { padding: 14px 16px; align-items: flex-start; }
  .d-body { padding: 14px 12px 40px; padding-left: max(12px, env(safe-area-inset-left)); padding-right: max(12px, env(safe-area-inset-right)); }
  .d-stats { gap: 10px; }
  .d-stat { padding: 14px 16px; }
  .d-stat-val { font-size: 22px; }
  .d-header { padding: 10px 12px; }
  .d-dhead { padding: 14px; flex-direction: column; align-items: stretch; gap: 14px; }
  .d-dhead-l { width: 100%; }
  .d-dactions { width: 100%; justify-content: stretch; }
  .d-dactions .dl-btn { flex: 1; justify-content: center; min-height: 42px; }
  .d-media { padding: 14px; }
  .d-sidebar { padding: 14px; }
  .d-modal { margin: 12px; padding: 22px; max-height: calc(100dvh - 24px); overflow-y: auto; }
  .d-modal-btns { flex-direction: column; }
  .d-modal-btns .d-modal-cancel,
  .d-modal-btns .d-modal-ok { width: 100%; min-height: 46px; }
  .d-toast {
    bottom: max(12px, env(safe-area-inset-bottom));
    right: 12px;
    left: 12px;
    max-width: none;
  }
  .d-mimg-wrap { height: 140px; }
  .d-video { max-height: 220px; }
}

@media (max-width: 380px) {
  .d-brand { font-size: 14px; }
  .d-brand-dot { width: 30px; height: 30px; }
  .d-tabbar { padding: 0 12px; overflow-x: auto; }
  .ib-grid { grid-template-columns: 1fr; }
}
`;

function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`d-toast ${type}`}>
      {type === "green" ? (
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            d="M20 6L9 17l-5-5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
      )}
      {msg}
    </div>
  );
}

function ConfirmDialog({ title, desc, onConfirm, onCancel }) {
  return (
    <div className="d-overlay" onClick={onCancel}>
      <div className="d-modal" onClick={(e) => e.stopPropagation()}>
        <div className="d-modal-ic">
          <svg
            width="22"
            height="22"
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              strokeLinejoin="round"
            />
            <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
          </svg>
        </div>
        <p className="d-modal-title">{title}</p>
        <p className="d-modal-desc">{desc}</p>
        <div className="d-modal-btns">
          <button className="d-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="d-modal-ok" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentLightbox({ items, index, onClose, onSelectIndex }) {
  const n = items.length;
  const idx = n === 0 ? 0 : Math.max(0, Math.min(index, n - 1));
  const cur = items[idx];
  const src = cur ? mediaUrl(cur.path) : "";

  useEffect(() => {
    if (n === 0) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onSelectIndex(Math.max(0, idx - 1));
      if (e.key === "ArrowRight") onSelectIndex(Math.min(n - 1, idx + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n, idx, onClose, onSelectIndex]);

  if (!cur || !src) return null;

  return (
    <div className="d-doc-overlay" onClick={onClose} role="presentation">
      <div
        className="d-doc-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Document: ${cur.title}`}
      >
        <div className="d-doc-top">
          <div>
            <p className="d-doc-title">{cur.title}</p>
            <p className="d-doc-sub">
              {idx + 1} of {n} · Confidential
            </p>
          </div>
          <div className="d-doc-top-actions">
            <button
              type="button"
              className="d-doc-iconbtn"
              title="Open in new tab"
              onClick={() => {
                const w = window.open(src, "_blank", "noopener,noreferrer");
                if (!w) {
                  window.alert(
                    "Pop-up blocked. Allow pop-ups for this site to open in a new tab.",
                  );
                }
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className="d-doc-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </div>
        <div className="d-doc-imgwrap">
          {idx > 0 && (
            <button
              type="button"
              className="d-doc-arrow d-doc-prev"
              onClick={() => onSelectIndex(idx - 1)}
              aria-label="Previous document"
            >
              ‹
            </button>
          )}
          <img src={src} alt={cur.title} className="d-doc-img" draggable={false} />
          {idx < n - 1 && (
            <button
              type="button"
              className="d-doc-arrow d-doc-next"
              onClick={() => onSelectIndex(idx + 1)}
              aria-label="Next document"
            >
              ›
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MediaBox({ title, path, onOpen }) {
  const src = mediaUrl(path);
  const openModal = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!src) return;
    if (onOpen) onOpen();
    else {
      const w = window.open(src, "_blank", "noopener,noreferrer");
      if (!w) {
        window.alert(
          "Your browser blocked the pop-up. Allow pop-ups for this site to open the full image.",
        );
      }
    }
  };
  return (
    <div className="d-mbox">
      <div className="d-mbox-lbl">{title}</div>
      <div
        className="d-mimg-wrap"
        role={src ? "button" : undefined}
        tabIndex={src ? 0 : undefined}
        onClick={src ? openModal : undefined}
        onKeyDown={
          src
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openModal(e);
                }
              }
            : undefined
        }
        style={src ? { cursor: "zoom-in" } : undefined}
      >
        {src ? (
          <>
            <img
              src={src}
              alt={title}
              className="d-mimg"
              loading="lazy"
              draggable={false}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div className="d-mmark">Confidential · click to view</div>
          </>
        ) : (
          <div className="d-mempty">
            <svg
              width="22"
              height="22"
              fill="none"
              stroke="#d1d5db"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" />
            </svg>
            Not uploaded
          </div>
        )}
      </div>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const locked = isLockedOut();
  const lockMins = remainingLockout();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLockedOut()) return;
    if (!id.trim()) {
      setError("Please enter your Admin ID.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await authClient.post(
        "/api/admin/login",
        {
          id: id.trim(),
          password,
          nonce: generateNonce(16),
        },
        {
          timeout: 10000,
          headers: { "X-Requested-With": "XMLHttpRequest" },
          withCredentials: true,
        },
      );

      if (res.data.success) {
        clearAttempts();
        await createSession();
        onLogin();
      } else {
        const rem = MAX_ATTEMPTS - recordFailedAttempt();
        setError(
          rem > 0
            ? `Invalid credentials. ${rem} attempt${rem !== 1 ? "s" : ""} remaining.`
            : `Too many failed attempts. Locked for ${LOCKOUT_MS / 60000} minutes.`,
        );
      }
    } catch {
      const rem = MAX_ATTEMPTS - recordFailedAttempt();
      setError(
        rem > 0
          ? `Invalid credentials. ${rem} attempt${rem !== 1 ? "s" : ""} remaining.`
          : `Too many failed attempts. Locked for ${LOCKOUT_MS / 60000} minutes.`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">
      <div className="lp-left">
        <div className="lp-left-inner">
          <div className="lp-logo-wrap">
            <svg
              width="30"
              height="30"
              fill="none"
              stroke="#fff"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2>
            COINORA
            <br />
            VDASP Admin
          </h2>
          <p>
            Secure administrative portal for KYC verification and user
            management.
          </p>
          <div className="lp-features">
            {[
              [
                "256-bit AES encrypted sessions",
                <svg
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                </svg>,
              ],
              [
                "Rate-limited brute-force protection",
                <svg
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>,
              ],
              [
                "Auto-logout on session inactivity",
                <svg
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" strokeLinecap="round" />
                </svg>,
              ],
            ].map(([label, icon]) => (
              <div className="lp-feat" key={label}>
                <div className="lp-feat-icon">{icon}</div>
                {label}
              </div>
            ))}
          </div>
          <div className="lp-dots">
            <div className="lp-dot active" />
            <div className="lp-dot" />
            <div className="lp-dot" />
          </div>
        </div>
      </div>

      <div className="lp-right">
        <div className="lp-card">
          <div className="lp-top-badge">
            <svg
              width="10"
              height="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Secure Portal
          </div>

          <h1>Welcome back</h1>
          <p className="lp-sub">Sign in to access the admin dashboard</p>

          {locked && (
            <div className="lp-alert warn">
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                style={{ flexShrink: 0, marginTop: 1 }}
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
              </svg>
              Account locked for {lockMins} more minute
              {lockMins !== 1 ? "s" : ""}. Too many failed attempts.
            </div>
          )}

          {error && !locked && (
            <div className="lp-alert err">
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                style={{ flexShrink: 0, marginTop: 1 }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="lp-field">
              <label className="lp-label" htmlFor="lp-id">
                Admin ID
              </label>
              <div className="lp-input-wrap">
                <span className="lp-icon">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                      strokeLinecap="round"
                    />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="lp-id"
                  type="text"
                  name="adminId"
                  autoComplete="username"
                  className="lp-input"
                  placeholder="e.g. admin"
                  value={id}
                  disabled={locked || loading}
                  onChange={(e) => setId(e.target.value)}
                />
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label" htmlFor="lp-pwd">
                Password
              </label>
              <div className="lp-input-wrap">
                <span className="lp-icon">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                  </svg>
                </span>
                <input
                  id="lp-pwd"
                  type={showPass ? "text" : "password"}
                  name="adminPassword"
                  autoComplete="current-password"
                  className="lp-input with-eye"
                  placeholder="Enter your password"
                  value={password}
                  disabled={locked || loading}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="lp-eye"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="lp-submit"
              disabled={locked || loading}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />{" "}
                  Verifying…
                </>
              ) : (
                <>
                  Sign In{" "}
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 12h14M12 5l7 7-7 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="lp-footer">
            <svg
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            256-bit AES encrypted · Auto session timeout
          </div>
        </div>
      </div>
    </div>
  );
}

const IB_LONG_FIELDS = new Set([
  "memo",
  "holderAddress",
  "indemnifierAddress",
  "amountInWords",
]);

function IndemnityBondPanel({ showToast, downloadFile }) {
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({});
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await authClient.get("/api/admin/indemnity-bonds");
      setList(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast("Could not load generated bonds list.", "red");
    } finally {
      setListLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authClient.get("/api/admin/indemnity-bond/fields");
        const g = res.data?.groups || [];
        const init = {};
        for (const sec of g) {
          for (const f of sec.fields) {
            init[f.key] = "";
          }
        }
        if (!cancelled) {
          setGroups(g);
          setForm(init);
        }
      } catch {
        if (!cancelled) showToast("Could not load indemnity form fields.", "red");
      }
    })();
    loadList();
    return () => {
      cancelled = true;
    };
    // Initial load only; loadList/showToast intentionally omitted to avoid refetch loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authClient.post("/api/admin/indemnity-bond/generate", form);
      if (res.data?.success) {
        showToast(`Generated ${res.data.bondId}.pdf`, "green");
        loadList();
        if (res.data.pdf_path) {
          downloadFile(res.data.pdf_path, `${res.data.bondId}_indemnity.pdf`);
        }
      }
    } catch (err) {
      showToast(err?.response?.data?.error || "Generation failed.", "red");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bondId) => {
    if (!window.confirm(`Delete ${bondId} and its PDF?`)) return;
    try {
      await authClient.delete(
        `/api/admin/indemnity-bond/${encodeURIComponent(bondId)}`,
      );
      showToast("Deleted.", "green");
      loadList();
    } catch {
      showToast("Delete failed.", "red");
    }
  };

  return (
    <div className="ib-root">
      <div className="ib-hero">
        <h2>Indemnity bond PDF</h2>
        <p>
          Enter the variable fields for the bond. Values appear in the PDF in{" "}
          <strong style={{ color: "#b45309" }}>amber</strong> (same role as the
          yellow highlights in your template). Each run creates a new{" "}
          <code className="ib-small">IB-…</code> file in{" "}
          <code className="ib-small">storage/indemnity_pdfs/</code>.
        </p>
      </div>
      <form className="ib-form-wrap" onSubmit={handleGenerate}>
        {groups.map((sec) => (
          <div className="ib-section" key={sec.title}>
            <h3>{sec.title}</h3>
            <div className="ib-grid">
              {sec.fields.map((f) => (
                <div className="ib-field" key={f.key}>
                  <label htmlFor={`ib-${f.key}`}>{f.label}</label>
                  {IB_LONG_FIELDS.has(f.key) ? (
                    <textarea
                      id={`ib-${f.key}`}
                      value={form[f.key] ?? ""}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder={f.placeholder || ""}
                      rows={f.key === "memo" ? 2 : 4}
                    />
                  ) : (
                    <input
                      id={`ib-${f.key}`}
                      type="text"
                      value={form[f.key] ?? ""}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder={f.placeholder || ""}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="ib-actions">
          <button type="submit" className="hbtn primary" disabled={loading}>
            {loading ? "Generating…" : "Generate PDF"}
          </button>
          <button
            type="button"
            className="hbtn ghost"
            onClick={loadList}
            disabled={listLoading}
          >
            Refresh list
          </button>
        </div>
      </form>

      <div className="ib-list-card">
        <h3>Recent admin-generated bonds</h3>
        <div className="ib-table-wrap">
          <table className="ib-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Label</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && !listLoading && (
                <tr>
                  <td colSpan={4} className="ib-small" style={{ padding: "20px" }}>
                    No bonds yet. Generate one above.
                  </td>
                </tr>
              )}
              {list.map((row) => (
                <tr key={row.bondId}>
                  <td>
                    <strong>{row.bondId}</strong>
                  </td>
                  <td>{row.memo || "—"}</td>
                  <td className="ib-small">
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td>
                    <div className="ib-btn-row">
                      <button
                        type="button"
                        className="ib-btn-dl"
                        onClick={() =>
                          downloadFile(row.pdf_path, `${row.bondId}_indemnity.pdf`)
                        }
                      >
                        Download
                      </button>
                      <button
                        type="button"
                        className="ib-btn-del"
                        onClick={() => handleDelete(row.bondId)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PdfMergePanel({ showToast, downloadFile }) {
  const [bondPdfs, setBondPdfs] = useState([]);
  const [kycPdfs, setKycPdfs] = useState([]);
  const [bondPath, setBondPath] = useState("");
  const [kycPath, setKycPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [sourcesLoading, setSourcesLoading] = useState(false);

  const loadSources = useCallback(async () => {
    setSourcesLoading(true);
    try {
      const res = await authClient.get("/api/admin/pdf-merge-sources");
      const b = Array.isArray(res.data?.bondPdfs) ? res.data.bondPdfs : [];
      const k = Array.isArray(res.data?.kycPdfs) ? res.data.kycPdfs : [];
      setBondPdfs(b);
      setKycPdfs(k);
    } catch {
      showToast("Could not load PDF lists from the server.", "red");
    } finally {
      setSourcesLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMerge = async (e) => {
    e.preventDefault();
    if (!bondPath || !kycPath) {
      showToast("Choose both an indemnity bond PDF and a KYC PDF.", "red");
      return;
    }
    setLoading(true);
    try {
      const res = await authClient.post("/api/admin/merge-pdfs", {
        bondPath,
        kycPath,
      });
      if (res.data?.success && res.data.pdf_path) {
        showToast(`Merged as ${res.data.filename || "file"}. Download started.`, "green");
        downloadFile(
          res.data.pdf_path,
          res.data.filename || "merged.pdf",
        );
        loadSources();
      }
    } catch (err) {
      showToast(err?.response?.data?.error || "Merge failed.", "red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ib-root">
      <div className="ib-hero">
        <h2>Merge PDFs</h2>
        <p>
          Combine two PDFs into one file. Pages are appended in order:{" "}
          <strong>indemnity bond first</strong>, then <strong>KYC summary</strong>. Pick files
          from the lists (from <code className="ib-small">storage/indemnity_pdfs</code> and{" "}
          <code className="ib-small">storage/pdfs</code>), then merge. Output is saved under{" "}
          <code className="ib-small">storage/merged/</code> and downloaded automatically.
        </p>
      </div>

      <form className="ib-form-wrap" onSubmit={handleMerge}>
        <div className="ib-section">
          <h3>1. Indemnity bond PDF (first in the merged document)</h3>
          <div className="ib-field">
            <label htmlFor="merge-bond">File</label>
            <select
              id="merge-bond"
              value={bondPath}
              onChange={(e) => setBondPath(e.target.value)}
              className="pm-select"
            >
              <option value="">— Select bond PDF —</option>
              {bondPdfs.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="ib-section">
          <h3>2. KYC summary PDF (appended after the bond)</h3>
          <div className="ib-field">
            <label htmlFor="merge-kyc">File</label>
            <select
              id="merge-kyc"
              value={kycPath}
              onChange={(e) => setKycPath(e.target.value)}
              className="pm-select"
            >
              <option value="">— Select KYC PDF —</option>
              {kycPdfs.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="ib-actions">
          <button type="submit" className="hbtn primary" disabled={loading}>
            {loading ? "Merging…" : "Merge & download"}
          </button>
          <button
            type="button"
            className="hbtn ghost"
            onClick={loadSources}
            disabled={sourcesLoading}
          >
            {sourcesLoading ? "Refreshing…" : "Refresh file lists"}
          </button>
        </div>
      </form>

      <p className="ib-small" style={{ marginTop: 8, lineHeight: 1.5 }}>
        Tip: for the same customer, bond and KYC often share the same ref (e.g.{" "}
        <code>indemnity_pdfs/CN-12.pdf</code> and <code>pdfs/CN-12.pdf</code>).
      </p>
    </div>
  );
}

const AdminDashboard = () => {
  const [authed, setAuthed] = useState(() => sessionValid());
  const [adminPanel, setAdminPanel] = useState("kyc");
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [sessionWarn, setSessionWarn] = useState(false);
  const [docLightboxIndex, setDocLightboxIndex] = useState(null);
  const sessionTimer = useRef(null);

  const documentSlots = useMemo(
    () => buildDocumentSlots(selected),
    [selected],
  );
  const documentItems = useMemo(
    () => buildDocumentItems(selected),
    [selected],
  );

  useEffect(() => {
    setDocLightboxIndex(null);
  }, [selected?.id]);

  const showToast = (msg, type = "green") => setToast({ msg, type });

  const resetSessionTimer = useCallback(() => {
    clearTimeout(sessionTimer.current);
    sessionStorage.setItem(SESSION_EXP, String(Date.now() + SESSION_TTL));
    setSessionWarn(false);
    sessionTimer.current = setTimeout(
      () => {
        const exp = parseInt(sessionStorage.getItem(SESSION_EXP) || "0", 10);
        if (Date.now() > exp - 5 * 60 * 1000) setSessionWarn(true);
        if (!sessionValid()) handleLogout();
      },
      SESSION_TTL - 5 * 60 * 1000,
    );
  }, []);

  useEffect(() => {
    if (!authed) return;
    resetSessionTimer();
    const evs = ["click", "keydown", "mousemove"];
    evs.forEach((ev) => window.addEventListener(ev, resetSessionTimer));
    return () => {
      clearTimeout(sessionTimer.current);
      evs.forEach((ev) => window.removeEventListener(ev, resetSessionTimer));
    };
  }, [authed, resetSessionTimer]);

  const handleLogout = () => {
    clearSession();
    setAuthed(false);
    setSelected(null);
    setUsers([]);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authClient.get("/api/admin/all-users");
      const data = Array.isArray(res.data) ? res.data : [];
      setUsers(data);
    } catch {
      showToast("Could not load the user list. Check that the API is running, then refresh.", "red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchUsers();
  }, [authed, fetchUsers]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      users.filter(
        (u) =>
          u.buyer_full_name?.toLowerCase().includes(q) ||
          u.utr_reference_no?.toLowerCase().includes(q) ||
          u.refId?.toLowerCase().includes(q),
      ),
    );
  }, [search, users]);

  const openFolder = async (user) => {
    setSelected({ ...user });
    try {
      const res = await authClient.get(`/api/admin/user-details/${user.id}`);
      if (res.data) setSelected((prev) => ({ ...prev, ...res.data }));
    } catch {
      showToast("Could not load this user’s details. Try again or pick another row.", "red");
    }
  };

  const updateProofStatus = async (id, proof_status) => {
    try {
      const res = await authClient.post("/api/admin/update-proof-status", {
        id,
        proof_status,
      });
      if (res.data.success) {
        showToast(`Purpose proof updated to “${proof_status}”.`, "green");
        setSelected((prev) =>
          prev
            ? {
                ...prev,
                proof_status,
                phase_access: proof_status === "Approved",
              }
            : prev,
        );
        fetchUsers();
      }
    } catch {
      showToast("Could not update proof status. Check your connection and try again.", "red");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await authClient.post("/api/admin/update-status", {
        id,
        status,
      });
      if (res.data.success) {
        showToast(`KYC decision set to “${status}”.`, "green");
        setSelected((prev) =>
          prev ? { ...prev, admin_status: status } : prev,
        );
        fetchUsers();
      }
    } catch {
      showToast("Could not update KYC status. Try again.", "red");
    }
  };

  const deleteUser = async (id) => {
    try {
      const res = await authClient.delete(`/api/admin/delete-user/${id}`);
      if (res.data.success) {
        showToast("User record and stored files were removed.", "green");
        setSelected(null);
        fetchUsers();
      }
    } catch {
      showToast("Delete failed. Refresh and try again.", "red");
    }
  };

  const downloadFile = async (path, filename) => {
    if (!path) {
      showToast("File not found.", "red");
      return;
    }
    const url = mediaUrl(path);
    const outName = preferredDownloadName(path, filename);
    try {
      const res = await fetch(url, { credentials: "include", mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = outName;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      showToast("Download failed. Check your connection or try again.", "red");
    }
  };

  const stats = {
    total: users.length,
    verified: users.filter((u) => u.admin_status === "Verified").length,
    pending: users.filter(
      (u) => !u.admin_status || u.admin_status === "Pending",
    ).length,
    rejected: users.filter((u) => u.admin_status === "Rejected").length,
  };

  if (!authed)
    return (
      <>
        <style>{CSS}</style>
        <LoginPage onLogin={() => setAuthed(true)} />
      </>
    );

  return (
    <>
      <style>{CSS}</style>
      <div className="d-root">
        {sessionWarn && (
          <div className="d-session-bar">
            ⚠️ Session expiring soon — move your mouse or click to extend.
          </div>
        )}

        <header className="d-header">
          <div className="d-brand">
            <div className="d-brand-dot">
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            COINORA <span className="d-brand-accent">&nbsp;Admin</span>
          </div>
          <div className="d-header-r">
            {adminPanel === "kyc" && !selected && (
              <div className="d-search-wrap">
                <span className="d-search-icon">
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  className="d-search"
                  placeholder="Search name, UTR, Ref ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search KYC records"
                />
              </div>
            )}
            <div className="d-header-actions">
              <button
                type="button"
                className="hbtn ghost"
                onClick={fetchUsers}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        border: "2px solid #cbd5e1",
                        borderTopColor: "#64748b",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />{" "}
                    Loading
                  </>
                ) : (
                  <>
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M23 4v6h-6M1 20v-6h6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>{" "}
                    Refresh
                  </>
                )}
              </button>
              <button type="button" className="hbtn danger" onClick={handleLogout}>
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <nav className="d-tabbar" aria-label="Admin sections">
          <button
            type="button"
            className={`d-tab ${adminPanel === "kyc" ? "active" : ""}`}
            onClick={() => {
              setAdminPanel("kyc");
            }}
          >
            KYC records
          </button>
          <button
            type="button"
            className={`d-tab ${adminPanel === "indemnity" ? "active" : ""}`}
            onClick={() => {
              setAdminPanel("indemnity");
              setSelected(null);
            }}
          >
            Indemnity bond
          </button>
          <button
            type="button"
            className={`d-tab ${adminPanel === "merge" ? "active" : ""}`}
            onClick={() => {
              setAdminPanel("merge");
              setSelected(null);
            }}
          >
            PDF merge
          </button>
        </nav>

        <div className="d-body">
          {adminPanel === "indemnity" ? (
            <IndemnityBondPanel showToast={showToast} downloadFile={downloadFile} />
          ) : adminPanel === "merge" ? (
            <PdfMergePanel showToast={showToast} downloadFile={downloadFile} />
          ) : !selected ? (
            <>
              <div className="d-stats">
                {[
                  {
                    label: "Total Users",
                    val: stats.total,
                    cls: "blue",
                    icon: (
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                          strokeLinecap="round"
                        />
                        <circle cx="9" cy="7" r="4" />
                        <path
                          d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                          strokeLinecap="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    label: "Verified",
                    val: stats.verified,
                    cls: "green",
                    icon: (
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M22 11.08V12a10 10 0 11-5.93-9.14"
                          strokeLinecap="round"
                        />
                        <path
                          d="M22 4L12 14.01l-3-3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    label: "Pending",
                    val: stats.pending,
                    cls: "amber",
                    icon: (
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" strokeLinecap="round" />
                      </svg>
                    ),
                  },
                  {
                    label: "Rejected",
                    val: stats.rejected,
                    cls: "red",
                    icon: (
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
                      </svg>
                    ),
                  },
                ].map(({ label, val, cls, icon }) => (
                  <div className="d-stat" key={label}>
                    <div className={`d-stat-ic ${cls}`}>{icon}</div>
                    <div>
                      <div className="d-stat-val">{val}</div>
                      <div className="d-stat-lbl">{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="d-tcard">
                <div className="d-tcard-head">
                  <div className="d-tcard-title-wrap">
                    <span className="d-tcard-title">KYC Records</span>
                    <span className="d-table-hint">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Swipe horizontally to see all columns
                    </span>
                  </div>
                  <span className="d-tcard-count">
                    {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {loading ? (
                  <div className="d-loading">
                    <div className="d-spinner" />
                    <span className="d-spinner-lbl">Loading records…</span>
                  </div>
                ) : (
                  <div className="d-twrap">
                    <table className="d-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Ref ID</th>
                          <th>Full Name</th>
                          <th>Mobile</th>
                          <th>Amount</th>
                          <th>Proof</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((u) => (
                          <tr key={u.id}>
                            <td
                              style={{
                                color: "#94a3b8",
                                fontSize: "12px",
                                fontWeight: 500,
                              }}
                            >
                              {String(u.id).slice(-6)}
                            </td>
                            <td>
                              <span className="ref-chip">{u.refId || "—"}</span>
                            </td>
                            <td style={{ fontWeight: 600, color: "#1e293b" }}>
                              {u.buyer_full_name || "—"}
                            </td>
                            <td style={{ color: "#475569" }}>
                              {u.buyer_mobile || "—"}
                            </td>
                            <td style={{ fontWeight: 700, color: "#2563eb" }}>
                              {u.amount ? `₹${u.amount}` : "—"}
                            </td>
                            <td>
                              <span
                                className={`badge ${badgeClass(u.proof_status, "proof")}`}
                              >
                                {u.proof_status || "Pending"}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge ${badgeClass(u.admin_status)}`}
                              >
                                {u.admin_status || "Pending"}
                              </span>
                            </td>
                            <td>
                              <button
                                className="open-btn"
                                onClick={() => openFolder(u)}
                              >
                                Open
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filtered.length === 0 && (
                      <div className="d-empty">No records found.</div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="d-detail">
              <div className="d-dhead">
                <div className="d-dhead-l">
                  <button className="d-back" onClick={() => setSelected(null)}>
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="#374151"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M19 12H5M12 5l-7 7 7 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div>
                    <p className="d-dname">{selected.buyer_full_name || "—"}</p>
                    <p className="d-dmeta">
                      Ref <b>{selected.refId || "—"}</b> &nbsp;·&nbsp; Proof{" "}
                      <b>{selected.proof_status || "Pending"}</b> &nbsp;·&nbsp;
                      Phase{" "}
                      <b>{selected.phase_access ? "Unlocked" : "Locked"}</b>
                    </p>
                  </div>
                </div>
                <div className="d-dactions">
                  <button
                    className="dl-btn blue"
                    onClick={() =>
                      downloadFile(
                        selected.pdf_path,
                        `${selected.refId || "user"}_kyc.pdf`,
                      )
                    }
                  >
                    <svg
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    KYC PDF
                  </button>
                  {selected.indemnity_pdf_path && (
                    <button
                      className="dl-btn blue"
                      onClick={() =>
                        downloadFile(
                          selected.indemnity_pdf_path,
                          `${selected.refId || "user"}_indemnity.pdf`,
                        )
                      }
                    >
                      <svg
                        width="12"
                        height="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Indemnity PDF
                    </button>
                  )}
                  {selected.path_video_verification && (
                    <button
                      className="dl-btn dark"
                    onClick={() =>
                      downloadFile(
                        selected.path_video_verification,
                        `${selected.refId || "user"}_video`,
                      )
                    }
                    >
                      <svg
                        width="12"
                        height="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Video
                    </button>
                  )}
                </div>
              </div>

              <div className="d-dbody">
                <div className="d-media">
                  <p className="sec-label">Identity Documents</p>
                  <div className="d-mgrid">
                    {documentSlots.map((item, i) => (
                      <MediaBox
                        key={`${item.title}-${i}`}
                        title={item.title}
                        path={item.path}
                        onOpen={
                          mediaUrl(item.path)
                            ? () => {
                                const ix = documentItems.findIndex(
                                  (d) =>
                                    d.title === item.title &&
                                    d.path === item.path,
                                );
                                if (ix >= 0) setDocLightboxIndex(ix);
                              }
                            : undefined
                        }
                      />
                    ))}
                  </div>
                  <div className="d-video-sec">
                    <p className="sec-label" style={{ marginTop: 22 }}>
                      Consent Video
                    </p>
                    {selected.path_video_verification ? (
                      <video
                        controls
                        className="d-video"
                        src={mediaUrl(selected.path_video_verification)}
                      />
                    ) : (
                      <div className="d-video-empty">
                        Video not uploaded yet
                      </div>
                    )}
                  </div>
                </div>

                <div className="d-sidebar">
                  <div className="d-icard">
                    <p className="sec-label">User Information</p>
                    {[
                      ["Ref ID", selected.refId],
                      ["Mobile", selected.buyer_mobile],
                      ["Email", selected.buyer_email],
                      ["Aadhaar", selected.buyer_aadhaar_no],
                      ["PAN", selected.buyer_pan_no],
                      ["UTR", selected.utr_reference_no],
                      ["Purpose", selected.q5],
                    ].map(([k, v]) => (
                      <div key={k} className="d-irow">
                        <span className="d-ikey">{k}</span>
                        <span className="d-ival">{v || "—"}</span>
                      </div>
                    ))}
                    <div className="d-irow">
                      <span className="d-ikey">Amount</span>
                      <span className="d-amt">₹{selected.amount || "0"}</span>
                    </div>
                  </div>

                  <div className="d-acard">
                    <p className="d-atitle">Actions</p>

                    {selected.proof_status !== "Not Required" &&
                      selected.proof_status !== "Approved" &&
                      selected.proof_status !== "Rejected" && (
                        <>
                          <button
                            className="abtn green"
                            onClick={() =>
                              updateProofStatus(selected.id, "Approved")
                            }
                          >
                            <svg
                              width="13"
                              height="13"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M20 6L9 17l-5-5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Approve Proof
                          </button>
                          <button
                            className="abtn soft-red"
                            onClick={() =>
                              updateProofStatus(selected.id, "Rejected")
                            }
                          >
                            Reject Proof
                          </button>
                          <div className="a-div" />
                        </>
                      )}

                    <button
                      className="abtn green"
                      onClick={() => updateStatus(selected.id, "Verified")}
                    >
                      <svg
                        width="13"
                        height="13"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M20 6L9 17l-5-5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Verify Final KYC
                    </button>
                    <button
                      className="abtn soft-red"
                      onClick={() => updateStatus(selected.id, "Rejected")}
                    >
                      Reject Final KYC
                    </button>

                    <div className="a-div" />
                    <button
                      className="abtn hard-red"
                      onClick={() =>
                        setConfirm({
                          title: "Delete Record",
                          desc: `Permanently delete all data for ${selected.buyer_full_name}? This cannot be undone.`,
                          onConfirm: () => {
                            setConfirm(null);
                            deleteUser(selected.id);
                          },
                        })
                      }
                    >
                      <svg
                        width="13"
                        height="13"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path
                          d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Delete Record
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {docLightboxIndex !== null && documentItems.length > 0 && (
        <DocumentLightbox
          items={documentItems}
          index={docLightboxIndex}
          onClose={() => setDocLightboxIndex(null)}
          onSelectIndex={setDocLightboxIndex}
        />
      )}

      {confirm && (
        <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />
      )}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
};

export default AdminDashboard;