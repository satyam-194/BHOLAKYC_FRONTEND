import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import PhaseA from './PhaseA';
import PhaseB from './PhaseB';
import PhaseC from './PhaseC';
import { useToast } from './hooks/useToast.js';
import KycToast from './components/KycToast.jsx';


const fadeUp = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit:    { opacity: 0, y: -16, scale: 0.98 }
};
const fadeUpTransition = { duration: 0.4, ease: 'easeOut' };

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .kyc-overlay-root *, .kyc-overlay-root *::before, .kyc-overlay-root *::after {
    box-sizing: border-box; margin: 0; padding: 0;
  }
  .kyc-overlay-root {
    min-height: 100vh;
    background: #f0f2f7;
    font-family: 'DM Sans', sans-serif;
  }

  .kyc-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid #e4e8f0;
    padding: 14px 24px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .kyc-logo {
    font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: 15px; letter-spacing: 0.05em;
    text-transform: uppercase; color: #0f172a;
    display: flex; align-items: center; gap: 8px;
  }
  .kyc-logo-dot {
    width: 18px; height: 18px; border-radius: 5px;
    background: #2563eb; flex-shrink: 0;
  }
  .kyc-logo-accent { color: #2563eb; }
  .kyc-header-badge {
    font-size: 10px; font-weight: 500;
    letter-spacing: 0.1em; text-transform: uppercase;
    background: #eff6ff; color: #1d4ed8;
    border: 1px solid #bfdbfe; border-radius: 20px; padding: 4px 10px;
  }

  .kyc-status-page {
    min-height: calc(100vh - 57px);
    display: flex; align-items: center; justify-content: center;
    padding: 24px 16px 60px;
  }
  .kyc-status-card {
    background: #fff; border-radius: 24px;
    border: 1px solid #e4e8f0;
    box-shadow: 0 4px 24px rgba(15,23,42,0.07), 0 1px 4px rgba(15,23,42,0.04);
    width: 100%; max-width: 460px;
    padding: 40px 36px; text-align: center;
    overflow: hidden;
  }
  .kyc-status-icon-wrap {
    width: 72px; height: 72px; border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px;
  }
  .kyc-status-icon-wrap.red   { background: #fef2f2; border: 1.5px solid #fecaca; }
  .kyc-status-icon-wrap.amber { background: #fffbeb; border: 1.5px solid #fde68a; }
  .kyc-status-icon-wrap.green { background: #f0fdf4; border: 1.5px solid #bbf7d0; }

  .kyc-status-title {
    font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: clamp(20px, 5vw, 26px);
    text-transform: uppercase; letter-spacing: -0.02em;
    color: #0f172a; margin-bottom: 10px;
  }
  .kyc-status-title.red   { color: #dc2626; }
  .kyc-status-title.amber { color: #d97706; }
  .kyc-status-title.green { color: #16a34a; }

  .kyc-status-desc {
    font-size: 14px; color: #64748b; line-height: 1.7;
    margin-bottom: 0;
  }

  .kyc-rejection-reasons {
    margin: 20px 0 0; text-align: left;
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: 14px; padding: 16px 18px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .kyc-rejection-reason-item {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; color: #7f1d1d; line-height: 1.5;
  }
  .kyc-rejection-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #ef4444; flex-shrink: 0; margin-top: 6px;
  }

  .kyc-ref-badge {
    margin: 20px 0 0;
    background: #f0f6ff; border: 1px solid #bfdbfe;
    border-radius: 12px; padding: 12px 16px;
    font-size: 13px; color: #374151;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .kyc-ref-value {
    font-family: 'Syne', sans-serif; font-weight: 700;
    font-size: 14px; color: #2563eb; letter-spacing: 0.06em;
  }

  .kyc-approval-form {
    margin-top: 24px; text-align: left;
  }
  .kyc-approval-divider {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px;
  }
  .kyc-approval-divider-line {
    flex: 1; height: 1px; background: #e4e8f0;
  }
  .kyc-approval-divider-text {
    font-size: 10px; font-weight: 600; color: #94a3b8;
    letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap;
  }
  .kyc-approval-fields { display: flex; flex-direction: column; gap: 10px; }
  .kyc-approval-input {
    width: 100%; background: #fff;
    border: 1.5px solid #e2e8f0; border-radius: 10px;
    padding: 11px 14px; font-size: 13px;
    font-family: 'DM Sans', sans-serif; font-weight: 400;
    color: #1e293b; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .kyc-approval-input::placeholder { color: #b0bec5; }
  .kyc-approval-input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }

  .kyc-btn-primary {
    width: 100%; background: #2563eb; color: #fff;
    border: none; border-radius: 12px;
    padding: 14px 20px; margin-top: 16px;
    font-family: 'Syne', sans-serif; font-size: 12px;
    font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 8px 20px rgba(37,99,235,0.26);
    transition: background 0.15s, transform 0.1s;
  }
  .kyc-btn-primary:hover { background: #1d4ed8; }
  .kyc-btn-primary:active { transform: scale(0.99); }
  .kyc-btn-primary:disabled { background: #e2e8f0; color: #94a3b8; box-shadow: none; cursor: not-allowed; }
  .kyc-btn-primary.red { background: #dc2626; box-shadow: 0 8px 20px rgba(220,38,38,0.22); }
  .kyc-btn-primary.red:hover { background: #b91c1c; }

  .kyc-btn-ghost {
    background: none; border: none; cursor: pointer;
    font-size: 11px; font-weight: 500; color: #94a3b8;
    letter-spacing: 0.06em; text-transform: uppercase;
    padding: 8px; margin-top: 4px; width: 100%;
    transition: color 0.15s;
  }
  .kyc-btn-ghost:hover { color: #374151; }

  .kyc-loading-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(8px);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px;
  }
  .kyc-spinner {
    width: 52px; height: 52px; border-radius: 50%;
    border: 5px solid #dbeafe;
    border-top-color: #2563eb;
    animation: kyc-spin 0.85s linear infinite;
  }
  @keyframes kyc-spin { to { transform: rotate(360deg); } }
  .kyc-loading-label {
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase; color: #1d4ed8;
  }

  .kyc-success-ref {
    margin: 20px 0 0;
    background: #f8fafc; border: 1px solid #e4e8f0;
    border-radius: 12px; padding: 14px 18px;
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; text-align: center;
  }
  .kyc-success-ref span {
    display: block; margin-top: 4px;
    font-family: 'Syne', sans-serif; font-size: 15px;
    font-weight: 700; color: #0f172a; letter-spacing: 0.04em;
  }

  @media (max-width: 520px) {
    .kyc-header { padding: 12px 16px; flex-wrap: wrap; gap: 8px; }
    .kyc-logo { font-size: 13px; }
    .kyc-status-page { padding: 16px 12px 48px; }
    .kyc-status-card { padding: 28px 18px; border-radius: 20px; }
  }
`;

const getRejectionReasons = (answers) => {
  const reasons = [];
  if (answers?.q1 === 'No')
    reasons.push('Third-party funds are not permitted. Only personal funds may be used.');
  if (answers?.q2 === 'Not Confirmed')
    reasons.push('Funds must be confirmed as legitimate and free from illegal activity.');
  if (answers?.q3 === 'Student')
    reasons.push('Student profession does not meet eligibility requirements for this service.');
  if (answers?.q4 === 'No')
    reasons.push('You must agree to the 24-hour refund policy to proceed.');
  if (answers?.q5 === 'Buy from Coinora and sell via P2P')
    reasons.push('Re-selling USDT purchased from Coinora via P2P is not permitted.');
  return reasons;
};

const KYCHeader = () => (
  <header className="kyc-header">
    <div className="kyc-logo">
      <div className="kyc-logo-dot" />
      COINORA <span className="kyc-logo-accent">&nbsp;VDASP</span>
    </div>
    <div className="kyc-header-badge">🔒 Secure KYC</div>
  </header>
);

const RejectionScreen = ({ reasons }) => (
  <div className="kyc-overlay-root">
    <style>{STYLES}</style>
    <KYCHeader />
    <div className="kyc-status-page">
      <motion.div
        className="kyc-status-card"
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <motion.div
          className="kyc-status-icon-wrap red"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 14, delay: 0.1 }}
        >
          <svg width="32" height="32" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round"/>
          </svg>
        </motion.div>

        <h2 className="kyc-status-title red">Application Rejected</h2>
        <p className="kyc-status-desc">
          Your declaration could not be accepted. Please review the reasons below before trying again.
        </p>

        {reasons.length > 0 && (
          <div className="kyc-rejection-reasons">
            {reasons.map((r, i) => (
              <div key={i} className="kyc-rejection-reason-item">
                <div className="kyc-rejection-dot" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}

        <button className="kyc-btn-primary red" style={{ marginTop: 24 }} onClick={() => window.location.reload()}>
          Start Over
          <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </motion.div>
    </div>
  </div>
);

const AwaitingApprovalScreen = ({ refId, resumeRefId, setResumeRefId, resumeMobile, setResumeMobile, onCheck, loading }) => (
  <div className="kyc-overlay-root">
    <style>{STYLES}</style>
    <KYCHeader />
    <div className="kyc-status-page">
      <motion.div
        className="kyc-status-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="kyc-status-icon-wrap amber">
          <svg width="32" height="32" fill="none" stroke="#d97706" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 className="kyc-status-title amber">Pending Approval</h2>
        <p className="kyc-status-desc">
          Your Phase 1 declaration has been submitted. Please wait for admin review before proceeding to document upload.
        </p>

        <div className="kyc-ref-badge">
          <svg width="14" height="14" fill="none" stroke="#2563eb" strokeWidth="1.5" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="16" rx="2"/>
            <path d="M8 9h8M8 13h5" strokeLinecap="round"/>
          </svg>
          Your Reference ID: <span className="kyc-ref-value">{refId}</span>
        </div>

        <div className="kyc-approval-form">
          <div className="kyc-approval-divider">
            <div className="kyc-approval-divider-line" />
            <span className="kyc-approval-divider-text">Check approval status</span>
            <div className="kyc-approval-divider-line" />
          </div>
          <div className="kyc-approval-fields">
            <input
              type="text"
              value={resumeRefId}
              onChange={e => setResumeRefId(e.target.value.toUpperCase())}
              placeholder="Enter CN Reference ID"
              className="kyc-approval-input"
            />
            <input
              type="tel"
              value={resumeMobile}
              onChange={e => setResumeMobile(e.target.value)}
              placeholder="Enter Registered Mobile Number"
              className="kyc-approval-input"
            />
          </div>
          <button type="button" className="kyc-btn-primary" onClick={onCheck} disabled={loading}>
            {loading ? 'Checking…' : 'Check & Continue'}
            {!loading && (
              <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  </div>
);

const SuccessScreen = ({ refId, apiBaseUrl, pdfPath, indemnityPdfPath }) => (
  <div className="kyc-overlay-root">
    <style>{STYLES}</style>
    <KYCHeader />
    <div className="kyc-status-page">
      <motion.div
        className="kyc-status-card"
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <motion.div
          className="kyc-status-icon-wrap green"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 14, delay: 0.1 }}
        >
          <svg width="32" height="32" fill="none" stroke="#16a34a" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>

        <h2 className="kyc-status-title green">KYC Complete</h2>
        <p className="kyc-status-desc">
          Your documents and verification have been submitted successfully. Our admin team will complete the review shortly.
        </p>

        <div className="kyc-success-ref">
          Transaction Reference
          <span>{refId || '—'}</span>
        </div>

        {(pdfPath || indemnityPdfPath) && apiBaseUrl && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            {pdfPath && (
              <a
                href={`${apiBaseUrl}/storage/${pdfPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="kyc-btn-ghost"
                style={{ fontWeight: 600, color: '#2563eb' }}
              >
                View KYC summary PDF
              </a>
            )}
            {indemnityPdfPath && (
              <a
                href={`${apiBaseUrl}/storage/${indemnityPdfPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="kyc-btn-ghost"
                style={{ fontWeight: 600, color: '#2563eb' }}
              >
                View indemnity bond PDF
              </a>
            )}
          </div>
        )}

        <button className="kyc-btn-primary" style={{ marginTop: 24 }} onClick={() => window.location.reload()}>
          Submit Another Application
        </button>
      </motion.div>
    </div>
  </div>
);

const LoadingOverlay = () => (
  <motion.div
    className="kyc-loading-overlay"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="kyc-spinner" />
    <span className="kyc-loading-label">Securing your data…</span>
  </motion.div>
);

function isProofRejected(status) {
  if (status == null || status === '') return false;
  return String(status).trim().toLowerCase() === 'rejected';
}

const UserKYC = ({ apiBaseUrl, onNavigate }) => {
  const { toast, showToast } = useToast();
  const [currentStep,      setCurrentStep]      = useState(1);
  const [rejectionReasons, setRejectionReasons] = useState([]);
  const [isRejected,       setIsRejected]       = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const [resumeRefId,      setResumeRefId]      = useState('');
  const [resumeMobile,     setResumeMobile]     = useState('');
  const [recordId,         setRecordId]         = useState('');
  const [phaseAResetKey,   setPhaseAResetKey]   = useState(0);

  const [userData, setUserData] = useState({
    fullname: '', email: '', buyer_mobile: '', amount: '', utr: '', refId: '',
    q1: '', q2: '', q3: '', q4: '', q5: '',
    aadhaar_no: '', pan_no: '',
    aadhaarFrontFile: null, aadhaarBackFile: null, panCardFile: null, selfieFile: null,
    pdf_path: '', indemnity_pdf_path: ''
  });

  const KYC_PHASE_A_CACHE = 'kyc_phase_a_data';

  /** Keep wizard step aligned with URL hash (browser back/forward + onNavigate). */
  useEffect(() => {
    const syncStepFromHash = () => {
      const raw = (window.location.hash || '')
        .replace(/^#\/?/, '')
        .replace(/\/$/, '');
      const phase = raw.split('/')[0] || '';
      if (phase === 'PhaseA') {
        setCurrentStep(1);
        return;
      }
      if (phase === 'PhaseB' && recordId) {
        setCurrentStep(2);
        return;
      }
      if (phase === 'PhaseC' && recordId) {
        setCurrentStep(3);
      }
    };
    syncStepFromHash();
    window.addEventListener('hashchange', syncStepFromHash);
    return () => window.removeEventListener('hashchange', syncStepFromHash);
  }, [recordId]);

  const phase1AllowsStep2 = (data) => {
    const phaseAccess =
      data.phase_access === true ||
      data.phase_access === 'true' ||
      String(data.phase_access).toLowerCase() === 'true';
    return data.proof_status === 'Not Required' || phaseAccess;
  };

  const resetToPhaseAAfterProofRejection = () => {
    showToast(
      'Your purpose proof was rejected. Please complete Phase 1 again from the beginning.',
      'error',
      7500
    );
    try {
      localStorage.removeItem(KYC_PHASE_A_CACHE);
    } catch {
      /* ignore */
    }
    setPhaseAResetKey((k) => k + 1);
    setAwaitingApproval(false);
    setCurrentStep(1);
    if (onNavigate) onNavigate('#PhaseA');
  };

  const handlePhase1Submit = (data) => {
    if (isProofRejected(data.proof_status)) {
      resetToPhaseAAfterProofRejection();
      return;
    }

    setUserData((prev) => ({ ...prev, ...data }));

    if (phase1AllowsStep2(data)) {
      setRecordId(String(data.id || ''));
      setCurrentStep(2);
      if (onNavigate) onNavigate('#PhaseB');
    } else {
      setResumeRefId((data.refId || '').toString().toUpperCase().trim());
      setResumeMobile((data.buyer_mobile || '').trim());
      setAwaitingApproval(true);
    }
  };

  const handleContinueFromPhase1 = async () => {
    const raw = localStorage.getItem(KYC_PHASE_A_CACHE);
    if (!raw) {
      showToast('No saved submission found. Complete Phase 1 again.', 'warning');
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      showToast('Could not read saved progress. Try Start Over.', 'error');
      return;
    }

    const refId = String(parsed.refId || '').trim();
    const buyer_mobile = String(parsed.buyer_mobile || '').trim();
    if (!refId || !buyer_mobile) {
      showToast('Saved data is missing Reference ID or mobile. Use Start Over.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const { data: res } = await axios.post(`${apiBaseUrl}/api/check-phase-access`, {
        refId,
        buyer_mobile
      });

      if (!res.success) {
        showToast(res.error || 'Could not verify your record.', 'error');
        return;
      }

      if (isProofRejected(res.proof_status)) {
        resetToPhaseAAfterProofRejection();
        return;
      }

      const name = res.buyer_full_name || parsed.fullname || '';
      handlePhase1Submit({
        ...parsed,
        id: res.id,
        refId: res.refId,
        proof_status: res.proof_status,
        phase_access: res.phase_access,
        buyer_full_name: name,
        fullname: name,
        buyer_mobile
      });
    } catch (err) {
      showToast(
        err?.response?.data?.error || err?.message || 'Could not resume. Check network and try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePhaseAReject = (answers) => {
    setRejectionReasons(getRejectionReasons(answers));
    setIsRejected(true);
  };

  const handleCheckApproval = async () => {
    if (!resumeRefId.trim() || !resumeMobile.trim()) {
      showToast('Enter your Reference ID (e.g. CN-12) and the same mobile number you used in Phase 1.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const { data: res } = await axios.post(`${apiBaseUrl}/api/check-phase-access`, {
        refId: resumeRefId,
        buyer_mobile: resumeMobile
      });

      if (res.success) {
        if (isProofRejected(res.proof_status)) {
          resetToPhaseAAfterProofRejection();
          return;
        }
        if (res.phase_access) {
          setRecordId(res.id);
          setUserData(prev => ({ 
            ...prev, 
            refId: res.refId, 
            buyer_mobile: resumeMobile,
            buyer_full_name: res.buyer_full_name,
            fullname: res.buyer_full_name || prev.fullname,
            amount: prev.amount, 
            utr: prev.utr
          }));
          setAwaitingApproval(false);
          setCurrentStep(2);
          showToast('Approved — you can upload documents in the next step.', 'success', 3800);
          if (onNavigate) onNavigate('#PhaseB');
        } else {
          showToast(
            `Status: ${res.proof_status || 'Pending'}. Wait for admin approval or contact support if it stays pending.`,
            'info',
            5500
          );
        }
      }
    } catch (err) {
      showToast(
        err?.response?.data?.error || 'Could not verify approval. Check Reference ID, mobile, and try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePhaseBSubmit = (payload) => {
    if (payload && typeof payload === 'object') {
      setUserData((prev) => ({
        ...prev,
        ...payload,
        utr: payload.utr != null ? String(payload.utr) : prev.utr,
      }));
    }
    setCurrentStep(3);
    if (onNavigate) onNavigate('#PhaseC');
  };

  const handleFinalSubmit = async (videoBlob) => {
    if (videoBlob == null) {
      setCurrentStep(4);
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('aadhaar_no', userData.aadhaar_no);
      formData.append('pan_no',     userData.pan_no);

      if (userData.aadhaarFrontFile) formData.append('aadhaarFront', userData.aadhaarFrontFile);
      if (userData.aadhaarBackFile)  formData.append('aadhaarBack',  userData.aadhaarBackFile);
      if (userData.panCardFile)      formData.append('panCard',      userData.panCardFile);
      if (userData.selfieFile)       formData.append('selfie',       userData.selfieFile);
      if (videoBlob)                 formData.append('video',        videoBlob, 'video.webm');

      const { data: res } = await axios.post(
        `${apiBaseUrl}/api/finalize-kyc/${recordId}`,
        formData,
        { timeout: 120000, headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (res.success) {
        setUserData((prev) => ({
          ...prev,
          refId: res.refId || prev.refId,
          pdf_path: res.pdf_path || prev.pdf_path,
          indemnity_pdf_path: res.indemnity_pdf_path || prev.indemnity_pdf_path
        }));
        setCurrentStep(4);
        showToast('KYC submitted successfully. Thank you.', 'success', 4000);
      } else {
        showToast(res.error || 'Final submission failed. Please try again.', 'error');
      }
    } catch (err) {
      showToast(
        err?.response?.data?.error || err?.message || 'Upload failed. Check your connection and try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  if (isRejected)       return <RejectionScreen reasons={rejectionReasons} />;
  if (awaitingApproval) return (
    <>
      <KycToast toast={toast} />
    <AwaitingApprovalScreen
      refId={userData.refId}
      resumeRefId={resumeRefId}   setResumeRefId={setResumeRefId}
      resumeMobile={resumeMobile} setResumeMobile={setResumeMobile}
      onCheck={handleCheckApproval}
      loading={loading}
    />
    </>
  );
  if (currentStep === 4) {
    return (
      <SuccessScreen
        refId={userData.refId}
        apiBaseUrl={apiBaseUrl}
        pdfPath={userData.pdf_path}
        indemnityPdfPath={userData.indemnity_pdf_path}
      />
    );
  }

  return (
    <>
      <KycToast toast={toast} />
      <div className="kyc-phase-shell">
      <AnimatePresence>
        {loading && <LoadingOverlay key="loader" />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div className="kyc-phase-motion" key={`phase-a-${phaseAResetKey}`} variants={fadeUp} initial="initial" animate="animate" exit="exit" transition={fadeUpTransition}>
            <PhaseA 
              apiBaseUrl={apiBaseUrl}
              onNext={handlePhase1Submit}
              onContinueKyc={handleContinueFromPhase1}
              onBack={() => {
                if (typeof window === 'undefined') return;
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  showToast(
                    'There is no previous page in this tab. Close the tab or open the site again to start over.',
                    'info',
                    4500,
                  );
                }
              }}
            />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div className="kyc-phase-motion" key="phase-b" variants={fadeUp} initial="initial" animate="animate" exit="exit" transition={fadeUpTransition}>
            <PhaseB 
              userId={recordId} 
              fullname={userData.buyer_full_name}
              mobile={userData.buyer_mobile}
              proofStatus={userData.proof_status}
              phaseAccess={true}
              apiBaseUrl={apiBaseUrl}
              onNext={handlePhaseBSubmit}
              onBack={() => {
                setCurrentStep(1);
                if (onNavigate) onNavigate('#PhaseA');
              }}
            />
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div className="kyc-phase-motion" key="phase-c" variants={fadeUp} initial="initial" animate="animate" exit="exit" transition={fadeUpTransition}>
            <PhaseC
              userId={recordId}
              apiBaseUrl={apiBaseUrl}
              fullname={userData.fullname || userData.buyer_full_name || ''}
              amount={userData.amount != null && userData.amount !== '' ? userData.amount : ''}
              utr={userData.utr != null && userData.utr !== '' ? userData.utr : ''}
              onSubmit={handleFinalSubmit}
              onBack={() => {
                setCurrentStep(2);
                if (onNavigate) onNavigate('#PhaseB');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
};

export default UserKYC;