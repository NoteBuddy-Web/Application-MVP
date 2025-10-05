// Firebase Configuration
// NoteBuddy Firebase Project Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBeL0jxE1oBdDu9G8BqZge_reFV5GNfedk",
    authDomain: "notebuddy-e5370.firebaseapp.com",
    projectId: "notebuddy-e5370",
    storageBucket: "notebuddy-e5370.firebasestorage.app",
    messagingSenderId: "183381311494",
    appId: "1:183381311494:web:f574fae1a5554186438387",
    measurementId: "G-QBFNCSG9M5"
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
} else {
    window.firebaseConfig = firebaseConfig;
}
