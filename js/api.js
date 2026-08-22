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

    static async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token && !endpoint.includes('/auth/login')) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
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
                    this.removeToken();
                    window.location.href = 'index.html';
                }
                throw new Error(data.error || 'API Request Failed');
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

    static getTreatments() {
        return this.request('/treatments');
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
}
