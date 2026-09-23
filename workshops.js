/**
 * Panchved Admin - Workshops Management JavaScript
 * Handles:
 * - Multi-view transitions (List View <-> Add Workshop View <-> Edit Workshop View)
 * - 3-dots Action Dropdown (Edit, View)
 * - Slide-over Filter Drawer with accordion and Status checkboxes
 * - Add Workshop & Edit Workshop form submissions with dynamic table updates
 * - Live search filter & pagination
 * - Drag & drop file uploads
 * - View Workshop Details Modal Dialog
 */

document.addEventListener('DOMContentLoaded', () => {
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
  const viewWsModalStatus = document.getElementById('viewWsModalStatus');
  const viewWsModalAbout = document.getElementById('viewWsModalAbout');
  const viewWsModalSpeaker = document.getElementById('viewWsModalSpeaker');
  const viewWsModalImage = document.getElementById('viewWsModalImage');

  // Forms
  const addWorkshopForm = document.getElementById('addWorkshopForm');
  const editWorkshopForm = document.getElementById('editWorkshopForm');

  // State
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
  // View Switching
  // --------------------------------------------------------------------------
  function switchView(targetView) {
    [workshopsListView, addWorkshopView, editWorkshopView].forEach(view => {
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

  if (openAddWorkshopBtn) {
    openAddWorkshopBtn.addEventListener('click', () => {
      if (addWorkshopForm) addWorkshopForm.reset();
      const fnSpan = document.getElementById('addWsFileName');
      if (fnSpan) fnSpan.textContent = '';
      switchView(addWorkshopView);
    });
  }

  if (backFromAddWsBtn) {
    backFromAddWsBtn.addEventListener('click', () => switchView(workshopsListView));
  }

  if (backFromEditWsBtn) {
    backFromEditWsBtn.addEventListener('click', () => switchView(workshopsListView));
  }

  // --------------------------------------------------------------------------
  // Action Dropdown Management
  // --------------------------------------------------------------------------
  function closeAllDropdowns() {
    document.querySelectorAll('.ws-dropdown.open').forEach(dropdown => {
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

  // --------------------------------------------------------------------------
  // Edit Workshop Action
  // --------------------------------------------------------------------------
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-ws-btn');
    if (editBtn) {
      const row = editBtn.closest('.workshop-row');
      if (row) {
        currentTargetRow = row;

        document.getElementById('editWsName').value = row.getAttribute('data-name') || '';
        document.getElementById('editWsDate').value = row.getAttribute('data-date') || '02/09/2026';
        document.getElementById('editWsTime').value = row.getAttribute('data-time') || '08:00 AM';
        document.getElementById('editWsAttendee').value = row.getAttribute('data-attendee') || 'Doctor';
        document.getElementById('editWsFee').value = row.getAttribute('data-fee') ? `₹${row.getAttribute('data-fee').replace('₹','')}` : '₹500';
        document.getElementById('editWsAbout').value = row.getAttribute('data-about') || '';
        document.getElementById('editWsSpeaker').value = row.getAttribute('data-speaker') || '';

        closeAllDropdowns();
        switchView(editWorkshopView);
      }
    }
  });

  // --------------------------------------------------------------------------
  // View Workshop Modal Action
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

  if (closeViewWsModalBtn) {
    closeViewWsModalBtn.addEventListener('click', () => closeModal(viewWorkshopModal));
  }

  if (viewWorkshopModal) {
    viewWorkshopModal.addEventListener('click', (e) => {
      if (e.target === viewWorkshopModal) closeModal(viewWorkshopModal);
    });
  }

  document.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('.view-ws-btn');
    if (viewBtn) {
      const row = viewBtn.closest('.workshop-row');
      if (row) {
        if (viewWsModalName) viewWsModalName.textContent = row.getAttribute('data-name') || 'Ayurveda Wellness Workshop';
        if (viewWsModalDate) viewWsModalDate.textContent = row.getAttribute('data-date') || '2 Sep 2026';
        if (viewWsModalTime) viewWsModalTime.textContent = row.getAttribute('data-time') || '8:00 AM';
        if (viewWsModalAttendee) viewWsModalAttendee.textContent = row.getAttribute('data-attendee') || 'Doctor';
        if (viewWsModalRegistrations) viewWsModalRegistrations.textContent = row.getAttribute('data-registrations') || '24';
        if (viewWsModalFee) viewWsModalFee.textContent = row.getAttribute('data-fee') ? `₹${row.getAttribute('data-fee').replace('₹','')}` : '₹500';
        if (viewWsModalStatus) viewWsModalStatus.textContent = row.getAttribute('data-status') || 'Upcoming';
        if (viewWsModalAbout) viewWsModalAbout.textContent = row.getAttribute('data-about') || 'Lorem ipsum simple tx Lorem ipsumLorem ipsum simple tx Lorem ipsum';
        if (viewWsModalSpeaker) viewWsModalSpeaker.textContent = row.getAttribute('data-speaker') || 'Lorem ipsum simple tx Lorem ipsumLorem ipsum simple tx Lorem ipsum';

        closeAllDropdowns();
        openModal(viewWorkshopModal);
      }
    }
  });

  // --------------------------------------------------------------------------
  // Filter Drawer Management (Screen 5)
  // --------------------------------------------------------------------------
  function openFilterDrawer() {
    if (workshopFilterDrawer) {
      workshopFilterDrawer.classList.add('open');
      workshopFilterDrawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeFilterDrawer() {
    if (workshopFilterDrawer) {
      workshopFilterDrawer.classList.remove('open');
      workshopFilterDrawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (openWorkshopFilterBtn) {
    openWorkshopFilterBtn.addEventListener('click', openFilterDrawer);
  }

  if (closeWorkshopFilterBtn) {
    closeWorkshopFilterBtn.addEventListener('click', closeFilterDrawer);
  }

  if (workshopFilterDrawer) {
    workshopFilterDrawer.addEventListener('click', (e) => {
      if (e.target === workshopFilterDrawer) closeFilterDrawer();
    });
  }

  // Accordion toggle
  if (statusAccordionBtn && statusFilterOptions) {
    statusAccordionBtn.addEventListener('click', () => {
      const isExpanded = statusAccordionBtn.getAttribute('aria-expanded') === 'true';
      statusAccordionBtn.setAttribute('aria-expanded', !isExpanded);
      statusFilterOptions.classList.toggle('collapsed', isExpanded);
    });
  }

  // Filter checkboxes live application
  statusCheckboxes.forEach(cb => {
    cb.addEventListener('change', applyFiltersAndSearch);
  });

  if (resetWorkshopFilterBtn) {
    resetWorkshopFilterBtn.addEventListener('click', () => {
      statusCheckboxes.forEach(cb => cb.checked = false);
      applyFiltersAndSearch();
      closeFilterDrawer();
      showToast('Filters reset to default');
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      closeModal(viewWorkshopModal);
      closeFilterDrawer();
    }
  });

  // --------------------------------------------------------------------------
  // Form Submissions
  // --------------------------------------------------------------------------
  if (addWorkshopForm) {
    addWorkshopForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('addWsName').value.trim();
      const date = document.getElementById('addWsDate').value.trim();
      const time = document.getElementById('addWsTime').value.trim();
      const attendee = document.getElementById('addWsAttendee').value.trim();
      const fee = document.getElementById('addWsFee').value.trim().replace('₹', '');
      const about = document.getElementById('addWsAbout').value.trim();
      const speaker = document.getElementById('addWsSpeaker').value.trim();

      const newRow = document.createElement('tr');
      newRow.className = 'workshop-row';
      newRow.setAttribute('data-id', `WS-${Date.now().toString().slice(-3)}`);
      newRow.setAttribute('data-name', name);
      newRow.setAttribute('data-date', date);
      newRow.setAttribute('data-time', time);
      newRow.setAttribute('data-attendee', attendee);
      newRow.setAttribute('data-registrations', '0');
      newRow.setAttribute('data-fee', fee);
      newRow.setAttribute('data-status', 'Upcoming');
      newRow.setAttribute('data-about', about || 'Wellness workshop session');
      newRow.setAttribute('data-speaker', speaker || 'Ayurvedic specialist');
      newRow.setAttribute('data-image', 'assets/package-thumb.jpg');

      newRow.innerHTML = `
        <td class="td-ws-name font-bold ws-name-cell">${name}</td>
        <td class="td-date text-muted-dark ws-date-cell">${date}</td>
        <td class="td-time text-muted-dark ws-time-cell">${time}</td>
        <td class="td-attendee text-muted-dark ws-attendee-cell">${attendee}</td>
        <td class="td-registrations text-muted-dark ws-registrations-cell">0</td>
        <td class="td-status">
          <span class="status-badge ws-status status-upcoming">Upcoming</span>
        </td>
        <td class="td-action text-right">
          <div class="action-menu-container">
            <button type="button" class="action-dots-btn" aria-label="Actions for ${name}">
              <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>
            </button>
            <div class="action-dropdown ws-dropdown" role="menu">
              <button type="button" class="dropdown-item edit-ws-btn" role="menuitem">
                <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                <span>Edit</span>
              </button>
              <button type="button" class="dropdown-item view-ws-btn" role="menuitem">
                <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <span>View</span>
              </button>
            </div>
          </div>
        </td>
      `;

      if (workshopsTableBody) {
        workshopsTableBody.insertBefore(newRow, workshopsTableBody.firstChild);
      }

      if (statTotalWorkshops) {
        statTotalWorkshops.textContent = (parseInt(statTotalWorkshops.textContent) || 12) + 1;
      }
      if (statUpcomingWorkshops) {
        statUpcomingWorkshops.textContent = (parseInt(statUpcomingWorkshops.textContent) || 6) + 1;
      }

      switchView(workshopsListView);
      showToast(`Workshop "${name}" added successfully!`);
    });
  }

  if (editWorkshopForm) {
    editWorkshopForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentTargetRow) return;

      const name = document.getElementById('editWsName').value.trim();
      const date = document.getElementById('editWsDate').value.trim();
      const time = document.getElementById('editWsTime').value.trim();
      const attendee = document.getElementById('editWsAttendee').value.trim();
      const fee = document.getElementById('editWsFee').value.trim().replace('₹', '');
      const about = document.getElementById('editWsAbout').value.trim();
      const speaker = document.getElementById('editWsSpeaker').value.trim();

      currentTargetRow.setAttribute('data-name', name);
      currentTargetRow.setAttribute('data-date', date);
      currentTargetRow.setAttribute('data-time', time);
      currentTargetRow.setAttribute('data-attendee', attendee);
      currentTargetRow.setAttribute('data-fee', fee);
      currentTargetRow.setAttribute('data-about', about);
      currentTargetRow.setAttribute('data-speaker', speaker);

      const nameCell = currentTargetRow.querySelector('.ws-name-cell');
      const dateCell = currentTargetRow.querySelector('.ws-date-cell');
      const timeCell = currentTargetRow.querySelector('.ws-time-cell');
      const attendeeCell = currentTargetRow.querySelector('.ws-attendee-cell');

      if (nameCell) nameCell.textContent = name;
      if (dateCell) dateCell.textContent = date;
      if (timeCell) timeCell.textContent = time;
      if (attendeeCell) attendeeCell.textContent = attendee;

      [nameCell, dateCell, timeCell, attendeeCell].forEach(c => {
        if (c) {
          c.style.backgroundColor = '#FEF08A';
          setTimeout(() => { c.style.backgroundColor = ''; }, 1000);
        }
      });

      switchView(workshopsListView);
      showToast(`Workshop "${name}" updated successfully!`);
    });
  }

  // --------------------------------------------------------------------------
  // Drag & Drop File Upload Handlers
  // --------------------------------------------------------------------------
  ['add', 'edit'].forEach(prefix => {
    const dropzone = document.getElementById(`${prefix}WsDropzoneBox`);
    const fileInput = document.getElementById(`${prefix}WsImageInput`);
    const filenameSpan = document.getElementById(`${prefix}WsFileName`);
    const browseBtn = document.getElementById(`${prefix}WsBrowseBtn`);

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
  // Live Search & Filter Logic
  // --------------------------------------------------------------------------
  function applyFiltersAndSearch() {
    const query = workshopSearchInput ? workshopSearchInput.value.trim().toLowerCase() : '';
    const rows = Array.from(workshopsTableBody ? workshopsTableBody.querySelectorAll('.workshop-row') : []);

    if (clearWorkshopSearchBtn) {
      clearWorkshopSearchBtn.classList.toggle('active', query.length > 0);
    }

    const selectedStatuses = Array.from(document.querySelectorAll('input[name="wsStatusFilter"]:checked')).map(cb => cb.value);

    let matchCount = 0;
    rows.forEach(row => {
      const name = (row.getAttribute('data-name') || '').toLowerCase();
      const attendee = (row.getAttribute('data-attendee') || '').toLowerCase();
      const date = (row.getAttribute('data-date') || '').toLowerCase();
      const status = row.getAttribute('data-status') || 'Upcoming';

      const matchesSearch = !query || name.includes(query) || attendee.includes(query) || date.includes(query);
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(status);

      if (matchesSearch && matchesStatus) {
        row.style.display = '';
        matchCount++;
      } else {
        row.style.display = 'none';
      }
    });

    if (wsShowingEnd) wsShowingEnd.textContent = (query || selectedStatuses.length > 0) ? matchCount : '5';
    if (wsShowingStart) wsShowingStart.textContent = matchCount > 0 ? '1' : '0';
  }

  if (workshopSearchInput) {
    workshopSearchInput.addEventListener('input', applyFiltersAndSearch);
  }

  if (clearWorkshopSearchBtn) {
    clearWorkshopSearchBtn.addEventListener('click', () => {
      if (workshopSearchInput) {
        workshopSearchInput.value = '';
        applyFiltersAndSearch();
        workshopSearchInput.focus();
      }
    });
  }

  // --------------------------------------------------------------------------
  // Pagination
  // --------------------------------------------------------------------------
  function updatePaginationUI() {
    if (wsPageIndicator) wsPageIndicator.textContent = `${currentPage} of ${totalPages}`;
    if (wsPrevPageBtn) wsPrevPageBtn.disabled = currentPage === 1;
    if (wsNextPageBtn) wsNextPageBtn.disabled = currentPage === totalPages;
    if (wsShowingStart && wsShowingEnd) {
      const start = (currentPage - 1) * 5 + 1;
      const end = Math.min(currentPage * 5, 20);
      wsShowingStart.textContent = start;
      wsShowingEnd.textContent = end;
    }
  }

  if (wsPrevPageBtn) {
    wsPrevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        updatePaginationUI();
      }
    });
  }

  if (wsNextPageBtn) {
    wsNextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        updatePaginationUI();
      }
    });
  }
});
