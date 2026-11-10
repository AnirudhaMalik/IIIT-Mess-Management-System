/**
 * helpers.js - Utility Functions
 * IIIT Bhubaneswar Mess Management System
 */

const helpers = {
  /**
   * Format date as 'Nov 9, 2026'
   */
  formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  /**
   * Format date & time as 'Nov 9, 2026, 3:45 PM'
   */
  formatDateTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  },

  /**
   * Format currency as '₹2,800'
   */
  formatCurrency(amount) {
    if (amount === undefined || amount === null) return '₹0';
    const num = Number(amount);
    return `₹${num.toLocaleString('en-IN')}`;
  },

  /**
   * Extract initials e.g. 'John Doe' -> 'JD'
   */
  getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },

  /**
   * Capitalize string e.g. 'breakfast' -> 'Breakfast'
   */
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  /**
   * Get meal icon emoji
   */
  getMealIcon(mealType) {
    const type = String(mealType).toLowerCase();
    switch (type) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '☀️';
      case 'snacks':
      case 'evening_snacks':
      case 'tea':
        return '☕';
      case 'dinner':
        return '🌙';
      default:
        return '🍽️';
    }
  },

  /**
   * Standard meal timing string
   */
  getMealTiming(mealType) {
    const type = String(mealType).toLowerCase();
    switch (type) {
      case 'breakfast':
        return '7:30 AM - 9:30 AM';
      case 'lunch':
        return '12:30 PM - 2:30 PM';
      case 'snacks':
        return '5:00 PM - 6:30 PM';
      case 'dinner':
        return '8:00 PM - 10:00 PM';
      default:
        return 'Mess Operating Hours';
    }
  },

  /**
   * Maps status strings to badge CSS classes
   */
  getStatusClass(status) {
    if (!status) return 'badge-secondary';
    const s = String(status).toLowerCase();
    switch (s) {
      case 'active':
      case 'success':
      case 'resolved':
      case 'approved':
      case 'paid':
      case 'completed':
      case 'published':
        return 'badge-success';

      case 'pending':
      case 'in_progress':
      case 'under_review':
      case 'draft':
      case 'warning':
        return 'badge-warning';

      case 'failed':
      case 'rejected':
      case 'cancelled':
      case 'expired':
      case 'inactive':
      case 'error':
        return 'badge-error';

      case 'upcoming':
      case 'extended':
      case 'info':
        return 'badge-info';

      default:
        return 'badge-secondary';
    }
  },

  /**
   * Debounce helper
   */
  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Formats date as YYYY-MM-DD for <input type="date">
   */
  formatDateForInput(date = new Date()) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Get greeting based on current time
   */
  getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  },

  /**
   * Modal helper with focus trap, backdrop click, and Escape key
   */
  setupModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return null;

    const closeButtons = modal.querySelectorAll('[data-dismiss="modal"], .modal-close');
    const open = () => {
      modal.classList.add('is-active');
      document.body.style.overflow = 'hidden';
      const firstInput = modal.querySelector('input, select, textarea, button:not(.modal-close)');
      if (firstInput) firstInput.focus();
    };

    const close = () => {
      modal.classList.remove('is-active');
      document.body.style.overflow = '';
    };

    closeButtons.forEach(btn => btn.addEventListener('click', close));

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-active')) {
        close();
      }
    });

    return { modal, open, close };
  },

  /**
   * Initializes shared layout features: user info, active link, notification count, mobile toggle
   */
  async initLayout(role = 'student') {
    // 1. Guard authentication and role
    if (window.Auth) {
      window.Auth.requireRole(role);
    }

    // 2. Populate user info in topbar
    const user = window.Auth ? window.Auth.getUser() : null;
    if (user) {
      const nameElems = document.querySelectorAll('.user-display-name');
      const avatarElems = document.querySelectorAll('.avatar-circle');
      const roleElems = document.querySelectorAll('.user-role-label');

      nameElems.forEach(el => { el.textContent = user.name || user.email || 'User'; });
      avatarElems.forEach(el => { el.textContent = helpers.getInitials(user.name || user.email || 'U'); });
      roleElems.forEach(el => { el.textContent = user.role === 'admin' ? 'Administrator' : (user.studentId || 'Student'); });
    }

    // 3. Highlight current sidebar nav link + force same-tab navigation
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.sidebar .nav-item');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        const linkFilename = href.split('/').pop().split('?')[0];
        const currentFilename = currentPath.split('/').pop().split('?')[0];
        if (linkFilename && linkFilename === currentFilename) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }

        // Force same-tab navigation — prevents any browser/viewer from opening in a new tab
        link.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = href;
        });
      }
    });

    // 3b. Force same-tab navigation on topbar links (notification bell, profile menu)
    document.querySelectorAll('.notification-bell-btn, .user-profile-menu[href], a.user-profile-menu').forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = href;
        });
      }
    });

    // 4. Mobile sidebar toggle
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (hamburgerBtn && sidebar) {
      hamburgerBtn.addEventListener('click', () => {
        sidebar.classList.toggle('is-open');
        if (overlay) overlay.classList.toggle('is-open');
      });
    }

    if (overlay && sidebar) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('is-open');
        overlay.classList.remove('is-open');
      });
    }

    // 5. Logout triggers
    const logoutBtns = document.querySelectorAll('.logout-trigger, [data-action="logout"]');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to log out?')) {
          window.Auth.logout();
        }
      });
    });

    // 6. Fetch unread notification count
    try {
      if (window.api && window.Auth && window.Auth.isAuthenticated()) {
        const notifBadge = document.querySelector('.notification-count-badge');
        if (notifBadge) {
          const res = await window.api.get('/notifications', { unreadOnly: true, limit: 10 });
          const count = res.unreadCount !== undefined ? res.unreadCount : (Array.isArray(res) ? res.filter(n => !n.isRead).length : (res.data ? res.data.length : 0));
          if (count > 0) {
            notifBadge.textContent = count > 99 ? '99+' : count;
            notifBadge.style.display = 'block';
          } else {
            notifBadge.style.display = 'none';
          }
        }
      }
    } catch (e) {
      // Quiet fail if backend isn't up yet or notifications fail
      console.warn('Could not fetch notification count:', e.message);
    }
  }
};

window.helpers = helpers;

