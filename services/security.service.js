const crypto = require('crypto');

class SecurityService {
    constructor() {
        this._serverToken = crypto.randomBytes(32).toString('hex');
        this._serverSecret = process.env.SERVER_SECRET || crypto.randomBytes(32).toString('hex');
    }

    generateRequestSignature(timestamp) {
        const data = `${this._serverToken}:${timestamp}`;
        return crypto
            .createHmac('sha256', this._serverSecret)
            .update(data)
            .digest('hex');
    }

    verifyRequest(token, timestamp, signature) {
        if (!token || !timestamp || !signature) return false;
        if (token !== this._serverToken) return false;

        // Verify timestamp is within 5 minutes
        const now = Date.now();
        const requestTime = parseInt(timestamp);
        if (now - requestTime > 300000) return false;

        const expectedSignature = this.generateRequestSignature(timestamp);
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }

    getRequestHeaders() {
        const timestamp = Date.now().toString();
        return {
            'X-Server-Token': this._serverToken,
            'X-Timestamp': timestamp,
            'X-Signature': this.generateRequestSignature(timestamp)
        };
    }
}

module.exports = new SecurityService();
