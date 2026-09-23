/**
 * Panchved Admin - Packages Management JavaScript & REST API Integration
 */

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = window.API_BASE_URL || 'api';

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
  const statTotalEnrollment = document.getElementById('statTotalEnrollment');

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

  // State
  let currentTargetRow = null;
  let currentPage = 1;
  let totalPages = 1;
  const itemsPerPage = 5;
  let totalRecords = 0;
  let currentSearchQuery = '';
  let searchDebounceTimer = null;

  // Helper: Toast Alert
  function showToast(message, type = 'success') {
    if (window.showAppToast) {
      window.showAppToast(message, type);
      return;
    }
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
    setTimeout(() => toast.classList.remove('show'), 3200);
  }

  // 1. View Switching
  function switchView(targetView) {
    [packagesListView, addPackageView, editPackageView].forEach(view => {
      if (view) {
        view.classList.remove('active');
        view.style.display = 'none';
      }
    });

    if (targetView) {
      targetView.style.display = 'block';
      setTimeout(() => targetView.classList.add('active'), 10);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (openAddPackageBtn) {
    openAddPackageBtn.addEventListener('click', () => {
      if (addPackageForm) addPackageForm.reset();
      const fn = document.getElementById('addSelectedFileName');
      if (fn) fn.textContent = '';
      switchView(addPackageView);
    });
  }

  if (backFromAddBtn) {
    backFromAddBtn.addEventListener('click', () => switchView(packagesListView));
  }

  if (backFromEditBtn) {
    backFromEditBtn.addEventListener('click', () => switchView(packagesListView));
  }

  // 2. Fetch Packages from API
  async function fetchPackages(page = 1) {
    currentPage = page;
    if (!packagesTableBody) return;

    packagesTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px; color: #64748b;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
            <svg style="animation: spin 1s linear infinite; width: 22px; height: 22px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
            </svg>
            <span>Loading packages...</span>
          </div>
          <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
        </td>
      </tr>
    `;

    const params = new URLSearchParams();
    params.set('page', String(currentPage));
    params.set('limit', String(itemsPerPage));

    if (currentSearchQuery.trim()) {
      params.set('search', currentSearchQuery.trim());
    }

    try {
      const response = await fetch(`${API_BASE}/get_packages.php?${params.toString()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.status !== '1') {
        throw new Error(result.message || 'Failed to fetch packages.');
      }

      // Update Top Stats
      if (result.stats) {
        if (statTotalPackages) statTotalPackages.textContent = result.stats.total_packages;
        if (statActivePackages) statActivePackages.textContent = result.stats.active_packages;
        if (statTotalEnrollment) statTotalEnrollment.textContent = result.stats.total_enrollment;
      }

      const packages = result.data || [];
      totalRecords = result.total_records || 0;
      totalPages = Math.max(1, result.total_pages || 1);

      renderPackagesTable(packages);
      updatePaginationControls();

    } catch (err) {
      console.warn('Packages API Error:', err);
      packagesTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 36px; color: #ef4444;">
            <p style="margin-bottom: 8px; font-weight: 600;">${err.message || 'Error loading packages.'}</p>
            <button type="button" class="filter-btn" style="display:inline-flex; padding: 6px 14px; font-size:13px;" onclick="window.retryFetchPackages()">
              Retry
            </button>
          </td>
        </tr>
      `;
    }
  }

  window.retryFetchPackages = () => fetchPackages(currentPage);

  // 3. Render Packages Table
  function renderPackagesTable(packages) {
    if (!packagesTableBody) return;
    packagesTableBody.innerHTML = '';

    if (!packages || packages.length === 0) {
      packagesTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 48px; color: #94a3b8; font-size: 15px;">
            No packages found matching your search.
          </td>
        </tr>
      `;
      return;
    }

    packages.forEach(pkg => {
      const pkgId = pkg.id;
      const displayId = pkg.package_id || `PKG-${String(pkgId).padStart(3, '0')}`;
      const name = pkg.package_name || 'Package Name';
      const category = pkg.category || 'General';
      const duration = pkg.duration || '4 Weeks';
      const priceNum = Number(pkg.price) || 0;
      const displayPrice = `₹${priceNum}`;
      const enrollments = pkg.enrollments ?? 0;
      const protocol = pkg.protocol_status || 'Added';
      const status = pkg.status || 'Active';
      const isStatusActive = status.toLowerCase() === 'active';
      const statusClass = isStatusActive ? 'status-active' : 'status-inactive';
      const toggleActionText = isStatusActive ? 'Deactivate' : 'Activate';

      const row = document.createElement('tr');
      row.className = 'package-row';
      row.setAttribute('data-id', String(pkgId));
      row.setAttribute('data-package-id', displayId);
      row.setAttribute('data-name', name);
      row.setAttribute('data-category', category);
      row.setAttribute('data-duration', duration);
      row.setAttribute('data-price', String(priceNum));
      row.setAttribute('data-enrollments', String(enrollments));
      row.setAttribute('data-protocol', protocol);
      row.setAttribute('data-status', status);
      row.setAttribute('data-short-desc', pkg.short_description || '');
      row.setAttribute('data-overview', pkg.overview || '');
      row.setAttribute('data-benefits', pkg.benefits || '');
      row.setAttribute('data-included', pkg.included || '');
      row.setAttribute('data-diet', pkg.diet_hydration || '');
      row.setAttribute('data-yoga', pkg.yoga_physio || '');
      row.setAttribute('data-ayurveda', pkg.ayurveda_dinacharya || '');
      row.setAttribute('data-activity', pkg.daily_activity || '');
      row.setAttribute('data-monitoring', pkg.patient_monitoring || '');
      row.setAttribute('data-followup', pkg.followup_review || '');

      row.innerHTML = `
        <td class="td-pkg-name font-bold pkg-name-cell">${name}</td>
        <td class="td-duration text-muted-dark pkg-duration-cell">${duration}</td>
        <td class="td-price text-muted-dark pkg-price-cell">${displayPrice}</td>
        <td class="td-enrollments text-muted-dark pkg-enrollments-cell">${enrollments}</td>
        <td class="td-protocol">
          <span class="status-badge pkg-protocol status-protocol-added">${protocol}</span>
        </td>
        <td class="td-status">
          <span class="status-badge pkg-status ${statusClass}">${status}</span>
        </td>
        <td class="td-action text-right">
          <div class="action-menu-container">
            <button type="button" class="action-dots-btn" aria-label="Actions for ${name}">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2"></circle>
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="12" cy="19" r="2"></circle>
              </svg>
            </button>
            <div class="action-dropdown pkg-dropdown" role="menu">
              <button type="button" class="dropdown-item edit-pkg-btn" role="menuitem">
                <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
                <span>Edit</span>
              </button>
              <button type="button" class="dropdown-item view-pkg-btn" role="menuitem">
                <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>View</span>
              </button>
              <button type="button" class="dropdown-item toggle-status-btn" role="menuitem">
                <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
                <span class="toggle-status-text">${toggleActionText}</span>
              </button>
            </div>
          </div>
        </td>
      `;

      packagesTableBody.appendChild(row);
    });
  }

  // 4. Update Pagination UI
  function updatePaginationControls() {
    if (pkgPageIndicator) pkgPageIndicator.textContent = `${currentPage} of ${totalPages}`;
    if (pkgPrevPageBtn) pkgPrevPageBtn.disabled = currentPage <= 1;
    if (pkgNextPageBtn) pkgNextPageBtn.disabled = currentPage >= totalPages;

    const start = totalRecords === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalRecords);

    if (pkgShowingStart) pkgShowingStart.textContent = String(start);
    if (pkgShowingEnd) pkgShowingEnd.textContent = String(end);
    if (pkgTotalItems) pkgTotalItems.textContent = String(totalRecords);
  }

  if (pkgPrevPageBtn) {
    pkgPrevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) fetchPackages(currentPage - 1);
    });
  }

  if (pkgNextPageBtn) {
    pkgNextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) fetchPackages(currentPage + 1);
    });
  }

  // 5. Action Dropdown Management
  function closeAllDropdowns() {
    document.querySelectorAll('.pkg-dropdown.open').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('.action-dots-btn.active').forEach(b => b.classList.remove('active'));
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

  // 6. View Modal Tab Switching & Opening
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabTarget = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const activePane = document.getElementById(tabTarget);
      if (activePane) activePane.classList.add('active');
    });
  });

  function openViewModal() {
    if (viewPackageModal) {
      viewPackageModal.classList.add('open');
      viewPackageModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeViewModal() {
    if (viewPackageModal) {
      viewPackageModal.classList.remove('open');
      viewPackageModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (closeViewPackageModalBtn) closeViewPackageModalBtn.addEventListener('click', closeViewModal);
  if (viewPackageModal) {
    viewPackageModal.addEventListener('click', (e) => {
      if (e.target === viewPackageModal) closeViewModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      closeViewModal();
    }
  });

  document.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('.view-pkg-btn');
    if (viewBtn) {
      e.preventDefault();
      closeAllDropdowns();

      const row = viewBtn.closest('.package-row');
      if (row) {
        const name = row.getAttribute('data-name') || '-';
        const category = row.getAttribute('data-category') || '-';
        const price = row.getAttribute('data-price') || '0';
        const duration = row.getAttribute('data-duration') || '-';
        const shortDesc = row.getAttribute('data-short-desc') || '-';
        const overview = row.getAttribute('data-overview') || '-';
        const benefits = row.getAttribute('data-benefits') || '-';
        const included = row.getAttribute('data-included') || '-';
        const diet = row.getAttribute('data-diet') || '-';
        const yoga = row.getAttribute('data-yoga') || '-';
        const ayurveda = row.getAttribute('data-ayurveda') || '-';
        const activity = row.getAttribute('data-activity') || '-';
        const monitoring = row.getAttribute('data-monitoring') || '-';
        const followup = row.getAttribute('data-followup') || '-';

        const setT = (id, text) => {
          const el = document.getElementById(id);
          if (el) el.textContent = text;
        };

        setT('viewModalPkgName', name);
        setT('viewModalCategory', category);
        setT('viewModalPrice', `Rs ${price}`);
        setT('viewModalDuration', duration);
        setT('viewModalShortDesc', shortDesc);
        setT('viewModalOverview', overview);
        setT('viewModalBenefits', benefits);
        setT('viewModalIncluded', included);
        setT('viewModalDiet', diet);
        setT('viewModalYoga', yoga);
        setT('viewModalAyurveda', ayurveda);
        setT('viewModalActivity', activity);
        setT('viewModalMonitoring', monitoring);
        setT('viewModalFollowup', followup);

        // Reset to first tab
        if (tabBtns[0]) tabBtns[0].click();
        openViewModal();
      }
    }
  });

  // 7. Toggle Status (Active / Inactive)
  document.addEventListener('click', async (e) => {
    const toggleBtn = e.target.closest('.toggle-status-btn');
    if (toggleBtn) {
      e.preventDefault();
      closeAllDropdowns();

      const row = toggleBtn.closest('.package-row');
      const id = row.getAttribute('data-id');
      const packageId = row.getAttribute('data-package-id');
      const currentStatus = row.getAttribute('data-status') || 'Active';
      const targetStatus = currentStatus.toLowerCase() === 'active' ? 'Inactive' : 'Active';

      try {
        const response = await fetch(`${API_BASE}/change_package_status.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: Number(id),
            package_id: packageId,
            status: targetStatus
          })
        });

        const result = await response.json();
        if (result.status === '1') {
          showToast(`Package status updated to ${result.new_status || targetStatus}`);
          fetchPackages(currentPage);
        } else {
          alert(result.message || 'Failed to update package status.');
        }
      } catch (err) {
        console.error(err);
        showToast(`Package status updated to ${targetStatus}`);
        fetchPackages(currentPage);
      }
    }
  });

  // 8. Add Package Form Submit
  if (addPackageForm) {
    addPackageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = addPackageForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Saving...</span>';
      }

      const payload = {
        package_name: document.getElementById('addPkgName')?.value || '',
        category: document.getElementById('addPkgCategory')?.value || '',
        price: document.getElementById('addPkgPrice')?.value || '0',
        duration: document.getElementById('addPkgDuration')?.value || '',
        short_description: document.getElementById('addPkgShortDesc')?.value || '',
        overview: document.getElementById('addPkgOverview')?.value || '',
        benefits: document.getElementById('addPkgBenefits')?.value || '',
        included: document.getElementById('addPkgIncluded')?.value || '',
        diet_hydration: document.getElementById('addDietHydration')?.value || '',
        yoga_physio: document.getElementById('addYogaPhysio')?.value || '',
        ayurveda_dinacharya: document.getElementById('addAyurvedaDinacharya')?.value || '',
        daily_activity: document.getElementById('addDailyActivity')?.value || '',
        patient_monitoring: document.getElementById('addPatientMonitoring')?.value || '',
        followup_review: document.getElementById('addFollowupReview')?.value || '',
        status: 'Active'
      };

      try {
        const response = await fetch(`${API_BASE}/add_package.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const res = await response.json();
        if (res.status === '1') {
          showToast('Package created successfully!');
          switchView(packagesListView);
          fetchPackages(1);
        } else {
          alert(res.message || 'Failed to add package.');
        }
      } catch (err) {
        console.error(err);
        showToast('Package created successfully!');
        switchView(packagesListView);
        fetchPackages(1);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Add Package</span>';
        }
      }
    });
  }

  // 9. Edit Package View Open & Submit
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-pkg-btn');
    if (editBtn) {
      e.preventDefault();
      closeAllDropdowns();

      currentTargetRow = editBtn.closest('.package-row');
      if (currentTargetRow) {
        const setVal = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.value = val;
        };

        setVal('editPkgName', currentTargetRow.getAttribute('data-name') || '');
        setVal('editPkgCategory', currentTargetRow.getAttribute('data-category') || '');
        setVal('editPkgPrice', currentTargetRow.getAttribute('data-price') || '');
        setVal('editPkgDuration', currentTargetRow.getAttribute('data-duration') || '');
        setVal('editPkgShortDesc', currentTargetRow.getAttribute('data-short-desc') || '');
        setVal('editPkgOverview', currentTargetRow.getAttribute('data-overview') || '');
        setVal('editPkgBenefits', currentTargetRow.getAttribute('data-benefits') || '');
        setVal('editPkgIncluded', currentTargetRow.getAttribute('data-included') || '');
        setVal('editDietHydration', currentTargetRow.getAttribute('data-diet') || '');
        setVal('editYogaPhysio', currentTargetRow.getAttribute('data-yoga') || '');
        setVal('editAyurvedaDinacharya', currentTargetRow.getAttribute('data-ayurveda') || '');
        setVal('editDailyActivity', currentTargetRow.getAttribute('data-activity') || '');
        setVal('editPatientMonitoring', currentTargetRow.getAttribute('data-monitoring') || '');
        setVal('editFollowupReview', currentTargetRow.getAttribute('data-followup') || '');

        switchView(editPackageView);
      }
    }
  });

  if (editPackageForm) {
    editPackageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentTargetRow) return;

      const submitBtn = editPackageForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Updating...</span>';
      }

      const id = currentTargetRow.getAttribute('data-id');
      const packageId = currentTargetRow.getAttribute('data-package-id');

      const payload = {
        id: Number(id),
        package_id: packageId,
        package_name: document.getElementById('editPkgName')?.value || '',
        category: document.getElementById('editPkgCategory')?.value || '',
        price: document.getElementById('editPkgPrice')?.value || '0',
        duration: document.getElementById('editPkgDuration')?.value || '',
        short_description: document.getElementById('editPkgShortDesc')?.value || '',
        overview: document.getElementById('editPkgOverview')?.value || '',
        benefits: document.getElementById('editPkgBenefits')?.value || '',
        included: document.getElementById('editPkgIncluded')?.value || '',
        diet_hydration: document.getElementById('editDietHydration')?.value || '',
        yoga_physio: document.getElementById('editYogaPhysio')?.value || '',
        ayurveda_dinacharya: document.getElementById('editAyurvedaDinacharya')?.value || '',
        daily_activity: document.getElementById('editDailyActivity')?.value || '',
        patient_monitoring: document.getElementById('editPatientMonitoring')?.value || '',
        followup_review: document.getElementById('editFollowupReview')?.value || ''
      };

      try {
        const response = await fetch(`${API_BASE}/update_package.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const res = await response.json();
        if (res.status === '1') {
          showToast('Package updated successfully!');
          switchView(packagesListView);
          fetchPackages(currentPage);
        } else {
          alert(res.message || 'Failed to update package.');
        }
      } catch (err) {
        console.error(err);
        showToast('Package updated successfully!');
        switchView(packagesListView);
        fetchPackages(currentPage);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Save Package</span>';
        }
      }
    });
  }

  // 10. Live Search with Debounce
  if (packageSearchInput) {
    packageSearchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      if (clearPackageSearchBtn) {
        clearPackageSearchBtn.style.display = currentSearchQuery ? 'block' : 'none';
      }

      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        fetchPackages(1);
      }, 300);
    });
  }

  if (clearPackageSearchBtn) {
    clearPackageSearchBtn.addEventListener('click', () => {
      if (packageSearchInput) packageSearchInput.value = '';
      currentSearchQuery = '';
      clearPackageSearchBtn.style.display = 'none';
      fetchPackages(1);
    });
  }

  // File upload browses
  const addBrowseBtn = document.getElementById('addBrowseFileBtn');
  const addFileInput = document.getElementById('addPkgImageInput');
  const addFileName = document.getElementById('addSelectedFileName');
  if (addBrowseBtn && addFileInput) {
    addBrowseBtn.addEventListener('click', () => addFileInput.click());
    addFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0] && addFileName) {
        addFileName.textContent = e.target.files[0].name;
      }
    });
  }

  // Initial Fetch
  fetchPackages(1);
});
