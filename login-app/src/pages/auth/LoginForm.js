// Authentication form component
export function createLoginForm() {
  return `
    <div class="login-container">
      <div class="login-card">
        <div class="auth-toggle">
          <button type="button" class="auth-toggle-btn active" data-mode="login">Sign In</button>
          <button type="button" class="auth-toggle-btn" data-mode="register">Create Account</button>
        </div>
        
        <div class="login-header" id="auth-header">
          <h1>Welcome Back</h1>
          <p>Please sign in to your account</p>
        </div>
        
        <div class="role-tabs" id="role-tabs">
          <button type="button" class="tab-btn active" data-role="user">
            <span class="tab-icon">👤</span>
            <span class="tab-text">User</span>
          </button>
          <button type="button" class="tab-btn" data-role="admin">
            <span class="tab-icon">⚙️</span>
            <span class="tab-text">Admin</span>
          </button>
        </div>
        
        <!-- Login Form -->
        <form id="loginForm" class="auth-form login-form">
          <input type="hidden" id="loginRole" name="role" value="user">
          
          <div class="form-group">
            <label for="loginEmail">Email Address</label>
            <input type="email" id="loginEmail" name="email" required placeholder="Enter your email">
          </div>
          
          <div class="form-group">
            <label for="loginPassword">Password</label>
            <input type="password" id="loginPassword" name="password" required placeholder="Enter your password">
          </div>
          
          <button type="submit" class="auth-btn" id="login-btn">Sign In</button>
          <button type="button" class="google-btn" id="google-login-btn">
            <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          
          <div id="login-error-message" class="error-message" style="display: none;"></div>
        </form>
        
        <!-- Registration Form -->
        ${createRegistrationFormMarkup()}
        
        <div class="demo-credentials" id="demo-section">
          <h3>Quick Demo Login:</h3>
          <div class="demo-buttons">
            <button type="button" class="demo-btn user-demo" data-email="user@example.com" data-password="user123" data-role="user">
              <span class="demo-icon">👤</span>
              <div class="demo-text">
                <strong>Login as User</strong>
                <small>user@example.com</small>
              </div>
            </button>
            <button type="button" class="demo-btn admin-demo" data-email="m.alifmasdar@gmail.com" data-password="123123" data-role="admin">
              <span class="demo-icon">⚙️</span>
              <div class="demo-text">
                <strong>Login as Admin</strong>
                <small>m.alifmasdar@gmail.com</small>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function createRegistrationFormMarkup(options = {}) {
  const {
    formId = 'registerForm',
    formClass = 'auth-form register-form',
    visible = false,
    includeGoogleButton = true,
    googleButtonId = 'google-register-btn',
    submitButtonId = 'register-btn',
    submitButtonText = 'Create Account',
    errorMessageId = 'register-error-message',
    successMessageId = 'register-success-message',
    roleInputId = 'registerRole',
    roleValue = 'user',
    roleFieldHTML,
    idPrefix = 'register',
    includeNoKPField = false,
    noKpLabel = 'No. Kad Pengenalan',
    noKpPlaceholder = '123456789012',
    noKpHelpText = '12 digit number only (example: 123456789012)',
    formAttributes = ''
  } = options;
  
  const displayStyle = visible ? '' : 'display: none;';
  const nameInputId = `${idPrefix}Name`;
  const emailInputId = `${idPrefix}Email`;
  const passwordInputId = `${idPrefix}Password`;
  const confirmInputId = `${idPrefix}ConfirmPassword`;
  const noKpInputId = `${idPrefix}NoKP`;
  
  const roleField = roleFieldHTML !== undefined
    ? roleFieldHTML
    : `<input type="hidden" id="${roleInputId}" name="role" value="${roleValue}">`;
    
  const noKpField = includeNoKPField ? `
          <div class="form-group">
            <label for="${noKpInputId}">${noKpLabel}</label>
            <input 
              type="text" 
              id="${noKpInputId}" 
              name="no_kp" 
              required 
              pattern="[0-9]{12}" 
              inputmode="numeric"
              maxlength="12" 
              placeholder="${noKpPlaceholder}">
            <small class="form-help">${noKpHelpText}</small>
          </div>
  ` : '';
  
  const googleButton = includeGoogleButton ? `
          <button type="button" class="google-btn" id="${googleButtonId}">
            <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>
  ` : '';
  
  return `
        <form id="${formId}" class="${formClass}" style="${displayStyle}" ${formAttributes}>
          ${roleField}
          
          <div class="form-group">
            <label for="${nameInputId}">Full Name</label>
            <input type="text" id="${nameInputId}" name="name" required placeholder="Enter your full name">
          </div>
          
          <div class="form-group">
            <label for="${emailInputId}">Email Address</label>
            <input type="email" id="${emailInputId}" name="email" required placeholder="Enter your email">
          </div>
          
          <div class="form-group">
            <label for="${passwordInputId}">Password</label>
            <input type="password" id="${passwordInputId}" name="password" required placeholder="Create a password" minlength="6">
          </div>
          
          <div class="form-group">
            <label for="${confirmInputId}">Confirm Password</label>
            <input type="password" id="${confirmInputId}" name="confirmPassword" required placeholder="Confirm your password">
          </div>
          
          ${noKpField}
          
          <button type="submit" class="auth-btn" id="${submitButtonId}">${submitButtonText}</button>
          ${googleButton}
          
          <div id="${errorMessageId}" class="error-message" style="display: none;"></div>
          <div id="${successMessageId}" class="success-message" style="display: none;"></div>
        </form>
  `;
}

// Handle authentication mode toggle (login/register)
export function handleAuthToggle(event) {
  const clickedBtn = event.target.closest('.auth-toggle-btn');
  if (!clickedBtn) return;
  
  const mode = clickedBtn.dataset.mode;
  const allToggleBtns = document.querySelectorAll('.auth-toggle-btn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authHeader = document.getElementById('auth-header');
  const demoSection = document.getElementById('demo-section');
  const roleTabs = document.getElementById('role-tabs');
  
  // Update active toggle button
  allToggleBtns.forEach(btn => btn.classList.remove('active'));
  clickedBtn.classList.add('active');
  
  // Clear all error messages
  clearAllErrors();
  
  if (mode === 'login') {
    // Show login form, hide register form
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    demoSection.style.display = 'block';
    
    // Update header
    authHeader.innerHTML = `
      <h1>Welcome Back</h1>
      <p>Please sign in to your account</p>
    `;
    
    // Update role tabs text
    updateRoleTabsText('login');
  } else {
    // Show register form, hide login form
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    demoSection.style.display = 'none';
    
    // Update header
    authHeader.innerHTML = `
      <h1>Create Account</h1>
      <p>Join our platform today</p>
    `;
    
    // Update role tabs text
    updateRoleTabsText('register');
  }
}

// Update role tabs text based on mode
function updateRoleTabsText(mode) {
  const userTab = document.querySelector('[data-role="user"] .tab-text');
  const adminTab = document.querySelector('[data-role="admin"] .tab-text');
  
  if (mode === 'login') {
    userTab.textContent = 'User';
    adminTab.textContent = 'Admin';
  } else {
    userTab.textContent = 'User Account';
    adminTab.textContent = 'Admin Account';
  }
}

// Handle tab switching
export function handleTabSwitch(event) {
  const clickedTab = event.target.closest('.tab-btn');
  if (!clickedTab) return;
  
  const role = clickedTab.dataset.role;
  const allTabs = document.querySelectorAll('.tab-btn');
  
  // Update active tab
  allTabs.forEach(tab => tab.classList.remove('active'));
  clickedTab.classList.add('active');
  
  // Update hidden role inputs for both forms
  const loginRoleInput = document.getElementById('loginRole');
  const registerRoleInput = document.getElementById('registerRole');
  
  if (loginRoleInput) loginRoleInput.value = role;
  if (registerRoleInput) registerRoleInput.value = role;
  
  // Clear any existing error messages
  clearAllErrors();
}

// Handle demo login buttons
export function handleDemoLogin(event, users, onLoginSuccess) {
  const demoBtn = event.target.closest('.demo-btn');
  if (!demoBtn) return;
  
  const email = demoBtn.dataset.email;
  const password = demoBtn.dataset.password;
  const role = demoBtn.dataset.role;
  const originalText = demoBtn.innerHTML;
  
  // Show loading state
  demoBtn.innerHTML = '<div class="loading-spinner"></div>Signing in...';
  demoBtn.classList.add('loading');
  demoBtn.disabled = true;
  
  // Fill the login form
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = password;
  document.getElementById('loginRole').value = role;
  
  // Update the active tab
  const allTabs = document.querySelectorAll('.tab-btn');
  allTabs.forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.role === role) {
      tab.classList.add('active');
    }
  });
  
  // Clear any existing error messages
  clearAllErrors();
  
  // Auto-submit the form after a short delay for visual feedback
  setTimeout(() => {
    // Reset button state
    demoBtn.innerHTML = originalText;
    demoBtn.classList.remove('loading');
    demoBtn.disabled = false;
    
    const user = users[email];
    if (user && user.password === password && user.role === role) {
      onLoginSuccess(user);
    }
  }, 800);
}

// Handle registration form submission
export function handleRegistration(event, onRegistrationSuccess, onRegistrationError) {
  event.preventDefault();
  
  const submitButton = event.target.querySelector('#register-btn');
  const originalText = submitButton.innerHTML;
  
  // Show loading state
  submitButton.innerHTML = '<div class="loading-spinner white"></div>Creating Account...';
  submitButton.classList.add('loading');
  submitButton.disabled = true;
  
  const formData = new FormData(event.target);
  const name = formData.get('name').trim();
  const email = formData.get('email').trim();
  const password = formData.get('password');
  const confirmPassword = document.getElementById('confirmPassword').value;
  const role = formData.get('role');
  
  // Clear previous messages
  clearRegistrationMessages();
  
  // Validation
  if (!name || !email || !password || !confirmPassword) {
    // Reset button state
    submitButton.innerHTML = originalText;
    submitButton.classList.remove('loading');
    submitButton.disabled = false;
    
    showRegistrationError('Please fill in all fields');
    return;
  }
  
  if (password !== confirmPassword) {
    // Reset button state
    submitButton.innerHTML = originalText;
    submitButton.classList.remove('loading');
    submitButton.disabled = false;
    
    showRegistrationError('Passwords do not match');
    return;
  }
  
  if (password.length < 6) {
    // Reset button state
    submitButton.innerHTML = originalText;
    submitButton.classList.remove('loading');
    submitButton.disabled = false;
    
    showRegistrationError('Password must be at least 6 characters long');
    return;
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    // Reset button state
    submitButton.innerHTML = originalText;
    submitButton.classList.remove('loading');
    submitButton.disabled = false;
    
    showRegistrationError('Please enter a valid email address');
    return;
  }
  
  // Simulate async operation
  setTimeout(() => {
    // Reset button state
    submitButton.innerHTML = originalText;
    submitButton.classList.remove('loading');
    submitButton.disabled = false;
    
    // Call registration success callback with user data
    onRegistrationSuccess({
      name,
      email,
      password,
      role
    });
  }, 1000);
}

// Clear all error and success messages
function clearAllErrors() {
  const loginError = document.getElementById('login-error-message');
  const registerError = document.getElementById('register-error-message');
  const registerSuccess = document.getElementById('register-success-message');
  
  if (loginError) loginError.style.display = 'none';
  if (registerError) registerError.style.display = 'none';
  if (registerSuccess) registerSuccess.style.display = 'none';
}

// Clear registration messages
function clearRegistrationMessages() {
  const registerError = document.getElementById('register-error-message');
  const registerSuccess = document.getElementById('register-success-message');
  
  if (registerError) registerError.style.display = 'none';
  if (registerSuccess) registerSuccess.style.display = 'none';
}

// Show registration error
export function showRegistrationError(message) {
  const errorElement = document.getElementById('register-error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

// Show registration success
export function showRegistrationSuccess(message, showVerificationInfo = false) {
  const successElement = document.getElementById('register-success-message');
  if (successElement) {
    if (showVerificationInfo) {
      successElement.innerHTML = `
        <div class="verification-success">
          <div class="success-title">✅ Account Created Successfully!</div>
          <div class="verification-info">
            <p><strong>📧 Email Verification Required</strong></p>
            <p>We've sent a verification email to your inbox. Please:</p>
             <ol>
               <li>Check your email inbox for the verification email</li>
               <li><strong>If not found in inbox, check your spam/junk folder</strong></li>
               <li>Click the verification link in the email</li>
               <li>Return here to log in</li>
             </ol>
            <p class="verification-note">You must verify your email before you can log in.</p>
          </div>
        </div>
      `;
    } else {
      successElement.textContent = message;
    }
    successElement.style.display = 'block';
  }
}

// Handle Google Sign-In
export async function handleGoogleSignIn(event, onSuccess, onError) {
  event.preventDefault();
  
  const button = event.target;
  const originalText = button.innerHTML;
  const isLoginButton = button.id === 'google-login-btn';
  
  try {
    // Get selected role from active tab
    const activeTab = document.querySelector('.tab-btn.active');
    const selectedRole = activeTab ? activeTab.dataset.role : 'user';
    
    // Import FirebaseAuthService dynamically to avoid circular imports
    const { FirebaseAuthService } = await import('../../services/frontend/FirebaseAuthService.js');
    
    // Clear any existing errors
    clearAllErrors();
    
    // Show loading state
    button.innerHTML = '<div class="loading-spinner dark"></div>' + (isLoginButton ? 'Signing in...' : 'Creating account...');
    button.classList.add('loading');
    button.disabled = true;
    
    // Attempt Google Sign-In
    const user = await FirebaseAuthService.signInWithGoogle(selectedRole);
    
    // Reset button
    button.innerHTML = originalText;
    button.classList.remove('loading');
    button.disabled = false;
    
    // Call success callback
    if (onSuccess) {
      onSuccess(user);
    }
  } catch (error) {
    console.error('Google Sign-In error:', error);
    
    // Reset button
    button.innerHTML = originalText;
    button.classList.remove('loading');
    button.disabled = false;
    
    // Show error message
    showError(error.message);
    
    // Call error callback
    if (onError) {
      onError(error);
    }
  }
}

// Show login error
export function showError(message) {
  const errorElement = document.getElementById('login-error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Hide error after 5 seconds
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }
}
