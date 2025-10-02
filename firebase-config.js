// Firebase Configuration and Services
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBWX_li52qXOfsee0v6dEX6TsTre5nsyJQ",
    authDomain: "tradersurvivor99.firebaseapp.com",
    projectId: "tradersurvivor99",
    storageBucket: "tradersurvivor99.firebasestorage.app",
    messagingSenderId: "321644861145",
    appId: "1:321644861145:web:4adf78d89de42ab14650c8",
    measurementId: "G-CS7ST78JQT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Global variables for current user
let currentUser = null;

// Authentication functions
export const authService = {
    // Register new user
    async register(email, password, displayName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Update user profile with display name
            await updateProfile(user, {
                displayName: displayName
            });
            
            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: email,
                displayName: displayName,
                createdAt: new Date(),
                lastLogin: new Date()
            });
            
            return { success: true, user: user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Login user
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Update last login
            await updateDoc(doc(db, 'users', user.uid), {
                lastLogin: new Date()
            });
            
            return { success: true, user: user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Logout user
    async logout() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Get current user
    getCurrentUser() {
        return auth.currentUser;
    },

    // Listen to auth state changes
    onAuthStateChanged(callback) {
        return onAuthStateChanged(auth, callback);
    }
};

// Database functions
export const dbService = {
    // Operations CRUD
    async addOperation(operationData) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Usuario no autenticado');
            
            const docRef = await addDoc(collection(db, 'operations'), {
                ...operationData,
                userId: user.uid,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getOperations() {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Usuario no autenticado');
            
            const q = query(
                collection(db, 'operations'), 
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const operations = [];
            
            querySnapshot.forEach((doc) => {
                operations.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data: operations };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updateOperation(operationId, operationData) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Usuario no autenticado');
            
            await updateDoc(doc(db, 'operations', operationId), {
                ...operationData,
                updatedAt: new Date()
            });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deleteOperation(operationId) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Usuario no autenticado');
            
            await deleteDoc(doc(db, 'operations', operationId));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Accounts CRUD
    async addAccount(accountData) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Usuario no autenticado');
            
            const docRef = await addDoc(collection(db, 'accounts'), {
                ...accountData,
                userId: user.uid,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getAccounts() {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Usuario no autenticado');
            
            const q = query(
                collection(db, 'accounts'), 
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const accounts = [];
            
            querySnapshot.forEach((doc) => {
                accounts.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data: accounts };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updateAccount(accountId, accountData) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Usuario no autenticado');
            
            await updateDoc(doc(db, 'accounts', accountId), {
                ...accountData,
                updatedAt: new Date()
            });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deleteAccount(accountId) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Usuario no autenticado');
            
            await deleteDoc(doc(db, 'accounts', accountId));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Finances CRUD
    async addFinance(financeData) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Usuario no autenticado');
            
            const docRef = await addDoc(collection(db, 'finances'), {
                ...financeData,
                userId: user.uid,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getFinances() {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Usuario no autenticado');
            
            const q = query(
                collection(db, 'finances'), 
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const finances = [];
            
            querySnapshot.forEach((doc) => {
                finances.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data: finances };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updateFinance(financeId, financeData) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Usuario no autenticado');
            
            await updateDoc(doc(db, 'finances', financeId), {
                ...financeData,
                updatedAt: new Date()
            });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deleteFinance(financeId) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Usuario no autenticado');
            
            await deleteDoc(doc(db, 'finances', financeId));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // User settings
    async getUserSettings() {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Usuario no autenticado');
            
            const docRef = doc(db, 'user_settings', user.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return { success: true, data: docSnap.data() };
            } else {
                // Create default settings
                const defaultSettings = {
                    currency: 'USD',
                    theme: 'dark',
                    notifications: true,
                    createdAt: new Date()
                };
                
                await setDoc(docRef, defaultSettings);
                return { success: true, data: defaultSettings };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updateUserSettings(settings) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Usuario no autenticado');
            
            await setDoc(doc(db, 'user_settings', user.uid), {
                ...settings,
                updatedAt: new Date()
            }, { merge: true });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// Export Firebase instances
export { auth, db, storage, analytics };
