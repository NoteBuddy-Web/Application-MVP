// Basic Authentication Helper Script
// This script provides basic logout functionality without complex auth checks

(function() {
    'use strict';
    
    // Function to logout and clear session
    function logout() {
        console.log('Logging out user...');
        
        // Clear session storage
        sessionStorage.removeItem('userAuthenticated');
        
        // Clear local storage
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userDisplayName');
        localStorage.removeItem('mockAuthUser');
        
        // Sign out from Firebase if available
        if (window.auth && window.auth.currentUser) {
            window.auth.signOut().then(() => {
                console.log('Firebase user signed out');
            }).catch((error) => {
                console.error('Error signing out from Firebase:', error);
            });
        }
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
    
    // Make logout function globally available
    window.logout = logout;
    
    // Function to show admin indicator (if user is admin)
    function showAdminIndicator() {
        // Check if user is admin via email
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail === 'mlecroc@gmail.com') {
            console.log('👑 Admin user detected!');
            
            // Create admin badge if it doesn't exist
            if (!document.getElementById('admin-badge')) {
                const adminBadge = document.createElement('div');
                adminBadge.id = 'admin-badge';
                adminBadge.innerHTML = '👑 Admin';
                adminBadge.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #02a0d1, #dc3dcc);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    z-index: 9999;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: adminPulse 2s infinite;
                `;
                
                // Add CSS animation
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes adminPulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                `;
                document.head.appendChild(style);
                
                document.body.appendChild(adminBadge);
                
                // Remove badge after 5 seconds
                setTimeout(() => {
                    if (adminBadge.parentNode) {
                        adminBadge.parentNode.removeChild(adminBadge);
                    }
                }, 5000);
            }
        }
    }
    
    // Show admin indicator when page loads (if user is admin)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showAdminIndicator);
    } else {
        showAdminIndicator();
    }
    
    console.log('Basic auth helper loaded - logout function available as window.logout()');
    
})();
