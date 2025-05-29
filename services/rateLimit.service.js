class RateLimitService {
    constructor() {
        this.requests = new Map();
        this.bannedIPs = new Map();
        this.WINDOW_SIZE_MS = 60 * 1000; // 1 minute
        this.MAX_REQUESTS = 5; // 5 requests per minute
        this.BAN_DURATION_MS = 60 * 60 * 1000; // 1 hour
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
        
        // Remove requests outside current window
        const validRequests = userRequests.filter(time => time > now - this.WINDOW_SIZE_MS);
        
        // Check for spam pattern (rapid requests)
        if (validRequests.length >= 3) {
            const timeDiffs = [];
            for (let i = 1; i < validRequests.length; i++) {
                timeDiffs.push(validRequests[i] - validRequests[i-1]);
            }
            
            // If average time between requests is less than 2 seconds
            const avgTimeDiff = timeDiffs.reduce((a,b) => a + b, 0) / timeDiffs.length;
            if (avgTimeDiff < 2000) {
                this.banIP(ip);
                return {
                    allowed: false,
                    error: 'Spam detected. You are banned for 1 hour.'
                };
            }
        }

        if (validRequests.length >= this.MAX_REQUESTS) {
            const oldestRequest = Math.min(...validRequests);
            const resetTime = Math.ceil((oldestRequest + this.WINDOW_SIZE_MS - now) / 1000);
            return {
                allowed: false,
                error: `Rate limit exceeded. Try again in ${resetTime} seconds.`
            };
        }

        // Update requests
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

    // Cleanup old data periodically
    cleanup() {
        const now = Date.now();
        
        // Cleanup requests
        for (const [ip, requests] of this.requests) {
            const validRequests = requests.filter(time => time > now - this.WINDOW_SIZE_MS);
            if (validRequests.length === 0) {
                this.requests.delete(ip);
            } else {
                this.requests.set(ip, validRequests);
            }
        }

        // Cleanup bans
        for (const [ip, banInfo] of this.bannedIPs) {
            if (now >= banInfo.expiry) {
                this.bannedIPs.delete(ip);
            }
        }
    }
}

module.exports = new RateLimitService();
