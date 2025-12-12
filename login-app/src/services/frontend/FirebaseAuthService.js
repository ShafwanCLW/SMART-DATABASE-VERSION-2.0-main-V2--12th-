// Firebase Authentication Service
import { initializeApp, getApps } from 'firebase/app';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  getAuth
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { auth, db, firebaseConfig } from '../database/firebase.js';

// Current user state
let currentUser = null;
let userProfile = null;
let secondaryAuthInstance = null;

function getAdminRegistrationAuth() {
  if (secondaryAuthInstance) return secondaryAuthInstance;
  if (!firebaseConfig?.apiKey) {
    throw new Error('Firebase configuration is missing. Tidak dapat mencipta pengguna baharu.');
  }
  
  const secondaryAppName = 'admin-registration';
  const apps = getApps();
  const existingApp = apps.find(app => app.name === secondaryAppName);
  const secondaryApp = existingApp || initializeApp(firebaseConfig, secondaryAppName);
  secondaryAuthInstance = getAuth(secondaryApp);
  return secondaryAuthInstance;
}

// Authentication methods
export class FirebaseAuthService {
  static getCurrentUser() {
    return currentUser;
  }

  static getUserProfile() {
    return userProfile;
  }

  static async login(email, password, selectedRole) {
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found. Please contact administrator.');
      }
      
      const userData = userDoc.data();
      
      // Check if the selected role matches the user's role
      if (userData.role !== selectedRole) {
        await signOut(auth);
        throw new Error(`Access denied. This account is registered as ${userData.role}. You cannot login as ${selectedRole}. Please select the correct role tab.`);
      }
      
      // Update email verification status if it has changed
      if (user.emailVerified && !userData.emailVerified) {
        await updateDoc(doc(db, 'users', user.uid), {
          emailVerified: true,
          status: 'active'
        });
        userData.emailVerified = true;
        userData.status = 'active';
      }
      
      // Check if email is verified for non-admin users
      if (!user.emailVerified && userData.role !== 'admin') {
        throw new Error('Please verify your email address before logging in. Check your inbox or spam for the verification email.');
      }
      
      // Set current user and profile
      currentUser = user;
      userProfile = userData;
      
      return {
        uid: user.uid,
        email: user.email,
        name: userData.name,
        role: userData.role,
        ...userData
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  static async register(email, password, name, role = 'user', extraProfileData = {}) {
    try {
      // Create user with Firebase Auth using a secondary app to avoid logging out current admin
      const registrationAuth = getAdminRegistrationAuth();
      const userCredential = await createUserWithEmailAndPassword(registrationAuth, email, password);
      const user = userCredential.user;
      
      // Update the user's display name
      await updateProfile(user, { displayName: name });
      
      // Send email verification
      await sendEmailVerification(user, {
        url: window.location.origin + '/login', // Redirect URL after verification
        handleCodeInApp: false
      });
      
      // Create user profile in Firestore
      const now = new Date();
      const baseProfile = {
        name: name,
        email: email,
        role: role,
        status: 'pending_verification', // Changed from 'active' to indicate pending verification
        emailVerified: false,
        createdAt: now,
        lastLogin: now
      };
      
      const userProfile = {
        ...baseProfile,
        ...(extraProfileData || {})
      };
      
      if (!userProfile.status) {
        userProfile.status = 'pending_verification';
      }
      if (!userProfile.createdBy) {
        userProfile.createdBy = 'self-service';
      }
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      return {
        uid: user.uid,
        email: user.email,
        name: name,
        role: role,
        emailVerified: false,
        verificationEmailSent: true,
        ...userProfile
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    } finally {
      if (secondaryAuthInstance) {
        try {
          await signOut(secondaryAuthInstance);
        } catch (logoutError) {
          console.warn('Failed to clear secondary auth session:', logoutError);
        }
      }
    }
  }

  static async signInWithGoogle(selectedRole) {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user profile exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        // Existing user - check role
        const userData = userDoc.data();
        
        if (userData.role !== selectedRole) {
          await signOut(auth);
          throw new Error(`Access denied. This account is registered as ${userData.role}. You cannot login as ${selectedRole}. Please select the correct role tab.`);
        }
        
        // Update last login
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogin: new Date()
        });
        
        currentUser = user;
        userProfile = userData;
        
        return {
          uid: user.uid,
          email: user.email,
          name: userData.name,
          role: userData.role,
          ...userData
        };
      } else {
        // New user - create profile
        const userProfile = {
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          role: selectedRole,
          status: 'active',
          createdAt: new Date(),
          lastLogin: new Date(),
          authProvider: 'google'
        };
        
        await setDoc(doc(db, 'users', user.uid), userProfile);
        
        currentUser = user;
        this.userProfile = userProfile;
        
        return {
          uid: user.uid,
          email: user.email,
          name: userProfile.name,
          role: userProfile.role,
          ...userProfile
        };
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked by browser. Please allow pop-ups and try again.');
      }
      throw new Error(error.message || 'Google Sign-In failed');
    }
  }

  static async logout() {
    try {
      await signOut(auth);
      currentUser = null;
      userProfile = null;
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed');
    }
  }

  static isAuthenticated() {
    return currentUser !== null;
  }

  static isAdmin() {
    return userProfile && userProfile.role === 'admin';
  }

  static isUser() {
    return userProfile && userProfile.role === 'user';
  }

  static isModerator() {
    return userProfile && userProfile.role === 'moderator';
  }

  static async resendVerificationEmail() {
    try {
      if (!currentUser) {
        throw new Error('No user is currently logged in');
      }
      
      if (currentUser.emailVerified) {
        throw new Error('Email is already verified');
      }
      
      await sendEmailVerification(currentUser, {
        url: window.location.origin + '/login',
        handleCodeInApp: false
      });
      
      return { success: true, message: 'Verification email sent successfully' };
    } catch (error) {
      console.error('Resend verification error:', error);
      throw new Error(error.message || 'Failed to resend verification email');
    }
  }

  // Listen for authentication state changes
  static onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        // Get user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            userProfile = userDoc.data();
            callback({
              uid: user.uid,
              email: user.email,
              name: userProfile.name,
              role: userProfile.role,
              ...userProfile
            });
          } else {
            callback(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          callback(null);
        }
      } else {
        currentUser = null;
        userProfile = null;
        callback(null);
      }
    });
  }

  // User management methods
  static async getAllUsers() {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const users = [];
      
      usersSnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  static async updateUser(userId, userData) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  static async deleteUser(userId) {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  // Activity management methods
  static async addActivity(activityData) {
    try {
      const activitiesCollection = collection(db, 'activities');
      const docRef = await addDoc(activitiesCollection, {
        ...activityData,
        createdAt: new Date(),
        createdBy: currentUser?.uid
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding activity:', error);
      throw new Error('Failed to add activity');
    }
  }

  static async getAllActivities() {
    try {
      const activitiesCollection = collection(db, 'activities');
      const activitiesQuery = query(activitiesCollection, orderBy('createdAt', 'desc'));
      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activities = [];
      
      activitiesSnapshot.forEach((doc) => {
        activities.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return activities;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw new Error('Failed to fetch activities');
    }
  }

  static async updateActivity(activityId, activityData) {
    try {
      const activityRef = doc(db, 'activities', activityId);
      await updateDoc(activityRef, {
        ...activityData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating activity:', error);
      throw new Error('Failed to update activity');
    }
  }

  static async deleteActivity(activityId) {
    try {
      await deleteDoc(doc(db, 'activities', activityId));
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw new Error('Failed to delete activity');
    }
  }
}

// Handle login form submission with Firebase
export async function handleFirebaseLogin(event, onSuccess, onError) {
  event.preventDefault();
  
  const submitButton = event.target.querySelector('#login-btn');
  const originalText = submitButton.innerHTML;
  
  try {
    // Show loading state
    submitButton.innerHTML = '<div class="loading-spinner white"></div>Signing in...';
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Get selected role from active tab
    const activeTab = document.querySelector('.tab-btn.active');
    const selectedRole = activeTab ? activeTab.dataset.role : 'user';
    
    const user = await FirebaseAuthService.login(email, password, selectedRole);
    
    // Reset button state
    submitButton.innerHTML = originalText;
    submitButton.classList.remove('loading');
    submitButton.disabled = false;
    
    onSuccess(user);
  } catch (error) {
    // Reset button state
    submitButton.innerHTML = originalText;
    submitButton.classList.remove('loading');
    submitButton.disabled = false;
    
    onError(error.message);
  }
}

// Handle logout with Firebase
export async function handleFirebaseLogout(onLogout) {
  try {
    await FirebaseAuthService.logout();
    onLogout();
  } catch (error) {
    console.error('Logout error:', error);
  }
}
