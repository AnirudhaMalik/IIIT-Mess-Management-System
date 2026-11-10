/**
 * auth.js - Authentication & Role Guard Service
 * IIIT Bhubaneswar Mess Management System
 */

const Auth = {
  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  getUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  /**
   * Helper to resolve relative target URLs accurately
   */
  _resolvePath(target) {
    const path = window.location.pathname;
    let inSubfolder = path.includes('/pages/student/') || path.includes('/pages/admin/') || path.includes('/pages/auth/');

    if (target === 'login') {
      return inSubfolder ? '../auth/login.html' : './pages/auth/login.html';
    }
    if (target === 'student') {
      return inSubfolder ? '../student/dashboard.html' : './pages/student/dashboard.html';
    }
    if (target === 'admin') {
      return inSubfolder ? '../admin/dashboard.html' : './pages/admin/dashboard.html';
    }
    return inSubfolder ? '../auth/login.html' : './pages/auth/login.html';
  },

  logout() {
    localStorage.clear();
    window.location.href = this._resolvePath('login');
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      this.logout();
      return false;
    }
    return true;
  },

  requireRole(requiredRole) {
    if (!this.requireAuth()) return;
    const user = this.getUser();
    if (!user || user.role !== requiredRole) {
      this.redirectByRole();
    }
  },

  redirectByRole() {
    const user = this.getUser();
    if (!user) {
      window.location.href = this._resolvePath('login');
      return;
    }

    if (user.role === 'admin' || user.role === 'mess_manager') {
      window.location.href = this._resolvePath('admin');
    } else {
      window.location.href = this._resolvePath('student');
    }
  }
};

window.Auth = Auth;
