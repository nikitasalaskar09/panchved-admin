/**
 * Panchved Admin - Patients Screen Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const filterBtn = document.getElementById('filterBtn');
  const patientsTableBody = document.getElementById('patientsTableBody');
  const patientRows = document.querySelectorAll('.patient-row');
  
  // Modal Elements
  const viewPatientModal = document.getElementById('viewPatientModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalPatientName = document.getElementById('modalPatientName');
  const modalPatientPhone = document.getElementById('modalPatientPhone');
  const modalPatientEmail = document.getElementById('modalPatientEmail');
  const modalPatientAge = document.getElementById('modalPatientAge');
  const modalPatientGender = document.getElementById('modalPatientGender');
  const modalPatientPackage = document.getElementById('modalPatientPackage');
  const modalPatientAppointments = document.getElementById('modalPatientAppointments');

  // Pagination Elements
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const pageIndicator = document.getElementById('pageIndicator');
  const showingStart = document.getElementById('showingStart');
  const showingEnd = document.getElementById('showingEnd');
  const totalItems = document.getElementById('totalItems');

  let currentPage = 1;
  const totalPages = 4;
  const itemsPerPage = 5;
  const totalRecords = 20;

  // 1. Action Dropdown Menu Handler
  document.addEventListener('click', (e) => {
    const dotsBtn = e.target.closest('.action-dots-btn');
    const allDropdowns = document.querySelectorAll('.action-dropdown');
    const allDotsBtns = document.querySelectorAll('.action-dots-btn');

    if (dotsBtn) {
      e.stopPropagation();
      const parentContainer = dotsBtn.closest('.action-menu-container');
      const dropdown = parentContainer.querySelector('.action-dropdown');
      const isOpen = dropdown.classList.contains('open');

      // Close all other dropdowns
      allDropdowns.forEach(d => d.classList.remove('open'));
      allDotsBtns.forEach(b => b.classList.remove('active'));

      if (!isOpen) {
        dropdown.classList.add('open');
        dotsBtn.classList.add('active');
      }
    } else {
      // Clicked outside dropdown
      if (!e.target.closest('.action-dropdown')) {
        allDropdowns.forEach(d => d.classList.remove('open'));
        allDotsBtns.forEach(b => b.classList.remove('active'));
      }
    }
  });

  // 2. View Modal Open & Populate Handler
  document.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('.view-btn');
    if (viewBtn) {
      e.preventDefault();
      const row = viewBtn.closest('.patient-row');
      if (row) {
        // Read data attributes
        const name = row.getAttribute('data-name') || 'Rahul Sharma';
        const phone = row.getAttribute('data-phone') || '9876543210';
        const email = row.getAttribute('data-email') || 'rahulsharma@gmail.com';
        const age = row.getAttribute('data-age') || '34';
        const gender = row.getAttribute('data-gender') || 'Male';
        const pkg = row.getAttribute('data-package') || 'Stress Management';
        const appointments = row.getAttribute('data-appointments') || '18';

        // Populate Modal Fields
        if (modalPatientName) modalPatientName.textContent = name;
        if (modalPatientPhone) modalPatientPhone.textContent = phone;
        if (modalPatientEmail) modalPatientEmail.textContent = email;
        if (modalPatientAge) modalPatientAge.textContent = age;
        if (modalPatientGender) modalPatientGender.textContent = gender;
        if (modalPatientPackage) modalPatientPackage.textContent = pkg;
        if (modalPatientAppointments) modalPatientAppointments.textContent = appointments;

        // Open Modal
        openModal();
      }

      // Close open dropdowns
      document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('open'));
      document.querySelectorAll('.action-dots-btn').forEach(b => b.classList.remove('active'));
    }
  });

  // Modal Open/Close Functions
  function openModal() {
    if (viewPatientModal) {
      viewPatientModal.classList.add('open');
      viewPatientModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (viewPatientModal) {
      viewPatientModal.classList.remove('open');
      viewPatientModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  if (viewPatientModal) {
    viewPatientModal.addEventListener('click', (e) => {
      if (e.target === viewPatientModal) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && viewPatientModal && viewPatientModal.classList.contains('open')) {
      closeModal();
    }
  });

  // 3. Remove Patient Row Handler
  document.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.remove-btn');
    if (removeBtn) {
      e.preventDefault();
      const row = removeBtn.closest('.patient-row');
      const patientName = row.getAttribute('data-name') || 'this patient';

      if (confirm(`Are you sure you want to remove ${patientName}?`)) {
        row.style.transition = 'all 0.3s ease';
        row.style.opacity = '0';
        row.style.transform = 'scale(0.95)';
        setTimeout(() => {
          row.remove();
          updateShowingCount();
        }, 300);
      }

      // Close dropdown
      document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('open'));
      document.querySelectorAll('.action-dots-btn').forEach(b => b.classList.remove('active'));
    }
  });

  // 4. Live Search Filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const rows = document.querySelectorAll('.patient-row');
      let visibleCount = 0;

      if (clearSearchBtn) {
        if (query.length > 0) {
          clearSearchBtn.classList.add('active');
        } else {
          clearSearchBtn.classList.remove('active');
        }
      }

      rows.forEach(row => {
        const name = (row.getAttribute('data-name') || '').toLowerCase();
        const id = (row.getAttribute('data-id') || '').toLowerCase();
        const pkg = (row.getAttribute('data-package') || '').toLowerCase();

        if (name.includes(query) || id.includes(query) || pkg.includes(query)) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });

      // Handle empty search result state
      let noResultRow = document.getElementById('noResultRow');
      if (visibleCount === 0) {
        if (!noResultRow && patientsTableBody) {
          noResultRow = document.createElement('tr');
          noResultRow.id = 'noResultRow';
          noResultRow.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 36px 16px; color: var(--text-muted); font-weight: 500;">
              No matching patient records found for "${query}"
            </td>
          `;
          patientsTableBody.appendChild(noResultRow);
        }
      } else if (noResultRow) {
        noResultRow.remove();
      }

      updateShowingCount(visibleCount);
    });

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.classList.remove('active');
        searchInput.dispatchEvent(new Event('input'));
        searchInput.focus();
      });
    }
  }

  // 5. Filter Slide-Over Drawer & Accordions
  const filterDrawer = document.getElementById('filterDrawer');
  const filterDrawerBackdrop = document.getElementById('filterDrawerBackdrop');
  const closeFilterDrawerBtn = document.getElementById('closeFilterDrawerBtn');
  const resetFilterBtn = document.getElementById('resetFilterBtn');

  // Accordion Toggle Buttons
  const packageAccordionBtn = document.getElementById('packageAccordionBtn');
  const statusAccordionBtn = document.getElementById('statusAccordionBtn');
  const packageAccordion = document.getElementById('packageAccordion');
  const statusAccordion = document.getElementById('statusAccordion');

  const packageCheckboxes = document.querySelectorAll('input[name="packageFilter"]');
  const statusCheckboxes = document.querySelectorAll('input[name="statusFilter"]');

  function openFilterDrawer() {
    if (filterDrawer && filterDrawerBackdrop) {
      filterDrawer.classList.add('open');
      filterDrawerBackdrop.classList.add('open');
      filterDrawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeFilterDrawer() {
    if (filterDrawer && filterDrawerBackdrop) {
      filterDrawer.classList.remove('open');
      filterDrawerBackdrop.classList.remove('open');
      filterDrawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (filterBtn) {
    filterBtn.addEventListener('click', openFilterDrawer);
  }

  if (closeFilterDrawerBtn) {
    closeFilterDrawerBtn.addEventListener('click', closeFilterDrawer);
  }

  if (filterDrawerBackdrop) {
    filterDrawerBackdrop.addEventListener('click', closeFilterDrawer);
  }

  // Accordion Toggles
  if (packageAccordionBtn && packageAccordion) {
    packageAccordionBtn.addEventListener('click', () => {
      const isOpen = packageAccordion.classList.contains('open');
      packageAccordion.classList.toggle('open');
      packageAccordionBtn.setAttribute('aria-expanded', !isOpen);
    });
  }

  if (statusAccordionBtn && statusAccordion) {
    statusAccordionBtn.addEventListener('click', () => {
      const isOpen = statusAccordion.classList.contains('open');
      statusAccordion.classList.toggle('open');
      statusAccordionBtn.setAttribute('aria-expanded', !isOpen);
    });
  }

  // Apply Filter based on selected checkboxes
  function applyFilters() {
    const selectedPackages = Array.from(packageCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value.toLowerCase());

    const selectedStatuses = Array.from(statusCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value.toLowerCase());

    const rows = document.querySelectorAll('.patient-row');
    let visibleCount = 0;

    rows.forEach(row => {
      const rowPkg = (row.getAttribute('data-package') || '').toLowerCase();
      const rowStatus = (row.getAttribute('data-status') || '').toLowerCase();

      const matchesPackage = selectedPackages.length === 0 || 
        selectedPackages.some(pkg => rowPkg.includes(pkg) || pkg.includes(rowPkg));

      const matchesStatus = selectedStatuses.length === 0 || 
        selectedStatuses.includes(rowStatus);

      if (matchesPackage && matchesStatus) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    // Check empty results
    let noResultRow = document.getElementById('noResultRow');
    if (visibleCount === 0) {
      if (!noResultRow && patientsTableBody) {
        noResultRow = document.createElement('tr');
        noResultRow.id = 'noResultRow';
        noResultRow.innerHTML = `
          <td colspan="5" style="text-align: center; padding: 36px 16px; color: var(--text-muted); font-weight: 500;">
            No patient records match the selected filters.
          </td>
        `;
        patientsTableBody.appendChild(noResultRow);
      }
    } else if (noResultRow) {
      noResultRow.remove();
    }

    updateShowingCount(visibleCount);
  }

  packageCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));
  statusCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));

  // Reset Filter Button
  if (resetFilterBtn) {
    resetFilterBtn.addEventListener('click', () => {
      packageCheckboxes.forEach(cb => (cb.checked = false));
      statusCheckboxes.forEach(cb => (cb.checked = false));
      applyFilters();
    });
  }

  // Close filter drawer on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (filterDrawer && filterDrawer.classList.contains('open')) {
        closeFilterDrawer();
      }
    }
  });

  // 6. Pagination Handlers
  if (prevPageBtn && nextPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        updatePagination();
      }
    });

    nextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        updatePagination();
      }
    });
  }

  function updatePagination() {
    if (pageIndicator) pageIndicator.textContent = `${currentPage} of ${totalPages}`;
    if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;

    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalRecords);
    if (showingStart) showingStart.textContent = start;
    if (showingEnd) showingEnd.textContent = end;
    if (totalItems) totalItems.textContent = totalRecords;
  }

  function updateShowingCount(customCount) {
    const remainingRows = document.querySelectorAll('.patient-row:not([style*="display: none"])').length;
    const count = customCount !== undefined ? customCount : remainingRows;
    if (showingEnd) showingEnd.textContent = count;
  }
});
