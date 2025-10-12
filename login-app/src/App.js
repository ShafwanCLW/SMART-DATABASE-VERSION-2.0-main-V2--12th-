// Main application controller
import { createLoginForm, handleTabSwitch, handleDemoLogin, showError, handleAuthToggle, handleRegistration, showRegistrationSuccess, showRegistrationError, handleGoogleSignIn } from './pages/auth/LoginForm.js';
import { createAdminDashboard, setupUserManagementListeners, setupKIRManagementListeners, setupCiptaKIRListeners, setupProgramKehadiranListeners, setupSenariKIRListeners, setupReportsListeners, setupSettingsListeners, setupFinancialTrackingListeners } from './pages/admin/AdminDashboard.js';
import { createUserDashboard } from './pages/user/UserDashboard.js';
import { FirebaseAuthService, handleFirebaseLogin, handleFirebaseLogout } from './services/frontend/FirebaseAuthService.js';
import { AuthService, handleLogin, handleLogout } from './services/frontend/AuthService.js'; // Keep for demo functionality
import { saveUserSession, loadUserSession, clearUserSession } from './lib/SessionUtils.js';
import { setupNavigationListeners } from './lib/NavigationUtils.js';
import { KIRProfile } from './pages/admin/KIRProfile.js';



export class App {
  constructor() {
    this.appElement = document.querySelector('#app');
    this.currentRoute = null;
    this.kirProfile = new KIRProfile();
  }

  // Render login page
  renderLogin() {
    // Remove KIR profile body class when navigating away
    document.body.classList.remove('kir-profile-active');
    
    this.appElement.innerHTML = createLoginForm();
    
    // Setup authentication mode toggle (login/register)
    const authToggleContainer = document.querySelector('.auth-toggle');
    authToggleContainer.addEventListener('click', handleAuthToggle);
    
    // Setup login form event listener for Firebase authentication
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', (event) => {
      handleFirebaseLogin(
        event,
        (user) => this.onLoginSuccess(user),
        (error) => showError(error)
      );
    });
    
    // Setup registration form event listener
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', (event) => {
      handleRegistration(
        event,
        (userData) => this.onRegistrationSuccess(userData),
        (error) => showRegistrationError(error)
      );
    });
    
    // Set up Google Sign-In buttons
    const googleLoginBtn = document.getElementById('google-login-btn');
    const googleRegisterBtn = document.getElementById('google-register-btn');
    
    if (googleLoginBtn) {
      googleLoginBtn.addEventListener('click', (event) => {
        handleGoogleSignIn(event, this.onLoginSuccess.bind(this), (error) => {
          console.error('Google login error:', error);
        });
      });
    }
    
    if (googleRegisterBtn) {
      googleRegisterBtn.addEventListener('click', (event) => {
        handleGoogleSignIn(event, this.onLoginSuccess.bind(this), (error) => {
          console.error('Google registration error:', error);
        });
      });
    }
    
    // Setup tab switching functionality
    const tabContainer = document.querySelector('.role-tabs');
    tabContainer.addEventListener('click', handleTabSwitch);
    
    // Setup demo login functionality (still uses mock data for demo purposes)
    const demoContainer = document.querySelector('.demo-buttons');
    demoContainer.addEventListener('click', (event) => {
      handleDemoLogin(
        event,
        AuthService.getUsers(),
        (user) => this.onLoginSuccess(user)
      );
    });
  }

  // Render dashboard based on user role and route
  renderDashboard() {
    // Remove KIR profile body class when navigating away
    document.body.classList.remove('kir-profile-active');
    
    const currentUser = FirebaseAuthService.getCurrentUser();
    const userProfile = FirebaseAuthService.getUserProfile();
    
    if (!currentUser || !userProfile) {
      this.renderLogin();
      return;
    }

    const userData = {
      uid: currentUser.uid,
      email: currentUser.email,
      name: userProfile.name,
      role: userProfile.role,
      ...userProfile
    };

    // Check for specific routes first
    const route = this.getCurrentRoute();
    if (route && userData.role === 'admin') {
      if (route.path === 'admin/kir' && route.params.kirId && route.params.kirId !== 'null' && route.params.kirId !== 'undefined') {
        this.renderKIRProfile(route.params.kirId, route.query.tab);
        return;
      }


    }

    // Render appropriate dashboard based on role
    if (userData.role === 'admin') {
      this.appElement.innerHTML = createAdminDashboard(userData);
      // Setup user management listeners for admin dashboard
      setupUserManagementListeners();
      // Setup KIR management listeners for admin dashboard
      setupKIRManagementListeners();
      // Setup Senarai KIR listeners for admin dashboard
      setupSenariKIRListeners();
      // Setup Cipta KIR wizard listeners for admin dashboard
      setupCiptaKIRListeners();

      // Setup Program & Kehadiran listeners for admin dashboard
    setupProgramKehadiranListeners();
      // Setup Financial Tracking listeners for admin dashboard
      setupFinancialTrackingListeners();
      // Setup Reports listeners for admin dashboard
      setupReportsListeners();
      // Setup Settings listeners for admin dashboard
      setupSettingsListeners();
    } else {
      this.appElement.innerHTML = createUserDashboard(userData);
    }

    // Setup navigation listeners
    setupNavigationListeners(() => this.onLogout());
  }

  // Render KIR Profile page
  async renderKIRProfile(kirId, tab = 'maklumat-asas') {
    // Add body class for KIR profile styling
    document.body.classList.add('kir-profile-active');
    
    // Create KIR Profile container
    this.appElement.innerHTML = `
      <div id="kir-profile-container" class="kir-profile-page">
        <!-- KIR Profile content will be rendered here -->
      </div>
    `;
    
    // Initialize KIR Profile component
    await this.kirProfile.init(kirId, tab);
    
    // Make sure the global kirProfile instance is updated with the current instance
    window.kirProfile = this.kirProfile;
  }







  // Get current route from hash
  getCurrentRoute() {
    const hash = window.location.hash.slice(1); // Remove #
    if (!hash) return null;
    
    // Parse route: /admin/kir/123?tab=maklumat-asas
    const [pathPart, queryPart] = hash.split('?');
    const pathSegments = pathPart.split('/').filter(Boolean);
    
    // Parse query parameters
    const query = {};
    if (queryPart) {
      queryPart.split('&').forEach(param => {
        const [key, value] = param.split('=');
        query[key] = decodeURIComponent(value || '');
      });
    }
    
    // Handle admin/kir/:kirId route
    if (pathSegments[0] === 'admin' && pathSegments[1] === 'kir' && pathSegments[2]) {
      return {
        path: 'admin/kir',
        params: { kirId: pathSegments[2] },
        query
      };
    }
    
    return {
      path: pathSegments.join('/'),
      params: {},
      query
    };
  }

  // Setup routing listeners
  setupRouting() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      this.handleRouteChange();
    });
    
    // Handle initial route
    this.handleRouteChange();
  }

  // Handle route changes
  handleRouteChange() {
    const currentUser = FirebaseAuthService.getCurrentUser();
    const userProfile = FirebaseAuthService.getUserProfile();
    
    if (currentUser && userProfile) {
      this.renderDashboard();
    }
  }

  // Handle successful login
  onLoginSuccess(user) {
    // For Firebase users, the state is managed by Firebase Auth
    // For demo users, still use the old method
    if (user.uid) {
      // Firebase user - state is managed by onAuthStateChanged
      saveUserSession(user);
      this.renderDashboard();
    } else {
      // Demo user - use old method
      AuthService.setCurrentUser(user);
      saveUserSession(user);
      this.renderDashboard();
    }
  }

  // Handle successful registration
  async onRegistrationSuccess(userData) {
    try {
      // Register user with Firebase
      const newUser = await FirebaseAuthService.register(
        userData.email,
        userData.password,
        userData.name,
        userData.role
      );
      
      // Show success message with email verification info
      showRegistrationSuccess('Account created successfully!', true);
      
      // Clear the registration form
      document.getElementById('registerForm').reset();
      
      // Switch back to login mode after a short delay
      setTimeout(() => {
        const loginToggle = document.querySelector('[data-mode="login"]');
        if (loginToggle) {
          loginToggle.click();
        }
      }, 2000);
      
    } catch (error) {
      console.error('Registration error:', error);
      showRegistrationError(error.message || 'Registration failed. Please try again.');
    }
  }

  // Handle logout
  async onLogout() {
    try {
      // Check if it's a Firebase user or demo user
      const currentUser = FirebaseAuthService.getCurrentUser();
      if (currentUser) {
        // Firebase logout
        await handleFirebaseLogout(() => {
          clearUserSession();
          this.renderLogin();
        });
      } else {
        // Demo logout
        handleLogout(() => {
          clearUserSession();
          this.renderLogin();
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback to demo logout
      handleLogout(() => {
        clearUserSession();
        this.renderLogin();
      });
    }
  }

  // Initialize the application
  initialize() {
    // Setup routing
    this.setupRouting();
    
    // Setup Firebase auth state listener
    FirebaseAuthService.onAuthStateChange((user) => {
      if (user) {
        // User is signed in with Firebase
        this.renderDashboard();
      } else {
        // Check for demo user session
        const savedUser = loadUserSession();
        if (savedUser && !savedUser.uid) {
          // Demo user session exists
          AuthService.setCurrentUser(savedUser);
          this.renderDashboard();
        } else {
          // No user session, show login
          clearUserSession();
          this.renderLogin();
        }
      }
    });
  }
}