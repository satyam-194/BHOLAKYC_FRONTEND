import React, { useState } from 'react';
import PhaseC from './PhaseC.jsx';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.eu-root {
  min-height: 100dvh;
  background: #f0f2f7;
  font-family: 'DM Sans', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

.eu-card {
  background: #fff;
  border-radius: 22px;
  border: 1px solid #e4e8f0;
  box-shadow: 0 4px 24px rgba(15,23,42,0.09), 0 1px 4px rgba(15,23,42,0.05);
  width: 100%;
  max-width: 440px;
  padding: 36px 32px 32px;
}

.eu-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
}
.eu-logo-dot {
  width: 20px; height: 20px; border-radius: 6px;
  background: #2563eb; flex-shrink: 0;
}
.eu-logo-text {
  font-family: 'Syne', sans-serif;
  font-size: 14px; font-weight: 800;
  letter-spacing: 0.06em; text-transform: uppercase; color: #0f172a;
}
.eu-logo-text span { color: #2563eb; }

.eu-title {
  font-family: 'Syne', sans-serif;
  font-size: 22px; font-weight: 800;
  color: #0f172a; margin-bottom: 6px;
}
.eu-subtitle {
  font-size: 13.5px; color: #64748b;
  line-height: 1.6; margin-bottom: 28px;
}

.eu-label {
  display: block;
  font-size: 12px; font-weight: 600;
  color: #374151; margin-bottom: 7px;
  letter-spacing: 0.03em;
}

.eu-input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: #0f172a;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  margin-bottom: 20px;
}
.eu-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
}
.eu-input::placeholder { color: #94a3b8; }

.eu-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.eu-btn-primary {
  width: 100%;
  padding: 13px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px; font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  margin-bottom: 12px;
}
.eu-btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.eu-btn-primary:active:not(:disabled) { transform: scale(0.99); }
.eu-btn-primary:disabled { opacity: 0.6; cursor: default; }

.eu-btn-back {
  width: 100%;
  padding: 11px;
  background: transparent;
  color: #64748b;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.eu-btn-back:hover { background: #f1f5f9; color: #334155; }

.eu-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 10px 13px;
  font-size: 13px;
  color: #dc2626;
  margin-bottom: 18px;
}

.eu-found-chip {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 22px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.eu-found-chip-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: #dcfce7;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.eu-found-name { font-size: 14px; font-weight: 600; color: #15803d; }
.eu-found-sub  { font-size: 12px; color: #4ade80; }

.eu-divider {
  height: 1px; background: #f1f5f9; margin: 20px 0;
}

.eu-txn-history { margin-bottom: 22px; }
.eu-txn-history-label {
  font-size: 11px; font-weight: 600; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;
}
.eu-txn-item {
  background: #f8fafc; border: 1px solid #e4e8f0;
  border-radius: 12px; padding: 12px 14px; margin-bottom: 8px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px;
}
.eu-txn-row { display: flex; flex-direction: column; gap: 2px; }
.eu-txn-row-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
.eu-txn-row-value { font-size: 13px; color: #1e293b; font-weight: 600; }
.eu-txn-status-chip {
  display: inline-block; font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.06em;
}
.eu-txn-status-chip.pending  { background: #fef3c7; color: #d97706; }
.eu-txn-status-chip.verified { background: #dcfce7; color: #16a34a; }
.eu-txn-status-chip.rejected { background: #fee2e2; color: #dc2626; }

.eu-new-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 700; color: #2563eb;
  background: #eff6ff; border: 1px solid #bfdbfe;
  border-radius: 20px; padding: 3px 10px; margin-bottom: 14px;
  letter-spacing: 0.06em; text-transform: uppercase;
}

.eu-success-icon {
  width: 64px; height: 64px; border-radius: 50%;
  background: #dcfce7;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}
.eu-success-title {
  font-family: 'Syne', sans-serif;
  font-size: 20px; font-weight: 800;
  color: #0f172a; text-align: center; margin-bottom: 8px;
}
.eu-success-sub {
  font-size: 13.5px; color: #64748b;
  text-align: center; line-height: 1.6; margin-bottom: 28px;
}

@media (max-width: 480px) {
  .eu-card { padding: 28px 20px 24px; }
  .eu-row { grid-template-columns: 1fr; gap: 0; }
}
`;

const ExistingUserKYC = ({ apiBaseUrl, onBack }) => {
  const [step, setStep]                 = useState('phone');
  const [phone, setPhone]               = useState('');
  const [utr, setUtr]                   = useState('');
  const [amount, setAmount]             = useState('');
  const [userId, setUserId]             = useState(null);
  const [userInfo, setUserInfo]         = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [videoKey, setVideoKey]         = useState(0);

  const cleanPhone = () => phone.trim().replace(/\D/g, '').slice(0, 10);

  const lookupUser = async () => {
    const ph = cleanPhone();
    if (ph.length < 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${apiBaseUrl}/api/existing-user/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_mobile: ph }),
      });
      const data = await res.json();
      if (!data.found) { setError('No registered KYC found for this mobile number.'); return; }
      setUserId(data.id);
      setUserInfo({ name: data.name, amount: data.amount });
      setAmount(data.amount || '');
      setTransactions(data.transactions || []);
      setStep('utr');
    } catch {
      setError('Lookup failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const proceedToVideo = () => {
    if (!utr.trim()) { setError('UTR reference number is required.'); return; }
    setError('');
    // Clear cached PhaseC state so it always starts fresh (camera + isAlreadySubmitted)
    if (userId) localStorage.removeItem(`kyc_phase_c_${userId}`);
    setVideoKey((k) => k + 1); // force PhaseC to fully remount
    setStep('video');
  };

  const handleVideoSubmit = async (blob) => {
    if (!blob) throw new Error('No video recorded. Please record your video declaration first.');

    const fd = new FormData();
    fd.append('video',            blob, 'consent_video.webm');
    fd.append('utr_reference_no', utr.trim());
    fd.append('amount',           amount.trim());

    const res  = await fetch(`${apiBaseUrl}/api/existing-user/video/${userId}`, {
      method: 'POST',
      body: fd,
    });

    let data = {};
    try { data = await res.json(); } catch { /* non-JSON response */ }
    if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);

    if (data.transactions) setTransactions(data.transactions);
    setStep('done');
  };

  if (step === 'done') {
    return (
      <>
        <style>{CSS}</style>
        <div className="eu-root">
          <div className="eu-card">
            <div className="eu-logo">
              <div className="eu-logo-dot" />
              <div className="eu-logo-text">COINORA <span>KYC</span></div>
            </div>
            <div className="eu-success-icon">
              <svg width="28" height="28" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="eu-success-title">Video Submitted!</p>
            <p className="eu-success-sub">
              Your video declaration has been uploaded and a new KYC record has been created. All previous submissions remain intact.
            </p>

            {transactions.length > 0 && (
              <div className="eu-txn-history">
                <p className="eu-txn-history-label">All Submissions ({transactions.length})</p>
                {[...transactions].reverse().map((t, i) => (
                  <div key={i} className="eu-txn-item">
                    <div className="eu-txn-row">
                      <span className="eu-txn-row-label">Ref</span>
                      <span className="eu-txn-row-value">{t.txn_ref || '—'}</span>
                    </div>
                    <div className="eu-txn-row">
                      <span className="eu-txn-row-label">Status</span>
                      <span className={`eu-txn-status-chip ${(t.admin_status || 'pending').toLowerCase()}`}>
                        {t.admin_status || 'Pending'}
                      </span>
                    </div>
                    <div className="eu-txn-row">
                      <span className="eu-txn-row-label">UTR</span>
                      <span className="eu-txn-row-value">{t.utr_reference_no || '—'}</span>
                    </div>
                    <div className="eu-txn-row">
                      <span className="eu-txn-row-label">Amount</span>
                      <span className="eu-txn-row-value">₹{t.amount || '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button className="eu-btn-primary" onClick={onBack}>
              Back to Home
            </button>
          </div>
        </div>
      </>
    );
  }

  if (step === 'video') {
    return (
      <PhaseC
        key={videoKey}
        userId={userId}
        fullname={userInfo?.name}
        amount={amount}
        utr={utr}
        apiBaseUrl={apiBaseUrl}
        onSubmit={handleVideoSubmit}
        onBack={() => setStep('utr')}
      />
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="eu-root">
        <div className="eu-card">
          <div className="eu-logo">
            <div className="eu-logo-dot" />
            <div className="eu-logo-text">COINORA <span>KYC</span></div>
          </div>

          {step === 'phone' && (
            <>
              <p className="eu-title">Existing User</p>
              <p className="eu-subtitle">
                Enter your registered mobile number to verify your identity and update your video declaration.
              </p>

              {error && <div className="eu-error">{error}</div>}

              <label className="eu-label" htmlFor="eu-phone">Registered Mobile Number</label>
              <input
                id="eu-phone"
                className="eu-input"
                type="tel"
                placeholder="10-digit mobile number"
                maxLength={10}
                value={phone}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && lookupUser()}
              />

              <button className="eu-btn-primary" onClick={lookupUser} disabled={loading}>
                {loading ? 'Verifying…' : 'Verify & Continue'}
              </button>
              <button className="eu-btn-back" onClick={onBack}>
                Back to Home
              </button>
            </>
          )}

          {step === 'utr' && (
            <>
              <p className="eu-title">New Transaction</p>
              <p className="eu-subtitle">
                Enter the UTR and amount for this transaction, then proceed to record your video declaration.
              </p>

              {userInfo && (
                <div className="eu-found-chip">
                  <div className="eu-found-chip-icon">
                    <svg width="16" height="16" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="eu-found-name">{userInfo.name || 'User found'}</div>
                    <div className="eu-found-sub">Identity verified</div>
                  </div>
                </div>
              )}

              {transactions.length > 0 && (
                <div className="eu-txn-history">
                  <p className="eu-txn-history-label">Previous Submissions ({transactions.length})</p>
                  {[...transactions].reverse().map((t, i) => (
                    <div key={i} className="eu-txn-item">
                      <div className="eu-txn-row">
                        <span className="eu-txn-row-label">Ref</span>
                        <span className="eu-txn-row-value">{t.txn_ref || '—'}</span>
                      </div>
                      <div className="eu-txn-row">
                        <span className="eu-txn-row-label">Status</span>
                        <span className={`eu-txn-status-chip ${(t.admin_status || 'pending').toLowerCase()}`}>
                          {t.admin_status || 'Pending'}
                        </span>
                      </div>
                      <div className="eu-txn-row">
                        <span className="eu-txn-row-label">UTR</span>
                        <span className="eu-txn-row-value">{t.utr_reference_no || '—'}</span>
                      </div>
                      <div className="eu-txn-row">
                        <span className="eu-txn-row-label">Amount</span>
                        <span className="eu-txn-row-value">₹{t.amount || '—'}</span>
                      </div>
                    </div>
                  ))}
                  <div className="eu-new-badge">
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                    </svg>
                    New submission below
                  </div>
                </div>
              )}

              {error && <div className="eu-error">{error}</div>}

              <label className="eu-label" htmlFor="eu-utr">UTR / Transaction Reference No.</label>
              <input
                id="eu-utr"
                className="eu-input"
                type="text"
                placeholder="e.g. 123456789012"
                value={utr}
                onChange={(e) => { setUtr(e.target.value); setError(''); }}
              />

              <label className="eu-label" htmlFor="eu-amount">Transaction Amount (₹)</label>
              <input
                id="eu-amount"
                className="eu-input"
                type="text"
                placeholder="e.g. 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <button className="eu-btn-primary" onClick={proceedToVideo}>
                Proceed to Video Declaration
              </button>
              <button className="eu-btn-back" onClick={() => { setStep('phone'); setError(''); }}>
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ExistingUserKYC;
