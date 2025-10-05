// Firebase Authentication Helper
// Handles both local development and production scenarios

class FirebaseAuthHelper {
    constructor() {
        this.isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.auth = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isLocalhost) {
            // Use mock authentication for localhost
            console.log('Using mock authentication for local development');
            await this.initializeMockAuth();
        } else {
            // Use real Firebase for production
            console.log('Using real Firebase authentication');
            await this.initializeFirebaseAuth();
        }
    }

    async initializeMockAuth() {
        // Import mock auth if not already loaded
        if (typeof MockAuth === 'undefined') {
            const script = document.createElement('script');
            script.src = 'mock-auth.js';
            document.head.appendChild(script);
            
            // Wait for script to load
            await new Promise((resolve) => {
                script.onload = resolve;
            });
        }

        this.auth = new MockAuth();
        this.auth.initialize();
        this.isInitialized = true;
    }

    async initializeFirebaseAuth() {
        try {
            // Dynamically load Firebase SDK
            await this.loadFirebaseSDK();
            
            // Initialize Firebase
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            const firebaseConfig = {
                apiKey: "AIzaSyBeL0jxE1oBdDu9G8BqZge_reFV5GNfedk",
                authDomain: "notebuddy-e5370.firebaseapp.com",
                projectId: "notebuddy-e5370",
                storageBucket: "notebuddy-e5370.firebasestorage.app",
                messagingSenderId: "183381311494",
                appId: "1:183381311494:web:f574fae1a5554186438387",
                measurementId: "G-QBFNCSG9M5"
            };

            const app = initializeApp(firebaseConfig);
            this.auth = getAuth(app);
            this.isInitialized = true;
            
            console.log('Firebase authentication initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Firebase auth:', error);
            // Fallback to mock auth
            await this.initializeMockAuth();
        }
    }

    async loadFirebaseSDK() {
        // Check if Firebase is already loaded
        if (window.firebase) {
            return;
        }

        // Load Firebase SDK
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        document.head.appendChild(script);

        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
        });
    }

    // Authentication methods
    onAuthStateChanged(callback) {
        if (!this.isInitialized) {
            console.warn('Auth not initialized yet');
            return () => {};
        }

        if (this.isLocalhost) {
            return this.auth.onAuthStateChanged(callback);
        } else {
            const { onAuthStateChanged } = require('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            return onAuthStateChanged(this.auth, callback);
        }
    }

    async signInWithPopup(provider) {
        if (!this.isInitialized) {
            throw new Error('Auth not initialized');
        }

        if (this.isLocalhost) {
            return this.auth.signInWithPopup(provider);
        } else {
            const { signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            return signInWithPopup(this.auth, provider);
        }
    }

    async signInWithEmailAndPassword(email, password) {
        if (!this.isInitialized) {
            throw new Error('Auth not initialized');
        }

        if (this.isLocalhost) {
            return this.auth.signInWithEmailAndPassword(email, password);
        } else {
            const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            return signInWithEmailAndPassword(this.auth, email, password);
        }
    }

    async createUserWithEmailAndPassword(email, password) {
        if (!this.isInitialized) {
            throw new Error('Auth not initialized');
        }

        if (this.isLocalhost) {
            return this.auth.createUserWithEmailAndPassword(email, password);
        } else {
            const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            return createUserWithEmailAndPassword(this.auth, email, password);
        }
    }

    async signOut() {
        if (!this.isInitialized) {
            throw new Error('Auth not initialized');
        }

        if (this.isLocalhost) {
            return this.auth.signOut();
        } else {
            const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            return signOut(this.auth);
        }
    }

    // Provider creation
    createGoogleProvider() {
        if (this.isLocalhost) {
            return new MockGoogleAuthProvider();
        } else {
            // For production, we'll need to handle this differently
            // since we can't dynamically import classes
            return { providerId: 'google.com' };
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FirebaseAuthHelper };
} else {
    window.FirebaseAuthHelper = FirebaseAuthHelper;
}
