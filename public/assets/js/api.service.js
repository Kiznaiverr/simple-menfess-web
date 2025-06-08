/**
 * Centralized API Service
 * Handles all API communications and hides endpoint details from frontend
 */
class ApiService {
    constructor() {
        this.baseUrl = '';
        this.token = localStorage.getItem('adminToken');
    }

    // Private method to handle requests
    async _request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        if (this.token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.message || 'Request failed');
            }
            
            return { success: true, data, response };
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            return { success: false, error: error.message, response: null };
        }
    }

    // Messages API
    async getMessages() {
        return this._request('/api/messages');
    }

    async sendMessage(recipient, message) {
        return this._request('/api/messages', {
            method: 'POST',
            body: JSON.stringify({ recipient, message })
        });
    }

    async deleteMessage(id) {
        return this._request(`/api/messages/${id}`, {
            method: 'DELETE'
        });
    }

    async deleteMessages(ids) {
        return this._request('/api/messages', {
            method: 'DELETE',
            body: JSON.stringify({ ids })
        });
    }

    async reportMessage(id, reason) {
        return this._request(`/api/messages/${id}/report`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    }

    async getReportedMessages() {
        return this._request('/api/messages/reported');
    }

    async dismissReport(id) {
        return this._request(`/api/messages/${id}/dismiss-report`, {
            method: 'POST'
        });
    }

    // Admin API
    async verifyAdmin(password) {
        const result = await this._request('/api/verify-admin', {
            method: 'POST',
            body: JSON.stringify({ password })
        });
        
        if (result.success && result.data.token) {
            this.token = result.data.token;
            localStorage.setItem('adminToken', this.token);
        }
        
        return result;
    }

    async getSystemInfo() {
        return this._request('/api/system-info');
    }

    // Support API
    async submitSupport(type, description, contact, contactType) {
        return this._request('/api/support', {
            method: 'POST',
            body: JSON.stringify({ type, description, contact, contactType })
        });
    }

    // Ban Check API
    async checkBan() {
        return this._request('/api/check-ban');
    }

    // Auth helpers
    setToken(token) {
        this.token = token;
        localStorage.setItem('adminToken', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('adminToken');
    }

    isAuthenticated() {
        return !!this.token;
    }
}

// Create global instance
window.apiService = new ApiService();
