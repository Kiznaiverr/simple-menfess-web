const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

class DiscordService {
    constructor() {
        // Validate webhook URL on service initialization
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (!webhookUrl || !webhookUrl.includes('discord.com/api/webhooks')) {
            console.error('⚠️ Invalid Discord webhook URL configuration');
            throw new Error('Invalid Discord webhook configuration');
        }
        
        this.webhookUrl = webhookUrl;
        console.log('✅ Discord webhook validated and configured');
    }

    async sendSupportNotification(data) {
        if (!this.webhookUrl) {
            console.error('Discord webhook URL not configured in environment');
            throw new Error('Discord integration not configured');
        }

        try {
            console.log('🔄 Sending to Discord:', this.webhookUrl.substring(0, 40) + '...');

            const payload = {
                username: 'UMNUfes Support',
                avatar_url: 'https://pomf2.lain.la/f/3nykooiu.jpg',
                embeds: [{
                    title: '📫 New Support Request',
                    color: 0x5865F2,
                    fields: [
                        {
                            name: '🏷️ Type',
                            value: data.type,
                            inline: true
                        },
                        {
                            name: '📧 Contact',
                            value: data.contact || 'Not provided',
                            inline: true
                        },
                        {
                            name: '📝 Description',
                            value: data.description
                        }
                    ],
                    timestamp: new Date().toISOString()
                }]
            };

            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Discord API error: ${response.status} - ${errorText}`);
            }

            console.log('✅ Support notification sent successfully');
            return true;

        } catch (error) {
            console.error('❌ Discord notification error:', error.message);
            throw error;
        }
    }
}

// Create singleton instance with error handling
let discordService;
try {
    discordService = new DiscordService();
} catch (error) {
    console.error('❌ Failed to initialize Discord service:', error.message);
    // Provide fallback/dummy service if initialization fails
    discordService = {
        sendSupportNotification: async () => {
            console.error('Discord service not properly initialized');
            return false;
        }
    };
}

module.exports = discordService;
