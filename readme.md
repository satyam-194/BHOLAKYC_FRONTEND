# KYC Application — Backend Developer Documentation

> **Stack:** Node.js · Express · MongoDB (Mongoose) · Multer  
> **Backend port:** `5001`  
> **Frontend origin (CORS):** `http://localhost:3000` (override via `ALLOWED_ORIGIN` env var; comma‑separate multiple origins)

---

## Table of Contents

1. [Environment Variables](#1-environment-variables)
2. [Project Structure](#2-project-structure)
3. [Dependencies](#3-dependencies)
4. [Data Models](#4-data-models)
5. [File Storage](#5-file-storage)
6. [API Endpoints](#6-api-endpoints)
   - [Admin — Auth](#admin--auth)
   - [Admin — User Management](#admin--user-management)
   - [KYC — Phase 1 (Declaration)](#kyc--phase-1-declaration)
   - [KYC — Phase Access Check](#kyc--phase-access-check)
   - [KYC — Phase 2 (Finalize)](#kyc--phase-2-finalize)
7. [Rate Limiting](#7-rate-limiting)
8. [Input Validation & Sanitization](#8-input-validation--sanitization)
9. [Known Bugs in Source](#9-known-bugs-in-source)
10. [Security Notes](#10-security-notes)

---

## 1. Environment Variables


```

All three fall back to the defaults shown above if not set.

---

## 2. Project Structure

```
COINORA-SRC-CODE/
├── backend/
│   ├── storage/                    # auto-created on server start
│   │   ├── images/
│   │   │   └── <refId>/            # per-user folder (e.g. CN-1001/)
│   │   │       ├── aadhaar_front.jpg
│   │   │       ├── aadhaar_back.jpg
│   │   │       ├── pan.jpg
│   │   │       ├── selfie.jpg
│   │   │       └── purpose_proof.jpg
│   │   ├── videos/
│   │   │   └── <refId>/
│   │   │       └── video.webm
│   │   └── pdfs/
│   │       └── <refId>.pdf         # e.g. CN-1001.pdf
│   ├── generateKycPDF.js
│   ├── server.js                   # entire Node.js backend
│   └── package.json
├── src/
│   ├── PhaseA.jsx                  # basic user details phase
│   ├── PhaseB.jsx                  # document upload phase
│   ├── PhaseC.jsx                  # live video phase
│   ├── App.jsx                     # main router & navigation
│   ├── UserKYC.jsx                 # phase orchestrator
│   ├── AdminDashboard.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
└── package.json
```

Storage folders are auto-created on server start if they don't exist.  
Files are served as static assets at: `GET /storage/<subpath>`

---

## 3. Dependencies

| Package | Version | Purpose |
|---|---|---|
| `express` | ^4.18.2 | HTTP server & routing |
| `mongoose` | ^7.6.3 | MongoDB ODM |
| `multer` | ^1.4.4 | Multipart file uploads |
| `cors` | ^2.8.5 | Cross-origin headers |
| `helmet` | ^7.1.1 | HTTP security headers |
| `express-rate-limit` | ^7.1.1 | Rate limiting |
| `dotenv` | ^16.0.0 | Environment variables |

---

## 4. Data Models

### Counter Schema
Used internally to auto-generate sequential `refId` values like `CN-1001`.

```js
{
  name:  String,  // e.g. "kyc_ref"
  value: Number   // auto-incremented
}
```

---

### Admin Schema

```js
{
  username: String,  // required, unique
  password: String   // required — plain text currently; use bcrypt in production
}
```

A default admin is seeded on first run if no admin exists:
- **Username:** `admin`
- **Password:** `admin123`
- ⚠️ Change this immediately in the database after first login.

---

### User Schema

| Field | Type | Default | Notes |
|---|---|---|---|
| `refId` | String | `''` | Auto-generated, format `CN-<n>` |
| `buyer_full_name` | String | `''` | |
| `buyer_email` | String | `''` | |
| `buyer_mobile` | String | `''` | |
| `buyer_aadhaar_no` | String | `''` | Set in Phase 2 |
| `buyer_pan_no` | String | `''` | Set in Phase 2 |
| `buyer_address` | String | `''` | |
| `utr_reference_no` | String | `''` | Set in Phase 1 |
| `amount` | String | `''` | |
| `q1` – `q5` | String | `''` | Declaration answers |
| `proof_status` | String | `'Not Required'` | `Pending`, `Approved`, `Rejected`, `Not Required` |
| `phase_access` | Boolean | `false` | Set to `true` when proof approved (or not required) |
| `phase1_completed` | Boolean | `false` | Set `true` on Phase 1 submit |
| `final_kyc_completed` | Boolean | `false` | Set `true` on Phase 2 submit |
| `admin_status` | String | `'Pending'` | `Pending`, `Verified`, `Rejected` |
| `execution_date` | Date | `Date.now` | |
| `purpose_proof_path` | String | `''` | Relative path e.g. `images/CN-1/purpose_proof.jpg` |
| `path_aadhaar_front` | String | `''` | Relative path |
| `path_aadhaar_back` | String | `''` | Relative path |
| `path_pan_card` | String | `''` | Relative path |
| `path_selfie_live` | String | `''` | Relative path |
| `path_video_verification` | String | `''` | Relative path |
| `pdf_path` | String | `''` | e.g. `pdfs/CN-1001.pdf` |

---

## 5. File Storage

### Accepted types

| Category | Allowed MIME types | Max size |
|---|---|---|
| Images | `image/jpeg`, `image/jpg`, `image/png`, `image/webp` | 5 MB |
| Video | `video/webm`, `video/mp4` | 50 MB |

### Stored filenames

Files are saved with fixed names inside a per-user folder (`/storage/images/<refId>/`):

| Form field | Saved filename |
|---|---|
| `purpose_proof` | `purpose_proof.<ext>` |
| `aadhaarFront` | `aadhaar_front.<ext>` |
| `aadhaarBack` | `aadhaar_back.<ext>` |
| `panCard` | `pan.<ext>` |
| `selfie` | `selfie.<ext>` |
| `video` | `video.<ext>` (in `/videos/<refId>/`) |

### Accessing files

All files under `/storage` are served as static assets:

```
GET /storage/images/CN-1001/selfie.jpg
GET /storage/videos/CN-1001/video.webm
GET /storage/pdfs/CN-1001.pdf
```

---

## 6. API Endpoints

All endpoints are prefixed with `/api`. Request body is JSON unless noted as `multipart/form-data`.

---

### Admin — Auth

#### `POST /api/admin/login`

Authenticates an admin user.

**Rate limit:** 10 attempts per 15 minutes per IP.

**Request body (JSON):**

| Field | Type | Required |
|---|---|---|
| `id` | String | Yes — the admin username |
| `password` | String | Yes |

**Responses:**

```json
// 200 OK — success
{ "success": true, "message": "Login Successful" }

// 401 — wrong credentials
{ "success": false, "error": "Invalid Credentials" }

// 400 — missing fields
{ "success": false, "error": "ID and password are required." }

// 429 — rate limited
{ "success": false, "error": "Too many login attempts. Try again in 15 minutes." }
```

---

### Admin — User Management

#### `GET /api/admin/all-users`

Returns a summary list of all KYC users, sorted by `execution_date` descending (newest first).

**Response (200):** Array of user summary objects.

```json
[
  {
    "id": "64f3a...",
    "refId": "CN-1001",
    "buyer_full_name": "Ravi Sharma",
    "buyer_mobile": "9876543210",
    "utr_reference_no": "UTR123456",
    "amount": "50000",
    "admin_status": "Pending",
    "proof_status": "Not Required",
    "phase_access": true,
    "final_kyc_completed": false,
    "execution_date": "2024-01-15T10:30:00.000Z"
  }
]
```

---

#### `GET /api/admin/user-details/:id`

Returns full KYC details for a single user including all file paths.

**URL param:** `:id` — MongoDB ObjectId of the user.

**Response (200):** Full user object with all fields including `q1`–`q5`, all file paths, and `pdf_path`.

**Error responses:**
```json
// 400
{ "error": "Invalid user ID." }

// 404
{ "error": "User not found." }
```

---

#### `POST /api/admin/update-proof-status`

Updates the `proof_status` for a user. Automatically sets `phase_access`:
- `Approved` → `phase_access: true`
- `Rejected` → `phase_access: false`

**Request body (JSON):**

| Field | Type | Allowed values |
|---|---|---|
| `id` | String | Valid MongoDB ObjectId |
| `proof_status` | String | `Pending`, `Approved`, `Rejected`, `Not Required` |

**Response:**
```json
// 200
{ "success": true }

// 400 — invalid status value
{ "error": "Invalid proof status value." }
```

---

#### `POST /api/admin/update-status`

Updates the final `admin_status` of a KYC record.

**Request body (JSON):**

| Field | Type | Allowed values |
|---|---|---|
| `id` | String | Valid MongoDB ObjectId |
| `status` | String | `Pending`, `Verified`, `Rejected` |

**Response:**
```json
{ "success": true }
```

---

#### `DELETE /api/admin/delete-user/:userId`

Deletes a user record and all associated files (images folder, video folder, PDF).

**URL param:** `:userId` — MongoDB ObjectId.

**Response:**
```json
// 200 — deleted
{ "success": true, "message": "User and all associated files deleted.", "affectedRows": 1 }

// 200 — user not found (treated as no-op)
{ "success": true, "affectedRows": 0 }

// 400
{ "error": "Invalid user ID." }
```

---

### KYC — Phase 1 (Declaration)

#### `POST /api/phase1-submit`

Submits Phase 1 (declaration form). Creates a new user record and auto-generates a `refId`.

**Rate limit:** 20 submissions per hour per IP.

**Content-Type:** `multipart/form-data`

**Fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `fullname` | String | Yes | Max 100 chars |
| `buyer_mobile` | String | Yes | Max 15 chars |
| `amount` | String | Yes | Max 20 chars |
| `email` | String | No | Max 150 chars |
| `utr` | String | No | Max 50 chars |
| `q1` – `q4` | String | No | Max 200 chars each |
| `q5` | String | No | Must be one of: `Spot Trading`, `Futures Trading`, `HOLD`, `Investment`, `Other` |
| `purpose_proof` | File (image) | Conditional | **Required** if `q5` is `Spot Trading`, `Futures Trading`, or `HOLD` |

**Proof logic:**

| `q5` value | `proof_status` set to | `phase_access` set to |
|---|---|---|
| `Spot Trading`, `Futures Trading`, `HOLD` | `Pending` | `false` (requires admin approval) |
| `Investment`, `Other`, or empty | `Not Required` | `true` (can proceed immediately) |

**Response (200):**
```json
{
  "success": true,
  "id": "64f3a...",
  "refId": "CN-1001",
  "proof_status": "Not Required",
  "phase_access": true
}
```

**Error responses:**
```json
// 400 — missing required fields
{ "success": false, "error": "Required fields are missing." }

// 400 — invalid q5 value
{ "success": false, "error": "Invalid purpose value." }

// 400 — proof image missing when required
{ "success": false, "error": "Proof image is required for the selected purpose." }
```

---

### KYC — Phase Access Check

#### `POST /api/check-phase-access`

Checks whether a user is allowed to proceed to Phase 2. Used at the Phase 1 → Phase 2 transition screen.

**Request body (JSON):**

| Field | Type | Required | Notes |
|---|---|---|---|
| `refId` | String | Yes | Must match format `CN-<number>` |
| `buyer_mobile` | String | Yes | Max 15 chars |

**Response (200):**
```json
{
  "success": true,
  "id": "64f3a...",
  "refId": "CN-1001",
  "proof_status": "Approved",
  "phase_access": true,
  "buyer_full_name": "Ravi Sharma"
}
```

**Error responses:**
```json
// 400 — missing fields
{ "success": false, "error": "Ref ID and mobile are required." }

// 400 — bad refId format (not CN-<number>)
{ "success": false, "error": "Invalid Ref ID format." }

// 404
{ "success": false, "error": "Record not found." }
```

---

### KYC — Phase 2 (Finalize)

#### `POST /api/finalize-kyc/:id`

Submits Phase 2 documents and optional Phase 3 video. Triggers KYC PDF generation after saving.

**URL param:** `:id` — MongoDB ObjectId of the user (returned from Phase 1 submit or phase access check).

**Prerequisite:** `user.phase_access` must be `true`, otherwise returns 403.

**Content-Type:** `multipart/form-data`

**Fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `aadhaar_no` | String | No | Max 20 chars; updates `buyer_aadhaar_no` |
| `pan_no` | String | No | Max 20 chars; updates `buyer_pan_no` |
| `aadhaarFront` | File (image) | No | Saved as `aadhaar_front.<ext>` |
| `aadhaarBack` | File (image) | No | Saved as `aadhaar_back.<ext>` |
| `panCard` | File (image) | No | Saved as `pan.<ext>` |
| `selfie` | File (image) | No | Saved as `selfie.<ext>` |
| `video` | File (video) | No | Saved as `video.<ext>` in `/videos/<refId>/` |

> All file fields are optional on re-submission — existing paths are preserved if no new file is uploaded.

**On success:**
- Sets `final_kyc_completed: true`
- Resets `admin_status` to `Pending`
- Calls `generateKycPDF()` using Aadhaar front/back and PAN paths
- Saves `pdf_path` as `pdfs/<refId>.pdf`

**Response (200):**
```json
{
  "success": true,
  "id": "64f3a...",
  "refId": "CN-1001",
  "pdf_path": "pdfs/CN-1001.pdf"
}
```

**Error responses:**
```json
// 400 — invalid ObjectId
{ "success": false, "error": "Invalid user ID." }

// 403 — phase access not granted
{ "success": false, "error": "Phase 2 access not approved yet." }

// 404
{ "success": false, "error": "User not found." }

// 400 — file too large
{ "error": "File too large. Max 5 MB for images, 50 MB for video." }

// 400 — wrong file type
{ "error": "Invalid file type for aadhaarFront. Only JPEG, PNG and WEBP images are allowed." }
```

---

## 7. Rate Limiting

| Limiter | Applies to | Window | Max requests |
|---|---|---|---|
| `loginLimiter` | `POST /api/admin/login` | 15 minutes | 10 |
| `phase1Limiter` | `POST /api/phase1-submit` | 60 minutes | 20 |

---

## 8. Input Validation & Sanitization

All string inputs are passed through `sanitizeString(val, maxLen)` which:
- Rejects non-strings (returns `''`)
- Trims whitespace
- Truncates to `maxLen`

`refId` values are also validated against the regex `/^CN-\d+$/` via `sanitizeRefId()` before any database or filesystem operation.

---

## 9. Known Bugs in Source

These are bugs found in the current `server.js`:

| Line | Bug | Fix |
|---|---|---|
| 427 | `buyer_mobile` used as variable but should be `buyerMobile` (declared on line 415) | Change `buyer_mobile` → `buyerMobile` in the `findOne` query |
| 582 | `saveRefId` is a typo — should be `safeRefId` | Change `saveRefId` → `safeRefId` |

---

## 10. Security Notes

- **Helmet** is enabled — sets standard HTTP security headers on all responses.
- **CORS** is restricted to `ALLOWED_ORIGIN` only. Allowed methods: `GET`, `POST`, `DELETE`.
- **NoSQL injection** is mitigated by sanitizing all string inputs and validating ObjectIds with `mongoose.Types.ObjectId.isValid()`.
- **File uploads** are type-checked by MIME type (not just extension) and size-limited via Multer.
- **Admin password** is stored in plain text currently. Use `bcrypt` before deploying to production.
- **No session/JWT** is implemented yet. Admin login returns success but does not issue a token — any client that calls admin routes succeeds without authentication. Add token-based auth before going to production.
- **Default admin credentials** (`admin` / `admin123`) are seeded automatically on first run. Change them immediately.