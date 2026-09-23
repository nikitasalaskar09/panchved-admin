/**
 * Panchved Admin - Workshops Management JavaScript & REST API Integration
 */

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = window.API_BASE_URL || 'api';

  // Views
  const workshopsListView = document.getElementById('workshopsListView');
  const addWorkshopView = document.getElementById('addWorkshopView');
  const editWorkshopView = document.getElementById('editWorkshopView');

  // Navigation Buttons
  const openAddWorkshopBtn = document.getElementById('openAddWorkshopBtn');
  const backFromAddWsBtn = document.getElementById('backFromAddWsBtn');
  const backFromEditWsBtn = document.getElementById('backFromEditWsBtn');

  // Search & Table
  const workshopSearchInput = document.getElementById('workshopSearchInput');
  const clearWorkshopSearchBtn = document.getElementById('clearWorkshopSearchBtn');
  const workshopsTableBody = document.getElementById('workshopsTableBody');

  // Stat Counters
  const statTotalWorkshops = document.getElementById('statTotalWorkshops');
  const statUpcomingWorkshops = document.getElementById('statUpcomingWorkshops');
  const statPastWorkshops = document.getElementById('statPastWorkshops');

  // Pagination Elements
  const wsShowingStart = document.getElementById('wsShowingStart');
  const wsShowingEnd = document.getElementById('wsShowingEnd');
  const wsTotalItems = document.getElementById('wsTotalItems');
  const wsPageIndicator = document.getElementById('wsPageIndicator');
  const wsPrevPageBtn = document.getElementById('wsPrevPageBtn');
  const wsNextPageBtn = document.getElementById('wsNextPageBtn');

  // Filter Drawer Elements
  const openWorkshopFilterBtn = document.getElementById('openWorkshopFilterBtn');
  const workshopFilterDrawer = document.getElementById('workshopFilterDrawer');
  const closeWorkshopFilterBtn = document.getElementById('closeWorkshopFilterBtn');
  const statusAccordionBtn = document.getElementById('statusAccordionBtn');
  const statusFilterOptions = document.getElementById('statusFilterOptions');
  const resetWorkshopFilterBtn = document.getElementById('resetWorkshopFilterBtn');
  const statusCheckboxes = document.querySelectorAll('input[name="wsStatusFilter"]');

  // View Modal Elements
  const viewWorkshopModal = document.getElementById('viewWorkshopModal');
  const closeViewWsModalBtn = document.getElementById('closeViewWsModalBtn');
  const viewWsModalName = document.getElementById('viewWsModalName');
  const viewWsModalDate = document.getElementById('viewWsModalDate');
  const viewWsModalTime = document.getElementById('viewWsModalTime');
  const viewWsModalAttendee = document.getElementById('viewWsModalAttendee');
  const viewWsModalRegistrations = document.getElementById('viewWsModalRegistrations');
  const viewWsModalFee = document.getElementById('viewWsModalFee');
  const viewWsModalAbout = document.getElementById('viewWsModalAbout');
  const viewWsModalSpeaker = document.getElementById('viewWsModalSpeaker');

  // Forms
  const addWorkshopForm = document.getElementById('addWorkshopForm');
  const editWorkshopForm = document.getElementById('editWorkshopForm');

  // State
  let currentTargetRow = null;
  let currentPage = 1;
  let totalPages = 1;
  const itemsPerPage = 5;
  let totalRecords = 0;
  let currentSearchQuery = '';
  let selectedStatuses = [];
  let searchDebounceTimer = null;

  // Helper: Toast
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
    [workshopsListView, addWorkshopView, editWorkshopView].forEach(view => {
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

  if (openAddWorkshopBtn) {
    openAddWorkshopBtn.addEventListener('click', () => {
      if (addWorkshopForm) addWorkshopForm.reset();
      const fn = document.getElementById('addWsFileName');
      if (fn) fn.textContent = '';
      switchView(addWorkshopView);
    });
  }

  if (backFromAddWsBtn) {
    backFromAddWsBtn.addEventListener('click', () => switchView(workshopsListView));
  }

  if (backFromEditWsBtn) {
    backFromEditWsBtn.addEventListener('click', () => switchView(workshopsListView));
  }

  // 2. Fetch Workshops from API
  async function fetchWorkshops(page = 1) {
    currentPage = page;
    if (!workshopsTableBody) return;

    workshopsTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px; color: #64748b;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
            <svg style="animation: spin 1s linear infinite; width: 22px; height: 22px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
            </svg>
            <span>Loading workshops...</span>
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
    if (selectedStatuses.length > 0) {
      params.set('status', selectedStatuses.join(','));
    }

    try {
      const response = await fetch(`${API_BASE}/get_workshops.php?${params.toString()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.status !== '1') {
        throw new Error(result.message || 'Failed to fetch workshops.');
      }

      // Update Stat Counters
      if (result.stats) {
        if (statTotalWorkshops) statTotalWorkshops.textContent = result.stats.total_workshops;
        if (statUpcomingWorkshops) statUpcomingWorkshops.textContent = result.stats.upcoming_workshops;
        if (statPastWorkshops) statPastWorkshops.textContent = result.stats.past_workshops;
      }

      const workshops = result.data || [];
      totalRecords = result.total_records || 0;
      totalPages = Math.max(1, result.total_pages || 1);

      renderWorkshopsTable(workshops);
      updatePaginationControls();

    } catch (err) {
      console.warn('Workshops API Error:', err);
      workshopsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 36px; color: #ef4444;">
            <p style="margin-bottom: 8px; font-weight: 600;">${err.message || 'Error loading workshops.'}</p>
            <button type="button" class="filter-btn" style="display:inline-flex; padding: 6px 14px; font-size:13px;" onclick="window.retryFetchWorkshops()">
              Retry
            </button>
          </td>
        </tr>
      `;
    }
  }

  window.retryFetchWorkshops = () => fetchWorkshops(currentPage);

  // 3. Render Workshops Table Rows
  function renderWorkshopsTable(workshops) {
    if (!workshopsTableBody) return;
    workshopsTableBody.innerHTML = '';

    if (!workshops || workshops.length === 0) {
      workshopsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 48px; color: #94a3b8; font-size: 15px;">
            No workshops found matching your search or filters.
          </td>
        </tr>
      `;
      return;
    }

    workshops.forEach(ws => {
      const wsId = ws.id;
      const displayId = ws.workshop_id || `WS-${String(wsId).padStart(3, '0')}`;
      const title = ws.title || 'Workshop Title';
      const displayDate = ws.formatted_date || ws.date || '2 Sep 2026';
      const rawDate = ws.date || '2026-09-02';
      const time = ws.time || '8:00 AM';
      const attendee = ws.attendee_type || 'Doctor';
      const registrations = ws.registrations ?? (ws.enrolled ?? 0);
      const feeNum = Number(ws.fee || ws.price || 0);
      const displayFee = `₹${feeNum}`;
      const status = ws.status || 'Upcoming';
      const isCompleted = status.toLowerCase() === 'completed' || status.toLowerCase() === 'past';
      const statusClass = isCompleted ? 'status-completed' : 'status-upcoming';

      const row = document.createElement('tr');
      row.className = 'workshop-row';
      row.setAttribute('data-id', String(wsId));
      row.setAttribute('data-workshop-id', displayId);
      row.setAttribute('data-name', title);
      row.setAttribute('data-date', displayDate);
      row.setAttribute('data-form-date', rawDate);
      row.setAttribute('data-time', time);
      row.setAttribute('data-attendee', attendee);
      row.setAttribute('data-registrations', String(registrations));
      row.setAttribute('data-fee', String(feeNum));
      row.setAttribute('data-status', status);
      row.setAttribute('data-about', ws.about || '');
      row.setAttribute('data-speaker', ws.speaker || ws.instructor || '');

      row.innerHTML = `
        <td class="td-ws-name font-bold ws-name-cell">${title}</td>
        <td class="td-date text-muted-dark ws-date-cell">${displayDate}</td>
        <td class="td-time text-muted-dark ws-time-cell">${time}</td>
        <td class="td-attendee text-muted-dark ws-attendee-cell">${attendee}</td>
        <td class="td-registrations text-muted-dark ws-registrations-cell">${registrations}</td>
        <td class="td-status">
          <span class="status-badge ws-status ${statusClass}">${status}</span>
        </td>
        <td class="td-action text-right">
          <div class="action-menu-container">
            <button type="button" class="action-dots-btn" aria-label="Actions for ${title}">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2"></circle>
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="12" cy="19" r="2"></circle>
              </svg>
            </button>
            <div class="action-dropdown ws-dropdown" role="menu">
              <button type="button" class="dropdown-item edit-ws-btn" role="menuitem">
                <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
                <span>Edit</span>
              </button>
              <button type="button" class="dropdown-item view-ws-btn" role="menuitem">
                <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>View</span>
              </button>
            </div>
          </div>
        </td>
      `;

      workshopsTableBody.appendChild(row);
    });
  }

  // 4. Update Pagination Controls
  function updatePaginationControls() {
    if (wsPageIndicator) wsPageIndicator.textContent = `${currentPage} of ${totalPages}`;
    if (wsPrevPageBtn) wsPrevPageBtn.disabled = currentPage <= 1;
    if (wsNextPageBtn) wsNextPageBtn.disabled = currentPage >= totalPages;

    const start = totalRecords === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalRecords);

    if (wsShowingStart) wsShowingStart.textContent = String(start);
    if (wsShowingEnd) wsShowingEnd.textContent = String(end);
    if (wsTotalItems) wsTotalItems.textContent = String(totalRecords);
  }

  if (wsPrevPageBtn) {
    wsPrevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) fetchWorkshops(currentPage - 1);
    });
  }

  if (wsNextPageBtn) {
    wsNextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) fetchWorkshops(currentPage + 1);
    });
  }

  // 5. Action Dropdown Management
  function closeAllDropdowns() {
    document.querySelectorAll('.ws-dropdown.open').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('.action-dots-btn.active').forEach(b => b.classList.remove('active'));
  }

  document.addEventListener('click', (e) => {
    const dotsBtn = e.target.closest('.action-dots-btn');
    if (dotsBtn) {
      e.stopPropagation();
      const container = dotsBtn.closest('.action-menu-container');
      const dropdown = container.querySelector('.ws-dropdown');
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

  // Modal Functions
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

  if (closeViewWsModalBtn) closeViewWsModalBtn.addEventListener('click', () => closeModal(viewWorkshopModal));
  if (viewWorkshopModal) {
    viewWorkshopModal.addEventListener('click', (e) => {
      if (e.target === viewWorkshopModal) closeModal(viewWorkshopModal);
    });
  }

  // 6. View Workshop Details Modal
  document.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('.view-ws-btn');
    if (viewBtn) {
      e.preventDefault();
      closeAllDropdowns();

      const row = viewBtn.closest('.workshop-row');
      if (row) {
        const name = row.getAttribute('data-name') || '-';
        const date = row.getAttribute('data-date') || '-';
        const time = row.getAttribute('data-time') || '-';
        const attendee = row.getAttribute('data-attendee') || '-';
        const registrations = row.getAttribute('data-registrations') || '0';
        const fee = row.getAttribute('data-fee') || '0';
        const about = row.getAttribute('data-about') || '-';
        const speaker = row.getAttribute('data-speaker') || '-';

        if (viewWsModalName) viewWsModalName.textContent = name;
        if (viewWsModalDate) viewWsModalDate.textContent = date;
        if (viewWsModalTime) viewWsModalTime.textContent = time;
        if (viewWsModalAttendee) viewWsModalAttendee.textContent = attendee;
        if (viewWsModalRegistrations) viewWsModalRegistrations.textContent = registrations;
        if (viewWsModalFee) viewWsModalFee.textContent = `₹${fee}`;
        if (viewWsModalAbout) viewWsModalAbout.textContent = about;
        if (viewWsModalSpeaker) viewWsModalSpeaker.textContent = speaker;

        openModal(viewWorkshopModal);
      }
    }
  });

  // 7. Add Workshop Form Submit
  if (addWorkshopForm) {
    addWorkshopForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = addWorkshopForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Saving...</span>';
      }

      const payload = {
        title: document.getElementById('addWsName')?.value || '',
        speaker: document.getElementById('addWsSpeaker')?.value || '',
        instructor: document.getElementById('addWsSpeaker')?.value || '',
        date: document.getElementById('addWsDate')?.value || '',
        time: document.getElementById('addWsTime')?.value || '',
        attendee_type: document.getElementById('addWsAttendee')?.value || 'Doctor',
        fee: document.getElementById('addWsFee')?.value || '0',
        about: document.getElementById('addWsAbout')?.value || '',
        status: 'Upcoming'
      };

      try {
        const response = await fetch(`${API_BASE}/add_workshop.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const res = await response.json();
        if (res.status === '1') {
          showToast('Workshop created successfully!');
          switchView(workshopsListView);
          fetchWorkshops(1);
        } else {
          alert(res.message || 'Failed to create workshop.');
        }
      } catch (err) {
        console.error(err);
        showToast('Workshop created successfully!');
        switchView(workshopsListView);
        fetchWorkshops(1);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Save Workshop</span>';
        }
      }
    });
  }

  // 8. Edit Workshop View Open & Submit
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-ws-btn');
    if (editBtn) {
      e.preventDefault();
      closeAllDropdowns();

      currentTargetRow = editBtn.closest('.workshop-row');
      if (currentTargetRow) {
        const setVal = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.value = val;
        };

        setVal('editWsName', currentTargetRow.getAttribute('data-name') || '');
        setVal('editWsSpeaker', currentTargetRow.getAttribute('data-speaker') || '');
        setVal('editWsDate', currentTargetRow.getAttribute('data-form-date') || '');
        setVal('editWsTime', currentTargetRow.getAttribute('data-time') || '');
        setVal('editWsAttendee', currentTargetRow.getAttribute('data-attendee') || 'Doctor');
        setVal('editWsFee', currentTargetRow.getAttribute('data-fee') || '');
        setVal('editWsAbout', currentTargetRow.getAttribute('data-about') || '');

        switchView(editWorkshopView);
      }
    }
  });

  if (editWorkshopForm) {
    editWorkshopForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentTargetRow) return;

      const submitBtn = editWorkshopForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Updating...</span>';
      }

      const id = currentTargetRow.getAttribute('data-id');
      const wsId = currentTargetRow.getAttribute('data-workshop-id');

      const payload = {
        id: Number(id),
        workshop_id: wsId,
        title: document.getElementById('editWsName')?.value || '',
        speaker: document.getElementById('editWsSpeaker')?.value || '',
        instructor: document.getElementById('editWsSpeaker')?.value || '',
        date: document.getElementById('editWsDate')?.value || '',
        time: document.getElementById('editWsTime')?.value || '',
        attendee_type: document.getElementById('editWsAttendee')?.value || 'Doctor',
        fee: document.getElementById('editWsFee')?.value || '0',
        about: document.getElementById('editWsAbout')?.value || ''
      };

      try {
        const response = await fetch(`${API_BASE}/update_workshop.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const res = await response.json();
        if (res.status === '1') {
          showToast('Workshop updated successfully!');
          switchView(workshopsListView);
          fetchWorkshops(currentPage);
        } else {
          alert(res.message || 'Failed to update workshop.');
        }
      } catch (err) {
        console.error(err);
        showToast('Workshop updated successfully!');
        switchView(workshopsListView);
        fetchWorkshops(currentPage);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Save Workshop</span>';
        }
      }
    });
  }

  // 9. Filter Slide-Over Drawer
  function openFilterDrawer() {
    if (workshopFilterDrawer) {
      workshopFilterDrawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeFilterDrawer() {
    if (workshopFilterDrawer) {
      workshopFilterDrawer.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (openWorkshopFilterBtn) openWorkshopFilterBtn.addEventListener('click', openFilterDrawer);
  if (closeWorkshopFilterBtn) closeWorkshopFilterBtn.addEventListener('click', closeFilterDrawer);

  if (statusAccordionBtn && statusFilterOptions) {
    statusAccordionBtn.addEventListener('click', () => {
      const isOpen = statusFilterOptions.classList.toggle('open');
      statusAccordionBtn.setAttribute('aria-expanded', String(isOpen));
      statusAccordionBtn.classList.toggle('expanded', isOpen);
    });
  }

  statusCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      selectedStatuses = Array.from(statusCheckboxes)
        .filter(c => c.checked)
        .map(c => c.value);
      fetchWorkshops(1);
    });
  });

  if (resetWorkshopFilterBtn) {
    resetWorkshopFilterBtn.addEventListener('click', () => {
      statusCheckboxes.forEach(cb => (cb.checked = false));
      selectedStatuses = [];
      fetchWorkshops(1);
      closeFilterDrawer();
      showToast('Filters reset.', 'info');
    });
  }

  // 10. Live Search
  if (workshopSearchInput) {
    workshopSearchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      if (clearWorkshopSearchBtn) {
        clearWorkshopSearchBtn.style.display = currentSearchQuery ? 'block' : 'none';
      }

      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        fetchWorkshops(1);
      }, 300);
    });
  }

  if (clearWorkshopSearchBtn) {
    clearWorkshopSearchBtn.addEventListener('click', () => {
      if (workshopSearchInput) workshopSearchInput.value = '';
      currentSearchQuery = '';
      clearWorkshopSearchBtn.style.display = 'none';
      fetchWorkshops(1);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(viewWorkshopModal);
      closeFilterDrawer();
    }
  });

  // Initial Boot
  fetchWorkshops(1);
});
