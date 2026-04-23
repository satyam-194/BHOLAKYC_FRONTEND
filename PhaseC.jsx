import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useToast } from './hooks/useToast.js';
import KycToast from './components/KycToast.jsx';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

.pc-root{
  background:#f0f2f7;
  font-family:'DM Sans',sans-serif;
  padding-bottom:calc(140px + env(safe-area-inset-bottom,24px));
}

.pc-header{
  position:sticky;top:0;z-index:50;
  background:rgba(255,255,255,0.88);
  backdrop-filter:blur(14px);
  border-bottom:1px solid #e4e8f0;
  padding:13px 20px;
  display:flex;align-items:center;justify-content:space-between;
}
.pc-header-left{display:flex;align-items:center;gap:12px;min-width:0}
.pc-back-btn{
  background:#f1f5f9;border:none;width:36px;height:36px;
  border-radius:10px;display:flex;align-items:center;justify-content:center;
  cursor:pointer;color:#475569;flex-shrink:0;
  transition:background 0.15s,color 0.15s;
}
.pc-back-btn:hover{background:#e2e8f0;color:#0f172a}
.pc-back-btn:active{transform:scale(0.98)}
.pc-back-btn:disabled{opacity:0.45;cursor:not-allowed;transform:none}
.pc-logo{
  font-family:'Syne',sans-serif;
  font-size:14px;letter-spacing:0.05em;text-transform:uppercase;
  color:#0f172a;display:flex;align-items:center;gap:8px;
}
.pc-logo-dot{width:17px;height:17px;border-radius:5px;background:#2563eb;flex-shrink:0}
.pc-logo-accent{color:#2563eb}
.pc-badge{
  font-size:9.5px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;
  background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;
  border-radius:20px;padding:4px 10px;white-space:nowrap;
}

.pc-phase-bar{padding:18px 16px 0;display:flex;flex-direction:column;align-items:center;gap:6px}
.pc-phase-pills{display:flex;gap:7px}
.pc-phase-pill{height:4px;border-radius:4px;transition:all 0.3s}
.pc-phase-pill.done{background:#93c5fd;width:28px}
.pc-phase-pill.active{background:#2563eb;width:40px}
.pc-phase-label{font-size:10.5px;font-weight:500;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase}
.pc-phase-label b{color:#2563eb;font-weight:600}

.pc-wrap{max-width:900px;margin:20px auto 0;padding:0 14px 40px}

.pc-card{
  background:#fff;border-radius:22px;
  border:1px solid #e4e8f0;overflow:visible;
  box-shadow:0 4px 24px rgba(15,23,42,0.07),0 1px 4px rgba(15,23,42,0.04);
  position:relative;
}

.pc-countdown-overlay{
  position:absolute;inset:0;z-index:100;
  background:rgba(37,99,235,0.96);
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:16px;
}
.pc-countdown-num{
  font-family:'Syne',sans-serif;
  font-size:clamp(80px,20vw,120px);color:#fff;
  line-height:1;animation:pc-pulse 1s ease-in-out infinite;
}
@keyframes pc-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.85;transform:scale(0.96)}}
.pc-countdown-label{
  font-size:10px;font-weight:600;color:rgba(255,255,255,0.7);
  letter-spacing:0.2em;text-transform:uppercase;
}

.pc-card-head{
  padding:22px 24px 0;
  display:flex;align-items:flex-start;justify-content:space-between;
  flex-wrap:wrap;gap:14px;
}
.pc-head-left{}
.pc-eyebrow{
  font-size:10px;font-weight:600;color:#2563eb;
  letter-spacing:0.15em;text-transform:uppercase;margin-bottom:5px;
}
.pc-title{
  font-family:'Syne',sans-serif;
  font-size:clamp(18px,4vw,24px);
  text-transform:uppercase;letter-spacing:-0.02em;color:#0f172a;
}
.pc-title span{color:#2563eb}
.pc-head-desc{margin-top:5px;font-size:12px;color:#64748b;max-width:340px}

.pc-body{padding:18px 24px}

.pc-grid{display:grid;gap:16px;grid-template-columns:1fr}
@media(min-width:760px){.pc-grid{grid-template-columns:1.5fr 1fr}}
@media(max-width:759px){
  .pc-grid{display:flex;flex-direction:column;gap:14px;}
  .pc-teleprompter{order:1;}
  .pc-cam-col{order:2;align-items:center;width:100%;}
}

.pc-teleprompter{
  background:#0f172a;border-radius:16px;overflow:hidden;
  min-height:0;
}
.pc-progress-bar{height:3px;background:#1e293b;width:100%}
.pc-progress-fill{height:100%;background:#2563eb;transition:width 0.4s ease}

.pc-script-viewport{
  position:relative;height:min(260px,42vh);overflow:hidden;
}
@media(min-width:760px){.pc-script-viewport{height:360px}}

.pc-script-highlight{
  position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);
  height:72px;
  background:rgba(255,255,255,0.04);
  border-top:1px solid rgba(255,255,255,0.07);
  border-bottom:1px solid rgba(255,255,255,0.07);
  pointer-events:none;z-index:2;
}
.pc-script-scroll{
  height:100%;overflow-y:hidden;
  padding:0 20px;
  position:relative;z-index:1;
}
@media(min-width:760px){.pc-script-scroll{padding:0 28px}}
.pc-script-inner{padding-top:115px;padding-bottom:380px}
@media(max-width:759px){.pc-script-inner{padding-bottom:220px}}
.pc-script-text{
  color:#e2e8f0;font-size:clamp(14px,2.5vw,17px);
  font-weight:400;line-height:1.9;text-align:center;
}
.pc-script-text span{display:block;margin-bottom:18px}

.pc-cam-col{display:flex;flex-direction:column;gap:12px;align-items:center}
@media(min-width:760px){.pc-cam-col{align-items:stretch}}

.pc-cam-wrap{
  position:relative;border-radius:16px;overflow:hidden;
  background:#000;border:2px solid #e4e8f0;
  aspect-ratio:9/16;
  width:min(124px,34vw);
  max-width:200px;
  max-height:min(38vh,260px);
  margin:0 auto;
  flex-shrink:0;
}
@media(min-width:760px){
  .pc-cam-wrap{
    width:min(148px,20vw);
    max-height:min(44vh,300px);
  }
}
.pc-cam-wrap video{
  width:100%;height:100%;object-fit:cover;
  display:block;
}

.pc-badge-overlay {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  border-radius: 20px;
  padding: 5px 10px;
  pointer-events: none;
}

.pc-badge-text {
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: left;
}

.pc-badge-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pc-video-mirror {
  transform: scaleX(-1);
}

.pc-video-normal {
  transform: none;
}

.pc-rec-pulse{
  width:8px;height:8px;border-radius:50%;background:#ef4444;
  animation:pc-rec 1.1s ease-in-out infinite;
}
@keyframes pc-rec{0%,100%{opacity:1}50%{opacity:0.3}}

.pc-instructions{
  background:#f8fafc;border:1px solid #e4e8f0;border-radius:14px;padding:14px 16px;
  width:100%;max-width:420px;
}
@media(min-width:760px){.pc-instructions{max-width:none}}
.pc-instructions-title{
  font-size:9.5px;font-weight:600;color:#94a3b8;
  letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;
}
.pc-instructions-list{display:flex;flex-direction:column;gap:7px}
.pc-instruction-item{
  display:flex;align-items:flex-start;gap:8px;
  font-size:12.5px;color:#475569;line-height:1.5;
}
.pc-instr-dot{
  width:5px;height:5px;border-radius:50%;background:#2563eb;
  flex-shrink:0;margin-top:6px;
}

.pc-scroll-status{
  background:#f0f6ff;border:1px solid #bfdbfe;
  border-radius:10px;padding:10px 14px;
  display:flex;align-items:center;gap:8px;
  font-size:11px;color:#1d4ed8;font-weight:500;
}
.pc-scroll-status.warn{background:#fff7ed;border-color:#fed7aa;color:#c2410c}
.pc-status-dot-anim{
  width:7px;height:7px;border-radius:50%;background:#2563eb;flex-shrink:0;
  animation:pc-rec 1.1s ease-in-out infinite;
}
.pc-status-dot-anim.warn{background:#f97316}

.pc-footer{
  position:fixed;left:0;right:0;bottom:0;z-index:100;
  padding:14px 16px calc(18px + env(safe-area-inset-bottom,0px));
  display:flex;flex-direction:column;gap:10px;
  max-width:900px;margin:0 auto;
  width:100%;
  background:#fff;
  border-top:1px solid #e4e8f0;
  box-shadow:0 -8px 28px rgba(15,23,42,0.12);
}

.pc-btn-base{
  width:100%;color:#fff;border:none;
  border-radius:13px;padding:15px 20px;
  font-family:'Syne',sans-serif;font-size:13px;font-weight:700;
  letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:9px;
  transition:background 0.15s,transform 0.1s;
}
.pc-btn-base:active{transform:scale(0.99)}
.pc-btn-base:disabled{background:#e2e8f0;color:#94a3b8;box-shadow:none;cursor:not-allowed}

.pc-start-btn{
  background:#2563eb;
  box-shadow:0 8px 20px rgba(37,99,235,0.26);
}
.pc-start-btn:hover:not(:disabled){background:#1d4ed8}

.pc-cancel-btn{
  background:transparent; color:#64748b; border: 1.5px solid #e2e8f0;
  box-shadow:none;
}
.pc-cancel-btn:hover:not(:disabled){background:#f8fafc; color:#374151}

.pc-submit-btn{
  background:#16a34a;
  box-shadow:0 8px 20px rgba(22,163,74,0.26);
}
.pc-submit-btn:hover:not(:disabled){background:#15803d}

.pc-retake-btn{
  background:#f97316;
  box-shadow:0 8px 20px rgba(249,115,22,0.26);
}
.pc-retake-btn:hover:not(:disabled){background:#ea580c}

.pc-btn-arr{
  width:19px;height:19px;background:rgba(255,255,255,0.2);
  border-radius:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0;
}

.pc-processing{
  display:flex;align-items:center;justify-content:center;gap:10px;
}
.pc-spinner{
  width:18px;height:18px;border-radius:50%;
  border:2.5px solid rgba(255,255,255,0.3);
  border-top-color:#fff;
  animation:pc-spin 0.8s linear infinite;
}
@keyframes pc-spin{to{transform:rotate(360deg)}}

@media(max-width:520px){
  .pc-header{padding:10px 14px;flex-wrap:wrap}
  .pc-card-head{padding:16px 16px 0}
  .pc-body{padding:12px 14px}
  .pc-footer{padding:12px 14px calc(16px + env(safe-area-inset-bottom,0px))}
  .pc-wrap{padding:0 12px 36px;margin-top:14px}
  .pc-title{font-size:clamp(18px,5vw,24px)}
  .pc-grid{grid-template-columns:1fr!important;gap:14px!important}
}
`;

const SCRIPT = (fullname, amount, utr) => {
  const nameDisp = String(fullname ?? '').trim() || '____';
  const amtRaw = amount != null ? String(amount).trim() : '';
  const amtDisp = amtRaw || '____';
  const refDisp = String(utr ?? '').trim() || '____';
  return `Mera naam ${nameDisp} hai. Maine COINORA VDASP PVT LTD ko ${amtDisp} rupaye diye hain. Mera transaction reference number ${refDisp} hai. Yeh payment bilkul safe aur genuine hai. Maine koi bhi fraudulent amount nahi bheja hai. Agar mere payment ki wajah se koi bhi debit freeze, lien, ya hold aata hai aur yeh prove hota hai ki yeh mere transaction ki wajah se hua, toh main 24 ghante ke andar equivalent USDT ya INR amount wapas kar dunga. Agar main refund karne mein nakaam raha, toh yeh video recording legal purposes ke liye use ki ja sakti hai. Maine apni poori marzi se USDT purchase kiya hai. Mujhe clearly bataya gaya tha ki unknown platforms par commission aur profit ke naam par hone wale scams se door rahein aur mujhe inse bachne ki salah di gayi thi. Main confirm karta hoon ki koi bhi insaan Telegram ya kisi bhi aur platform par mujhe USDT kharidne ya bechne ke liye guide ya instruct nahi kar raha hai. Mujhe clearly inform kiya gaya tha ki USDT ko exchange se kisi bhi aur wallet ya platform par withdraw karna advisable nahi hai. Agar main phir bhi aisa karta hoon aur mujhe koi bhi financial loss hota hai, toh us loss ki poori zimmedari meri khud ki hogi.`;
};

function ArrowRight() {
  return (
    <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/** Per-session KYC record — avoids showing "Continue KYC" instead of "Start Recording" after another user/device used the same browser. */
function phaseCCacheKey(userId) {
  const id = String(userId ?? '').trim();
  return id ? `kyc_phase_c_${id}` : 'kyc_phase_c_pending';
}

function pickRecorderMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return 'video/webm';
  }
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

const PhaseC = ({ userId, fullname, amount, utr, apiBaseUrl, onSubmit, onComplete, onBack }) => {
  const { toast, showToast } = useToast();
  const [phase, setPhase] = useState('idle');
  const [countdown, setCountdown] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScrollComplete, setIsScrollComplete] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
  
  const [reviewBlobUrl, setReviewBlobUrl] = useState(null);
  /** True only if recording stopped after the teleprompter reached the end (full script read). */
  const [kycSubmitAllowed, setKycSubmitAllowed] = useState(false);

  const recordedChunksRef   = useRef([]);
  const recordedMimeRef     = useRef('video/webm');
  const videoRef            = useRef(null);
  const scrollRef           = useRef(null);
  const mediaRecorderRef    = useRef(null);
  const liveStreamRef       = useRef(null);
  const scrollIntervalRef   = useRef(null);
  const isScrollCompleteRef = useRef(false);
  /** Set synchronously when teleprompter hits bottom — source of truth for enabling submit (avoids React ref lag). */
  const fullScriptReadRef = useRef(false);
  const autoStopScheduledRef = useRef(false);

  const script = useMemo(() => SCRIPT(fullname, amount, utr), [fullname, amount, utr]);
  const sentences = useMemo(
    () => script.split('. ').map((s) => s.trim()).filter(Boolean),
    [script]
  );

  useEffect(() => {
    const key = phaseCCacheKey(userId);
    let savedData = localStorage.getItem(key);
    if (!savedData && userId) {
      const legacy = localStorage.getItem('kyc_phase_c_data');
      if (legacy) {
        try {
          const old = JSON.parse(legacy);
          if (old.finalizedAt && String(old.submissionId || '') === String(userId)) {
            localStorage.setItem(key, legacy);
            savedData = legacy;
          }
        } catch {
          /* ignore */
        }
      }
    }
    if (!savedData) {
      setIsAlreadySubmitted(false);
      return;
    }
    try {
      const parsed = JSON.parse(savedData);
      if (parsed.submissionId != null && parsed.finalizedAt == null) {
        localStorage.removeItem(key);
        setIsAlreadySubmitted(false);
        return;
      }
      if (parsed.finalizedAt) {
        const storedUser = String(parsed.storedUserId ?? parsed.submissionId ?? '').trim();
        const current = String(userId ?? '').trim();
        setIsAlreadySubmitted(Boolean(current && storedUser && storedUser === current));
      } else {
        setIsAlreadySubmitted(false);
      }
    } catch (err) {
      console.error('Failed to load Phase C cache', err);
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      setIsAlreadySubmitted(false);
    }
  }, [userId]);

  useEffect(() => {
    isScrollCompleteRef.current = isScrollComplete;
  }, [isScrollComplete]);

  const cleanupStream = useCallback(() => {
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach(track => track.stop());
      liveStreamRef.current = null;
    }
  }, []);

  const [streamTick, setStreamTick] = useState(0);

  const initCamera = useCallback(async () => {
    if (isAlreadySubmitted) return;

    cleanupStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 1280 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      liveStreamRef.current = stream;
      setStreamTick((t) => t + 1);
    } catch (err) {
      showToast(
        'Camera or microphone blocked. Allow both in the browser address bar (camera + mic), then refresh.',
        'error'
      );
      setPhase('idle');
    }
  }, [cleanupStream, isAlreadySubmitted, showToast]);

  useEffect(() => {
    if (!isAlreadySubmitted) {
      initCamera();
    }
    return () => {
      cleanupStream();
      if (reviewBlobUrl) URL.revokeObjectURL(reviewBlobUrl);
    };
  }, [initCamera, reviewBlobUrl, isAlreadySubmitted, cleanupStream]);

  useEffect(() => {
    if (isAlreadySubmitted) return;
    const stream = liveStreamRef.current;
    const el = videoRef.current;
    if (!stream || !el) return;
    el.srcObject = stream;
    el.play().catch(() => {});
  }, [streamTick, isAlreadySubmitted, phase]);

  const startTeleprompter = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    el.scrollTop = 0;
    fullScriptReadRef.current = false;
    isScrollCompleteRef.current = false;
    setIsScrollComplete(false);

    scrollIntervalRef.current = setInterval(() => {
      const threshold = 4;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
      if (atBottom) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
        fullScriptReadRef.current = true;
        isScrollCompleteRef.current = true;
        setIsScrollComplete(true);
      } else {
        el.scrollTop += 1;
      }
    }, 100);
  }, []);

  const stopTeleprompter = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!liveStreamRef.current) {
      showToast('Camera not ready yet. Wait a moment, allow camera access, or refresh.', 'warning');
      initCamera();
      return;
    }

    recordedChunksRef.current = [];
    setIsScrollComplete(false);
    
    if (!liveStreamRef.current.active) {
      initCamera().then(() => startRecordingLogic());
    } else {
      startRecordingLogic();
    }

    function startRecordingLogic() {
      try {
        autoStopScheduledRef.current = false;
        setKycSubmitAllowed(false);
        const streamToRecord = liveStreamRef.current;
        const picked = pickRecorderMimeType();
        const mr = picked
          ? new MediaRecorder(streamToRecord, { mimeType: picked })
          : new MediaRecorder(streamToRecord);
        const outType = mr.mimeType || picked || 'video/webm';
        recordedMimeRef.current = outType;

        mediaRecorderRef.current = mr;
        recordedChunksRef.current = [];

        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        mr.onstop = () => {
          if (!mr._intentionalStop) return;
          const chunks = recordedChunksRef.current;
          const blob = new Blob(chunks, { type: recordedMimeRef.current || 'video/webm' });
          if (!blob.size) {
            showToast('Recording was empty. Allow camera and microphone, then try again.', 'warning');
            setPhase('idle');
            return;
          }
          setKycSubmitAllowed(fullScriptReadRef.current);
          const url = URL.createObjectURL(blob);
          setReviewBlobUrl(url);
          setPhase('review');
        };

        mediaRecorderRef.current._intentionalStop = false;
        mr.start(100);
        startTeleprompter();
        setPhase('recording');
      } catch (err) {
        console.error('Recording error:', err);
        showToast('Recording could not start. Try Chrome/Edge, or update your browser.', 'error');
        setPhase('idle');
      }
    }
  }, [initCamera, startTeleprompter, showToast]);

  const stopRecording = useCallback(() => {
    stopTeleprompter();

    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr._intentionalStop = true;
      try {
        if (mr.state === 'recording') mr.requestData();
      } catch (_) {
        /* ignore */
      }
      mr.stop();
    }
  }, [stopTeleprompter]);

  /** When the teleprompter reaches the end, stop recording automatically so review + Submit appear. */
  useEffect(() => {
    if (phase !== 'recording' || !isScrollComplete) return;
    if (autoStopScheduledRef.current) return;
    autoStopScheduledRef.current = true;
    const t = window.setTimeout(() => {
      stopRecording();
    }, 280);
    return () => {
      window.clearTimeout(t);
      autoStopScheduledRef.current = false;
    };
  }, [phase, isScrollComplete, stopRecording]);

  /** If auto-stop failed (browser quirk), force stop shortly after script end. */
  useEffect(() => {
    if (phase !== 'recording' || !isScrollComplete) return;
    const backup = window.setTimeout(() => {
      const mr = mediaRecorderRef.current;
      if (mr && mr.state === 'recording') {
        stopRecording();
      }
    }, 3500);
    return () => window.clearTimeout(backup);
  }, [phase, isScrollComplete, stopRecording]);

  const cancelRecording = useCallback(() => {
    stopTeleprompter();
    autoStopScheduledRef.current = false;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current._intentionalStop = false;
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.stop();
    }
    recordedChunksRef.current = [];
    fullScriptReadRef.current = false;
    setKycSubmitAllowed(false);
    setPhase('idle');
  }, [stopTeleprompter]);

  const retakeRecording = useCallback(() => {
    if (reviewBlobUrl) {
      URL.revokeObjectURL(reviewBlobUrl);
      setReviewBlobUrl(null);
    }
    recordedChunksRef.current = [];
    fullScriptReadRef.current = false;
    setKycSubmitAllowed(false);
    setPhase('idle');
    setUploadError(null);
  }, [reviewBlobUrl]);

  const handleNavigateBack = useCallback(() => {
    stopTeleprompter();
    if (phase === 'countdown') {
      setCountdown(null);
      setPhase('idle');
    } else if (phase === 'recording') {
      cancelRecording();
    } else if (phase === 'review') {
      retakeRecording();
    }
    cleanupStream();
    if (onBack) onBack();
  }, [
    phase,
    stopTeleprompter,
    cancelRecording,
    retakeRecording,
    cleanupStream,
    onBack,
  ]);

  const parentSubmit = onSubmit || onComplete;

  const handleFinalSubmit = useCallback(async () => {
    if (!isAlreadySubmitted && !kycSubmitAllowed) {
      showToast('The full declaration must be read to the end. Tap Retake and read until the script finishes.', 'warning');
      return;
    }
    if (!recordedChunksRef.current || recordedChunksRef.current.length === 0) {
      showToast('No video captured. Record again and wait until the script finishes scrolling.', 'warning');
      return;
    }

    if (!userId) {
      showToast('Session expired. Go back to Phase 1 and complete the steps again.', 'error');
      return;
    }

    setIsProcessing(true);
    setUploadError(null);

    try {
      const blob = new Blob(recordedChunksRef.current, {
        type: recordedMimeRef.current || 'video/webm',
      });

      if (parentSubmit) {
        await parentSubmit(blob);
        const ck = phaseCCacheKey(userId);
        const currentCache = JSON.parse(localStorage.getItem(ck) || '{}');
        localStorage.setItem(
          ck,
          JSON.stringify({
            ...currentCache,
            finalizedAt: Date.now(),
            storedUserId: String(userId || '')
          })
        );
        setIsAlreadySubmitted(true);
        return;
      }

      const formData = new FormData();
      formData.append('video', blob, 'consent_video.webm');

      const response = await fetch(`${apiBaseUrl}/api/finalize-kyc/${userId}`, {
        method: 'POST',
        body: formData,
      });

      let result = {};
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text?.slice(0, 200) || `Server error (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      const ck = phaseCCacheKey(userId);
      const currentCache = JSON.parse(localStorage.getItem(ck) || '{}');
      const updatedCache = {
        ...currentCache,
        submissionId: result.id || result.submissionId,
        storedUserId: String(userId || ''),
        finalizedAt: Date.now(),
        timestamp: Date.now()
      };
      localStorage.setItem(ck, JSON.stringify(updatedCache));

      setIsAlreadySubmitted(true);
      showToast('Video uploaded successfully. Your KYC is being reviewed.', 'success', 4000);

      if (onComplete) onComplete(result);
    } catch (err) {
      console.error('Upload Error:', err);
      const msg = err.message || 'Could not upload video. Check your connection and try again.';
      setUploadError(msg);
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [userId, apiBaseUrl, parentSubmit, onComplete, showToast, kycSubmitAllowed, isAlreadySubmitted]);

  useEffect(() => {
    if (phase !== 'countdown' || countdown === null) return;
    
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCountdown(null);
      startRecording();
    }
  }, [phase, countdown, startRecording]);

  const handleStartClick = () => {
    setCountdown(3);
    setPhase('countdown');
  };

  const handleContinueClick = () => {
    if (parentSubmit) parentSubmit(null);
    else if (onComplete) onComplete({});
  };

  const handleResetClick = () => {
    try {
      localStorage.removeItem(phaseCCacheKey(userId));
      localStorage.removeItem('kyc_phase_c_data');
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  return (
    <>
      <style>{CSS}</style>
      <KycToast toast={toast} />

      <div className="pc-root kyc-phase-scroll">
        <header className="pc-header">
          <div className="pc-header-left">
            {onBack && (
              <button type="button" className="pc-back-btn" onClick={handleNavigateBack} aria-label="Go back">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
            )}
            <div className="pc-logo">
              <div className="pc-logo-dot" />
              COINORA <span className="pc-logo-accent">&nbsp;VDASP</span>
            </div>
          </div>
          <div className="pc-badge">🔒 Secure KYC</div>
        </header>

        <div className="pc-phase-bar">
          <div className="pc-phase-pills">
            <div className="pc-phase-pill done" />
            <div className="pc-phase-pill done" />
            <div className="pc-phase-pill active" />
          </div>
          <p className="pc-phase-label"><b>Step 3</b> of 3 — Video Consent</p>
        </div>

        <div className="pc-wrap">
          <div className="pc-card">
            {phase === 'countdown' && countdown !== null && (
              <div className="pc-countdown-overlay">
                <div className="pc-countdown-num">{countdown}</div>
                <p className="pc-countdown-label">Get Ready to Start</p>
              </div>
            )}

            <div className="pc-card-head">
              <div className="pc-head-left">
                <p className="pc-eyebrow">Final Verification</p>
                <h1 className="pc-title">Video <span>Consent</span></h1>
                <p className="pc-head-desc">
                  {phase === 'review'
                    ? 'Review your recording. If satisfied, submit.'
                    : 'Read the declaration aloud — camera and microphone are on.'}
                </p>
              </div>
            </div>

            <div className="pc-body">
              <div className="pc-grid">
                <div className="pc-teleprompter">
                  <div className="pc-progress-bar">
                    <div 
                      className="pc-progress-fill" 
                      style={{ width: `${phase === 'review' ? 100 : isScrollComplete ? 100 : phase === 'recording' ? 50 : 0}%` }} 
                    />
                  </div>
                  <div className="pc-script-viewport">
                    <div className="pc-script-highlight" />
                    <div className="pc-script-scroll" ref={scrollRef}>
                      <div className="pc-script-inner">
                        <p className="pc-script-text">
                          {sentences.map((s, i) => (
                            <span key={i}>{s}.</span>
                          ))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pc-cam-col">
                  <div className="pc-cam-wrap">
                    <video
                      ref={videoRef}
                      muted
                      playsInline
                      autoPlay
                      className={`pc-video-mirror ${phase === 'review' ? 'pc-hidden' : ''}`}
                      style={{ display: phase === 'review' ? 'none' : 'block' }}
                    />
                    
                    {phase === 'review' && reviewBlobUrl && (
                      <video
                        src={reviewBlobUrl}
                        controls
                        loop
                        playsInline
                        className="pc-video-normal"
                      />
                    )}

                    {phase === 'recording' && (
                      <div className="pc-badge-overlay">
                        <div className="pc-rec-pulse pc-badge-icon" />
                        <span className="pc-badge-text">Rec</span>
                      </div>
                    )}

                    {phase === 'review' && (
                      <div className="pc-badge-overlay" style={{ background: 'rgba(22, 163, 74, 0.9)' }}>
                        <div className="pc-badge-icon">
                          <svg width="8" height="8" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="pc-badge-text">Recorded</span>
                      </div>
                    )}
                  </div>

                  <div className="pc-instructions">
                    <p className="pc-instructions-title">Instructions</p>
                    <div className="pc-instructions-list">
                      {phase === 'review'
                        ? [
                            'Watch the video to ensure clarity',
                            'Ensure your face is visible throughout',
                            'Retake if the video is blurry or incomplete',
                          ].map((txt, i) => (
                            <div key={i} className="pc-instruction-item">
                              <div className="pc-instr-dot" />
                              <span>{txt}</span>
                            </div>
                          ))
                        : [
                            'Keep your face clearly visible in the camera',
                            'Speak clearly — your microphone is recorded with the video',
                            'Recording stops automatically when you finish the script',
                          ].map((txt, i) => (
                            <div key={i} className="pc-instruction-item">
                              <div className="pc-instr-dot" />
                              <span>{txt}</span>
                            </div>
                          ))
                      }
                    </div>
                  </div>

                  {phase === 'recording' && (
                    <div className={`pc-scroll-status${isScrollComplete ? '' : ' warn'}`}>
                      <div className={`pc-status-dot-anim${isScrollComplete ? '' : ' warn'}`} />
                      {isScrollComplete
                        ? 'Script complete — finishing recording…'
                        : 'Read to the end — recording will stop automatically'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pc-footer">
          {phase === 'idle' && (
            <>
              {!isAlreadySubmitted ? (
                <button type="button" className="pc-btn-base pc-start-btn" onClick={handleStartClick}>
                  Start Recording
                  <span className="pc-btn-arr"><ArrowRight /></span>
                </button>
              ) : (
                <button type="button" className="pc-btn-base pc-submit-btn" onClick={handleContinueClick}>
                  Continue KYC
                  <span className="pc-btn-arr"><ArrowRight /></span>
                </button>
              )}
            </>
          )}

          {phase === 'recording' && (
            <button type="button" className="pc-btn-base pc-cancel-btn" onClick={cancelRecording}>
              Cancel
            </button>
          )}

          {phase === 'review' && (
            <>
              {!isAlreadySubmitted && !kycSubmitAllowed && (
                <p
                  style={{
                    margin: '0 0 4px',
                    fontSize: 12,
                    color: '#c2410c',
                    textAlign: 'center',
                    lineHeight: 1.45,
                  }}
                >
                  You stopped before the script finished. Use Retake and read all lines to enable submit.
                </p>
              )}
              <button
                type="button"
                className="pc-btn-base pc-submit-btn"
                onClick={handleFinalSubmit}
                disabled={isProcessing || (!isAlreadySubmitted && !kycSubmitAllowed)}
                title={!isAlreadySubmitted && !kycSubmitAllowed ? 'Read the full script first' : undefined}
              >
                {isProcessing ? (
                  <div className="pc-processing">
                    <div className="pc-spinner" />
                    Uploading Video…
                  </div>
                ) : (
                  <>
                    {isAlreadySubmitted ? 'Continue KYC' : 'Submit Final KYC'}
                    <span className="pc-btn-arr"><ArrowRight /></span>
                  </>
                )}
              </button>
              <button type="button" className="pc-btn-base pc-retake-btn" onClick={retakeRecording} disabled={isProcessing}>
                Retake Recording
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PhaseC;