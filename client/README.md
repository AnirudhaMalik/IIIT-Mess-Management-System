# IIIT Bhubaneswar Mess Management System — Frontend Client

A production-grade, framework-free HTML5/CSS3/Vanilla ES6+ frontend for the central mess and dining portal of the International Institute of Information Technology, Bhubaneswar.

## Architecture & Design Principles

- **Pure Web Standards:** Zero framework dependencies (Vanilla ES6+ JavaScript, Native CSS3 custom properties, Semantic HTML5).
- **Strict Design System:**
  - Color Palette: Primary Navy (`#172B4D`), Secondary Slate (`#334E68`), Crisp Light Background (`#F5F7FA`), White Surfaces (`#FFFFFF`).
  - Strict Rules: No gradients, no shadows (clean `1px solid #E4E7EC` borders only), max 8px border radius on cards, 4px on controls.
  - Micro-interactions: 200ms ease CSS transitions strictly on interactive hover states.
- **Role-Based Routing:**
  - Dynamic route guards via `Auth.requireRole('student')` and `Auth.requireRole('admin')`.
  - Automatic token management with unified 401 expiration handling.
- **Hardware Integration:**
  - Digital QR Code generation via `QRCode.js`.
  - Live Counter QR Camera Barcode Scanner via `Html5Qrcode` library.
  - Interactive multi-metric analytical charts via `Chart.js`.

---

## Directory Structure

```
client/
├── assets/
│   ├── css/
│   │   ├── design-system.css    (Variables, reset, typography, utilities)
│   │   ├── components.css       (Buttons, forms, cards, badges, tables, modals, toasts, loaders)
│   │   ├── layout.css           (Fixed sidebar, topbar, mobile drawer, responsive breakpoints)
│   │   └── pages.css            (Auth split layouts, QR canvas, menu matrix, scanner viewport)
│   ├── js/
│   │   ├── services/
│   │   │   ├── api.js           (Central fetch client with auth headers and error handling)
│   │   │   └── auth.js          (JWT token management, session storage, and role guards)
│   │   └── utils/
│   │       ├── toast.js         (Non-blocking notification system)
│   │       ├── loader.js        (Full-page overlay spinners and skeleton loaders)
│   │       ├── pagination.js    (Reusable list pagination component)
│   │       └── helpers.js       (Date formatting, Indian currency formatting, modal handlers)
│   └── images/
│       └── logo.svg             (Vector institute brand mark)
├── pages/
│   ├── auth/
│   │   ├── login.html           (Institutional sign-in with demo autofill)
│   │   ├── register.html        (Student onboarding with hostel allocation)
│   │   └── forgot-password.html (Password recovery flow)
│   ├── student/
│   │   ├── dashboard.html       (Welcome cards, stats, today's menu, recent activity)
│   │   ├── menu.html            (Weekly menu schedule, day tabs, veg/non-veg tags)
│   │   ├── subscriptions.html   (Active plan details, plan selection, payment modal)
│   │   ├── qr-code.html         (Large digital QR meal pass with regeneration)
│   │   ├── attendance.html      (Meal consumption log, metrics, and date filters)
│   │   ├── payment.html         (Transaction receipts and payment ledger)
│   │   ├── complaints.html      (Grievance filing with image upload and resolution tracking)
│   │   ├── notifications.html   (Dining bulletins with read/unread tracking)
│   │   └── profile.html         (Editable personal info and password change)
│   └── admin/
│       ├── dashboard.html       (Executive metrics, Chart.js graphs, live registrations)
│       ├── scanner.html         (Camera-based QR counter turnstile scanner + manual lookup)
│       ├── menu.html            (7-day meal matrix scheduler and dish item builder)
│       ├── students.html        (Student directory, search, filters, account toggles)
│       ├── plans.html           (Mess plans configuration, pricing, and feature management)
│       ├── subscriptions.html   (Membership ledger, status updates, validity extensions)
│       ├── payments.html        (Revenue reconciliations, settlement filters, CSV exports)
│       ├── complaints.html      (Grievance resolution triage and formal response dispatch)
│       ├── announcements.html   (Official mess broadcasts and draft management)
│       └── reports.html         (Analytical audits across consumption, plans, and quality)
├── index.html                   (Root router redirecting based on authentication state)
└── README.md
```

---

## Testing & Demo Credentials

Launch any HTTP static server in the project directory (e.g. `npx serve client` or Python `python3 -m http.server 8080`).

### Demo Accounts
- **Admin:** `admin@iiitbbs.ac.in` / `Admin@123`
- **Student:** `2200001@iiitbbs.ac.in` / `Student@123`

The login page contains one-click autofill buttons for both roles to expedite testing.

---

## API Service Base
All client API calls point to `http://localhost:5000/api/v1` and handle empty states, network retries, and errors gracefully.
