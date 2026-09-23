/**
 * Panchved Admin - Doctors Screen Interactivity & RESTful API Integration
 */

document.addEventListener('DOMContentLoaded', () => {
  // Backend API Base URL
  const API_BASE_URL = window.API_BASE_URL || 'https://digitalbolt.co/nikita/panchved-admin/api';

  // View Containers
  const doctorsListView = document.getElementById('doctorsListView');
  const addDoctorView = document.getElementById('addDoctorView');
  const editDoctorView = document.getElementById('editDoctorView');

  // Navigation Buttons
  const openAddDoctorBtn = document.getElementById('openAddDoctorBtn');
  const backFromAddBtn = document.getElementById('backFromAddBtn');
  const backFromEditBtn = document.getElementById('backFromEditBtn');

  // Forms & Table
  const addDoctorForm = document.getElementById('addDoctorForm');
  const editDoctorForm = document.getElementById('editDoctorForm');
  const doctorsTableBody = document.getElementById('doctorsTableBody');

  // Search & Filter
  const doctorSearchInput = document.getElementById('doctorSearchInput');
  const clearDoctorSearchBtn = document.getElementById('clearDoctorSearchBtn');
  const doctorFilterBtn = document.getElementById('doctorFilterBtn');

  // View Modal Elements
  const viewDoctorModal = document.getElementById('viewDoctorModal');
  const closeDocModalBtn = document.getElementById('closeDocModalBtn');
  const modalDocName = document.getElementById('modalDocName');
  const modalDocPhone = document.getElementById('modalDocPhone');
  const modalDocEmail = document.getElementById('modalDocEmail');
  const modalDocYoe = document.getElementById('modalDocYoe');
  const modalDocExpertise = document.getElementById('modalDocExpertise');
  const modalDocArea = document.getElementById('modalDocArea');
  const modalDocReg = document.getElementById('modalDocReg');
  const modalDocHpr = document.getElementById('modalDocHpr');
  const modalDocAppointments = document.getElementById('modalDocAppointments');

  // Filter Drawer Elements
  const docFilterDrawer = document.getElementById('docFilterDrawer');
  const docFilterDrawerBackdrop = document.getElementById('docFilterDrawerBackdrop');
  const closeDocFilterDrawerBtn = document.getElementById('closeDocFilterDrawerBtn');
  const resetDocFilterBtn = document.getElementById('resetDocFilterBtn');
  const expertiseAccordionBtn = document.getElementById('expertiseAccordionBtn');
  const docStatusAccordionBtn = document.getElementById('docStatusAccordionBtn');
  const expertiseAccordion = document.getElementById('expertiseAccordion');
  const docStatusAccordion = document.getElementById('docStatusAccordion');
  const docStatusCheckboxes = document.querySelectorAll('input[name="docStatusFilter"]');

  // Pagination Elements
  const docPrevPageBtn = document.getElementById('docPrevPageBtn');
  const docNextPageBtn = document.getElementById('docNextPageBtn');
  const docPageIndicator = document.getElementById('docPageIndicator');
  const docShowingStart = document.getElementById('docShowingStart');
  const docShowingEnd = document.getElementById('docShowingEnd');
  const docTotalItems = document.getElementById('docTotalItems');

  // State Management
  let currentPage = 1;
  let totalPages = 1;
  const itemsPerPage = 5;
  let totalRecords = 0;
  let currentSearchQuery = '';
  let currentStatusFilter = '';
  let currentExpertiseFilter = '';
  let searchDebounceTimeout = null;

  // Toast / Notification helper
  function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.app-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `app-toast toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateY(20px);
      opacity: 0;
    `;
    toast.innerHTML = `
      <span>${message}</span>
      <button type="button" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1;margin-left:8px;">&times;</button>
    `;

    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => toast.remove());

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  }

  // Helper for Initials
  function getInitials(name) {
    if (!name) return 'DR';
    return name
      .replace(/^(Dr\.|Dr|Doctor)\s+/i, '')
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'DR';
  }

  // ==========================================================================
  // 1. View Navigation (List <-> Add <-> Edit)
  // ==========================================================================
  function showView(viewToShow) {
    if (doctorsListView) doctorsListView.style.display = 'none';
    if (addDoctorView) addDoctorView.style.display = 'none';
    if (editDoctorView) editDoctorView.style.display = 'none';

    if (viewToShow) {
      viewToShow.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (openAddDoctorBtn) {
    openAddDoctorBtn.addEventListener('click', () => {
      if (addDoctorForm) addDoctorForm.reset();
      showView(addDoctorView);
    });
  }

  if (backFromAddBtn) {
    backFromAddBtn.addEventListener('click', () => {
      showView(doctorsListView);
    });
  }

  if (backFromEditBtn) {
    backFromEditBtn.addEventListener('click', () => {
      showView(doctorsListView);
    });
  }

  // ==========================================================================
  // 2. Fetch & Render Doctors API
  // ==========================================================================
  async function fetchDoctors(page = 1) {
    currentPage = page;
    if (!doctorsTableBody) return;

    // Loading State
    doctorsTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: #64748b;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
            <svg style="animation: spin 1s linear infinite; width: 24px; height: 24px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
            </svg>
            <span>Loading doctors...</span>
          </div>
          <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
        </td>
      </tr>
    `;

    const queryParams = new URLSearchParams({
      page: String(currentPage),
      limit: String(itemsPerPage),
      search: currentSearchQuery,
      status: currentStatusFilter,
      expertise: currentExpertiseFilter
    });

    try {
      const response = await fetch(`${API_BASE_URL}/get_doctors.php?${queryParams.toString()}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.status !== '1') {
        throw new Error(result.message || 'Failed to fetch doctors from server.');
      }

      const doctors = result.data || [];
      totalRecords = result.total_records || 0;
      totalPages = Math.max(1, result.total_pages || 1);

      renderDoctorsTable(doctors);
      updatePaginationControls();

    } catch (err) {
      console.warn('API Error:', err.message);
      doctorsTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 36px; color: #ef4444;">
            <p style="margin-bottom: 8px; font-weight: 600;">${err.message}</p>
            <button type="button" class="filter-btn" style="display:inline-flex; padding: 6px 14px; font-size:13px;" onclick="window.retryFetchDoctors()">
              Retry
            </button>
          </td>
        </tr>
      `;
    }
  }

  window.retryFetchDoctors = () => fetchDoctors(currentPage);

  function renderDoctorsTable(doctors) {
    if (!doctorsTableBody) return;
    doctorsTableBody.innerHTML = '';

    if (!doctors || doctors.length === 0) {
      doctorsTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 48px; color: #94a3b8; font-size: 15px;">
            No doctors found matching your criteria.
          </td>
        </tr>
      `;
      return;
    }

    doctors.forEach(doc => {
      const docId = doc.id;
      const displayId = doc.doctorid || `DOC${String(docId).padStart(6, '0')}`;
      const fullName = doc.full_name || 'Doctor';
      const initials = getInitials(fullName);
      const yoe = doc.years_of_experience ?? 0;
      const expertise = doc.expertise || '-';
      const status = doc.status || 'Active';
      const isStatusActive = status.toLowerCase() === 'active';
      const statusClass = isStatusActive ? 'status-active' : 'status-inactive';

      const row = document.createElement('tr');
      row.className = 'doctor-row';
      row.setAttribute('data-id', String(docId));
      row.setAttribute('data-doctorid', displayId);
      row.setAttribute('data-name', fullName);
      row.setAttribute('data-dob', doc.date_of_birth || '');
      row.setAttribute('data-phone', doc.phone_number || '');
      row.setAttribute('data-gender', doc.gender || 'Male');
      row.setAttribute('data-email', doc.email || '');
      row.setAttribute('data-yoe', String(yoe));
      row.setAttribute('data-expertise', expertise);
      row.setAttribute('data-area', doc.area || '');
      row.setAttribute('data-reg', doc.registration_number || '');
      row.setAttribute('data-hpr', doc.hpr_registration_number || '');
      row.setAttribute('data-status', status);

      row.innerHTML = `
        <td class="td-patient">
          <div class="patient-profile-cell">
            <div class="patient-avatar-circle doc-avatar">${initials}</div>
            <div class="patient-meta">
              <span class="patient-name">${fullName}</span>
              <span class="patient-id">${displayId}</span>
            </div>
          </div>
        </td>
        <td class="td-yoe">${yoe}</td>
        <td class="td-expertise">${expertise}</td>
        <td class="td-status">
          <span class="status-badge doc-status ${statusClass}">${status}</span>
        </td>
        <td class="td-action text-right">
          <div class="action-menu-container">
            <button type="button" class="action-dots-btn" aria-label="Actions for ${fullName}">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2"></circle>
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="12" cy="19" r="2"></circle>
              </svg>
            </button>
            
            <div class="action-dropdown doctor-dropdown" role="menu">
              <!-- Change Status Submenu -->
              <div class="dropdown-item-wrapper">
                <button type="button" class="dropdown-item change-status-btn" role="menuitem">
                  <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                  <span>Change Status</span>
                </button>
                <div class="status-submenu" role="menu">
                  <button type="button" class="status-pill-opt opt-active" data-set-status="Active">Active</button>
                  <button type="button" class="status-pill-opt opt-inactive" data-set-status="Inactive">Inactive</button>
                </div>
              </div>

              <!-- Edit Doctor -->
              <button type="button" class="dropdown-item edit-doc-btn" role="menuitem">
                <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                <span>Edit</span>
              </button>

              <!-- View Doctor -->
              <button type="button" class="dropdown-item view-doc-btn" role="menuitem">
                <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>View</span>
              </button>

              <!-- Delete Doctor -->
              <button type="button" class="dropdown-item delete-doc-btn" role="menuitem" style="color: #ef4444;">
                <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Delete</span>
              </button>
            </div>
          </div>
        </td>
      `;

      doctorsTableBody.appendChild(row);
    });
  }

  function updatePaginationControls() {
    if (docPageIndicator) {
      docPageIndicator.textContent = `${currentPage} of ${totalPages}`;
    }
    if (docPrevPageBtn) {
      docPrevPageBtn.disabled = currentPage <= 1;
    }
    if (docNextPageBtn) {
      docNextPageBtn.disabled = currentPage >= totalPages;
    }

    const start = totalRecords === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalRecords);

    if (docShowingStart) docShowingStart.textContent = String(start);
    if (docShowingEnd) docShowingEnd.textContent = String(end);
    if (docTotalItems) docTotalItems.textContent = String(totalRecords);
  }

  // ==========================================================================
  // 3. Dropdown Menu, Action Handling & Status Change API
  // ==========================================================================
  document.addEventListener('click', (e) => {
    const dotsBtn = e.target.closest('.action-dots-btn');
    const allDropdowns = document.querySelectorAll('.doctor-dropdown');
    const allDotsBtns = document.querySelectorAll('.action-dots-btn');

    if (dotsBtn) {
      e.stopPropagation();
      const parentContainer = dotsBtn.closest('.action-menu-container');
      const dropdown = parentContainer.querySelector('.doctor-dropdown');
      const isOpen = dropdown.classList.contains('open');

      allDropdowns.forEach(d => d.classList.remove('open'));
      allDotsBtns.forEach(b => b.classList.remove('active'));

      if (!isOpen) {
        dropdown.classList.add('open');
        dotsBtn.classList.add('active');
      }
    } else {
      if (!e.target.closest('.doctor-dropdown')) {
        allDropdowns.forEach(d => d.classList.remove('open'));
        allDotsBtns.forEach(b => b.classList.remove('active'));
      }
    }
  });

  // Change Status API Call
  document.addEventListener('click', async (e) => {
    const statusPillOpt = e.target.closest('.status-pill-opt');
    if (statusPillOpt) {
      e.preventDefault();
      const newStatus = statusPillOpt.getAttribute('data-set-status');
      const row = statusPillOpt.closest('.doctor-row');
      if (!row || !newStatus) return;

      const docId = row.getAttribute('data-id');
      const statusBadge = row.querySelector('.doc-status');

      try {
        const response = await fetch(`${API_BASE_URL}/change_doctor_status.php`, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ id: Number(docId), status: newStatus })
        });

        const resData = await response.json().catch(() => ({}));
        if (!response.ok || resData.status !== '1') {
          throw new Error(resData.message || 'Failed to update status.');
        }

        row.setAttribute('data-status', newStatus);
        if (statusBadge) {
          statusBadge.textContent = newStatus;
          statusBadge.className = `status-badge doc-status ${newStatus === 'Active' ? 'status-active' : 'status-inactive'}`;
        }

        showToast(`Doctor status changed to ${newStatus}`);
      } catch (err) {
        showToast(err.message, 'error');
      }

      document.querySelectorAll('.doctor-dropdown').forEach(d => d.classList.remove('open'));
      document.querySelectorAll('.action-dots-btn').forEach(b => b.classList.remove('active'));
    }
  });

  // Delete Doctor API Call
  document.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.delete-doc-btn');
    if (deleteBtn) {
      e.preventDefault();
      const row = deleteBtn.closest('.doctor-row');
      if (!row) return;

      const docId = row.getAttribute('data-id');
      const docName = row.getAttribute('data-name') || 'this doctor';

      if (!confirm(`Are you sure you want to delete ${docName}?`)) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/delete_doctor.php`, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ id: Number(docId) })
        });

        const resData = await response.json().catch(() => ({}));
        if (!response.ok || resData.status !== '1') {
          throw new Error(resData.message || 'Failed to delete doctor.');
        }

        showToast('Doctor deleted successfully.');
        fetchDoctors(currentPage);
      } catch (err) {
        showToast(err.message, 'error');
      }

      document.querySelectorAll('.doctor-dropdown').forEach(d => d.classList.remove('open'));
      document.querySelectorAll('.action-dots-btn').forEach(b => b.classList.remove('active'));
    }
  });

  // Edit Doctor View Transition & Form Fill
  document.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.edit-doc-btn');
    if (editBtn) {
      e.preventDefault();
      const row = editBtn.closest('.doctor-row');
      if (row) {
        const docId = row.getAttribute('data-id');

        // Populate form with available attributes immediately
        const editIdInput = document.getElementById('editDoctorId');
        if (editIdInput) editIdInput.value = docId;

        document.getElementById('editFullName').value = row.getAttribute('data-name') || '';
        document.getElementById('editDob').value = row.getAttribute('data-dob') || '';
        document.getElementById('editPhone').value = row.getAttribute('data-phone') || '';
        document.getElementById('editGender').value = row.getAttribute('data-gender') || 'Male';
        document.getElementById('editEmail').value = row.getAttribute('data-email') || '';
        document.getElementById('editYoe').value = row.getAttribute('data-yoe') || '0';
        document.getElementById('editExpertise').value = row.getAttribute('data-expertise') || '';
        document.getElementById('editArea').value = row.getAttribute('data-area') || '';
        document.getElementById('editReg').value = row.getAttribute('data-reg') || '';
        document.getElementById('editHpr').value = row.getAttribute('data-hpr') || '';

        showView(editDoctorView);

        // Fetch fresh doctor details from API
        try {
          const res = await fetch(`${API_BASE_URL}/get_doctor.php?id=${docId}`, {
            method: 'GET',
            mode: 'cors',
            headers: { 'Accept': 'application/json' }
          });
          const data = await res.json();
          if (data.status === '1' && data.data) {
            const d = data.data;
            document.getElementById('editFullName').value = d.full_name || '';
            document.getElementById('editDob').value = d.date_of_birth || '';
            document.getElementById('editPhone').value = d.phone_number || '';
            document.getElementById('editGender').value = d.gender || 'Male';
            document.getElementById('editEmail').value = d.email || '';
            document.getElementById('editYoe').value = d.years_of_experience ?? 0;
            document.getElementById('editExpertise').value = d.expertise || '';
            document.getElementById('editArea').value = d.area || '';
            document.getElementById('editReg').value = d.registration_number || '';
            document.getElementById('editHpr').value = d.hpr_registration_number || '';
          }
        } catch (_) {}
      }

      document.querySelectorAll('.doctor-dropdown').forEach(d => d.classList.remove('open'));
      document.querySelectorAll('.action-dots-btn').forEach(b => b.classList.remove('active'));
    }
  });

  // View Doctor Modal Populating
  document.addEventListener('click', async (e) => {
    const viewBtn = e.target.closest('.view-doc-btn');
    if (viewBtn) {
      e.preventDefault();
      const row = viewBtn.closest('.doctor-row');
      if (row) {
        const docId = row.getAttribute('data-id');

        if (modalDocName) modalDocName.textContent = row.getAttribute('data-name') || '-';
        if (modalDocPhone) modalDocPhone.textContent = row.getAttribute('data-phone') || '-';
        if (modalDocEmail) modalDocEmail.textContent = row.getAttribute('data-email') || '-';
        if (modalDocYoe) modalDocYoe.textContent = row.getAttribute('data-yoe') || '0';
        if (modalDocExpertise) modalDocExpertise.textContent = row.getAttribute('data-expertise') || '-';
        if (modalDocArea) modalDocArea.textContent = row.getAttribute('data-area') || '-';
        if (modalDocReg) modalDocReg.textContent = row.getAttribute('data-reg') || '-';
        if (modalDocHpr) modalDocHpr.textContent = row.getAttribute('data-hpr') || '-';
        if (modalDocAppointments) modalDocAppointments.textContent = '-';

        openDocModal();

        // Fetch single doctor info including appointment count
        try {
          const res = await fetch(`${API_BASE_URL}/get_doctor.php?id=${docId}`, {
            method: 'GET',
            mode: 'cors',
            headers: { 'Accept': 'application/json' }
          });
          const resData = await res.json();
          if (resData.status === '1' && resData.data) {
            const d = resData.data;
            if (modalDocName) modalDocName.textContent = d.full_name || '-';
            if (modalDocPhone) modalDocPhone.textContent = d.phone_number || '-';
            if (modalDocEmail) modalDocEmail.textContent = d.email || '-';
            if (modalDocYoe) modalDocYoe.textContent = String(d.years_of_experience ?? 0);
            if (modalDocExpertise) modalDocExpertise.textContent = d.expertise || '-';
            if (modalDocArea) modalDocArea.textContent = d.area || '-';
            if (modalDocReg) modalDocReg.textContent = d.registration_number || '-';
            if (modalDocHpr) modalDocHpr.textContent = d.hpr_registration_number || '-';
            if (modalDocAppointments) modalDocAppointments.textContent = String(d.total_appointments ?? 0);
          }
        } catch (_) {}
      }

      document.querySelectorAll('.doctor-dropdown').forEach(d => d.classList.remove('open'));
      document.querySelectorAll('.action-dots-btn').forEach(b => b.classList.remove('active'));
    }
  });

  // Modal Functions
  function openDocModal() {
    if (viewDoctorModal) {
      viewDoctorModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeDocModal() {
    if (viewDoctorModal) {
      viewDoctorModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (closeDocModalBtn) closeDocModalBtn.addEventListener('click', closeDocModal);
  if (viewDoctorModal) {
    viewDoctorModal.addEventListener('click', (e) => {
      if (e.target === viewDoctorModal) closeDocModal();
    });
  }

  // ==========================================================================
  // 4. Form Submissions (Add & Update Doctors APIs)
  // ==========================================================================
  if (addDoctorForm) {
    addDoctorForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullName = document.getElementById('addFullName').value.trim();
      const dob = document.getElementById('addDob').value.trim();
      const phone = document.getElementById('addPhone').value.trim();
      const gender = document.getElementById('addGender').value.trim();
      const email = document.getElementById('addEmail').value.trim();
      const yoe = document.getElementById('addYoe').value.trim();
      const expertise = document.getElementById('addExpertise').value.trim();
      const area = document.getElementById('addArea').value.trim();
      const reg = document.getElementById('addReg').value.trim();
      const hpr = document.getElementById('addHpr').value.trim();

      if (!fullName) {
        showToast('Please enter doctor full name.', 'error');
        return;
      }
      if (!phone) {
        showToast('Please enter doctor phone number.', 'error');
        return;
      }
      if (!email) {
        showToast('Please enter doctor email address.', 'error');
        return;
      }

      const submitBtn = addDoctorForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '<span>Add</span>';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Saving...</span>';
      }

      const payload = {
        full_name: fullName,
        date_of_birth: dob,
        phone_number: phone,
        gender: gender || 'Male',
        email: email,
        years_of_experience: Number(yoe) || 0,
        expertise: expertise,
        area: area,
        registration_number: reg,
        hpr_registration_number: hpr,
        status: 'Active'
      };

      try {
        const response = await fetch(`${API_BASE_URL}/add_doctors.php`, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));

        if (result.status !== '1') {
          throw new Error(result.message || 'Failed to add doctor.');
        }

        addDoctorForm.reset();
        showToast('Doctor Added Successfully!');
        showView(doctorsListView);
        fetchDoctors(1);

      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  }

  if (editDoctorForm) {
    editDoctorForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const docId = document.getElementById('editDoctorId').value;
      const fullName = document.getElementById('editFullName').value.trim();
      const dob = document.getElementById('editDob').value.trim();
      const phone = document.getElementById('editPhone').value.trim();
      const gender = document.getElementById('editGender').value.trim();
      const email = document.getElementById('editEmail').value.trim();
      const yoe = document.getElementById('editYoe').value.trim();
      const expertise = document.getElementById('editExpertise').value.trim();
      const area = document.getElementById('editArea').value.trim();
      const reg = document.getElementById('editReg').value.trim();
      const hpr = document.getElementById('editHpr').value.trim();

      if (!fullName) {
        showToast('Please enter doctor full name.', 'error');
        return;
      }

      const updateBtn = editDoctorForm.querySelector('button[type="submit"]');
      const originalBtnText = updateBtn ? updateBtn.innerHTML : '<span>Update</span>';
      if (updateBtn) {
        updateBtn.disabled = true;
        updateBtn.innerHTML = '<span>Updating...</span>';
      }

      const payload = {
        id: Number(docId),
        full_name: fullName,
        date_of_birth: dob,
        phone_number: phone,
        gender: gender,
        email: email,
        years_of_experience: Number(yoe) || 0,
        expertise: expertise,
        area: area,
        registration_number: reg,
        hpr_registration_number: hpr
      };

      try {
        const response = await fetch(`${API_BASE_URL}/update_doctor.php`, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));

        if (result.status !== '1') {
          throw new Error(result.message || 'Failed to update doctor.');
        }

        showToast('Doctor Updated Successfully!');
        showView(doctorsListView);
        fetchDoctors(currentPage);

      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        if (updateBtn) {
          updateBtn.disabled = false;
          updateBtn.innerHTML = originalBtnText;
        }
      }
    });
  }

  // ==========================================================================
  // 5. Search Bar Handling
  // ==========================================================================
  if (doctorSearchInput) {
    doctorSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      currentSearchQuery = query;

      if (clearDoctorSearchBtn) {
        clearDoctorSearchBtn.classList.toggle('active', query.length > 0);
      }

      clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = setTimeout(() => {
        fetchDoctors(1);
      }, 350);
    });

    if (clearDoctorSearchBtn) {
      clearDoctorSearchBtn.addEventListener('click', () => {
        doctorSearchInput.value = '';
        currentSearchQuery = '';
        clearDoctorSearchBtn.classList.remove('active');
        fetchDoctors(1);
        doctorSearchInput.focus();
      });
    }
  }

  // ==========================================================================
  // 6. Filter Drawer Handling
  // ==========================================================================
  function openDocFilterDrawer() {
    if (docFilterDrawer && docFilterDrawerBackdrop) {
      docFilterDrawer.classList.add('open');
      docFilterDrawerBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeDocFilterDrawer() {
    if (docFilterDrawer && docFilterDrawerBackdrop) {
      docFilterDrawer.classList.remove('open');
      docFilterDrawerBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (doctorFilterBtn) doctorFilterBtn.addEventListener('click', openDocFilterDrawer);
  if (closeDocFilterDrawerBtn) closeDocFilterDrawerBtn.addEventListener('click', closeDocFilterDrawer);
  if (docFilterDrawerBackdrop) docFilterDrawerBackdrop.addEventListener('click', closeDocFilterDrawer);

  if (docStatusAccordionBtn && docStatusAccordion) {
    docStatusAccordionBtn.addEventListener('click', () => {
      const isOpen = docStatusAccordion.classList.contains('open');
      docStatusAccordion.classList.toggle('open');
      docStatusAccordionBtn.setAttribute('aria-expanded', !isOpen);
    });
  }

  docStatusCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const checkedStatuses = Array.from(docStatusCheckboxes)
        .filter(c => c.checked)
        .map(c => c.value);

      currentStatusFilter = checkedStatuses.join(',');
      fetchDoctors(1);
    });
  });

  if (resetDocFilterBtn) {
    resetDocFilterBtn.addEventListener('click', () => {
      docStatusCheckboxes.forEach(cb => (cb.checked = false));
      currentStatusFilter = '';
      currentExpertiseFilter = '';
      fetchDoctors(1);
      closeDocFilterDrawer();
    });
  }

  // Global Escape Key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDocModal();
      closeDocFilterDrawer();
    }
  });

  // ==========================================================================
  // 7. Pagination Controls
  // ==========================================================================
  if (docPrevPageBtn) {
    docPrevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        fetchDoctors(currentPage - 1);
      }
    });
  }

  if (docNextPageBtn) {
    docNextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        fetchDoctors(currentPage + 1);
      }
    });
  }

  // Initial Data Load
  fetchDoctors(1);
});
