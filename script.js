/**
 * Panchved Login Page - Interactive Handlers
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const phoneNumberInput = document.getElementById('phoneNumber');
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('passwordToggle');
  const eyeOffIcon = document.querySelector('.eye-off-icon');
  const eyeOnIcon = document.querySelector('.eye-on-icon');
  const phoneContainer = document.getElementById('phoneContainer');
  const passwordContainer = document.getElementById('passwordContainer');
  const phoneError = document.getElementById('phoneError');
  const passwordError = document.getElementById('passwordError');
  const loginBtn = document.getElementById('loginBtn');
  const countryCodeBtn = document.getElementById('countryCodeBtn');
  const selectedCode = document.getElementById('selectedCode');

  // Country code list for quick selection
  const countryCodes = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA / Canada' },
    { code: '+44', country: 'United Kingdom' },
    { code: '+971', country: 'UAE' },
    { code: '+61', country: 'Australia' },
    { code: '+65', country: 'Singapore' }
  ];

  let currentCodeIndex = 0;

  // Toggle Country Code on click / Enter key
  if (countryCodeBtn) {
    countryCodeBtn.addEventListener('click', () => {
      currentCodeIndex = (currentCodeIndex + 1) % countryCodes.length;
      selectedCode.textContent = countryCodes[currentCodeIndex].code;
      countryCodeBtn.setAttribute('title', countryCodes[currentCodeIndex].country);
    });

    countryCodeBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        countryCodeBtn.click();
      }
    });
  }

  // 1. Password Visibility Toggle
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';

      if (isPassword) {
        eyeOffIcon.style.display = 'none';
        eyeOnIcon.style.display = 'block';
        passwordToggle.setAttribute('aria-label', 'Hide password');
      } else {
        eyeOffIcon.style.display = 'block';
        eyeOnIcon.style.display = 'none';
        passwordToggle.setAttribute('aria-label', 'Show password');
      }
      passwordInput.focus();
    });
  }

  // 2. Numeric-only phone number input
  if (phoneNumberInput) {
    phoneNumberInput.addEventListener('input', (e) => {
      // Remove any non-digit character
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
      clearError(phoneContainer, phoneError);
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      clearError(passwordContainer, passwordError);
    });
  }

  // 3. Form Validation & Submission
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      const phoneValue = phoneNumberInput.value.trim();
      const passwordValue = passwordInput.value;

      // Phone Validation
      if (!phoneValue) {
        showError(phoneContainer, phoneError, 'Please enter your phone number');
        isValid = false;
      } else if (phoneValue.length < 10) {
        showError(phoneContainer, phoneError, 'Please enter a valid 10-digit phone number');
        isValid = false;
      } else {
        clearError(phoneContainer, phoneError);
      }

      // Password Validation
      if (!passwordValue) {
        showError(passwordContainer, passwordError, 'Please enter your password');
        isValid = false;
      } else if (passwordValue.length < 6) {
        showError(passwordContainer, passwordError, 'Password must be at least 6 characters');
        isValid = false;
      } else {
        clearError(passwordContainer, passwordError);
      }

      if (isValid) {
        // Show loading state
        const originalText = loginBtn.innerHTML;
        loginBtn.disabled = true;
        loginBtn.innerHTML = `<span>Logging in...</span>`;
        loginBtn.style.opacity = '0.85';

        // Simulate API call and redirect to dashboard
        setTimeout(() => {
          loginBtn.disabled = false;
          loginBtn.innerHTML = originalText;
          loginBtn.style.opacity = '1';
          window.location.href = 'dashboard.html';
        }, 800);
      }
    });
  }

  function showError(container, errorElement, message) {
    container.classList.add('has-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('active');
    }
  }

  function clearError(container, errorElement) {
    container.classList.remove('has-error');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('active');
    }
  }
});
