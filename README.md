# Sunrise Dental Clinic System - Frontend

## Overview
An interactive, menu-driven web client for clinic staff, consuming the `backend/` REST API.
Solves the double bookings, lost records, long waits, and billing errors described in the
assessment brief's scenario.

## Technology Stack
* **HTML5 / CSS3** - semantic structure and a custom, responsive design system (`css/styles.css`)
* **JavaScript (vanilla)** - no framework; `fetch` for API calls, DOM APIs for rendering
* **Chart.js** (via CDN) - the admin Reports charts

## Project Structure
* `index.html` - staff login (issues a JWT + an HttpOnly session cookie on success)
* `dashboard.html` - the main application shell: sidebar navigation between five sections
* `css/styles.css` - all visual styling
* `js/api.js` - `ApiService`: every HTTP call to the backend, JWT + session-cookie handling
* `js/app.js` - DOM wiring, form handling, validation feedback, and the Reports charts

## Functionality by dashboard section
1. **Register Appointment** - patient/dentist/treatment/date/time form with live stat tiles.
   Booking is restricted to the clinic's actual opening hours and days by the backend
   (08:00-17:30, Monday-Saturday); rejections (including double-booking, HTTP 409) surface as
   inline messages and toast notifications.
2. **Patients** - register a patient (name, address, phone, optional email - the email enables
   simulated confirmation emails) and view the full registry table.
3. **Search & Billing** - look up an appointment by number, view its status, **cancel** it
   (kept as history, not deleted), generate an itemised invoice (with any loyalty discount shown
   and explained), print it, and - for administrators - **verify the bill independently** against
   the database's own `sp_calculate_bill` stored procedure.
4. **Reports** (administrators only - hidden from the nav entirely for receptionist accounts) -
   KPI tiles plus three Chart.js visualisations (revenue by treatment, a 14-day appointment
   trend, dentist workload) fed by the backend's `/api/reports/*` endpoints, and a form to add
   new treatment types to the price list.
5. **Help** - step-by-step instructions for new staff, kept in sync with the features above.
6. **Sign Out** - calls `POST /api/auth/logout` (invalidating the session server-side) before
   clearing local storage and returning to the login screen.

## Architecture
Pure client-server: this is the presentation tier of the three-tier architecture described in
`backend/README.md`. `ApiService.request()` is the single chokepoint for every call - it attaches
the JWT bearer header, sends the session cookie (`credentials: 'include'`), and redirects to the
login page on a 401. Role (`ROLE_ADMIN` / `ROLE_RECEPTIONIST`), returned at login, is stored
client-side and used only to show/hide UI (the backend independently enforces the same
restriction on every request - the frontend check is a convenience, not the security boundary).

## How to Run
1. Start the backend first (see `backend/README.md`) - it must be listening on
   `http://localhost:8080`.
2. Serve this folder with any static file server, e.g.:
   ```bash
   python -m http.server 8000
   ```
3. Open `http://localhost:8000/index.html` and sign in with a seeded account (see
   `database/data.sql`): `admin` / `admin123` or `reception` / `reception123`.
