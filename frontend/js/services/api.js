import CONFIG from '../config.js';

class ApiService {
    constructor() {
        this.baseUrl = CONFIG.apiBaseUrl;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await this.parseError(response);
                throw error;
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async parseError(response) {
        let message = `HTTP Error: ${response.status}`;
        try {
            const data = await response.json();
            message = data.message || data.detail || message;
        } catch {
            message = response.statusText || message;
        }
        return new Error(message);
    }

    async generateDiagram(prompt, currentXml = null) {
        const body = { prompt };
        if (currentXml) {
            body.current_xml = currentXml;
        }
        
        return this.request('/draw', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    async healthCheck() {
        return this.request('/health');
    }
}

export default new ApiService();
