/**
 * Panchved Admin - Shared API Config & Session Utilities
 */

(function () {
  // Determine API Base URL intelligently:
  // If running on localhost or same domain, use relative 'api'
  // If running directly from remote digitalbolt server, use 'api'
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isDigitalBolt = window.location.hostname.includes('digitalbolt.co');
  
  window.API_BASE_URL = window.API_BASE_URL || (
    isLocal || isDigitalBolt || window.location.protocol === 'file:'
      ? 'api' 
      : 'https://digitalbolt.co/portfolio/shridhar/panchved/api'
  );

  // Global Auth Helper
  window.PanchvedAuth = {
    getUser: function () {
      try {
        const u = localStorage.getItem('panchved_user');
        return u ? JSON.parse(u) : null;
      } catch (e) {
        return null;
      }
    },
    getToken: function () {
      return localStorage.getItem('panchved_token') || '';
    },
    setUser: function (user, token) {
      if (user) localStorage.setItem('panchved_user', JSON.stringify(user));
      if (token) localStorage.setItem('panchved_token', token);
    },
    logout: async function () {
      try {
        await fetch(`${window.API_BASE_URL}/logout.php`, { method: 'POST' }).catch(() => {});
      } catch (_) {}
      localStorage.removeItem('panchved_user');
      localStorage.removeItem('panchved_token');
      window.location.href = 'index.html';
    },
    requireAuth: function () {
      const user = this.getUser();
      const currentPage = window.location.pathname.split('/').pop();
      if (!user && currentPage !== 'index.html' && currentPage !== 'login.html' && currentPage !== '') {
        // Optional redirect if unauthenticated, or allow guest viewing
      }
      return user;
    },
    updateUI: function () {
      const user = this.getUser();
      if (!user) return;

      const userNameEls = document.querySelectorAll('.user-name');
      const userRoleEls = document.querySelectorAll('.user-role');
      const welcomeText = document.querySelector('.welcome-text');

      userNameEls.forEach(el => el.textContent = user.full_name || user.username || 'Admin');
      userRoleEls.forEach(el => el.textContent = user.role || 'Admin');
      
      if (welcomeText && welcomeText.textContent.includes('Welcome Back')) {
        welcomeText.textContent = `Welcome Back ${user.full_name || user.username || 'Admin'}!`;
      }
    }
  };

  // Toast notification helper for all screens
  window.showAppToast = function (message, type = 'success') {
    const existingToast = document.querySelector('.app-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `app-toast toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: ${type === 'success' ? '#00828A' : type === 'error' ? '#ef4444' : '#0F647E'};
      color: #fff;
      padding: 13px 22px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.18);
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateY(20px);
      opacity: 0;
      font-family: 'Plus Jakarta Sans', sans-serif;
    `;
    toast.innerHTML = `
      <span style="display:inline-flex;align-items:center;">${message}</span>
      <button type="button" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1;margin-left:6px;opacity:0.8;">&times;</button>
    `;

    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    const closeBtn = toast.querySelector('button');
    if (closeBtn) closeBtn.addEventListener('click', () => toast.remove());

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  };

  // Wire logout button across all pages
  document.addEventListener('DOMContentLoaded', () => {
    window.PanchvedAuth.updateUI();

    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.PanchvedAuth.logout();
      });
    });
  });
})();
