# Student-Teacher Booking Appointment System

A web-based appointment booking system that allows students to book appointments with teachers, built using **HTML, CSS, JavaScript, and Firebase**.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Firebase Setup](#firebase-setup)
- [Installation & Execution](#installation--execution)
- [User Roles & Workflow](#user-roles--workflow)
- [Database Schema](#database-schema)
- [Logging](#logging)
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## Project Overview

This system provides a platform where:
- **Admin** manages teachers, approves student/teacher registrations, and monitors all appointments.
- **Teachers** set their availability, approve/cancel appointment requests, and view messages from students.
- **Students** search for teachers, book appointments based on available slots, and send messages to teachers.

---

## Features

### Admin
- Login with admin credentials
- Add new teachers (Name, Department, Subject, Qualification, Experience)
- Update/Delete existing teachers
- Approve or reject student and teacher registrations
- View all appointments across the system
- View system logs for all actions
- Logout

### Teacher
- Register and login (after admin approval)
- Schedule available appointment slots (day, date, time)
- Approve or cancel appointment requests from students
- View messages from students
- View all their appointments
- Logout

### Student
- Register and login (after admin approval)
- Search teachers by name, department, or subject
- Book appointments with teachers from available slots
- Send messages to teachers
- View their appointment history and status
- Logout

### System
- Comprehensive logging of all actions (stored in Firestore + browser console)
- Role-based access control (Admin, Teacher, Student)
- Registration approval workflow
- Responsive design for mobile and desktop

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| HTML5 | Page structure and content |
| CSS3 | Styling, layout, responsive design |
| JavaScript (ES6+) | Client-side logic, DOM manipulation |
| Firebase Auth | User authentication (email/password) |
| Firebase Firestore | NoSQL database for all data storage |
| Firebase Hosting | Deployment (optional) |

---

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser (Client)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Admin   │  │ Teacher  │  │ Student  │      │
│  │Dashboard │  │Dashboard │  │Dashboard │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │              │              │            │
│  ┌────┴──────────────┴──────────────┴────┐      │
│  │        JavaScript Modules             │      │
│  │  auth.js | logger.js | admin.js       │      │
│  │  teacher.js | student.js              │      │
│  └────────────────┬──────────────────────┘      │
└───────────────────┼──────────────────────────────┘
                    │ Firebase SDK (HTTPS)
┌───────────────────┼──────────────────────────────┐
│           Firebase Cloud Services                 │
│  ┌────────────────┴──────────────────────┐       │
│  │         Firebase Authentication        │       │
│  │      (Email/Password Auth)            │       │
│  └───────────────────────────────────────┘       │
│  ┌───────────────────────────────────────┐       │
│  │         Cloud Firestore               │       │
│  │  Collections:                         │       │
│  │  - users (admin, teacher, student)    │       │
│  │  - appointments                       │       │
│  │  - slots                              │       │
│  │  - messages                           │       │
│  │  - logs                               │       │
│  └───────────────────────────────────────┘       │
└──────────────────────────────────────────────────┘
```

---

## Project Structure

```
student-teacher-booking/
├── index.html                 # Login page
├── register.html              # Registration page (Student/Teacher)
├── setup.html                 # Initial admin setup page
├── admin-dashboard.html       # Admin dashboard
├── teacher-dashboard.html     # Teacher dashboard
├── student-dashboard.html     # Student dashboard
├── firestore.rules            # Firestore security rules
├── README.md                  # Project documentation
├── css/
│   └── style.css              # All styles (responsive)
└── js/
    ├── firebase-config.js     # Firebase configuration
    ├── logger.js              # Logging module
    ├── auth.js                # Authentication module
    ├── admin.js               # Admin dashboard logic
    ├── teacher.js             # Teacher dashboard logic
    ├── student.js             # Student dashboard logic
    └── setup-admin.js         # Admin account setup script
```

---

## Firebase Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"** and follow the wizard
3. Give your project a name (e.g., `student-teacher-booking`)

### Step 2: Enable Authentication
1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider

### Step 3: Create Firestore Database
1. Go to **Firestore Database** > **Create database**
2. Start in **Test mode** (or use the rules from `firestore.rules`)
3. Choose a region closest to you

### Step 4: Create Required Indexes
In Firestore, create the following composite indexes:

| Collection | Fields | Order |
|------------|--------|-------|
| appointments | teacherId (Asc), status (Asc), date (Asc) | — |
| appointments | teacherId (Asc), status (Asc), createdAt (Desc) | — |
| appointments | teacherId (Asc), createdAt (Desc) | — |
| appointments | studentId (Asc), createdAt (Desc) | — |
| appointments | studentId (Asc), status (Asc) | — |
| slots | teacherId (Asc), date (Asc) | — |
| slots | teacherId (Asc), isBooked (Asc), date (Asc) | — |
| messages | toId (Asc), createdAt (Desc) | — |
| messages | fromId (Asc), createdAt (Desc) | — |
| logs | timestamp (Desc) | — |

> **Tip:** Firebase will auto-prompt you to create indexes when queries fail. Simply click the link in the browser console error to auto-create the required index.

### Step 5: Get Firebase Config
1. Go to **Project Settings** > **General** > **Your apps**
2. Click the web icon (`</>`) to register a web app
3. Copy the `firebaseConfig` object
4. Paste it into `js/firebase-config.js`

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Step 6: Deploy Firestore Rules
Copy the contents of `firestore.rules` into **Firestore Database** > **Rules** tab and publish.

---

## Installation & Execution

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge)
- A Firebase account (free tier is sufficient)
- A local web server (optional, for local development)

### Steps to Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/student-teacher-booking.git
   cd student-teacher-booking
   ```

2. **Configure Firebase**
   - Open `js/firebase-config.js`
   - Replace the placeholder values with your Firebase project credentials

3. **Start a local server** (any one of these):
   ```bash
   # Using Python
   python -m http.server 8080

   # Using Node.js (install http-server globally)
   npx http-server -p 8080

   # Using VS Code Live Server extension
   # Right-click index.html > "Open with Live Server"
   ```

4. **Create Admin Account**
   - Open `http://localhost:8080/setup.html` in your browser
   - Fill in admin name, email, and password
   - Click "Create Admin Account"

5. **Login as Admin**
   - Go to `http://localhost:8080/index.html`
   - Select "Admin" role and login with the credentials you just created

6. **Start using the system!**

---

## User Roles & Workflow

### Complete Workflow

```
1. Admin Setup
   └── Open setup.html → Create admin account

2. Admin Login
   ├── Add Teachers (or approve teacher registrations)
   ├── Approve Student registrations
   └── Monitor appointments and logs

3. Teacher Registration & Login
   ├── Register at register.html (select "Teacher")
   ├── Wait for admin approval
   ├── Login → Set available slots
   ├── Approve/Cancel student appointment requests
   └── View messages from students

4. Student Registration & Login
   ├── Register at register.html (select "Student")
   ├── Wait for admin approval
   ├── Login → Search for teachers
   ├── Book appointment from available slots
   ├── Send messages to teachers
   └── Track appointment status
```

### Appointment Lifecycle

```
Student books slot → Status: PENDING
    ↓
Teacher reviews request
    ├── Approves → Status: APPROVED
    └── Cancels  → Status: CANCELLED (slot freed)
```

---

## Database Schema

### Users Collection (`users`)
| Field | Type | Description |
|-------|------|-------------|
| uid | string | Firebase Auth UID |
| email | string | User email |
| name | string | Full name |
| role | string | "admin" / "teacher" / "student" |
| approved | boolean | Whether account is approved by admin |
| department | string | Teacher's department |
| subject | string | Teacher's subject |
| qualification | string | Teacher's qualification |
| experience | string | Teacher's years of experience |
| studentId | string | Student's ID number |
| course | string | Student's course |
| semester | string | Student's semester |
| createdAt | timestamp | Account creation time |

### Appointments Collection (`appointments`)
| Field | Type | Description |
|-------|------|-------------|
| studentId | string | Student's UID |
| studentName | string | Student's name |
| teacherId | string | Teacher's UID |
| teacherName | string | Teacher's name |
| slotId | string | Reference to the booked slot |
| date | string | Appointment date |
| time | string | Appointment time range |
| purpose | string | Purpose of appointment |
| status | string | "pending" / "approved" / "cancelled" |
| createdAt | timestamp | Booking time |

### Slots Collection (`slots`)
| Field | Type | Description |
|-------|------|-------------|
| teacherId | string | Teacher's UID |
| teacherName | string | Teacher's name |
| day | string | Day of the week |
| date | string | Specific date |
| startTime | string | Slot start time |
| endTime | string | Slot end time |
| isBooked | boolean | Whether slot is booked |
| createdAt | timestamp | Slot creation time |

### Messages Collection (`messages`)
| Field | Type | Description |
|-------|------|-------------|
| fromId | string | Sender's UID |
| fromName | string | Sender's name |
| toId | string | Recipient's UID |
| toName | string | Recipient's name |
| subject | string | Message subject |
| message | string | Message body |
| createdAt | timestamp | Send time |

### Logs Collection (`logs`)
| Field | Type | Description |
|-------|------|-------------|
| timestamp | string | ISO timestamp |
| level | string | INFO / WARN / ERROR / ACTION / DEBUG |
| module | string | Module name (Auth, Admin, Teacher, Student) |
| message | string | Log message |
| userId | string | User who triggered the action |
| userAgent | string | Browser user agent |

---

## Logging

All actions in the application are logged using a custom JavaScript logging module (`js/logger.js`). Logs are:

1. **Printed to browser console** with color-coded levels:
   - 🔵 **INFO** - General information
   - 🟡 **WARN** - Warnings
   - 🔴 **ERROR** - Errors
   - ⚪ **DEBUG** - Debug information
   - 🟢 **ACTION** - User actions (login, booking, approval, etc.)

2. **Stored in Firestore** (`logs` collection) for admin review

### Logged Actions Include:
- User login/logout
- Registration attempts
- Teacher CRUD operations
- Appointment booking, approval, cancellation
- Message sending
- Page navigation
- Search queries
- All errors

---

## Deployment

### Option 1: Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### Option 2: GitHub Pages
1. Push code to GitHub
2. Go to repository **Settings** > **Pages**
3. Select branch and folder, then save

### Option 3: Netlify
1. Push code to GitHub
2. Connect repository to Netlify
3. Set publish directory to root (`/`)
4. Deploy

---

## Coding Standards

- **Modular Architecture**: Each role (Admin, Teacher, Student) has its own JS module
- **Safe**: No harmful operations; all destructive actions require confirmation
- **Testable**: Functions are isolated and can be tested independently
- **Maintainable**: Clean separation of concerns (HTML/CSS/JS)
- **Portable**: Works in any modern browser on any OS
- **Logging**: Every action is logged for debugging and auditing
- **Responsive**: Works on desktop, tablet, and mobile devices

---

## License

This project is developed for educational purposes.
