// Zoom API Configuration for NoteBuddy Bot
// This file handles Zoom API authentication and bot functionality

class ZoomBotAPI {
    constructor() {
        this.clientId = null;
        this.clientSecret = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.redirectUri = window.location.origin + '/pages/zoom-callback.html';
        this.apiBaseUrl = 'https://api.zoom.us/v2';
        this.isConnected = false;
    }

    // Initialize Zoom API with credentials
    initialize(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        console.log('🔗 Zoom API initialized with Client ID:', clientId);
    }

    // Get OAuth authorization URL
    getAuthorizationUrl() {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: 'meeting:write meeting:read user:read user:write',
            state: this.generateState()
        });
        
        return `https://zoom.us/oauth/authorize?${params.toString()}`;
    }

    // Generate random state for OAuth security
    generateState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Exchange authorization code for access token
    async exchangeCodeForToken(code) {
        try {
            const response = await fetch('https://zoom.us/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`)
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.redirectUri
                })
            });

            const data = await response.json();
            
            if (data.access_token) {
                this.accessToken = data.access_token;
                this.refreshToken = data.refresh_token;
                this.isConnected = true;
                
                // Store tokens in localStorage
                localStorage.setItem('zoomAccessToken', this.accessToken);
                localStorage.setItem('zoomRefreshToken', this.refreshToken);
                localStorage.setItem('zoomConnected', 'true');
                
                console.log('✅ Zoom OAuth successful');
                return true;
            } else {
                console.error('❌ Zoom OAuth failed:', data);
                return false;
            }
        } catch (error) {
            console.error('❌ Error exchanging code for token:', error);
            return false;
        }
    }

    // Load stored tokens
    loadStoredTokens() {
        const accessToken = localStorage.getItem('zoomAccessToken');
        const refreshToken = localStorage.getItem('zoomRefreshToken');
        const connected = localStorage.getItem('zoomConnected') === 'true';
        
        if (accessToken && refreshToken) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.isConnected = connected;
            console.log('📱 Loaded stored Zoom tokens');
            return true;
        }
        return false;
    }

    // Refresh access token
    async refreshAccessToken() {
        try {
            const response = await fetch('https://zoom.us/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`)
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: this.refreshToken
                })
            });

            const data = await response.json();
            
            if (data.access_token) {
                this.accessToken = data.access_token;
                this.refreshToken = data.refresh_token;
                
                // Update stored tokens
                localStorage.setItem('zoomAccessToken', this.accessToken);
                localStorage.setItem('zoomRefreshToken', this.refreshToken);
                
                console.log('🔄 Zoom token refreshed');
                return true;
            } else {
                console.error('❌ Failed to refresh Zoom token:', data);
                return false;
            }
        } catch (error) {
            console.error('❌ Error refreshing token:', error);
            return false;
        }
    }

    // Make authenticated API request
    async makeAPIRequest(endpoint, method = 'GET', data = null) {
        if (!this.accessToken) {
            throw new Error('No access token available');
        }

        const url = `${this.apiBaseUrl}${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            if (response.status === 401) {
                // Token expired, try to refresh
                console.log('🔄 Token expired, refreshing...');
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // Retry the request with new token
                    options.headers.Authorization = `Bearer ${this.accessToken}`;
                    const retryResponse = await fetch(url, options);
                    return await retryResponse.json();
                } else {
                    throw new Error('Failed to refresh token');
                }
            }

            return await response.json();
        } catch (error) {
            console.error('❌ API request failed:', error);
            throw error;
        }
    }

    // Get user information
    async getUserInfo() {
        try {
            const userInfo = await this.makeAPIRequest('/users/me');
            console.log('👤 Zoom user info:', userInfo);
            return userInfo;
        } catch (error) {
            console.error('❌ Failed to get user info:', error);
            return null;
        }
    }

    // List user's meetings
    async getMeetings() {
        try {
            const meetings = await this.makeAPIRequest('/users/me/meetings');
            console.log('📅 Zoom meetings:', meetings);
            return meetings;
        } catch (error) {
            console.error('❌ Failed to get meetings:', error);
            return null;
        }
    }

    // Create a meeting
    async createMeeting(meetingData) {
        try {
            const meeting = await this.makeAPIRequest('/users/me/meetings', 'POST', meetingData);
            console.log('✅ Meeting created:', meeting);
            return meeting;
        } catch (error) {
            console.error('❌ Failed to create meeting:', error);
            return null;
        }
    }

    // Join meeting as bot (this would require Zoom SDK integration)
    async joinMeetingAsBot(meetingId, meetingPassword = '') {
        try {
            console.log('🤖 Attempting to join meeting as bot:', meetingId);
            
            // This is a placeholder - actual bot joining would require:
            // 1. Zoom SDK integration
            // 2. Bot permissions in the meeting
            // 3. Real-time audio/video processing
            
            const meetingInfo = await this.makeAPIRequest(`/meetings/${meetingId}`);
            
            if (meetingInfo) {
                console.log('📋 Meeting info retrieved:', meetingInfo);
                
                // For now, we'll simulate bot joining
                // In a real implementation, you'd use the Zoom SDK here
                return {
                    success: true,
                    message: 'Bot would join meeting (requires Zoom SDK)',
                    meetingInfo: meetingInfo
                };
            }
            
            return { success: false, message: 'Failed to get meeting info' };
        } catch (error) {
            console.error('❌ Failed to join meeting as bot:', error);
            return { success: false, message: error.message };
        }
    }

    // Disconnect from Zoom
    disconnect() {
        this.accessToken = null;
        this.refreshToken = null;
        this.isConnected = false;
        
        // Clear stored tokens
        localStorage.removeItem('zoomAccessToken');
        localStorage.removeItem('zoomRefreshToken');
        localStorage.removeItem('zoomConnected');
        
        console.log('🔌 Disconnected from Zoom');
    }

    // Check if connected
    isZoomConnected() {
        return this.isConnected && this.accessToken !== null;
    }
}

// Create global instance
window.zoomBotAPI = new ZoomBotAPI();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ZoomBotAPI };
}
