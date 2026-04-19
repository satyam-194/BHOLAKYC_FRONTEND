import React, { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "./hooks/useToast.js";
import KycToast from "./components/KycToast.jsx";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body { background: #f0f2f7; }

.pb-root {
  background: #f0f2f7;
  font-family: 'DM Sans', sans-serif;
  padding: 0 0 80px 0;
}

.pb-header {
  position: sticky; top: 0; z-index: 50;
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid #e4e8f0;
  padding: 13px 20px; 
  display: flex; align-items: center; justify-content: space-between;
}
.pb-header-content {
  display: flex; align-items: center; justify-content: space-between; width: 100%;
}
.pb-header-left {
  display: flex; align-items: center; gap: 16px;
}
.pb-back-btn {
  background: #f1f5f9; border: none; width: 36px; height: 36px;
  border-radius: 10px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #475569; transition: all 0.2s;
}
.pb-back-btn:hover { background: #e2e8f0; color: #0f172a; }
.pb-back-btn:active { transform: scale(0.95); }

.pb-logo {
  font-family: 'Syne', sans-serif;
  font-size: 14px; letter-spacing: 0.05em; text-transform: uppercase;
  color: #0f172a; display: flex; align-items: center; gap: 8px;
}
.pb-logo-dot { width: 17px; height: 17px; border-radius: 5px; background: #2563eb; flex-shrink: 0; }
.pb-logo-accent { color: #2563eb; }
.pb-badge {
  font-size: 9.5px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
  background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;
  border-radius: 20px; padding: 4px 10px; white-space: nowrap;
}

.pb-phase-bar { padding: 18px 16px 0; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.pb-phase-pills { display: flex; gap: 7px; }
.pb-phase-pill { height: 4px; border-radius: 4px; transition: all 0.3s; }
.pb-phase-pill.done { background: #93c5fd; width: 28px; }
.pb-phase-pill.active { background: #2563eb; width: 40px; }
.pb-phase-label { font-size: 10.5px; font-weight: 500; color: #6b7280; letter-spacing: 0.08em; text-transform: uppercase; }
.pb-phase-label b { color: #2563eb; font-weight: 600; }

.pb-wrap { max-width: 640px; margin: 20px auto 0; padding: 0 14px 40px; }

.pb-card {
  background: #fff; border-radius: 22px;
  border: 1px solid #e4e8f0; overflow: hidden;
  box-shadow: 0 4px 24px rgba(15,23,42,0.07), 0 1px 4px rgba(15,23,42,0.04);
  position: relative;
}

.pb-card-head {
  padding: 24px 24px 0;
  display: flex; align-items: flex-start; justify-content: space-between;
  flex-wrap: wrap; gap: 14px;
}
.pb-head-left {}
.pb-eyebrow {
  font-size: 10px; font-weight: 600; color: #2563eb;
  letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 6px;
}
.pb-title {
  font-family: 'Syne', sans-serif;
  font-size: clamp(20px, 4vw, 26px);
  text-transform: uppercase; letter-spacing: -0.02em; color: #0f172a;
}
.pb-title span { color: #2563eb; }
.pb-head-desc { margin-top: 6px; font-size: 13px; color: #64748b; line-height: 1.5; }

.pb-body { padding: 20px 24px; }

.pb-cache-notice {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px; border-radius: 12px; background: #eff6ff;
  border: 1px solid #bfdbfe; color: #1e40af; font-size: 12px; line-height: 1.45;
  margin-bottom: 18px;
}

.pb-summary {
  display: grid;
  gap: 14px;
  margin-bottom: 22px;
  padding: 16px 18px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}
.pb-summary-row { display: flex; flex-direction: column; gap: 4px; }
.pb-summary-label {
  font-size: 10px; font-weight: 700; color: #64748b;
  letter-spacing: 0.08em; text-transform: uppercase;
}
.pb-summary-value {
  font-size: 15px; font-weight: 700; color: #0f172a; word-break: break-word;
}

.pb-form-grid {
  display: grid; gap: 16px; margin-bottom: 24px;
}

.pb-input-group label {
  display: block; font-size: 11px; font-weight: 600; color: #475569;
  letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px;
}
.pb-input {
  width: 100%; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 10px;
  padding: 12px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif;
  color: #1e293b; outline: none; transition: border-color 0.15s;
}
.pb-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.pb-input:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
  border-color: #e2e8f0;
}
.pb-input--valid-aadhaar { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.12); }
.pb-input-pan { font-weight: 600; letter-spacing: 0.1em; font-variant-numeric: tabular-nums; }
.pb-aadhaar-hint { font-size: 12px; color: #64748b; margin-top: 8px; line-height: 1.4; }
.pb-aadhaar-hint.ok { color: #15803d; font-weight: 600; }
.pb-upload-grid--locked {
  opacity: 0.48;
  pointer-events: none;
  filter: grayscale(0.08);
  position: relative;
}
.pb-upload-grid--locked::after {
  content: '';
  position: absolute; inset: 0;
  border-radius: 12px;
  pointer-events: none;
}
.pb-upload-grid {
  display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 24px;
}
@media(min-width: 600px) { .pb-upload-grid { grid-template-columns: 1fr 1fr; } }

.pb-upload-card {
  border: 1.5px dashed #cbd5e1; border-radius: 12px;
  padding: 16px; background: #f8fafc;
  transition: all 0.2s; cursor: pointer; position: relative;
}
.pb-upload-card:hover { border-color: #2563eb; background: #eff6ff; }
.pb-upload-card.filled {
  border-style: solid; border-color: #16a34a; background: #f0fdf4;
}

.pb-upload-label {
  font-size: 11px; font-weight: 700; color: #475569;
  text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;
  display: flex; align-items: center; justify-content: space-between;
}

.pb-upload-area {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 100px; text-align: center;
}
.pb-upload-icon {
  width: 24px; height: 24px; color: #94a3b8; margin-bottom: 6px;
}
.pb-upload-text {
  font-size: 12px; color: #64748b; font-weight: 500;
}
.pb-upload-hint {
  font-size: 10px; color: #94a3b8; margin-top: 4px;
}

.pb-file-input {
  position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;
}

.pb-preview-img {
  width: 100%; height: 120px; object-fit: cover; border-radius: 8px;
  margin-top: 10px; display: none; border: 1px solid #e2e8f0;
}
.pb-upload-card.filled .pb-preview-img { display: block; }
.pb-upload-card.filled .pb-upload-area { display: none; }

.pb-live-selfie-card {
  grid-column: 1 / -1;
  margin-top: 4px;
  margin-bottom: 8px;
  padding: 22px 20px 24px;
  border-radius: 20px;
  background: linear-gradient(165deg, #f0f7ff 0%, #eef2ff 45%, #f8fafc 100%);
  border: 1px solid rgba(37, 99, 235, 0.15);
  box-shadow: 0 12px 40px rgba(37, 99, 235, 0.08), inset 0 1px 0 rgba(255,255,255,0.9);
}
.pb-live-selfie-head {
  display: flex; align-items: flex-start; gap: 14px;
  margin-bottom: 18px;
}
.pb-live-selfie-ic {
  width: 44px; height: 44px; border-radius: 14px;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
}
.pb-live-selfie-head h3 {
  font-family: 'Syne', sans-serif;
  font-size: 15px; font-weight: 800; color: #0f172a;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}
.pb-live-selfie-head p {
  font-size: 12.5px; color: #64748b; margin-top: 4px; line-height: 1.45;
}
.pb-selfie-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.pb-selfie-frame {
  position: relative;
  width: min(240px, 78vw);
  aspect-ratio: 1;
  border-radius: 50%;
  border: 3px solid transparent;
  background:
    linear-gradient(#0f172a, #1e293b) padding-box,
    linear-gradient(135deg, #60a5fa, #2563eb, #7c3aed) border-box;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.12) inset,
    0 20px 50px rgba(15, 23, 42, 0.35);
}
.pb-selfie-frame.live { animation: pb-ring-pulse 2.2s ease-in-out infinite; }
@keyframes pb-ring-pulse {
  0%, 100% { box-shadow: 0 0 0 1px rgba(255,255,255,0.12) inset, 0 20px 50px rgba(15, 23, 42, 0.35); }
  50% { box-shadow: 0 0 0 1px rgba(255,255,255,0.12) inset, 0 24px 56px rgba(37, 99, 235, 0.25); }
}
.pb-selfie-frame.filled {
  animation: none;
  background: linear-gradient(#ecfdf5, #d1fae5) padding-box,
    linear-gradient(135deg, #22c55e, #16a34a) border-box;
  box-shadow: 0 16px 40px rgba(22, 163, 74, 0.2);
}
.pb-cam-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: scaleX(-1);
}
.pb-selfie-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
  background: radial-gradient(circle at 50% 40%, rgba(37,99,235,0.12), transparent 55%);
  pointer-events: none;
}
.pb-selfie-preview {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: none;
}
.pb-selfie-frame.filled .pb-selfie-preview { display: block; }
.pb-selfie-hint {
  font-size: 11px; color: #64748b; text-align: center; max-width: 300px; line-height: 1.5;
}
.pb-cam-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  width: 100%;
  max-width: 320px;
}
.pb-btn-cam {
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 12px 20px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.12s, box-shadow 0.2s;
}
.pb-btn-cam:active { transform: scale(0.98); }
.pb-btn-cam:disabled { opacity: 0.5; cursor: not-allowed; }
.pb-btn-cam-primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
}
.pb-btn-cam-primary:hover:not(:disabled) {
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.5);
}
.pb-btn-cam-capture {
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: #fff;
  box-shadow: 0 8px 24px rgba(22, 163, 74, 0.35);
}
.pb-btn-cam-ghost {
  background: #fff;
  color: #475569;
  border: 1.5px solid #e2e8f0;
}
.pb-btn-cam-danger {
  background: #fef2f2;
  color: #b91c1c;
  border: 1.5px solid #fecaca;
}
.pb-selfie-wrap .pb-remove-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 15;
}

.pb-remove-btn {
  position: absolute; top: 8px; right: 8px;
  background: rgba(0,0,0,0.5); color: #fff; border: none;
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 10; display: none;
  font-size: 16px; line-height: 1;
}
.pb-upload-card.filled .pb-remove-btn { display: flex; }
.pb-selfie-frame.filled .pb-remove-btn { display: flex; }
.pb-remove-btn:hover { background: #ef4444; }

.pb-footer { padding: 0 24px 24px; display: flex; flex-direction: column; gap: 10px; }

.pb-btn-base {
  width: 100%; color: #fff; border: none; border-radius: 13px; padding: 15px 20px;
  font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 9px;
  transition: background 0.15s, transform 0.1s;
}
.pb-btn-base:active { transform: scale(0.99); }
.pb-btn-base:disabled { background: #e2e8f0; color: #94a3b8; box-shadow: none; cursor: not-allowed; }

.pb-submit-btn { background: #2563eb; box-shadow: 0 8px 20px rgba(37,99,235,0.26); }
.pb-submit-btn:hover:not(:disabled) { background: #1d4ed8; }

.pb-loading-spinner {
  width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media(max-width: 520px) {
  .pb-wrap { padding: 0 12px 32px; margin-top: 14px; }
  .pb-header { padding: 10px 14px; flex-wrap: wrap; gap: 8px; }
  .pb-badge { font-size: 8.5px; padding: 3px 8px; }
  .pb-card-head { padding: 18px 16px 0; }
  .pb-body { padding: 16px 16px; }
  .pb-footer { padding: 0 16px 20px; }
  .pb-title { font-size: clamp(18px, 5.5vw, 24px); }
}

.pb-success-screen {
  text-align: center; padding: 40px 20px;
}
.pb-success-icon {
  width: 60px; height: 60px; background: #dcfce7; border-radius: 50%;
  color: #22c55e; display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}
.pb-success-title { font-family: 'Syne', sans-serif; font-size: 22px; color: #0f172a; margin-bottom: 10px; }
.pb-success-text { color: #64748b; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
.pb-link-btn {
  display: inline-block; color: #2563eb; text-decoration: none; font-weight: 600; font-size: 13px;
  border-bottom: 1px solid transparent; transition: border-color 0.2s;
}
.pb-link-btn:hover { border-color: #2563eb; }
`;

const validateFile = (file) => {
  const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxImageSize = 5 * 1024 * 1024;
  if (!validImageTypes.includes(file.type)) return "Invalid image format. Only JPEG, PNG, or WEBP allowed.";
  if (file.size > maxImageSize) return "Image size exceeds 5MB limit.";
  return null;
};

const CACHE_KEY_B = "kyc_phase_b_data";

const PhaseB = ({ userId, fullname, mobile, proofStatus, phaseAccess, apiBaseUrl, onNext, onBack }) => {
  const { toast, showToast } = useToast();
  const [formData, setFormData] = useState({
    aadhaarNo: '',
    panNo: '',
    utr: '' 
  });
  const [files, setFiles] = useState({
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
    selfie: null
  });
  const [previews, setPreviews] = useState({
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
    selfie: null
  });
  const [cameraStreaming, setCameraStreaming] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    const savedData = localStorage.getItem(CACHE_KEY_B);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.aadhaarNo) setFormData(prev => ({ ...prev, aadhaarNo: parsed.aadhaarNo }));
        if (parsed.panNo) setFormData(prev => ({ ...prev, panNo: parsed.panNo }));
        if (parsed.utr) setFormData(prev => ({ ...prev, utr: parsed.utr }));
      } catch (err) {
        console.error("Failed to load cache", err);
        localStorage.removeItem(CACHE_KEY_B);
      }
    }
  }, []);

  useEffect(() => {
    const dataToSave = {
      aadhaarNo: formData.aadhaarNo,
      panNo: formData.panNo,
      utr: formData.utr,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY_B, JSON.stringify(dataToSave));
  }, [formData]);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  const stopSelfieCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStreaming(false);
  }, []);

  useEffect(() => {
    return () => stopSelfieCamera();
  }, [stopSelfieCamera]);

  useEffect(() => {
    if (!cameraStreaming) return;
    const stream = streamRef.current;
    const v = videoRef.current;
    if (!stream || !v) return;
    v.srcObject = stream;
    const play = v.play();
    if (play && typeof play.catch === 'function') play.catch(() => {});
  }, [cameraStreaming]);

  const startSelfieCamera = async () => {
    if (!idReady) {
      showToast('Enter all 12 digits of your Aadhaar number first, then use the live selfie.', 'warning');
      return;
    }
    stopSelfieCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;
      setCameraStreaming(true);
    } catch (err) {
      console.error(err);
      showToast(
        'Could not open the camera. Allow camera access in your browser or site settings, then try again.',
        'error'
      );
    }
  };

  const captureSelfieFromCamera = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      showToast('Wait until the camera preview is visible, then capture.', 'warning');
      return;
    }
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      showToast('Camera is still starting. Try again in a moment.', 'warning');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          showToast('Could not capture photo. Try again.', 'error');
          return;
        }
        if (blob.size > 5 * 1024 * 1024) {
          showToast('Photo is too large. Improve lighting or move closer, then retake.', 'warning');
          return;
        }
        const file = new File([blob], 'live-selfie.jpg', { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        setPreviews((prev) => {
          if (prev.selfie) URL.revokeObjectURL(prev.selfie);
          return { ...prev, selfie: url };
        });
        setFiles((prev) => ({ ...prev, selfie: file }));
        stopSelfieCamera();
        showToast('Selfie captured. You can retake if needed.', 'success', 2200);
      },
      'image/jpeg',
      0.92
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'aadhaarNo') {
      const digits = value.replace(/\D/g, '').slice(0, 12);
      setFormData((prev) => ({ ...prev, aadhaarNo: digits }));
      return;
    }
    if (name === 'panNo') {
      const pan = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
      setFormData((prev) => ({ ...prev, panNo: pan }));
      return;
    }
    if (name === 'utr') {
      setFormData((prev) => ({ ...prev, utr: value.toUpperCase() }));
    }
  };

  const idReady = /^\d{12}$/.test(formData.aadhaarNo);

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!idReady) {
      showToast('Enter all 12 digits of your Aadhaar number first, then upload documents.', 'warning');
      return;
    }

    const err = validateFile(file);
    if (err) {
      showToast(err, 'error');
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(file);
      setFiles(prev => ({ ...prev, [fieldName]: file }));
      setPreviews(prev => ({ ...prev, [fieldName]: objectUrl }));
    } catch (err) {
      console.error("Preview failed", err);
      setFiles(prev => ({ ...prev, [fieldName]: file }));
    }
  };

  const handleRemoveFile = (fieldName) => {
    const oldPreview = previews[fieldName];
    if (oldPreview) URL.revokeObjectURL(oldPreview);

    if (fieldName === 'selfie') {
      stopSelfieCamera();
    }

    setFiles(prev => ({ ...prev, [fieldName]: null }));
    setPreviews(prev => ({ ...prev, [fieldName]: null }));
    const input = document.getElementById(`input-${fieldName}`);
    if (input) input.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.aadhaarNo || formData.aadhaarNo.length !== 12) {
      showToast('Aadhaar must be exactly 12 digits. Only numbers are allowed.', 'warning');
      return;
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!formData.panNo || !panRegex.test(formData.panNo)) {
      showToast('PAN must be 10 characters: five letters, four numbers, one letter (e.g. ABCDE1234F).', 'warning');
      return;
    }

    const utrRegex = /^[a-zA-Z0-9]{6,}$/;
    if (!formData.utr || !utrRegex.test(formData.utr)) {
      showToast('UTR / reference must be at least 6 letters or numbers.', 'warning');
      return;
    }

    if (!files.aadhaarFront || !files.aadhaarBack || !files.panCard || !files.selfie) {
      showToast('Please add Aadhaar front & back, PAN, and a live selfie.', 'warning');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const submitData = new FormData();
      submitData.append('aadhaar_no', formData.aadhaarNo);
      submitData.append('pan_no', formData.panNo);
      submitData.append('utr', formData.utr); 
      submitData.append('aadhaarFront', files.aadhaarFront);
      submitData.append('aadhaarBack', files.aadhaarBack);
      submitData.append('panCard', files.panCard);
      submitData.append('selfie', files.selfie);

      const response = await fetch(`${apiBaseUrl}/api/finalize-kyc/${userId}`, {
        method: 'POST',
        body: submitData,
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

      showToast('Documents uploaded successfully. Continue to the next step.', 'success', 3200);
      setIsSuccess(true);

      localStorage.removeItem(CACHE_KEY_B);

      if (onNext) onNext({ ...result, utr: formData.utr.trim() });
    } catch (err) {
      console.error(err);
      setError(err.message);
      showToast(err.message || 'Could not submit documents. Check your connection and try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <>
        <style>{CSS}</style>
        <KycToast toast={toast} />
        <div className="pb-root kyc-phase-scroll">
          <header className="pb-header">
            <div className="pb-header-content">
              <div className="pb-header-left">
                <div className="pb-logo">
                  <div className="pb-logo-dot" />
                  COINORA <span className="pb-logo-accent">&nbsp;VDASP</span>
                </div>
              </div>
              <div className="pb-badge">🔒 Secure KYC</div>
            </div>
          </header>
          
          <div className="pb-phase-bar">
            <div className="pb-phase-pills">
              <div className="pb-phase-pill done" />
              <div className="pb-phase-pill done" />
              <div className="pb-phase-pill done" />
            </div>
            <p className="pb-phase-label"><b>Step 2</b> of 2 — Completed</p>
          </div>

          <div className="pb-wrap">
            <div className="pb-card">
              <div className="pb-success-screen">
                <div className="pb-success-icon">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="pb-success-title">Verification Complete</h2>
                <p className="pb-success-text">
                  Your KYC documents and UTR have been submitted successfully. 
                  Our team will review your application shortly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <KycToast toast={toast} />
      <div className="pb-root kyc-phase-scroll">
        <header className="pb-header">
          <div className="pb-header-content">
            <div className="pb-header-left">
              {onBack && (
                <button type="button" className="pb-back-btn" onClick={onBack} aria-label="Go Back">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </button>
              )}
              <div className="pb-logo">
                <div className="pb-logo-dot" />
                COINORA <span className="pb-logo-accent">&nbsp;VDASP</span>
              </div>
            </div>
            <div className="pb-badge">🔒 Secure KYC</div>
          </div>
        </header>

        <div className="pb-phase-bar">
          <div className="pb-phase-pills">
            <div className="pb-phase-pill done" />
            <div className="pb-phase-pill active" />
            <div className="pb-phase-pill inactive" />
          </div>
          <p className="pb-phase-label"><b>Step 2</b> of 3 — Document Upload</p>
        </div>

        <div className="pb-wrap">
          <div className="pb-card">
            <div className="pb-card-head">
              <div className="pb-head-left">
                <p className="pb-eyebrow">Identity Verification</p>
                <h1 className="pb-title">Upload <span>Documents</span></h1>
                <p className="pb-head-desc">Please ensure images are clear and details are visible.</p>
              </div>
            </div>

            <div className="pb-body">
              <form ref={formRef} onSubmit={handleSubmit}>
                {(formData.aadhaarNo || formData.panNo || formData.utr) && (
                  <div className="pb-cache-notice">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Form data is auto-saved. If you refreshed, please re-upload your images.</span>
                  </div>
                )}

                <div className="pb-summary">
                  <div className="pb-summary-row">
                    <span className="pb-summary-label">Full name (from Phase 1)</span>
                    <span className="pb-summary-value">{fullname?.trim() || '—'}</span>
                  </div>
                </div>

                <div className="pb-form-grid">
                  <div className="pb-input-group">
                    <label>UTR / transaction reference</label>
                    <input
                      type="text"
                      name="utr"
                      className="pb-input"
                      placeholder="Bank UTR or reference (min. 6 characters)"
                      value={formData.utr}
                      onChange={handleInputChange}
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                  </div>
                  <div className="pb-input-group">
                    <label>Aadhaar number</label>
                    <input
                      type="tel"
                      name="aadhaarNo"
                      className={`pb-input ${idReady ? 'pb-input--valid-aadhaar' : ''}`}
                      placeholder="Enter 12 digits"
                      value={formData.aadhaarNo}
                      onChange={handleInputChange}
                      maxLength={12}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                    <p className={`pb-aadhaar-hint ${idReady ? 'ok' : ''}`}>
                      {idReady
                        ? 'Aadhaar complete — you can fill PAN and uploads below.'
                        : `Enter ${Math.max(0, 12 - (formData.aadhaarNo?.length || 0))} more digit${
                            Math.max(0, 12 - (formData.aadhaarNo?.length || 0)) === 1 ? '' : 's'
                          } to unlock PAN and document uploads.`}
                    </p>
                  </div>
                  <div className="pb-input-group">
                    <label>PAN (capital letters &amp; numbers)</label>
                    <input
                      type="text"
                      name="panNo"
                      className="pb-input pb-input-pan"
                      placeholder="e.g. ABCDE1234F"
                      value={formData.panNo}
                      onChange={handleInputChange}
                      maxLength={10}
                      disabled={!idReady}
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                  </div>
                </div>

                <div className={`pb-upload-grid ${!idReady ? 'pb-upload-grid--locked' : ''}`}>
                  <div className={`pb-upload-card ${files.aadhaarFront ? 'filled' : ''}`}>
                    <div className="pb-upload-label"><span>Aadhaar Front</span><span style={{color:'#ef4444'}}>*</span></div>
                    <input type="file" id="input-aadhaarFront" className="pb-file-input" accept="image/*" onChange={(e) => handleFileChange(e, 'aadhaarFront')} />
                    {!files.aadhaarFront && (
                      <div className="pb-upload-area">
                        <svg className="pb-upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="pb-upload-text">Click to Upload</span>
                        <span className="pb-upload-hint">JPG, PNG</span>
                      </div>
                    )}
                    {files.aadhaarFront && (
                      <>
                        <img src={previews.aadhaarFront} alt="Preview" className="pb-preview-img" crossOrigin="anonymous" onError={(e) => e.target.style.display='none'}/>
                        <button type="button" className="pb-remove-btn" onClick={() => handleRemoveFile('aadhaarFront')}>×</button>
                      </>
                    )}
                  </div>

                  <div className={`pb-upload-card ${files.aadhaarBack ? 'filled' : ''}`}>
                    <div className="pb-upload-label"><span>Aadhaar Back</span><span style={{color:'#ef4444'}}>*</span></div>
                    <input type="file" id="input-aadhaarBack" className="pb-file-input" accept="image/*" onChange={(e) => handleFileChange(e, 'aadhaarBack')} />
                    {!files.aadhaarBack && (
                      <div className="pb-upload-area">
                        <svg className="pb-upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="pb-upload-text">Click to Upload</span>
                        <span className="pb-upload-hint">JPG, PNG</span>
                      </div>
                    )}
                    {files.aadhaarBack && (
                      <>
                        <img src={previews.aadhaarBack} alt="Preview" className="pb-preview-img" crossOrigin="anonymous" onError={(e) => e.target.style.display='none'}/>
                        <button type="button" className="pb-remove-btn" onClick={() => handleRemoveFile('aadhaarBack')}>×</button>
                      </>
                    )}
                  </div>

                  <div className={`pb-upload-card ${files.panCard ? 'filled' : ''}`}>
                    <div className="pb-upload-label"><span>PAN Card</span><span style={{color:'#ef4444'}}>*</span></div>
                    <input type="file" id="input-panCard" className="pb-file-input" accept="image/*" onChange={(e) => handleFileChange(e, 'panCard')} />
                    {!files.panCard && (
                      <div className="pb-upload-area">
                        <svg className="pb-upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="pb-upload-text">Click to Upload</span>
                        <span className="pb-upload-hint">JPG, PNG</span>
                      </div>
                    )}
                    {files.panCard && (
                      <>
                        <img src={previews.panCard} alt="Preview" className="pb-preview-img" crossOrigin="anonymous" onError={(e) => e.target.style.display='none'}/>
                        <button type="button" className="pb-remove-btn" onClick={() => handleRemoveFile('panCard')}>×</button>
                      </>
                    )}
                  </div>

                  <div className="pb-live-selfie-card">
                    <div className="pb-live-selfie-head">
                      <div className="pb-live-selfie-ic" aria-hidden>
                        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3>
                          Live selfie <span style={{ color: '#ef4444' }}>*</span>
                        </h3>
                        <p>Use your device camera — center your face in the circle, then capture. No file upload.</p>
                      </div>
                    </div>

                    <div className="pb-selfie-wrap">
                      <div
                        className={`pb-selfie-frame ${files.selfie ? 'filled' : ''} ${cameraStreaming && !files.selfie ? 'live' : ''}`}
                      >
                        {cameraStreaming && !files.selfie && (
                          <video ref={videoRef} className="pb-cam-video" playsInline muted autoPlay />
                        )}
                        {!cameraStreaming && !files.selfie && (
                          <div className="pb-selfie-placeholder">
                            <svg width="40" height="40" fill="none" stroke="#94a3b8" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: 8 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Camera preview</span>
                            <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Opens your webcam or phone camera</span>
                          </div>
                        )}
                        {files.selfie && (
                          <>
                            <img
                              src={previews.selfie}
                              alt="Captured selfie"
                              className="pb-selfie-preview"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <button
                              type="button"
                              className="pb-remove-btn"
                              onClick={() => handleRemoveFile('selfie')}
                              aria-label="Remove selfie"
                            >
                              ×
                            </button>
                          </>
                        )}
                      </div>

                      <div className="pb-cam-actions">
                        {!files.selfie && !cameraStreaming && (
                          <button
                            type="button"
                            className="pb-btn-cam pb-btn-cam-primary"
                            onClick={startSelfieCamera}
                            disabled={!idReady}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <circle cx="12" cy="13" r="3" />
                            </svg>
                            Open camera
                          </button>
                        )}
                        {cameraStreaming && !files.selfie && (
                          <>
                            <button type="button" className="pb-btn-cam pb-btn-cam-capture" onClick={captureSelfieFromCamera}>
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="9" />
                                <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
                              </svg>
                              Capture photo
                            </button>
                            <button type="button" className="pb-btn-cam pb-btn-cam-ghost" onClick={stopSelfieCamera}>
                              Cancel
                            </button>
                          </>
                        )}
                        {files.selfie && (
                          <button
                            type="button"
                            className="pb-btn-cam pb-btn-cam-danger"
                            onClick={() => {
                              handleRemoveFile('selfie');
                            }}
                          >
                            Retake selfie
                          </button>
                        )}
                      </div>

                      <p className="pb-selfie-hint">
                        Grant camera permission when asked. Captured image is saved as JPEG (max 5MB). Works on modern
                        browsers and mobile Chrome / Safari.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pb-footer">
                  <button type="submit" className="pb-btn-base pb-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <div className="pb-loading-spinner" />
                    ) : (
                      "Submit Documents"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PhaseB;