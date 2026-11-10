# IIIT Bhubaneswar — Mess Management System

A production-style, full-stack web application for managing all mess-related operations at IIIT Bhubaneswar.

## Quick Start

```bash
# 1. Start MongoDB
mongod --dbpath ~/mongodb-data

# 2. Install backend & seed data
cd server && npm install && npm run seed

# 3. Start backend
npm run dev

# 4. Serve frontend (new terminal)
cd ../client && python3 -m http.server 3000

# 5. Open http://localhost:3000
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@iiitbbs.ac.in | Admin@123 |
| Student | 22cs001@iiitbbs.ac.in | Student@123 |
| Student | 22cs002@iiitbbs.ac.in | Student@123 |

(Students 22cs001–22cs010 all use password: Student@123)

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **QR**: qrcode (generation) + jsQR (scanning)
- **Charts**: Chart.js (CDN)

## Features

### Student
- Login/Register with role-based redirect
- Dashboard with today's menu, subscription status, attendance summary
- Mess plan subscription with demo payment flow (UPI/Card/Net Banking)
- QR code generation for meal verification
- Weekly menu view
- Meal attendance history
- Complaint submission with image upload
- In-app notifications

### Admin
- Dashboard with live stats and Chart.js charts
- Student management (add, edit, activate/deactivate)
- Mess plan management
- Weekly menu management
- Camera-based QR scanner for meal verification
- Manual student lookup fallback
- Subscription management
- Transaction/payment management
- Complaint resolution system
- Announcement publishing
- Reports with CSV export

## API Base

```
http://localhost:5000/api/v1
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | Login |
| POST | /auth/register | Register student |
| GET | /plans | List mess plans |
| GET | /menus/today | Today's menu |
| GET | /subscriptions/my | My subscriptions |
| POST | /payments/initiate | Start demo payment |
| POST | /payments/confirm | Confirm payment |
| GET | /qr/my-token | Get QR code |
| POST | /qr/verify | Verify QR (admin) |
| GET | /attendance/my | My meal attendance |
| POST | /complaints | Submit complaint |
| GET | /reports/dashboard-stats | Admin stats |
| GET | /reports/export?type=payments | Export CSV |

## Project Structure

```
├── client/                 # Frontend (HTML/CSS/JS)
│   ├── assets/
│   │   ├── css/           # Design system, components, layout
│   │   └── js/
│   │       ├── services/  # api.js, auth.js
│   │       └── utils/     # helpers, toast, loader, pagination
│   └── pages/
│       ├── auth/          # login, register, forgot-password
│       ├── student/       # dashboard, profile, subscriptions, menu, qr-code, payment, attendance, complaints, notifications
│       └── admin/         # dashboard, students, plans, menu, scanner, subscriptions, payments, complaints, announcements, reports
│
└── server/                 # Backend API
    ├── src/
    │   ├── controllers/   # Request handlers
    │   ├── models/        # Mongoose schemas
    │   ├── routes/        # Express routes
    │   ├── middleware/    # Auth, roles, errors, uploads
    │   ├── services/      # QR, payment, notification
    │   └── utils/         # API response, audit log
    └── scripts/
        └── seedData.js    # Demo data seeder
```

## Database Models

| Model | Purpose |
|-------|---------|
| User | Student & admin accounts |
| MessPlan | Available subscription plans |
| Subscription | Student plan enrollments |
| Menu | Daily meal menus |
| QRToken | Student QR verification tokens |
| Transaction | Demo payment records |
| MealAttendance | Meal verification logs |
| Complaint | Student complaints |
| Notification | In-app notifications |
| Announcement | Admin announcements |
| AuditLog | System action log |

## Security

- bcryptjs password hashing (cost factor 12)
- JWT authentication (7-day expiry)
- Role-based route protection (students ≠ admin routes)
- Helmet security headers
- Rate limiting (100 req/15min/IP)
- Input validation on all endpoints
- File upload type/size restrictions
- No real financial data stored

## ⚠️ Payment Disclaimer

The payment system is **entirely simulated**. No real transactions occur. All transactions are flagged with `isDemo: true`. Never enter real card numbers or UPI PINs.
