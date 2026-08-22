# Sunrise Dental Clinic System - Frontend

## Overview
This is the frontend component of the Sunrise Dental Clinic System. It is an interactive, menu-driven web application designed for clinic staff to efficiently manage patient records, appointments, and billing. It solves the issues of double bookings, lost records, and billing errors caused by manual paper-based processes.

## Technology Stack
* **HTML5:** Semantic structure for user interfaces.
* **CSS3:** Custom styling for a clean, user-friendly, and responsive design tailored to clinic staff needs.
* **JavaScript (Vanilla):** Client-side logic, form validation, and asynchronous communication (`fetch` API) with the Java backend web services.

## Functionalities Covered
The frontend UI ensures all system requirements outlined in the brief are seamlessly integrated:
1. **User Authentication (Login):** Secure login interface (`index.html`) requiring a valid username and password. Stores the JWT token for secure session management.
2. **Register New Appointment:** A comprehensive form in the dashboard to input patient details (Name, Address, Contact) and appointment specifics (Dentist, Treatment, Date, Time). Includes rigorous client-side validation to restrict invalid entries.
3. **Display Appointment Details:** A dedicated section to search for an appointment by its unique appointment number and immediately display the complete patient and appointment record.
4. **Calculate and Print Bill:** An interface to generate bills/receipts, displaying the dynamically calculated total treatment costs (treatment fee + consultation) fetched from the backend. Includes an option to print the receipt.
5. **Help Section:** Provides a dedicated section with step-by-step instructions and guidance for new staff on how to navigate and use the system effectively.
6. **Exit System:** A secure logout/exit option that clears local session data and safely returns the user to the login screen, closing the current active session.

## Project Structure
* `index.html`: The entry point and login interface for the system.
* `dashboard.html`: The main interactive portal for all clinic operations, divided into intuitive menu sections for each functionality.
* `css/styles.css`: Contains all visual styles, providing a cohesive and user-friendly visual experience.
* `js/app.js`: Contains the main application logic, DOM manipulation, and UI event handling.
* `js/api.js`: Handles all HTTP requests (GET, POST), communicating securely with the backend API by attaching the JWT authorization header.

## Architecture
This frontend acts as the client side of a **distributed application**. It consumes RESTful web services provided by the Java backend, adhering to a clear client-server architecture model.

## How to Run
Since this is a static frontend communicating with a REST API, it does not require a complex build process:
1. Ensure the **Java backend** is running and the database is connected.
2. Serve the `frontend` folder using any local web server (e.g., Live Server extension in VS Code, Python's `http.server`, or Node's `http-server`).
   ```bash
   # Example using Python (run this inside the frontend directory)
   python -m http.server 8000
   ```
3. Open a web browser and navigate to `http://localhost:8000/index.html`.
4. Log in using the authorized staff credentials.
