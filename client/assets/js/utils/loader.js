/**
 * loader.js - Loading Skeleton & Spinner Utilities
 * IIIT Bhubaneswar Mess Management System
 */

(function () {
  let spinnerOverlay = null;

  /**
   * Shows a full-page overlay spinner
   */
  function showSpinner() {
    if (!spinnerOverlay || !document.body.contains(spinnerOverlay)) {
      spinnerOverlay = document.createElement('div');
      spinnerOverlay.className = 'spinner-overlay';
      spinnerOverlay.innerHTML = `
        <div class="d-flex flex-col items-center gap-12">
          <div class="spinner"></div>
          <span class="text-secondary font-medium" style="font-size: 13px;">Loading...</span>
        </div>
      `;
      document.body.appendChild(spinnerOverlay);
    }
    spinnerOverlay.style.display = 'flex';
  }

  /**
   * Hides the full-page overlay spinner
   */
  function hideSpinner() {
    if (spinnerOverlay) {
      spinnerOverlay.style.display = 'none';
    }
  }

  /**
   * Shows skeleton placeholders inside a container
   */
  function showLoader(container, rows = 3) {
    if (!container) return;
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;

    // Cache original innerHTML if not already cached
    if (!target._originalContent) {
      target._originalContent = target.innerHTML;
    }

    let skeletonHtml = `<div class="skeleton-loader-box" style="padding: 16px 0;">`;
    for (let i = 0; i < rows; i++) {
      skeletonHtml += `
        <div class="skeleton skeleton-text" style="width: ${i % 2 === 0 ? '100%' : '75%'}; margin-bottom: 12px; height: 16px;"></div>
      `;
    }
    skeletonHtml += `</div>`;

    target.innerHTML = skeletonHtml;
  }

  /**
   * Restores container content or clears skeleton
   */
  function hideLoader(container) {
    if (!container) return;
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;

    const skeleton = target.querySelector('.skeleton-loader-box');
    if (skeleton) {
      skeleton.remove();
    }
  }

  window.Loader = {
    showSpinner,
    hideSpinner,
    showLoader,
    hideLoader
  };

  window.showSpinner = showSpinner;
  window.hideSpinner = hideSpinner;
  window.showLoader = showLoader;
  window.hideLoader = hideLoader;
})();
