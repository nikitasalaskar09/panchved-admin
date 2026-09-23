/**
 * Panchved Admin - Packages Management JavaScript
 * Handles:
 * - View transitions (List View <-> Add Package View <-> Edit Package View)
 * - 3-dots Action Dropdown with Edit, View, and Status Toggle (Activate/Deactivate)
 * - Tabbed View Package Details Modal Dialog
 * - Add Package & Edit Package Form handling with live table updates
 * - Live search filter & pagination
 * - Drag-and-drop file upload previews
 * - Interactive toast alerts
 */

document.addEventListener('DOMContentLoaded', () => {
  // Views
  const packagesListView = document.getElementById('packagesListView');
  const addPackageView = document.getElementById('addPackageView');
  const editPackageView = document.getElementById('editPackageView');

  // Navigation Buttons
  const openAddPackageBtn = document.getElementById('openAddPackageBtn');
  const backFromAddBtn = document.getElementById('backFromAddBtn');
  const backFromEditBtn = document.getElementById('backFromEditBtn');

  // Search & Table Elements
  const packageSearchInput = document.getElementById('packageSearchInput');
  const clearPackageSearchBtn = document.getElementById('clearPackageSearchBtn');
  const packagesTableBody = document.getElementById('packagesTableBody');

  // Stat Counters
  const statTotalPackages = document.getElementById('statTotalPackages');
  const statActivePackages = document.getElementById('statActivePackages');

  // Pagination Elements
  const pkgShowingStart = document.getElementById('pkgShowingStart');
  const pkgShowingEnd = document.getElementById('pkgShowingEnd');
  const pkgTotalItems = document.getElementById('pkgTotalItems');
  const pkgPageIndicator = document.getElementById('pkgPageIndicator');
  const pkgPrevPageBtn = document.getElementById('pkgPrevPageBtn');
  const pkgNextPageBtn = document.getElementById('pkgNextPageBtn');

  // Modal Elements
  const viewPackageModal = document.getElementById('viewPackageModal');
  const closeViewPackageModalBtn = document.getElementById('closeViewPackageModalBtn');
  const tabBtns = document.querySelectorAll('.pkg-tab-btn');
  const tabPanes = document.querySelectorAll('.pkg-tab-pane');

  // Forms
  const addPackageForm = document.getElementById('addPackageForm');
  const editPackageForm = document.getElementById('editPackageForm');

  // Active state
  let currentTargetRow = null;
  let currentPage = 1;
  const totalPages = 4;

  // --------------------------------------------------------------------------
  // Helper: Toast Notifications
  // --------------------------------------------------------------------------
  function showToast(message) {
    let toast = document.querySelector('.toast-alert');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-alert';
      toast.innerHTML = `
        <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span class="toast-message"></span>
      `;
      document.body.appendChild(toast);
    }
    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // --------------------------------------------------------------------------
  // View Switching Functions
  // --------------------------------------------------------------------------
  function switchView(targetView) {
    [packagesListView, addPackageView, editPackageView].forEach(view => {
      if (view) {
        view.classList.remove('active');
        view.style.display = 'none';
      }
    });

    if (targetView) {
      targetView.style.display = 'block';
      setTimeout(() => {
        targetView.classList.add('active');
      }, 10);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (openAddPackageBtn) {
    openAddPackageBtn.addEventListener('click', () => {
      if (addPackageForm) addPackageForm.reset();
      const filenameSpan = document.getElementById('addSelectedFileName');
      if (filenameSpan) filenameSpan.textContent = '';
      switchView(addPackageView);
    });
  }

  if (backFromAddBtn) {
    backFromAddBtn.addEventListener('click', () => switchView(packagesListView));
  }

  if (backFromEditBtn) {
    backFromEditBtn.addEventListener('click', () => switchView(packagesListView));
  }

  // --------------------------------------------------------------------------
  // Action Dropdown Management
  // --------------------------------------------------------------------------
  function closeAllDropdowns() {
    document.querySelectorAll('.pkg-dropdown.open').forEach(dropdown => {
      dropdown.classList.remove('open');
    });
    document.querySelectorAll('.action-dots-btn.active').forEach(btn => {
      btn.classList.remove('active');
    });
  }

  document.addEventListener('click', (e) => {
    const dotsBtn = e.target.closest('.action-dots-btn');
    if (dotsBtn) {
      e.stopPropagation();
      const container = dotsBtn.closest('.action-menu-container');
      const dropdown = container.querySelector('.pkg-dropdown');
      const isOpen = dropdown.classList.contains('open');

      closeAllDropdowns();

      if (!isOpen) {
        dropdown.classList.add('open');
        dotsBtn.classList.add('active');
      }
      return;
    }

    if (!e.target.closest('.action-dropdown')) {
      closeAllDropdowns();
    }
  });

  // --------------------------------------------------------------------------
  // Edit Package Action
  // --------------------------------------------------------------------------
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-pkg-btn');
    if (editBtn) {
      const row = editBtn.closest('.package-row');
      if (row) {
        currentTargetRow = row;
        
        // Prefill Edit Form with row data
        document.getElementById('editPkgName').value = row.getAttribute('data-name') || '';
        document.getElementById('editPkgCategory').value = row.getAttribute('data-category') || '';
        document.getElementById('editPkgPrice').value = row.getAttribute('data-price') ? `₹${row.getAttribute('data-price').replace('₹','')}` : '';
        document.getElementById('editPkgDuration').value = row.getAttribute('data-duration') || '';
        document.getElementById('editPkgShortDesc').value = row.getAttribute('data-short-desc') || '';
        document.getElementById('editPkgOverview').value = row.getAttribute('data-overview') || '';
        document.getElementById('editPkgBenefits').value = row.getAttribute('data-benefits') || '';
        document.getElementById('editPkgIncluded').value = row.getAttribute('data-included') || '';
        document.getElementById('editDietHydration').value = row.getAttribute('data-diet') || '';
        document.getElementById('editYogaPhysio').value = row.getAttribute('data-yoga') || '';
        document.getElementById('editAyurvedaDinacharya').value = row.getAttribute('data-ayurveda') || '';
        document.getElementById('editDailyActivity').value = row.getAttribute('data-activity') || '';
        document.getElementById('editPatientMonitoring').value = row.getAttribute('data-monitoring') || '';
        document.getElementById('editFollowupReview').value = row.getAttribute('data-followup') || '';

        closeAllDropdowns();
        switchView(editPackageView);
      }
    }
  });

  // --------------------------------------------------------------------------
  // Toggle Status (Activate / Deactivate) Action
  // --------------------------------------------------------------------------
  document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.toggle-status-btn');
    if (toggleBtn) {
      const row = toggleBtn.closest('.package-row');
      if (row) {
        const currentStatus = row.getAttribute('data-status') || 'Active';
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        const statusBadge = row.querySelector('.pkg-status');
        const toggleText = toggleBtn.querySelector('.toggle-status-text');

        row.setAttribute('data-status', newStatus);

        if (statusBadge) {
          statusBadge.textContent = newStatus;
          statusBadge.className = `status-badge pkg-status status-${newStatus.toLowerCase()}`;
        }

        if (toggleText) {
          toggleText.textContent = newStatus === 'Active' ? 'Deactivate' : 'Activate';
        }

        // Update active package counter
        updateActiveCount();
        closeAllDropdowns();
        showToast(`Package marked as ${newStatus}`);
      }
    }
  });

  function updateActiveCount() {
    if (!statActivePackages || !packagesTableBody) return;
    const activeRows = packagesTableBody.querySelectorAll('.package-row[data-status="Active"]').length;
    statActivePackages.textContent = activeRows;
  }

  // --------------------------------------------------------------------------
  // View Package Details Modal Dialog (Screen 5)
  // --------------------------------------------------------------------------
  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (closeViewPackageModalBtn) {
    closeViewPackageModalBtn.addEventListener('click', () => closeModal(viewPackageModal));
  }

  if (viewPackageModal) {
    viewPackageModal.addEventListener('click', (e) => {
      if (e.target === viewPackageModal) closeModal(viewPackageModal);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      closeModal(viewPackageModal);
    }
  });

  // Modal Tab Switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetControl = btn.getAttribute('aria-controls');

      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const targetPane = document.getElementById(targetControl);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  document.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('.view-pkg-btn');
    if (viewBtn) {
      const row = viewBtn.closest('.package-row');
      if (row) {
        // Reset to Tab 1
        tabBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        tabPanes.forEach(p => p.classList.remove('active'));
        if (tabBtns[0]) {
          tabBtns[0].classList.add('active');
          tabBtns[0].setAttribute('aria-selected', 'true');
        }
        if (tabPanes[0]) tabPanes[0].classList.add('active');

        // Populate Modal Fields
        document.getElementById('viewModalPkgName').textContent = row.getAttribute('data-name') || '';
        document.getElementById('viewModalPkgCategory').textContent = row.getAttribute('data-category') || '';
        document.getElementById('viewModalPkgPrice').textContent = row.getAttribute('data-price') ? `₹${row.getAttribute('data-price').replace('₹','')}` : '';
        document.getElementById('viewModalPkgDuration').textContent = row.getAttribute('data-duration') || '';
        document.getElementById('viewModalPkgShortDesc').textContent = row.getAttribute('data-short-desc') || '';
        
        const imgElem = document.getElementById('viewModalPkgImage');
        if (imgElem && row.getAttribute('data-image')) {
          imgElem.src = row.getAttribute('data-image');
        }

        document.getElementById('viewModalPkgOverview').textContent = row.getAttribute('data-overview') || '';
        document.getElementById('viewModalPkgBenefits').textContent = row.getAttribute('data-benefits') || '';
        document.getElementById('viewModalPkgIncluded').textContent = row.getAttribute('data-included') || '';
        document.getElementById('viewModalDiet').textContent = row.getAttribute('data-diet') || '';
        document.getElementById('viewModalYoga').textContent = row.getAttribute('data-yoga') || '';
        document.getElementById('viewModalAyurveda').textContent = row.getAttribute('data-ayurveda') || '';
        document.getElementById('viewModalActivity').textContent = row.getAttribute('data-activity') || '';
        document.getElementById('viewModalMonitoring').textContent = row.getAttribute('data-monitoring') || '';
        document.getElementById('viewModalFollowup').textContent = row.getAttribute('data-followup') || '';

        closeAllDropdowns();
        openModal(viewPackageModal);
      }
    }
  });

  // --------------------------------------------------------------------------
  // Form Submissions
  // --------------------------------------------------------------------------
  if (addPackageForm) {
    addPackageForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('addPkgName').value.trim();
      const category = document.getElementById('addPkgCategory').value.trim();
      const price = document.getElementById('addPkgPrice').value.trim().replace('₹', '');
      const duration = document.getElementById('addPkgDuration').value.trim();
      const shortDesc = document.getElementById('addPkgShortDesc').value.trim();
      const overview = document.getElementById('addPkgOverview').value.trim();
      const benefits = document.getElementById('addPkgBenefits').value.trim();
      const included = document.getElementById('addPkgIncluded').value.trim();
      const diet = document.getElementById('addDietHydration').value.trim();
      const yoga = document.getElementById('addYogaPhysio').value.trim();
      const ayurveda = document.getElementById('addAyurvedaDinacharya').value.trim();
      const activity = document.getElementById('addDailyActivity').value.trim();
      const monitoring = document.getElementById('addPatientMonitoring').value.trim();
      const followup = document.getElementById('addFollowupReview').value.trim();

      const newRow = document.createElement('tr');
      newRow.className = 'package-row';
      newRow.setAttribute('data-id', `PKG-${Date.now().toString().slice(-3)}`);
      newRow.setAttribute('data-name', name);
      newRow.setAttribute('data-category', category);
      newRow.setAttribute('data-price', price);
      newRow.setAttribute('data-duration', duration);
      newRow.setAttribute('data-enrollments', '0');
      newRow.setAttribute('data-protocol', 'Added');
      newRow.setAttribute('data-status', 'Active');
      newRow.setAttribute('data-short-desc', shortDesc || 'Ayurvedic wellness package');
      newRow.setAttribute('data-image', 'assets/package-thumb.jpg');
      newRow.setAttribute('data-overview', overview || shortDesc);
      newRow.setAttribute('data-benefits', benefits || 'Enhanced wellness and vitality');
      newRow.setAttribute('data-included', included || 'Diet plan, daily consultations');
      newRow.setAttribute('data-diet', diet || 'Herbal tea and sattvic diet');
      newRow.setAttribute('data-yoga', yoga || 'Daily morning asanas');
      newRow.setAttribute('data-ayurveda', ayurveda || 'Dinacharya regimen');
      newRow.setAttribute('data-activity', activity || 'Gentle walking');
      newRow.setAttribute('data-monitoring', monitoring || 'Weekly pulse check');
      newRow.setAttribute('data-followup', followup || 'Bi-weekly doctor consultation');

      newRow.innerHTML = `
        <td class="td-pkg-name font-bold pkg-name-cell">${name}</td>
        <td class="td-duration text-muted-dark pkg-duration-cell">${duration}</td>
        <td class="td-price text-muted-dark pkg-price-cell">₹${price}</td>
        <td class="td-enrollments text-muted-dark pkg-enrollments-cell">0</td>
        <td class="td-protocol">
          <span class="status-badge pkg-protocol status-protocol-added">Added</span>
        </td>
        <td class="td-status">
          <span class="status-badge pkg-status status-active">Active</span>
        </td>
        <td class="td-action text-right">
          <div class="action-menu-container">
            <button type="button" class="action-dots-btn" aria-label="Actions for ${name}">
              <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>
            </button>
            <div class="action-dropdown pkg-dropdown" role="menu">
              <button type="button" class="dropdown-item edit-pkg-btn" role="menuitem">
                <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                <span>Edit</span>
              </button>
              <button type="button" class="dropdown-item view-pkg-btn" role="menuitem">
                <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <span>View</span>
              </button>
              <button type="button" class="dropdown-item toggle-status-btn" role="menuitem">
                <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                <span class="toggle-status-text">Deactivate</span>
              </button>
            </div>
          </div>
        </td>
      `;

      if (packagesTableBody) {
        packagesTableBody.insertBefore(newRow, packagesTableBody.firstChild);
      }

      if (statTotalPackages) {
        statTotalPackages.textContent = (parseInt(statTotalPackages.textContent) || 12) + 1;
      }
      updateActiveCount();

      switchView(packagesListView);
      showToast(`Package "${name}" added successfully!`);
    });
  }

  if (editPackageForm) {
    editPackageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentTargetRow) return;

      const name = document.getElementById('editPkgName').value.trim();
      const category = document.getElementById('editPkgCategory').value.trim();
      const price = document.getElementById('editPkgPrice').value.trim().replace('₹', '');
      const duration = document.getElementById('editPkgDuration').value.trim();
      const shortDesc = document.getElementById('editPkgShortDesc').value.trim();
      const overview = document.getElementById('editPkgOverview').value.trim();
      const benefits = document.getElementById('editPkgBenefits').value.trim();
      const included = document.getElementById('editPkgIncluded').value.trim();
      const diet = document.getElementById('editDietHydration').value.trim();
      const yoga = document.getElementById('editYogaPhysio').value.trim();
      const ayurveda = document.getElementById('editAyurvedaDinacharya').value.trim();
      const activity = document.getElementById('editDailyActivity').value.trim();
      const monitoring = document.getElementById('editPatientMonitoring').value.trim();
      const followup = document.getElementById('editFollowupReview').value.trim();

      // Update row data attributes
      currentTargetRow.setAttribute('data-name', name);
      currentTargetRow.setAttribute('data-category', category);
      currentTargetRow.setAttribute('data-price', price);
      currentTargetRow.setAttribute('data-duration', duration);
      currentTargetRow.setAttribute('data-short-desc', shortDesc);
      currentTargetRow.setAttribute('data-overview', overview);
      currentTargetRow.setAttribute('data-benefits', benefits);
      currentTargetRow.setAttribute('data-included', included);
      currentTargetRow.setAttribute('data-diet', diet);
      currentTargetRow.setAttribute('data-yoga', yoga);
      currentTargetRow.setAttribute('data-ayurveda', ayurveda);
      currentTargetRow.setAttribute('data-activity', activity);
      currentTargetRow.setAttribute('data-monitoring', monitoring);
      currentTargetRow.setAttribute('data-followup', followup);

      // Update visible cells
      const nameCell = currentTargetRow.querySelector('.pkg-name-cell');
      const durationCell = currentTargetRow.querySelector('.pkg-duration-cell');
      const priceCell = currentTargetRow.querySelector('.pkg-price-cell');

      if (nameCell) nameCell.textContent = name;
      if (durationCell) durationCell.textContent = duration;
      if (priceCell) priceCell.textContent = `₹${price}`;

      [nameCell, durationCell, priceCell].forEach(c => {
        if (c) {
          c.style.backgroundColor = '#FEF08A';
          setTimeout(() => { c.style.backgroundColor = ''; }, 1000);
        }
      });

      switchView(packagesListView);
      showToast(`Package "${name}" updated successfully!`);
    });
  }

  // --------------------------------------------------------------------------
  // Drag & Drop File Upload Handlers
  // --------------------------------------------------------------------------
  ['add', 'edit'].forEach(prefix => {
    const dropzone = document.getElementById(`${prefix}DropzoneBox`);
    const fileInput = document.getElementById(`${prefix}PkgImageInput`);
    const filenameSpan = document.getElementById(`${prefix}SelectedFileName`);
    const browseBtn = document.getElementById(`${prefix}BrowseFileBtn`);

    if (browseBtn && fileInput) {
      browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    if (dropzone && fileInput) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
          fileInput.files = e.dataTransfer.files;
          if (filenameSpan) filenameSpan.textContent = e.dataTransfer.files[0].name;
        }
      });

      fileInput.addEventListener('change', () => {
        if (fileInput.files.length && filenameSpan) {
          filenameSpan.textContent = fileInput.files[0].name;
        }
      });
    }
  });

  // --------------------------------------------------------------------------
  // Live Search Filter
  // --------------------------------------------------------------------------
  function filterPackages() {
    const query = packageSearchInput ? packageSearchInput.value.trim().toLowerCase() : '';
    const rows = Array.from(packagesTableBody ? packagesTableBody.querySelectorAll('.package-row') : []);

    if (clearPackageSearchBtn) {
      clearPackageSearchBtn.classList.toggle('active', query.length > 0);
    }

    let matchCount = 0;
    rows.forEach(row => {
      const name = (row.getAttribute('data-name') || '').toLowerCase();
      const category = (row.getAttribute('data-category') || '').toLowerCase();
      const duration = (row.getAttribute('data-duration') || '').toLowerCase();
      const price = (row.getAttribute('data-price') || '').toLowerCase();

      if (name.includes(query) || category.includes(query) || duration.includes(query) || price.includes(query)) {
        row.style.display = '';
        matchCount++;
      } else {
        row.style.display = 'none';
      }
    });

    if (pkgShowingEnd) pkgShowingEnd.textContent = query ? matchCount : '5';
    if (pkgShowingStart) pkgShowingStart.textContent = matchCount > 0 ? '1' : '0';
  }

  if (packageSearchInput) {
    packageSearchInput.addEventListener('input', filterPackages);
  }

  if (clearPackageSearchBtn) {
    clearPackageSearchBtn.addEventListener('click', () => {
      if (packageSearchInput) {
        packageSearchInput.value = '';
        filterPackages();
        packageSearchInput.focus();
      }
    });
  }

  // --------------------------------------------------------------------------
  // Pagination
  // --------------------------------------------------------------------------
  function updatePaginationUI() {
    if (pkgPageIndicator) pkgPageIndicator.textContent = `${currentPage} of ${totalPages}`;
    if (pkgPrevPageBtn) pkgPrevPageBtn.disabled = currentPage === 1;
    if (pkgNextPageBtn) pkgNextPageBtn.disabled = currentPage === totalPages;
    if (pkgShowingStart && pkgShowingEnd) {
      const start = (currentPage - 1) * 5 + 1;
      const end = Math.min(currentPage * 5, 20);
      pkgShowingStart.textContent = start;
      pkgShowingEnd.textContent = end;
    }
  }

  if (pkgPrevPageBtn) {
    pkgPrevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        updatePaginationUI();
      }
    });
  }

  if (pkgNextPageBtn) {
    pkgNextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        updatePaginationUI();
      }
    });
  }
});
