import React, { useState, useEffect, useRef } from "react";

const proofRequiredPurposes = ["Spot Trading", "Futures Trading", "HOLD"];

const sanitizeInput = (value) => {
  if (typeof value !== "string") return value;
  return value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

const validateFile = (file) => {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024; 

  if (!validTypes.includes(file.type)) {
    return "Invalid file type. Please upload PNG, JPG, or WEBP.";
  }
  if (file.size > maxSize) {
    return "File size exceeds 5MB limit.";
  }
  return null;
};

const CACHE_KEY = "kyc_phase_a_data";

const PhaseA = ({ apiBaseUrl, onNext, onContinueKyc, onBack }) => {
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
  
  const formRef = useRef(null);

  useEffect(() => {
    const savedData = localStorage.getItem(CACHE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        
        if (parsed.submissionId) {
          setIsAlreadySubmitted(true);
        } else {
          if (parsed.fullname) document.querySelector('[name="fullname"]').value = parsed.fullname;
          if (parsed.email) document.querySelector('[name="email"]').value = parsed.email;
          if (parsed.buyer_mobile) document.querySelector('[name="buyer_mobile"]').value = parsed.buyer_mobile;
          if (parsed.amount) document.querySelector('[name="amount"]').value = parsed.amount;
          
          if (parsed.q1) document.querySelector(`input[name="q1"][value="${parsed.q1}"]`).checked = true;
          if (parsed.q2) document.querySelector(`input[name="q2"][value="${parsed.q2}"]`).checked = true;
          if (parsed.q3) document.querySelector('[name="q3"]').value = parsed.q3;
          if (parsed.q4) document.querySelector(`input[name="q4"][value="${parsed.q4}"]`).checked = true;
          
          if (parsed.q5) {
            setSelectedPurpose(parsed.q5);
            setTimeout(() => {
                const select = document.querySelector('[name="q5"]');
                if(select) select.value = parsed.q5;
            }, 0);
          }
        }
      } catch (err) {
        console.error("Failed to load cache", err);
        localStorage.removeItem(CACHE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (proofPreview) URL.revokeObjectURL(proofPreview);
    };
  }, [proofPreview]);

  const handleCacheUpdate = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const data = Object.fromEntries(formData.entries());
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  };

  const showToast = (message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "error" }), type === "error" ? 4000 : 2000);
  };

  const validatePhoneNumber = (phone) => {
    if (!/^\d{10}$/.test(phone)) return false;
    const str = phone;
    if (/^(\d)\1{9}$/.test(str)) return false; 
    if (/^(1234567890|9876543210|0123456789)$/.test(str)) return false; 
    const uniqueDigits = new Set(str.split(''));
    if (uniqueDigits.size <= 2) return false; 
    if (/0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210/.test(str)) return false; 
    return true;
  };


  const handleNameInput = (e) => {
    let value = e.target.value;
    value = value.replace(/[^a-zA-Z\s]/g, '');
    if (value.length > 100) value = value.slice(0, 100);
    
    if (e.target.value !== value) {
      e.target.value = value;
    }
    handleCacheUpdate();
  };

  const handleEmailInput = (e) => {
    let value = e.target.value;
    value = value.replace(/[^a-zA-Z0-9@._+-]/g, '');
    
    if (e.target.value !== value) {
      e.target.value = value;
    }
    handleCacheUpdate();
  };

  const handleNumbersOnlyInput = (e) => {
    let value = e.target.value;
    value = value.replace(/[^0-9]/g, '');
    
    if (e.target.value !== value) {
      e.target.value = value;
    }
    handleCacheUpdate();
  };

  const handleProofChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      showToast(error);
      e.target.value = "";
      setProofFile(null);
      setProofPreview("");
      return;
    }

    setProofFile(file);
    try {
      const objectUrl = URL.createObjectURL(file);
      setProofPreview(objectUrl);
    } catch (err) {
      console.error("Failed to create preview URL", err);
      showToast("Unable to preview this image.", "error");
    }
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  const validateForm = (formData, isFilePresent) => {
    const answers = {};
    for (const [key, value] of Object.entries(formData)) {
      answers[key] = sanitizeInput(value);
    }

    if (!answers.fullname || answers.fullname.trim().length < 3) {
      showToast("Please enter a valid Full Name (min 3 chars).");
      return null;
    }
    if (/\d/.test(answers.fullname)) {
       showToast("Name cannot contain numbers.");
       return null;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(answers.email)) {
      showToast("Please enter a valid Email Address.");
      return null;
    }

    if (!validatePhoneNumber(answers.buyer_mobile)) {
      showToast("Please enter a valid 10-digit Mobile Number.");
      return null;
    }

    const amountNum = parseFloat(answers.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Please enter a valid Amount.");
      return null;
    }

    const isRejected =
      answers.q1 === "No" ||
      answers.q2 === "Not Confirmed" ||
      answers.q3 === "Student" ||
      answers.q4 === "No" ||
      answers.q5 === "Buy from Coinora and sell via P2P";

    if (isRejected) {
      showToast("Application rejected based on your answers.", "error");
      return null;
    }

    if (proofRequiredPurposes.includes(answers.q5)) {
      if (!isFilePresent) {
        showToast("Purpose proof image is required for the selected purpose.");
        return null;
      }
      const fileError = validateFile(isFilePresent);
      if (fileError) {
        showToast(fileError);
        return null;
      }
    }
    
    return answers;
  };

  const performSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const formElement = e ? e.target : formRef.current;
    if (!formElement.checkValidity()) {
        formElement.reportValidity();
        return;
    }

    const formData = new FormData(formElement);
    const rawAnswers = Object.fromEntries(formData.entries());
    
    const validAnswers = validateForm(rawAnswers, proofFile);
    if (!validAnswers) return;

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      
      submitData.append('fullname', validAnswers.fullname);
      submitData.append('email', validAnswers.email);
      submitData.append('buyer_mobile', validAnswers.buyer_mobile);
      submitData.append('amount', validAnswers.amount);
      
      submitData.append('q1', validAnswers.q1);
      submitData.append('q2', validAnswers.q2);
      submitData.append('q3', validAnswers.q3);
      submitData.append('q4', validAnswers.q4);
      submitData.append('q5', validAnswers.q5);

      if (proofRequiredPurposes.includes(validAnswers.q5) && proofFile) {
        submitData.append('purpose_proof', proofFile);
      }

      const response = await fetch(`${apiBaseUrl}/api/phase1-submit`, {
        method: 'POST',
        body: submitData,
      });

      let result = {};
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        const hint =
          response.status === 404
            ? 'API not found (404). On production, forward /api to your Node server (same fix as admin login).'
            : text?.trim().startsWith('<')
              ? `Server returned a web page instead of JSON (${response.status}). /api is probably not reaching Express.`
              : (text?.slice(0, 200) || `Server error (${response.status})`);
        throw new Error(hint);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      const currentCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const updatedCache = {
        ...currentCache,
        ...validAnswers,
        submissionId: result.id || result.submissionId,
        id: result.id || result.submissionId,
        refId: result.refId,
        proof_status: result.proof_status,
        phase_access: result.phase_access,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedCache));

      showToast("Declaration saved. Follow the next steps for verification.", "success");

      onNext({
        ...result,
        buyer_mobile: validAnswers.buyer_mobile,
        buyer_full_name: validAnswers.fullname,
        fullname: validAnswers.fullname,
        amount: validAnswers.amount,
      });

    } catch (err) {
      console.error(err);
      showToast(err.message || "An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAlreadySubmitted) {
    return (
      <>
        <style>{`
          .continue-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f0f2f7; padding: 20px; text-align: center; }
          .continue-card { background: #fff; padding: 40px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-width: 400px; }
          .continue-icon { width: 60px; height: 60px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
          .continue-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
          .continue-text { font-size: 14px; color: #64748b; margin-bottom: 24px; line-height: 1.5; }
          .continue-btn { width: 100%; background: #2563eb; color: #fff; border: none; padding: 14px; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 14px; }
          .reset-link { display: block; margin-top: 15px; font-size: 12px; color: #94a3b8; text-decoration: underline; cursor: pointer; }
        `}</style>
        <div className="continue-screen kyc-phase-scroll">
          <div className="continue-card">
            <div className="continue-icon">
               <svg width="32" height="32" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="continue-title">Phase 1 Complete</h2>
            <p className="continue-text">Your declaration has been submitted securely. You can now proceed to the next step.</p>
            <button
              type="button"
              className="continue-btn"
              onClick={() => onContinueKyc && onContinueKyc()}
            >
              Continue KYC Verification &rarr;
            </button>
            <div className="reset-link" onClick={() => { localStorage.removeItem(CACHE_KEY); window.location.reload(); }}>Start Over</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #f0f2f7; }

        .kyc-root { background: #f0f2f7; font-family: 'DM Sans', sans-serif; padding: 0 0 60px 0; }

        .kyc-toast {
          position: fixed; top: 20px; left: 50%; transform: translateX(-50%) translateY(-20px);
          background: #fff; color: #1e293b; padding: 12px 20px; border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
          font-size: 13px; font-weight: 500; z-index: 2000; opacity: 0; pointer-events: none;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex; align-items: center; gap: 10px;
        }
        .kyc-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: auto; }
        .kyc-toast.error { border-left: 4px solid #ef4444; }
        .kyc-toast.success { border-left: 4px solid #22c55e; }

        .kyc-header {
          position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.85);
          backdrop-filter: blur(12px); border-bottom: 1px solid #e4e8f0; padding: 14px 24px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .kyc-header-content {
          display: flex; align-items: center; justify-content: space-between; width: 100%;
        }
        .kyc-header-left {
          display: flex; align-items: center; gap: 12px;
        }
        .kyc-back-btn {
          background: #f1f5f9; border: none; width: 36px; height: 36px;
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #475569; transition: all 0.2s; flex-shrink: 0;
        }
        .kyc-back-btn:hover { background: #e2e8f0; color: #0f172a; }
        .kyc-back-btn:active { transform: scale(0.95); }
        
        .kyc-logo { font-family: 'Syne', sans-serif; font-size: 15px; letter-spacing: 0.05em; text-transform: uppercase; color: #0f172a; display: flex; align-items: center; gap: 8px; }
        .kyc-logo-dot { width: 18px; height: 18px; border-radius: 5px; background: #2563eb; flex-shrink: 0; }
        .kyc-logo-accent { color: #2563eb; }

        .kyc-top-continue-btn {
            background: #2563eb; color: #fff; border: none; padding: 8px 16px;
            border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
            cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .kyc-top-continue-btn:hover { background: #1d4ed8; }
        .kyc-top-continue-btn:disabled { background: #94a3b8; cursor: not-allowed; opacity: 0.7; }

        .kyc-step-bar { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 20px 24px 0; }
        .step-pill { height: 4px; border-radius: 4px; background: #2563eb; width: 40px; }
        .step-pill.inactive { background: #d1d5db; width: 24px; }
        .kyc-step-label { font-size: 11px; color: #6b7280; text-align: center; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 8px; }
        .kyc-step-label span { color: #2563eb; }

        .kyc-card { max-width: 520px; margin: 24px auto 0; padding: 0 16px; }
        .kyc-form-wrap { background: #fff; border-radius: 24px; border: 1px solid #e4e8f0; overflow: hidden; box-shadow: 0 4px 24px rgba(15,23,42,0.07), 0 1px 4px rgba(15,23,42,0.04); }

        .kyc-form-header { padding: 28px 28px 0; text-align: center; }
        .kyc-form-title { font-family: 'Syne', sans-serif; font-size: clamp(22px, 5vw, 28px); color: #0f172a; text-transform: uppercase; letter-spacing: -0.02em; }
        .kyc-form-title span { color: #2563eb; }
        .kyc-form-subtitle { margin-top: 6px; font-size: 13px; color: #64748b; }

        .kyc-contact-section { margin: 22px 28px 0; background: #f0f6ff; border: 1px solid #dbeafe; border-radius: 16px; padding: 18px 20px 16px; }
        .section-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #94a3b8; text-align: center; margin-bottom: 14px; }
        .kyc-field-grid { display: grid; gap: 10px; }
        .kyc-input { width: 100%; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 11px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; font-weight: 400; color: #1e293b; outline: none; transition: border-color 0.15s, box-shadow 0.15s; appearance: none; }
        .kyc-input::placeholder { color: #b0bec5; }
        .kyc-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .kyc-input[type="text"], .kyc-input[type="email"], .kyc-input[type="tel"], .kyc-input[type="number"] { height: 42px; }

        select.kyc-input { cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 38px; height: 42px; }
        .contact-footer-tag { margin-top: 10px; text-align: center; font-size: 9.5px; font-weight: 600; color: #3b82f6; letter-spacing: 0.1em; text-transform: uppercase; }

        .kyc-questions { padding: 18px 28px; display: flex; flex-direction: column; gap: 12px; }
        .kyc-q-block { background: #fff; border: 1px solid #e4e8f0; border-radius: 14px; padding: 16px 18px; transition: border-color 0.15s; }
        .kyc-q-block:focus-within { border-color: #93c5fd; }
        .kyc-q-label { font-size: 11.5px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 12px; line-height: 1.5; }
        .kyc-q-label .q-num { display: inline-block; background: #eff6ff; color: #2563eb; border-radius: 6px; font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; padding: 2px 7px; margin-right: 8px; vertical-align: middle; }
        .kyc-options { display: flex; flex-direction: column; gap: 7px; }
        .kyc-option-label { display: flex; align-items: center; gap: 10px; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; cursor: pointer; font-size: 13px; font-weight: 400; color: #374151; transition: background 0.12s, border-color 0.12s; user-select: none; }
        .kyc-option-label:hover { background: #f8faff; border-color: #93c5fd; }
        .kyc-option-label input[type="radio"] { appearance: none; width: 16px; height: 16px; border: 2px solid #d1d5db; border-radius: 50%; flex-shrink: 0; transition: border-color 0.12s, background 0.12s; position: relative; cursor: pointer; }
        .kyc-option-label input[type="radio"]:checked { border-color: #2563eb; background: #2563eb; }
        .kyc-option-label input[type="radio"]:checked::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 5px; height: 5px; border-radius: 50%; background: #fff; }
        .kyc-option-label:has(input:checked) { background: #eff6ff; border-color: #2563eb; color: #1d4ed8; font-weight: 500; }

        .kyc-upload-wrapper { position: relative; width: 100%; }
        .kyc-file-input { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
        .kyc-upload-zone { display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px dashed #bfdbfe; border-radius: 12px; padding: 24px 18px; text-align: center; cursor: pointer; transition: background 0.15s, border-color 0.15s; background-color: #fff; }
        .kyc-upload-zone:hover { background: #f0f6ff; border-color: #2563eb; }
        .kyc-upload-icon { width: 36px; height: 36px; background: #eff6ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
        .kyc-upload-text { font-size: 12px; font-weight: 500; color: #2563eb; }
        .kyc-upload-hint { font-size: 10.5px; color: #94a3b8; margin-top: 2px; }
        .kyc-proof-preview { margin-top: 12px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; background: #f8fafc; min-height: 100px; display: flex; align-items: center; justify-content: center; }
        .kyc-proof-preview img { width: 100%; height: auto; max-height: 250px; object-fit: contain; display: block; }

        .kyc-submit-wrap { padding: 0 28px 28px; }
        .kyc-submit-btn { width: 100%; background: #2563eb; color: #fff; border: none; border-radius: 14px; padding: 15px 20px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: background 0.15s, transform: 0.1s, box-shadow 0.15s; box-shadow: 0 8px 20px rgba(37,99,235,0.28); display: flex; align-items: center; justify-content: center; gap: 10px; }
        .kyc-submit-btn:hover { background: #1d4ed8; box-shadow: 0 10px 28px rgba(37,99,235,0.36); }
        .kyc-submit-btn:active { transform: scale(0.99); box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
        .kyc-submit-btn:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; }
        .kyc-submit-arrow { width: 20px; height: 20px; background: rgba(255,255,255,0.2); border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        .kyc-footer-note { text-align: center; font-size: 10px; color: #94a3b8; letter-spacing: 0.04em; padding: 0 28px 24px; }
        @media (max-width: 480px) { 
            .kyc-header { padding: 10px 16px; }
            .kyc-header-content { gap: 8px; }
            .kyc-logo { font-size: 13px; }
            .kyc-top-continue-btn { padding: 6px 12px; font-size: 11px; }
            .kyc-card { padding: 0 12px; } 
            .kyc-form-header { padding: 22px 20px 0; } 
            .kyc-contact-section { margin: 18px 20px 0; } 
            .kyc-questions { padding: 14px 20px; } 
            .kyc-submit-wrap { padding: 0 20px 22px; } 
            .kyc-footer-note { padding: 0 20px 20px; } 
        }
      `}</style>

      <div className="kyc-root kyc-phase-scroll">
        <div className={`kyc-toast ${toast.show ? "show" : ""} ${toast.type}`}>
          {toast.type === 'error' ? (
            <svg width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
            <svg width="16" height="16" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          )}
          {toast.message}
        </div>

        <header className="kyc-header">
          <div className="kyc-header-content">
            <div className="kyc-header-left">
                {onBack && (
                  <button type="button" className="kyc-back-btn" onClick={onBack} aria-label="Go back">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                  </button>
                )}
                <div className="kyc-logo">
                    <div className="kyc-logo-dot" />
                    COINORA <span className="kyc-logo-accent">&nbsp;VDASP</span>
                </div>
            </div>
            
            <button 
                className="kyc-top-continue-btn" 
                onClick={() => performSubmit(null)}
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Submitting...' : 'Continue KYC'}
            </button>
          </div>
        </header>

        <div>
          <div className="kyc-step-bar">
            <div className="step-pill" />
            <div className="step-pill inactive" />
            <div className="step-passive-pill inactive" />
          </div>
          <p className="kyc-step-label"><span>Step 1</span> of 3 — Declaration</p>
        </div>

        <div className="kyc-card">
          <div className="kyc-form-wrap">
            <form ref={formRef} onSubmit={performSubmit} onChange={handleCacheUpdate}>
              <div className="kyc-form-header">
                <h1 className="kyc-form-title">
                  Mandatory <span>Declaration</span>
                </h1>
                <p className="kyc-form-subtitle">
                  Please answer all questions honestly before proceeding.
                </p>
              </div>

              <div className="kyc-contact-section">
                <p className="section-eyebrow">Contact Information</p>
                <div className="kyc-field-grid">
                  <input
                    type="text"
                    name="fullname"
                    required
                    placeholder="Registered Full Name"
                    className="kyc-input"
                    autoComplete="name"
                    autoCapitalize="words"
                    maxLength={100}
                    onInput={handleNameInput}
                  />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Email Address"
                    className="kyc-input"
                    autoComplete="email"
                    autoCapitalize="none"
                    onInput={handleEmailInput}
                  />
                  <input
                    type="tel"
                    name="buyer_mobile"
                    required
                    placeholder="Mobile Number (10 digits)"
                    className="kyc-input"
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={10}
                    autoCorrect="off"
                    spellCheck="false"
                    onInput={handleNumbersOnlyInput}
                  />
                  
                  <input
                    type="number"
                    name="amount"
                    required
                    placeholder="Amount (₹)"
                    className="kyc-input"
                    min="1"
                    step="0.01"
                    inputMode="decimal"
                    onInput={handleNumbersOnlyInput}
                  />
                </div>
                <p className="contact-footer-tag">Secure KYC + Payment Identity Check</p>
              </div>

              <div className="kyc-questions">
                <div className="kyc-q-block">
                  <p className="kyc-q-label">
                    <span className="q-num">Q1</span>
                    The funds I am using are my own. No third person has sent me money.
                  </p>
                  <div className="kyc-options">
                    <label className="kyc-option-label">
                      <input type="radio" name="q1" value="Yes" required />
                      Yes — using my own funds
                    </label>
                    <label className="kyc-option-label">
                      <input type="radio" name="q1" value="No" />
                      No — third-party funds
                    </label>
                  </div>
                </div>

                <div className="kyc-q-block">
                  <p className="kyc-q-label">
                    <span className="q-num">Q2</span>
                    My funds are not from any scam or illegal activity.
                  </p>
                  <div className="kyc-options">
                    <label className="kyc-option-label">
                      <input type="radio" name="q2" value="Confirmed" required />
                      Confirmed — these funds are clean
                    </label>
                    <label className="kyc-option-label">
                      <input type="radio" name="q2" value="Not Confirmed" />
                      Not confirmed
                    </label>
                  </div>
                </div>

                <div className="kyc-q-block">
                  <p className="kyc-q-label">
                    <span className="q-num">Q3</span>
                    My profession
                  </p>
                  <select name="q3" required className="kyc-input">
                    <option value="">Select your profession</option>
                    <option value="Business">Business Owner</option>
                    <option value="Salaried">Salaried Employee</option>
                    <option value="Self-Employed">Self-Employed</option>
                    <option value="Student">Student</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="kyc-q-block">
                  <p className="kyc-q-label">
                    <span className="q-num">Q4</span>
                    If any issue arises due to my payment, I agree to refund within 24 hours.
                  </p>
                  <div className="kyc-options">
                    <label className="kyc-option-label">
                      <input type="radio" name="q4" value="Yes" required />
                      Yes, I agree
                    </label>
                    <label className="kyc-option-label">
                      <input type="radio" name="q4" value="No" />
                      I do not agree
                    </label>
                  </div>
                </div>

                <div className="kyc-q-block">
                  <p className="kyc-q-label">
                    <span className="q-num">Q5</span>
                    Purpose for buying USDT
                  </p>
                  <select
                    name="q5"
                    required
                    className="kyc-input"
                    value={selectedPurpose}
                    onChange={(e) => { setSelectedPurpose(e.target.value); handleCacheUpdate(); }}
                  >
                    <option value="">Select a purpose</option>
                    <option value="Spot Trading">Spot Trading</option>
                    <option value="Futures Trading">Futures Trading</option>
                    <option value="HOLD">HOLD / Investment</option>
                    <option value="Buy from Coinora and sell via P2P">
                      Buy from Coinora and sell via P2P
                    </option>
                  </select>
                </div>

                {proofRequiredPurposes.includes(selectedPurpose) && (
                  <div className="kyc-q-block">
                    <p className="kyc-q-label">Purpose Proof (Required)</p>
                    
                    <div className="kyc-upload-wrapper">
                      <label htmlFor="proof-upload" className="kyc-upload-zone">
                        <div className="kyc-upload-icon">
                          <svg width="16" height="16" fill="none" stroke="#2563eb" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 10l-4-4-4 4M12 6v10" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <p className="kyc-upload-text">
                          {proofFile ? proofFile.name : "Click to upload proof image"}
                        </p>
                        <p className="kyc-upload-hint">PNG, JPG up to 5MB</p>
                      </label>
                      <input
                        id="proof-upload"
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="kyc-file-input"
                        onChange={handleProofChange}
                        tabIndex="-1"
                      />
                    </div>

                    {proofPreview && (
                      <div className="kyc-proof-preview">
                        <img 
                          src={proofPreview} 
                          alt="Purpose Proof Preview" 
                          crossOrigin="anonymous"
                          onError={handleImageError}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="kyc-submit-wrap">
                <button type="submit" className="kyc-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      Submit Phase 1
                      <span className="kyc-submit-arrow">
                        <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </>
                  )}
                </button>
              </div>

              <p className="kyc-footer-note">
                All information is encrypted and used solely for identity verification.
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default PhaseA;