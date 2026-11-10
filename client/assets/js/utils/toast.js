/**
 * toast.js - Toast Notification System
 * IIIT Bhubaneswar Mess Management System
 */

(function () {
  let toastContainer = null;

  function ensureToastContainer() {
    if (!toastContainer || !document.body.contains(toastContainer)) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  function getIcon(type) {
    switch (type) {
      case 'success':
        return `<span style="color: var(--color-success); font-weight: bold;">✓</span>`;
      case 'error':
        return `<span style="color: var(--color-error); font-weight: bold;">✕</span>`;
      case 'warning':
        return `<span style="color: var(--color-warning); font-weight: bold;">⚠</span>`;
      case 'info':
      default:
        return `<span style="color: var(--color-info); font-weight: bold;">ℹ</span>`;
    }
  }

  function showToast(message, type = 'info', duration = 4000) {
    const container = ensureToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${getIcon(type)}</span>
        <span class="toast-message">${message}</span>
      </div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    container.appendChild(toast);

    // Slide-in transition trigger
    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });

    let dismissTimeout;

    const dismiss = () => {
      clearTimeout(dismissTimeout);
      toast.classList.remove('is-visible');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 200);
    };

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', dismiss);

    if (duration > 0) {
      dismissTimeout = setTimeout(dismiss, duration);
    }

    return { dismiss };
  }

  window.showToast = showToast;
})();
