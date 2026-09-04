const API_URL = 'http://localhost:8080/api';

class ApiService {
    static getToken() {
        return localStorage.getItem('jwt_token');
    }

    static setToken(token) {
        localStorage.setItem('jwt_token', token);
    }

    static removeToken() {
        localStorage.removeItem('jwt_token');
    }

    static getRole() {
        return localStorage.getItem('user_role');
    }

    static setRole(role) {
        localStorage.setItem('user_role', role);
    }

    static getUsername() {
        return localStorage.getItem('username');
    }

    static setUsername(username) {
        localStorage.setItem('username', username);
    }

    static isAdmin() {
        return this.getRole() === 'ROLE_ADMIN';
    }

    static clearSession() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('username');
    }

    static async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token && !endpoint.includes('/auth/login')) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // include: sends the SDCSESSION HttpOnly cookie set on login, so the server-side
        // session path (SessionManager) is exercised in addition to the JWT bearer header.
        const config = {
            ...options,
            headers,
            credentials: 'include'
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);
            const text = await response.text();

            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch (e) {
                data = text;
            }

            if (!response.ok) {
                if (response.status === 401 && !endpoint.includes('/auth/login')) {
                    this.clearSession();
                    window.location.href = 'index.html';
                }
                const error = new Error(data.error || 'API Request Failed');
                error.status = response.status;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    static logout() {
        return this.request('/auth/logout', { method: 'POST' }).catch(() => {
            // Best effort - the local session is cleared regardless of whether this call succeeds.
        });
    }

    static getTreatments() {
        return this.request('/treatments');
    }

    static createTreatment(data) {
        return this.request('/treatments', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static getPatients() {
        return this.request('/patients');
    }

    static createPatient(data) {
        return this.request('/patients', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static registerAppointment(data) {
        return this.request('/appointments', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static getAppointment(appNo) {
        return this.request(`/appointments/${appNo}`, { method: 'GET' });
    }

    static getBill(appNo) {
        return this.request(`/appointments/${appNo}/bill`, { method: 'GET' });
    }

    static cancelAppointment(appNo) {
        return this.request(`/appointments/${appNo}/cancel`, { method: 'POST' });
    }

    static listAppointments(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/appointments${query ? `?${query}` : ''}`);
    }

    static getReportSummary() {
        return this.request('/reports/summary');
    }

    static getRevenueByTreatment() {
        return this.request('/reports/revenue-by-treatment');
    }

    static getAppointmentsByDay(days = 14) {
        return this.request(`/reports/appointments-by-day?days=${days}`);
    }

    static getDentistWorkload() {
        return this.request('/reports/dentist-workload');
    }

    static verifyBill(appNo) {
        return this.request(`/reports/bill-verification?appointmentNumber=${encodeURIComponent(appNo)}`);
    }

    static listUsers() {
        return this.request('/users');
    }

    static createUser(data) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static deleteUser(id) {
        return this.request(`/users/${id}`, { method: 'DELETE' });
    }
}
