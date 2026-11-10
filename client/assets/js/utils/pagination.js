/**
 * pagination.js - Reusable Pagination Component
 * IIIT Bhubaneswar Mess Management System
 */

const Pagination = {
  /**
   * Renders pagination controls into a target container
   * @param {HTMLElement|string} container
   * @param {Object} options
   *   currentPage: number (1-based)
   *   totalPages: number
   *   totalItems: number
   *   limit: number
   *   onPageChange: function(newPage)
   */
  render(container, options = {}) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;

    const {
      currentPage = 1,
      totalPages = 1,
      totalItems = 0,
      limit = 10,
      onPageChange = () => {}
    } = options;

    if (totalItems === 0 || totalPages <= 1) {
      target.innerHTML = '';
      return;
    }

    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, totalItems);

    let html = `
      <div class="pagination">
        <div class="pagination-info">
          Showing <span class="font-semibold">${startItem}</span> to <span class="font-semibold">${endItem}</span> of <span class="font-semibold">${totalItems}</span> entries
        </div>
        <div class="pagination-pages">
          <button class="page-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''} title="Previous Page">&laquo; Prev</button>
    `;

    // Calculate page range (max 5 buttons visible)
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      html += `<button class="page-btn page-num" data-page="1">1</button>`;
      if (startPage > 2) {
        html += `<span class="px-2 text-muted">...</span>`;
      }
    }

    for (let p = startPage; p <= endPage; p++) {
      html += `
        <button class="page-btn page-num ${p === currentPage ? 'active' : ''}" data-page="${p}">
          ${p}
        </button>
      `;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += `<span class="px-2 text-muted">...</span>`;
      }
      html += `<button class="page-btn page-num" data-page="${totalPages}">${totalPages}</button>`;
    }

    html += `
          <button class="page-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''} title="Next Page">Next &raquo;</button>
        </div>
      </div>
    `;

    target.innerHTML = html;

    // Attach click listeners
    const prevBtn = target.querySelector('.prev-btn');
    const nextBtn = target.querySelector('.next-btn');
    const pageButtons = target.querySelectorAll('.page-num');

    if (prevBtn && currentPage > 1) {
      prevBtn.addEventListener('click', () => onPageChange(currentPage - 1));
    }
    if (nextBtn && currentPage < totalPages) {
      nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));
    }

    pageButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = parseInt(e.target.dataset.page, 10);
        if (page !== currentPage) {
          onPageChange(page);
        }
      });
    });
  }
};

window.Pagination = Pagination;
