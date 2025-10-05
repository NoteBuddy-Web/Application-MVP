// Firebase Database Helper for NoteBuddy
// Handles Firestore operations for summaries, events, and tasks

class FirebaseDatabase {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            // Import Firebase modules
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            // Firebase configuration
            const firebaseConfig = {
                apiKey: "AIzaSyBeL0jxE1oBdDu9G8BqZge_reFV5GNfedk",
                authDomain: "notebuddy-e5370.firebaseapp.com",
                projectId: "notebuddy-e5370",
                storageBucket: "notebuddy-e5370.firebasestorage.app",
                messagingSenderId: "183381311494",
                appId: "1:183381311494:web:f574fae1a5554186438387",
                measurementId: "G-QBFNCSG9M5"
            };

            // Initialize Firebase
            const app = initializeApp(firebaseConfig);
            this.db = getFirestore(app);
            
            // Use existing auth instance if available, otherwise create new one
            if (window.auth) {
                this.auth = window.auth;
                console.log('✅ Using existing Firebase auth instance');
            } else {
                this.auth = getAuth(app);
                console.log('✅ Created new Firebase auth instance');
            }
            
            // Wait for auth state to be ready
            await this.waitForAuthReady();
            
            this.initialized = true;

            console.log('✅ Firebase Database initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Firebase Database:', error);
            return false;
        }
    }

    // Wait for Firebase auth to be ready
    async waitForAuthReady() {
        return new Promise((resolve) => {
            if (this.auth.currentUser !== null) {
                // User is already authenticated
                console.log('✅ Firebase auth ready with user:', this.auth.currentUser.email);
                resolve();
            } else {
                // Wait for auth state change
                const unsubscribe = this.auth.onAuthStateChanged((user) => {
                    unsubscribe(); // Unsubscribe after first change
                    if (user) {
                        console.log('✅ Firebase auth ready with user:', user.email);
                    } else {
                        console.log('⚠️ Firebase auth ready but no user');
                    }
                    resolve();
                });
                
                // Increased timeout to 10 seconds for better reliability
                setTimeout(() => {
                    unsubscribe();
                    console.log('⚠️ Firebase auth timeout after 10 seconds, proceeding anyway');
                    console.log('🔄 Will use session-based authentication as fallback');
                    resolve();
                }, 10000);
            }
        });
    }

    // Get current user ID
    getCurrentUserId() {
        console.log('🔍 Checking authentication status...');
        console.log('Auth instance:', this.auth);
        console.log('Current user:', this.auth?.currentUser);
        console.log('User session:', sessionStorage.getItem('userAuthenticated'));
        console.log('User email:', localStorage.getItem('userEmail'));
        
        // Check for real Firebase auth (primary method)
        if (this.auth && this.auth.currentUser && this.auth.currentUser.uid) {
            console.log('✅ Using real Firebase auth user ID:', this.auth.currentUser.uid);
            return this.auth.currentUser.uid;
        }
        
        // Check for session-based authentication (fallback for development)
        const userSession = sessionStorage.getItem('userAuthenticated');
        if (userSession === 'true') {
            const userEmail = localStorage.getItem('userEmail');
            if (userEmail) {
                // Create a consistent user ID from email for any user
                // This ensures each user gets their own data space
                const emailHash = btoa(userEmail).replace(/[^a-zA-Z0-9]/g, '');
                const userId = 'user_' + emailHash;
                console.log('✅ Using dynamic user ID for session-based auth:', userId);
                console.log('📧 Email used for ID generation:', userEmail);
                return userId;
            }
        }
        
        // Additional fallback: create a default user if no authentication is available
        console.warn('⚠️ No authenticated user found, creating default user for development');
        const defaultEmail = 'dev@notebuddy.local';
        const emailHash = btoa(defaultEmail).replace(/[^a-zA-Z0-9]/g, '');
        const defaultUserId = 'dev_user_' + emailHash;
        
        // Set up session for this default user
        sessionStorage.setItem('userAuthenticated', 'true');
        localStorage.setItem('userEmail', defaultEmail);
        localStorage.setItem('userDisplayName', 'Development User');
        
        console.log('✅ Created default user ID for development:', defaultUserId);
        return defaultUserId;
    }

    // Ensure user document exists
    async ensureUserDocument() {
        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('User must be authenticated');
        }

        try {
            const { doc, getDoc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const userRef = doc(this.db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // Create user document with basic info
                let userData;
                
                if (this.auth && this.auth.currentUser) {
                    // Real Firebase user
                    userData = {
                        email: this.auth.currentUser.email,
                        displayName: this.auth.currentUser.displayName || 'User',
                        photoURL: this.auth.currentUser.photoURL || null,
                        providerData: this.auth.currentUser.providerData || [],
                        createdAt: serverTimestamp(),
                        lastLoginAt: serverTimestamp()
                    };
                } else {
                    // Development/fallback user from session
                    const userEmail = localStorage.getItem('userEmail') || 'dev@example.com';
                    const userDisplayName = localStorage.getItem('userDisplayName') || 'Development User';
                    userData = {
                        email: userEmail,
                        displayName: userDisplayName,
                        isDevelopmentUser: true,
                        createdAt: serverTimestamp(),
                        lastLoginAt: serverTimestamp()
                    };
                }
                
                await setDoc(userRef, userData);
                console.log('✅ User document created for:', userData.email);
            } else {
                // Update last login time
                await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
                console.log('✅ User document updated');
            }
        } catch (error) {
            console.error('❌ Error ensuring user document:', error);
            throw error;
        }
    }

    // Summary operations
    async saveSummary(summaryData) {
        console.log('🔄 Starting to save summary...');
        
        if (!this.initialized) {
            console.log('🔄 Initializing Firebase...');
            await this.initialize();
        }

        const userId = this.getCurrentUserId();
        console.log('👤 User ID:', userId);
        
        if (!userId) {
            console.error('❌ No user ID found');
            throw new Error('User must be authenticated to save summaries');
        }

        try {
            // Ensure user document exists first
            console.log('🔄 Ensuring user document exists...');
            await this.ensureUserDocument();
            
            const { doc, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Simplify data structure - focus on essential fields
            const simplifiedSummary = {
                title: summaryData.title || 'Meeting Summary',
                transcript: summaryData.transcript || '',
                summary: summaryData.summary || '',
                participants: summaryData.participants || [],
                keyPoints: summaryData.keyPoints || [],
                actionItems: summaryData.actionItems || [],
                tags: summaryData.tags || [],
                date: summaryData.date || new Date().toISOString(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            console.log('📝 Summary data to save:', simplifiedSummary);

            // Save to user's summaries subcollection: users/{userId}/summaries/{summaryId}
            const userSummariesRef = collection(this.db, 'users', userId, 'summaries');
            console.log('📍 Saving to Firebase path: users/' + userId + '/summaries/');
            const docRef = await addDoc(userSummariesRef, simplifiedSummary);
            console.log('✅ Summary saved with ID:', docRef.id);
            console.log('📍 Full Firebase path: users/' + userId + '/summaries/' + docRef.id);
            console.log('🔍 Document reference:', docRef);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error saving summary:', error);
            throw error;
        }
    }

    async getSummaries(limit = 10) {
        if (!this.initialized) {
            await this.initialize();
        }

        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('User must be authenticated to load summaries');
        }

        try {
            const { collection, query, orderBy, limit: limitTo, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Query user's summaries subcollection: users/{userId}/summaries
            const userSummariesRef = collection(this.db, 'users', userId, 'summaries');
            console.log('📍 Loading from Firebase path: users/' + userId + '/summaries/');
            const q = query(
                userSummariesRef,
                orderBy('createdAt', 'desc'),
                limitTo(limit)
            );

            const querySnapshot = await getDocs(q);
            const summaries = [];
            
            querySnapshot.forEach((doc) => {
                const summaryData = {
                    id: doc.id,
                    ...doc.data()
                };
                console.log('📄 Found summary document:', summaryData);
                summaries.push(summaryData);
            });

            console.log(`✅ Loaded ${summaries.length} summaries`);
            console.log('🔍 All summaries:', summaries);
            return summaries;
        } catch (error) {
            console.error('❌ Error loading summaries:', error);
            throw error;
        }
    }

    async getSummaryById(summaryId) {
        if (!this.initialized) {
            await this.initialize();
        }

        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('User must be authenticated to load summary');
        }

        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Access user's specific summary: users/{userId}/summaries/{summaryId}
            const summaryRef = doc(this.db, 'users', userId, 'summaries', summaryId);
            const summarySnap = await getDoc(summaryRef);

            if (summarySnap.exists()) {
                return {
                    id: summarySnap.id,
                    ...summarySnap.data()
                };
            } else {
                throw new Error('Summary not found');
            }
        } catch (error) {
            console.error('❌ Error loading summary:', error);
            throw error;
        }
    }

    async updateSummary(summaryId, updateData) {
        if (!this.initialized) {
            await this.initialize();
        }

        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('User must be authenticated to update summary');
        }

        try {
            const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Update user's specific summary: users/{userId}/summaries/{summaryId}
            const summaryRef = doc(this.db, 'users', userId, 'summaries', summaryId);
            const updateWithTimestamp = {
                ...updateData,
                updatedAt: serverTimestamp()
            };

            await updateDoc(summaryRef, updateWithTimestamp);
            console.log('✅ Summary updated successfully');
            return true;
        } catch (error) {
            console.error('❌ Error updating summary:', error);
            throw error;
        }
    }

    async deleteSummary(summaryId) {
        if (!this.initialized) {
            await this.initialize();
        }

        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('User must be authenticated to delete summary');
        }

        try {
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Delete user's specific summary: users/{userId}/summaries/{summaryId}
            const summaryRef = doc(this.db, 'users', userId, 'summaries', summaryId);
            await deleteDoc(summaryRef);
            console.log('✅ Summary deleted successfully');
            return true;
        } catch (error) {
            console.error('❌ Error deleting summary:', error);
            throw error;
        }
    }

    // Event operations
    async saveEvent(eventData) {
        try {
            if (!this.db) {
                throw new Error('Firebase not initialized');
            }

            const eventRef = this.db.collection('events').doc(eventData.id);
            await eventRef.set({
                ...eventData,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            console.log('✅ Event saved to Firebase:', eventData.id);
            return eventData.id;
        } catch (error) {
            console.error('❌ Error saving event to Firebase:', error);
            throw error;
        }
    }

    async getEvents() {
        try {
            if (!this.db) {
                throw new Error('Firebase not initialized');
            }

            const eventsSnapshot = await this.db.collection('events').get();
            const events = [];
            
            eventsSnapshot.forEach(doc => {
                events.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log('✅ Events loaded from Firebase:', events.length);
            return events;
        } catch (error) {
            console.error('❌ Error loading events from Firebase:', error);
            return [];
        }
    }

    async getEventsByDateRange(startDate, endDate) {
        try {
            if (!this.db) {
                throw new Error('Firebase not initialized');
            }

            const eventsSnapshot = await this.db.collection('events')
                .where('date', '>=', startDate)
                .where('date', '<=', endDate)
                .get();
            
            const events = [];
            eventsSnapshot.forEach(doc => {
                events.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return events;
        } catch (error) {
            console.error('❌ Error loading events by date range:', error);
            return [];
        }
    }

    async deleteEvent(eventId) {
        try {
            if (!this.db) {
                throw new Error('Firebase not initialized');
            }

            await this.db.collection('events').doc(eventId).delete();
            console.log('✅ Event deleted from Firebase:', eventId);
            return true;
        } catch (error) {
            console.error('❌ Error deleting event from Firebase:', error);
            throw error;
        }
    }

    // Client-Summary relationship operations
    async saveClientSummaryRelation(clientName, summaryId, summaryData) {
        if (!this.initialized) {
            await this.initialize();
        }

        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('User must be authenticated to save client relationships');
        }

        try {
            const { doc, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Save to user's client-summary relationships: users/{userId}/clientSummaries/{relationId}
            const clientSummariesRef = collection(this.db, 'users', userId, 'clientSummaries');
            
            const relationData = {
                clientName: clientName,
                summaryId: summaryId,
                summaryTitle: summaryData.title,
                summaryDate: summaryData.date,
                relatedAt: serverTimestamp(),
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(clientSummariesRef, relationData);
            console.log('✅ Client-summary relationship saved with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error saving client-summary relationship:', error);
            throw error;
        }
    }

    async getClientSummaries(clientName) {
        if (!this.initialized) {
            await this.initialize();
        }

        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('User must be authenticated to load client summaries');
        }

        try {
            const { collection, query, where, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Query client-summary relationships for specific client
            const clientSummariesRef = collection(this.db, 'users', userId, 'clientSummaries');
            const q = query(
                clientSummariesRef,
                where('clientName', '==', clientName),
                orderBy('relatedAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const relationships = [];
            
            querySnapshot.forEach((doc) => {
                relationships.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`✅ Loaded ${relationships.length} summaries for client: ${clientName}`);
            return relationships;
        } catch (error) {
            console.error('❌ Error loading client summaries:', error);
            throw error;
        }
    }

    async getAllClientSummaries() {
        if (!this.initialized) {
            await this.initialize();
        }

        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('User must be authenticated to load client summaries');
        }

        try {
            const { collection, query, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Query all client-summary relationships
            const clientSummariesRef = collection(this.db, 'users', userId, 'clientSummaries');
            const q = query(
                clientSummariesRef,
                orderBy('relatedAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const relationships = [];
            
            querySnapshot.forEach((doc) => {
                relationships.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`✅ Loaded ${relationships.length} client-summary relationships`);
            return relationships;
        } catch (error) {
            console.error('❌ Error loading all client summaries:', error);
            throw error;
        }
    }

    // Client management operations
    async saveClient(clientData) {
        if (!this.initialized) {
            await this.initialize();
        }

        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('User must be authenticated to save clients');
        }

        try {
            const { doc, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Save to user's clients collection: users/{userId}/clients/{clientId}
            const clientsRef = collection(this.db, 'users', userId, 'clients');
            
            const clientWithTimestamp = {
                ...clientData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const docRef = await addDoc(clientsRef, clientWithTimestamp);
            console.log('✅ Client saved with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error saving client:', error);
            throw error;
        }
    }

    async getClients() {
        if (!this.initialized) {
            await this.initialize();
        }

        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('User must be authenticated to load clients');
        }

        try {
            const { collection, query, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Query user's clients collection: users/{userId}/clients
            const clientsRef = collection(this.db, 'users', userId, 'clients');
            const q = query(
                clientsRef,
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const clients = [];
            
            querySnapshot.forEach((doc) => {
                clients.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`✅ Loaded ${clients.length} clients`);
            return clients;
        } catch (error) {
            console.error('❌ Error loading clients:', error);
            throw error;
        }
    }

    async searchClients(searchTerm) {
        if (!this.initialized) {
            await this.initialize();
        }

        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('User must be authenticated to search clients');
        }

        try {
            const clients = await this.getClients();
            
            // Filter clients based on search term (case-insensitive)
            const filteredClients = clients.filter(client => 
                client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
            );

            console.log(`🔍 Found ${filteredClients.length} clients matching "${searchTerm}"`);
            return filteredClients;
        } catch (error) {
            console.error('❌ Error searching clients:', error);
            throw error;
        }
    }

    // Initialize with sample clients if none exist
    async initializeSampleClients() {
        try {
            const clients = await this.getClients();
            
            if (clients.length === 0) {
                console.log('🔄 No clients found, creating sample clients...');
                
                const sampleClients = [
                    {
                        name: 'John Smith',
                        email: 'john.smith@techcorp.com',
                        company: 'TechCorp Solutions',
                        phone: '+1 (555) 123-4567',
                        role: 'Product Manager',
                        notes: 'Senior PM with 6+ years experience in agile methodologies'
                    },
                    {
                        name: 'Sarah Johnson',
                        email: 'sarah.johnson@designstudio.com',
                        company: 'DesignStudio',
                        phone: '+1 (555) 234-5678',
                        role: 'UX Designer',
                        notes: 'UX Designer specializing in mobile-first design and accessibility'
                    },
                    {
                        name: 'Mike Wilson',
                        email: 'mike.wilson@innovatecorp.com',
                        company: 'InnovateCorp',
                        phone: '+1 (555) 345-6789',
                        role: 'Full Stack Developer',
                        notes: 'Full Stack Developer with expertise in cloud architecture'
                    },
                    {
                        name: 'Alexey Guiullard',
                        email: 'alexey.guiullard@techcorp.com',
                        company: 'TechCorp Solutions',
                        phone: '+1 (555) 456-7890',
                        role: 'Senior Frontend Developer',
                        notes: 'Senior Frontend Developer with 8+ years experience in React and TypeScript'
                    }
                ];

                for (const client of sampleClients) {
                    await this.saveClient(client);
                }
                
                console.log('✅ Sample clients created successfully');
            }
        } catch (error) {
            console.error('❌ Error initializing sample clients:', error);
        }
    }

    // Task operations (placeholder for future implementation)
    async saveTask(taskData) {
        // TODO: Implement task saving
        console.log('Task saving not yet implemented');
    }

    async getTasks() {
        // TODO: Implement task loading
        console.log('Task loading not yet implemented');
        return [];
    }
}

// Create global instance
window.firebaseDB = new FirebaseDatabase();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FirebaseDatabase };
}
