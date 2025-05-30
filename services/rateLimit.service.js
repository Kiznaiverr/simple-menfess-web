class RateLimitService {
    constructor() {
        this.requests = new Map();
        this.bannedIPs = new Map();
        this.WINDOW_SIZE_MS = 60 * 1000; 
        this.MAX_REQUESTS = 3; 
        this.BAN_DURATION_MS = 60 * 60 * 1000; 
        this.SPAM_DETECTION = {
            TIME_WINDOW: 5 * 60 * 1000, 
            MAX_SIMILAR_MESSAGES: 3,     
            MIN_TIME_BETWEEN: 10 * 1000  
        };
        this.messageHistory = new Map(); 
    }

    isIPBanned(ip) {
        if (!this.bannedIPs.has(ip)) return false;
        
        const banInfo = this.bannedIPs.get(ip);
        if (Date.now() >= banInfo.expiry) {
            this.bannedIPs.delete(ip);
            return false;
        }
        return true;
    }

    getBanTimeRemaining(ip) {
        if (!this.bannedIPs.has(ip)) return 0;
        const banInfo = this.bannedIPs.get(ip);
        return Math.max(0, banInfo.expiry - Date.now());
    }

    banIP(ip) {
        this.bannedIPs.set(ip, {
            expiry: Date.now() + this.BAN_DURATION_MS,
            reason: 'Spam detection'
        });
    }

    checkRateLimit(ip) {
        if (this.isIPBanned(ip)) {
            const banInfo = this.getBanInfo(ip);
            return {
                allowed: false,
                error: `You are temporarily banned.`,
                redirect: `/banned?until=${banInfo.expiry}`
            };
        }

        const now = Date.now();
        const userRequests = this.requests.get(ip) || [];
        
        const validRequests = userRequests.filter(time => 
            time > now - this.WINDOW_SIZE_MS
        );

        if (validRequests.length > 0) {
            const lastRequest = Math.max(...validRequests);
            const timeSinceLastRequest = now - lastRequest;

            if (timeSinceLastRequest < this.SPAM_DETECTION.MIN_TIME_BETWEEN) {
                this.banIP(ip);
                return {
                    allowed: false,
                    error: 'Spam detected. You must wait at least 10 seconds between messages.',
                    redirect: `/banned?until=${now + this.BAN_DURATION_MS}`
                };
            }
        }

        if (validRequests.length >= 3) {
            const timeSpan = Math.max(...validRequests) - Math.min(...validRequests);
            if (timeSpan < 30000) { 
                this.banIP(ip);
                return {
                    allowed: false,
                    error: 'Spam behavior detected. You are banned for 1 hour.',
                    redirect: `/banned?until=${now + this.BAN_DURATION_MS}`
                };
            }
        }

        if (validRequests.length >= this.MAX_REQUESTS) {
            const oldestRequest = Math.min(...validRequests);
            const resetTime = Math.ceil((oldestRequest + this.WINDOW_SIZE_MS - now) / 1000);
            return {
                allowed: false,
                error: `Rate limit exceeded. Please wait ${resetTime} seconds.`
            };
        }

        validRequests.push(now);
        this.requests.set(ip, validRequests);

        return { allowed: true };
    }

    getBanInfo(ip) {
        const banInfo = this.bannedIPs.get(ip);
        if (!banInfo) {
            return { banned: false };
        }

        if (Date.now() >= banInfo.expiry) {
            this.bannedIPs.delete(ip);
            return { banned: false };
        }

        return {
            banned: true,
            expiry: banInfo.expiry,
            reason: banInfo.reason
        };
    }

    cleanup() {
        const now = Date.now();
        
        for (const [ip, requests] of this.requests) {
            const validRequests = requests.filter(time => 
                time > now - this.WINDOW_SIZE_MS
            );
            if (validRequests.length === 0) {
                this.requests.delete(ip);
            } else {
                this.requests.set(ip, validRequests);
            }
        }

        for (const [ip, banInfo] of this.bannedIPs) {
            if (now >= banInfo.expiry) {
                this.bannedIPs.delete(ip);
            }
        }

        for (const [ip, history] of this.messageHistory) {
            const validHistory = history.filter(entry => 
                entry.timestamp > now - this.SPAM_DETECTION.TIME_WINDOW
            );
            if (validHistory.length === 0) {
                this.messageHistory.delete(ip);
            } else {
                this.messageHistory.set(ip, validHistory);
            }
        }
    }
}

module.exports = new RateLimitService();
