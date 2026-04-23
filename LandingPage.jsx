import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

/* ─────────────────────── CSS ─────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.lp { min-height: 100vh; font-family: 'DM Sans', sans-serif; background: #05081a; color: #fff; overflow-x: hidden; }

/* ── ANIMATED GRID BG ── */
.lp-grid-bg {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
}

/* ── NAVBAR ── */
.lp-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 48px;
  transition: background 0.3s, border-color 0.3s;
}
.lp-nav.scrolled {
  background: rgba(5,8,26,0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(99,102,241,0.15);
}
.lp-nav-logo {
  display: flex; align-items: center; gap: 12px;
}
.lp-nav-logo-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 20px rgba(99,102,241,0.5);
  flex-shrink: 0;
}
.lp-nav-name {
  font-family: 'Syne', sans-serif; font-weight: 800; font-size: 14px;
  letter-spacing: 0.06em; text-transform: uppercase; line-height: 1.1;
}
.lp-nav-name-top { color: #fff; }
.lp-nav-name-bot { color: #818cf8; font-size: 10px; letter-spacing: 0.14em; }
.lp-nav-right { display: flex; align-items: center; gap: 14px; }
.lp-nav-badge {
  font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
  color: #86efac; background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.25);
  border-radius: 20px; padding: 5px 14px; display: flex; align-items: center; gap: 6px;
}
.lp-nav-badge-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #4ade80;
  animation: lp-blink 2s ease-in-out infinite;
}
@keyframes lp-blink {
  0%,100% { opacity:1; } 50% { opacity:0.3; }
}

/* ── HERO ── */
.lp-hero {
  min-height: 100vh; position: relative; z-index: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 130px 24px 100px; text-align: center;
  overflow: hidden;
}
.lp-hero-orb {
  position: absolute; border-radius: 50%; pointer-events: none;
  filter: blur(80px); opacity: 0.6;
}
.lp-hero-orb-1 {
  width: 600px; height: 600px; top: -10%; left: -10%;
  background: radial-gradient(circle, rgba(99,102,241,0.35), transparent 70%);
  animation: lp-float1 12s ease-in-out infinite;
}
.lp-hero-orb-2 {
  width: 500px; height: 500px; bottom: -5%; right: -8%;
  background: radial-gradient(circle, rgba(59,130,246,0.3), transparent 70%);
  animation: lp-float2 15s ease-in-out infinite;
}
.lp-hero-orb-3 {
  width: 350px; height: 350px; top: 30%; left: 60%;
  background: radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%);
  animation: lp-float3 10s ease-in-out infinite;
}
@keyframes lp-float1 {
  0%,100% { transform: translate(0,0) scale(1); }
  50% { transform: translate(40px,60px) scale(1.08); }
}
@keyframes lp-float2 {
  0%,100% { transform: translate(0,0) scale(1); }
  50% { transform: translate(-50px,-40px) scale(1.05); }
}
@keyframes lp-float3 {
  0%,100% { transform: translate(0,0) scale(1); }
  50% { transform: translate(30px,-50px) scale(1.1); }
}

.lp-hero-pill {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
  color: #a5b4fc; border: 1px solid rgba(99,102,241,0.3);
  background: rgba(99,102,241,0.08);
  border-radius: 30px; padding: 7px 18px; margin-bottom: 32px;
}
.lp-pill-sparkle { font-size: 13px; }

.lp-company-name {
  font-family: 'Syne', sans-serif; font-weight: 800;
  font-size: clamp(13px, 2.4vw, 22px);
  letter-spacing: 0.22em; text-transform: uppercase;
  color: #818cf8; margin-bottom: 18px;
  display: flex; align-items: center; justify-content: center; gap: 10px;
}
.lp-company-line {
  flex: 1; max-width: 80px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(129,140,248,0.5));
}
.lp-company-line.right { background: linear-gradient(90deg, rgba(129,140,248,0.5), transparent); }

.lp-hero-title {
  font-family: 'Syne', sans-serif; font-weight: 800;
  font-size: clamp(42px, 8vw, 90px);
  line-height: 1.0; letter-spacing: -0.03em;
  margin-bottom: 8px;
}
.lp-hero-title-white { color: #f0f4ff; }
.lp-hero-title-grad {
  background: linear-gradient(135deg, #60a5fa 0%, #818cf8 35%, #c084fc 65%, #f472b6 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  background-size: 200% 200%;
  animation: lp-grad-shift 6s ease infinite;
}
@keyframes lp-grad-shift {
  0%,100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.lp-hero-sub {
  font-size: clamp(15px, 2vw, 19px); color: #64748b; line-height: 1.75;
  max-width: 580px; margin: 20px auto 48px; font-weight: 400;
}
.lp-hero-sub em { color: #94a3b8; font-style: normal; }

.lp-cta-group { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; margin-bottom: 60px; }

.lp-btn-primary {
  position: relative; display: inline-flex; align-items: center; gap: 12px;
  font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: #fff;
  padding: 16px 36px; border: none; border-radius: 50px; cursor: pointer; overflow: hidden;
  background: linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6);
  background-size: 200% 200%;
  animation: lp-btn-grad 4s ease infinite;
  box-shadow: 0 0 0 1px rgba(139,92,246,0.3), 0 8px 32px rgba(99,102,241,0.4), 0 0 60px rgba(99,102,241,0.15);
  transition: transform 0.2s, box-shadow 0.2s;
}
@keyframes lp-btn-grad {
  0%,100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.lp-btn-primary::before {
  content: ''; position: absolute; inset: 1px; border-radius: 50px;
  background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
  pointer-events: none;
}
.lp-btn-primary:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 0 0 1px rgba(139,92,246,0.5), 0 16px 48px rgba(99,102,241,0.55), 0 0 80px rgba(99,102,241,0.2); }
.lp-btn-primary:active { transform: translateY(0) scale(0.99); }
.lp-btn-arrow-wrap {
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;
}

.lp-btn-outline {
  display: inline-flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 500; color: #94a3b8;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 50px; padding: 15px 28px; cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}
.lp-btn-outline:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color: #e2e8f0; }

/* ── TRUST STRIP ── */
.lp-trust-strip {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; flex-wrap: wrap;
}
.lp-trust-chip {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 500; color: #475569;
  padding: 6px 14px; border-radius: 20px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
}
.lp-trust-chip-icon { color: #4ade80; }

/* ── STATS ── */
.lp-stats {
  position: relative; z-index: 1;
  padding: 0 24px 100px; max-width: 1000px; margin: 0 auto;
}
.lp-stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
  background: rgba(255,255,255,0.07); border-radius: 24px; overflow: hidden;
  border: 1px solid rgba(255,255,255,0.07);
}
.lp-stat {
  background: rgba(255,255,255,0.03); padding: 36px 24px; text-align: center;
  backdrop-filter: blur(10px);
  transition: background 0.2s;
}
.lp-stat:hover { background: rgba(99,102,241,0.08); }
.lp-stat-num {
  font-family: 'Syne', sans-serif; font-weight: 800;
  font-size: clamp(28px, 4vw, 44px); letter-spacing: -0.02em;
  background: linear-gradient(135deg, #60a5fa, #818cf8);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  margin-bottom: 6px;
}
.lp-stat-label { font-size: 12px; color: #475569; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; }

/* ── STEPS ── */
.lp-steps { position: relative; z-index: 1; padding: 0 24px 100px; max-width: 1000px; margin: 0 auto; }
.lp-section-eyebrow {
  text-align: center; font-size: 11px; font-weight: 700;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: #818cf8; margin-bottom: 14px;
}
.lp-section-heading {
  text-align: center; font-family: 'Syne', sans-serif; font-weight: 800;
  font-size: clamp(26px, 4vw, 42px); letter-spacing: -0.025em;
  color: #f0f4ff; margin-bottom: 10px;
}
.lp-section-sub { text-align: center; font-size: 15px; color: #475569; line-height: 1.7; margin-bottom: 60px; max-width: 480px; margin-left: auto; margin-right: auto; }

.lp-steps-row {
  display: flex; align-items: flex-start; gap: 0;
}
.lp-step-item { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; }
.lp-step-icon-wrap {
  position: relative; margin-bottom: 20px;
}
.lp-step-ring {
  position: absolute; inset: -6px; border-radius: 50%;
  border: 1.5px solid rgba(99,102,241,0.3);
  animation: lp-ring-spin 8s linear infinite;
}
@keyframes lp-ring-spin { to { transform: rotate(360deg); } }
.lp-step-circle {
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; color: #fff;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  box-shadow: 0 0 0 8px rgba(99,102,241,0.12), 0 8px 28px rgba(99,102,241,0.35);
  position: relative; z-index: 1;
}
.lp-step-connector {
  flex: 1; height: 2px; margin-top: 32px;
  background: linear-gradient(90deg, rgba(99,102,241,0.6), rgba(59,130,246,0.6));
  position: relative;
}
.lp-step-connector::after {
  content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, rgba(99,102,241,0.6), rgba(59,130,246,0.6));
  animation: lp-line-flow 3s linear infinite;
  background-size: 200% 100%;
}
@keyframes lp-line-flow {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.lp-step-label {
  font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px;
  color: #f0f4ff; margin-bottom: 6px;
}
.lp-step-sublabel { font-size: 12px; color: #475569; line-height: 1.5; max-width: 140px; }

/* ── FEATURES ── */
.lp-features { position: relative; z-index: 1; padding: 0 24px 100px; max-width: 1100px; margin: 0 auto; }
.lp-cards-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
}
.lp-feat-card {
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px; padding: 30px 26px;
  position: relative; overflow: hidden;
  transition: border-color 0.25s, background 0.25s, transform 0.25s, box-shadow 0.25s;
}
.lp-feat-card::before {
  content: ''; position: absolute; inset: 0; border-radius: 20px; opacity: 0;
  background: radial-gradient(circle at 30% 30%, rgba(99,102,241,0.1), transparent 60%);
  transition: opacity 0.3s;
}
.lp-feat-card:hover { border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.06); transform: translateY(-6px); box-shadow: 0 20px 60px rgba(99,102,241,0.15); }
.lp-feat-card:hover::before { opacity: 1; }
.lp-feat-card-icon {
  width: 50px; height: 50px; border-radius: 14px; margin-bottom: 18px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(59,130,246,0.12));
  border: 1px solid rgba(99,102,241,0.18);
  position: relative; z-index: 1;
}
.lp-feat-card-title {
  font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px;
  color: #f0f4ff; margin-bottom: 10px; position: relative; z-index: 1;
}
.lp-feat-card-desc { font-size: 13.5px; color: #475569; line-height: 1.7; position: relative; z-index: 1; }

/* ── CTA SECTION ── */
.lp-cta-section { position: relative; z-index: 1; padding: 0 24px 100px; }
.lp-cta-inner {
  max-width: 860px; margin: 0 auto;
  background: linear-gradient(135deg, rgba(99,102,241,0.14), rgba(59,130,246,0.1), rgba(139,92,246,0.12));
  border: 1px solid rgba(99,102,241,0.22);
  border-radius: 32px; padding: 72px 48px; text-align: center;
  position: relative; overflow: hidden;
}
.lp-cta-inner::before {
  content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 60%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent);
}
.lp-cta-orb {
  position: absolute; bottom: -100px; right: -80px;
  width: 300px; height: 300px; border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%);
  filter: blur(40px); pointer-events: none;
}
.lp-cta-orb-2 {
  position: absolute; top: -80px; left: -60px;
  width: 250px; height: 250px; border-radius: 50%;
  background: radial-gradient(circle, rgba(59,130,246,0.18), transparent 70%);
  filter: blur(40px); pointer-events: none;
}
.lp-cta-title {
  font-family: 'Syne', sans-serif; font-weight: 800;
  font-size: clamp(28px, 4.5vw, 48px); letter-spacing: -0.025em;
  color: #f0f4ff; margin-bottom: 16px; position: relative; z-index: 1;
}
.lp-cta-sub {
  font-size: 16px; color: #475569; line-height: 1.7;
  max-width: 520px; margin: 0 auto 44px; position: relative; z-index: 1;
}
.lp-cta-company {
  font-family: 'Syne', sans-serif; font-weight: 700;
  font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase;
  color: #818cf8; margin-bottom: 32px; position: relative; z-index: 1;
}

/* ── FOOTER ── */
.lp-footer {
  position: relative; z-index: 1;
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 36px 48px;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
}
.lp-footer-brand { display: flex; align-items: center; gap: 10px; }
.lp-footer-brand-icon {
  width: 28px; height: 28px; border-radius: 8px; opacity: 0.7;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  display: flex; align-items: center; justify-content: center;
}
.lp-footer-brand-text { display: flex; flex-direction: column; }
.lp-footer-brand-name {
  font-family: 'Syne', sans-serif; font-weight: 800; font-size: 12px;
  letter-spacing: 0.08em; text-transform: uppercase; color: #475569;
}
.lp-footer-brand-pvt { font-size: 10px; color: #334155; letter-spacing: 0.06em; text-transform: uppercase; }
.lp-footer-copy { font-size: 12px; color: #334155; }
.lp-footer-links { display: flex; gap: 24px; }
.lp-footer-link { font-size: 12px; color: #334155; text-decoration: none; transition: color 0.15s; cursor: pointer; }
.lp-footer-link:hover { color: #64748b; }

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  .lp-cards-grid { grid-template-columns: repeat(2, 1fr); }
  .lp-stats-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .lp-nav { padding: 14px 20px; }
  .lp-hero { padding: 110px 20px 80px; }
  .lp-cards-grid { grid-template-columns: 1fr; }
  .lp-steps-row { flex-direction: column; align-items: center; gap: 32px; }
  .lp-step-connector { display: none; }
  .lp-cta-inner { padding: 48px 24px; }
  .lp-footer { padding: 24px 20px; flex-direction: column; align-items: flex-start; }
  .lp-stats-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 400px) {
  .lp-company-name { font-size: 10px; letter-spacing: 0.12em; }
}
`;

/* ─────────────────────── DATA ─────────────────────── */
const FEATURES = [
  {
    icon: <svg width="22" height="22" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Bank-Grade Security', desc: 'AES-256 end-to-end encryption protects all your documents and personal data throughout the process.',
  },
  {
    icon: <svg width="22" height="22" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: '3-Step Verification', desc: 'Streamlined three-step flow: Declaration → Documents → Video. Complete your KYC in under 5 minutes.',
  },
  {
    icon: <svg width="22" height="22" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Fast Approval', desc: 'Our dedicated admin team reviews every application swiftly so you can start trading without delay.',
  },
  {
    icon: <svg width="22" height="22" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01" strokeLinecap="round"/></svg>,
    title: 'Mobile Ready', desc: 'Designed for every screen — smartphone, tablet, or desktop. Seamless experience everywhere.',
  },
  {
    icon: <svg width="22" height="22" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'VDASP Compliant', desc: 'Fully aligned with VDASP regulatory requirements. Auto-generates a signed indemnity PDF on completion.',
  },
  {
    icon: <svg width="22" height="22" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0" strokeLinecap="round"/></svg>,
    title: 'Expert Support', desc: 'Our compliance team is available to guide you through every step of the verification journey.',
  },
];

const STEPS = [
  { n: '1', label: 'Declaration', sub: 'Fill personal details & answer compliance questions' },
  { n: '2', label: 'Documents', sub: 'Upload Aadhaar, PAN card & selfie photo' },
  { n: '3', label: 'Verification', sub: 'Record a short video liveness check' },
];

const STATS = [
  { num: '100%', label: 'Data Encrypted' },
  { num: '< 5 min', label: 'Avg. Completion' },
  { num: '24h', label: 'Review Window' },
  { num: 'VDASP', label: 'Certified Portal' },
];

/* ─────────────────────── PARTICLES ─────────────────────── */
const PARTICLE_COUNT = 28;
const Particles = () => {
  const dots = React.useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 1,
      dur: Math.random() * 14 + 8,
      delay: Math.random() * 6,
      opacity: Math.random() * 0.4 + 0.1,
    })), []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {dots.map(d => (
        <motion.div
          key={d.id}
          style={{
            position: 'absolute',
            left: `${d.x}%`, top: `${d.y}%`,
            width: d.size, height: d.size,
            borderRadius: '50%',
            background: '#818cf8',
            opacity: d.opacity,
          }}
          animate={{ y: [0, -30, 0], opacity: [d.opacity, d.opacity * 1.8, d.opacity] }}
          transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

/* ─────────────────────── COUNTER ─────────────────────── */
const useInView = (ref) => {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return inView;
};

/* ─────────────────────── COMPONENT ─────────────────────── */
const LandingPage = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const stagger = (i, base = 0.06) => ({ duration: 0.55, delay: i * base, ease: [0.22, 1, 0.36, 1] });

  return (
    <div className="lp">
      <style>{CSS}</style>
      <div className="lp-grid-bg" />

      {/* ══ NAV ══ */}
      <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
        <motion.div
          className="lp-nav-logo"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="lp-nav-logo-icon">
            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="lp-nav-name">
            <div className="lp-nav-name-top">COINORA VDASP</div>
            <div className="lp-nav-name-bot">PVT LTD · KYC Portal</div>
          </div>
        </motion.div>

        <motion.div
          className="lp-nav-right"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="lp-nav-badge">
            <div className="lp-nav-badge-dot" />
            Live & Secure
          </div>
        </motion.div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="lp-hero">
        <div className="lp-hero-orb lp-hero-orb-1" />
        <div className="lp-hero-orb lp-hero-orb-2" />
        <div className="lp-hero-orb lp-hero-orb-3" />
        <Particles />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="lp-hero-pill">
            <span className="lp-pill-sparkle">✦</span>
            Official VDASP KYC Platform
          </div>
        </motion.div>

        {/* Company name */}
        <motion.div
          className="lp-company-name"
          initial={{ opacity: 0, letterSpacing: '0.4em' }}
          animate={{ opacity: 1, letterSpacing: '0.22em' }}
          transition={{ duration: 0.9, delay: 0.1 }}
        >
          <div className="lp-company-line" />
          COINORA VDASP PVT LTD
          <div className="lp-company-line right" />
        </motion.div>

        <motion.h1
          className="lp-hero-title"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="lp-hero-title-white">Verify.</span>{' '}
          <span className="lp-hero-title-grad">Comply.</span>
          <br />
          <span className="lp-hero-title-white">Trade.</span>
        </motion.h1>

        <motion.p
          className="lp-hero-sub"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Complete your <em>Know Your Customer</em> verification in just 3 steps.
          Secure, fast, and fully compliant with VDASP regulations.
        </motion.p>

        <motion.div
          className="lp-cta-group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42 }}
        >
          <button className="lp-btn-primary" onClick={onGetStarted}>
            Start KYC Verification
            <span className="lp-btn-arrow-wrap">
              <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
          <button className="lp-btn-outline" onClick={onGetStarted}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Takes under 5 mins
          </button>
        </motion.div>

        <motion.div
          className="lp-trust-strip"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.56 }}
        >
          {['256-bit Encrypted', 'VDASP Certified', 'Zero Data Sharing', 'Instant Reference ID'].map((t) => (
            <div key={t} className="lp-trust-chip">
              <svg className="lp-trust-chip-icon" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ══ STATS ══ */}
      <section className="lp-stats" ref={statsRef}>
        <div className="lp-stats-grid">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              className="lp-stat"
              initial={{ opacity: 0, y: 24 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={stagger(i)}
            >
              <div className="lp-stat-num">{s.num}</div>
              <div className="lp-stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="lp-steps">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="lp-section-eyebrow">How It Works</div>
          <div className="lp-section-heading">3 Steps to Compliance</div>
          <div className="lp-section-sub">Simple, guided, and done in minutes — from declaration to approval.</div>
        </motion.div>

        <div className="lp-steps-row">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <motion.div
                className="lp-step-item"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.18 }}
              >
                <div className="lp-step-icon-wrap">
                  <div className="lp-step-ring" />
                  <div className="lp-step-circle">{s.n}</div>
                </div>
                <div className="lp-step-label">{s.label}</div>
                <div className="lp-step-sublabel">{s.sub}</div>
              </motion.div>
              {i < STEPS.length - 1 && <div className="lp-step-connector" />}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="lp-features">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="lp-section-eyebrow">Why Choose Us</div>
          <div className="lp-section-heading">Built for Trust</div>
          <div className="lp-section-sub">Every feature is designed to keep your data safe and your experience smooth.</div>
        </motion.div>

        <div className="lp-cards-grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              className="lp-feat-card"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={stagger(i, 0.07)}
            >
              <div className="lp-feat-card-icon">{f.icon}</div>
              <div className="lp-feat-card-title">{f.title}</div>
              <div className="lp-feat-card-desc">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ BOTTOM CTA ══ */}
      <section className="lp-cta-section">
        <motion.div
          className="lp-cta-inner"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="lp-cta-orb" />
          <div className="lp-cta-orb-2" />
          <div className="lp-cta-company">COINORA VDASP PVT LTD</div>
          <h2 className="lp-cta-title">Ready to Get Verified?</h2>
          <p className="lp-cta-sub">
            Join traders who trust Coinora's secure KYC platform. Your data stays private. Your identity stays verified.
          </p>
          <button className="lp-btn-primary" onClick={onGetStarted} style={{ margin: '0 auto' }}>
            Begin Verification Now
            <span className="lp-btn-arrow-wrap">
              <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
        </motion.div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="lp-footer">
        <div className="lp-footer-brand">
          <div className="lp-footer-brand-icon">
            <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="lp-footer-brand-text">
            <div className="lp-footer-brand-name">Coinora VDASP</div>
            <div className="lp-footer-brand-pvt">Private Limited</div>
          </div>
        </div>
        <div className="lp-footer-copy">© {new Date().getFullYear()} Coinora VDASP Pvt Ltd. All rights reserved.</div>
        <div className="lp-footer-links">
          <span className="lp-footer-link">Privacy Policy</span>
          <span className="lp-footer-link">Terms of Use</span>
          <span className="lp-footer-link">Support</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
