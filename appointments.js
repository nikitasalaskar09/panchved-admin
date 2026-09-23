/**
 * Panchved Admin - Appointments Management JavaScript
 * Handles:
 * - 3-dots Action dropdown toggle and outside-click dismiss
 * - "Reassign Doctor" modal dialog with dynamic row update & feedback toast
 * - "View" Appointment History modal dialog with dynamic data population
 * - Live search filter across patient names and doctor names
 * - Pagination controls and indicators
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const searchInput = document.getElementById('appointmentSearchInput');
  const clearSearchBtn = document.getElementById('clearAppointmentSearchBtn');
  const appointmentsTableBody = document.getElementById('appointmentsTableBody');
  const rows = Array.from(appointmentsTableBody ? appointmentsTableBody.querySelectorAll('.appointment-row') : []);

  // Pagination Elements
  const apptShowingStart = document.getElementById('apptShowingStart');
  const apptShowingEnd = document.getElementById('apptShowingEnd');
  const apptTotalItems = document.getElementById('apptTotalItems');
  const apptPageIndicator = document.getElementById('apptPageIndicator');
  const apptPrevPageBtn = document.getElementById('apptPrevPageBtn');
  const apptNextPageBtn = document.getElementById('apptNextPageBtn');

  // Reassign Modal Elements
  const reassignModal = document.getElementById('reassignDoctorModal');
  const closeReassignModalBtn = document.getElementById('closeReassignModalBtn');
  const reassignForm = document.getElementById('reassignForm');
  const doctorSelectInput = document.getElementById('doctorSelectInput');

  // View Modal Elements
  const viewModal = document.getElementById('viewAppointmentModal');
  const closeApptModalBtn = document.getElementById('closeApptModalBtn');
  const modalApptId = document.getElementById('modalApptId');
  const modalApptPatient = document.getElementById('modalApptPatient');
  const modalApptPackage = document.getElementById('modalApptPackage');
  const modalApptDate = document.getElementById('modalApptDate');
  const modalApptTime = document.getElementById('modalApptTime');
  const modalApptDoctor = document.getElementById('modalApptDoctor');
  const modalApptDuration = document.getElementById('modalApptDuration');
  const modalApptAgenda = document.getElementById('modalApptAgenda');
  const modalApptPrescription = document.getElementById('modalApptPrescription');

  // Active state
  let currentTargetRow = null;
  let currentPage = 1;
  const totalPages = 4;

  // --------------------------------------------------------------------------
  // Helper: Toast Notification
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
  // Action Dropdown Management
  // --------------------------------------------------------------------------
  function closeAllDropdowns() {
    document.querySelectorAll('.appt-dropdown.open').forEach(dropdown => {
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
      const dropdown = container.querySelector('.appt-dropdown');
      const isOpen = dropdown.classList.contains('open');

      closeAllDropdowns();

      if (!isOpen) {
        dropdown.classList.add('open');
        dotsBtn.classList.add('active');
      }
      return;
    }

    // If clicked inside dropdown, allow default action
    if (!e.target.closest('.action-dropdown')) {
      closeAllDropdowns();
    }
  });

  // --------------------------------------------------------------------------
  // Open / Close Modals
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

  // Close buttons and backdrop clicks
  if (closeReassignModalBtn) {
    closeReassignModalBtn.addEventListener('click', () => closeModal(reassignModal));
  }
  if (closeApptModalBtn) {
    closeApptModalBtn.addEventListener('click', () => closeModal(viewModal));
  }

  [reassignModal, viewModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal);
        }
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      closeModal(reassignModal);
      closeModal(viewModal);
    }
  });

  // --------------------------------------------------------------------------
  // Reassign Doctor Handler
  // --------------------------------------------------------------------------
  document.addEventListener('click', (e) => {
    const reassignBtn = e.target.closest('.reassign-btn');
    if (reassignBtn) {
      const row = reassignBtn.closest('.appointment-row');
      if (row) {
        currentTargetRow = row;
        const currentDoctor = row.getAttribute('data-doctor') || '';
        
        // Match option if exists
        if (doctorSelectInput) {
          doctorSelectInput.value = currentDoctor;
          if (!doctorSelectInput.value) {
            doctorSelectInput.selectedIndex = 0;
          }
        }

        closeAllDropdowns();
        openModal(reassignModal);
      }
    }
  });

  if (reassignForm) {
    reassignForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const selectedDoctor = doctorSelectInput.value;
      if (!selectedDoctor) return;

      if (currentTargetRow) {
        const doctorCell = currentTargetRow.querySelector('.doctor-name-cell');
        if (doctorCell) {
          doctorCell.textContent = selectedDoctor;
          doctorCell.style.backgroundColor = '#FEF08A';
          setTimeout(() => {
            doctorCell.style.backgroundColor = '';
          }, 1000);
        }
        currentTargetRow.setAttribute('data-doctor', selectedDoctor);
        const patientName = currentTargetRow.getAttribute('data-patient') || 'Patient';
        showToast(`Successfully reassigned ${patientName}'s doctor to ${selectedDoctor}`);
      }

      closeModal(reassignModal);
    });
  }

  // --------------------------------------------------------------------------
  // View Appointment History Handler
  // --------------------------------------------------------------------------
  document.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('.view-appt-btn');
    if (viewBtn) {
      const row = viewBtn.closest('.appointment-row');
      if (row) {
        if (modalApptId) modalApptId.textContent = row.getAttribute('data-id') || 'ABC-001';
        if (modalApptPatient) modalApptPatient.textContent = row.getAttribute('data-patient') || 'Rahul Mishra';
        if (modalApptPackage) modalApptPackage.textContent = row.getAttribute('data-package') || 'Stress Management';
        if (modalApptDate) modalApptDate.textContent = row.getAttribute('data-date') || '2 Sept 2026';
        if (modalApptTime) modalApptTime.textContent = row.getAttribute('data-time') || '03:00 - 03:45 PM';
        if (modalApptDoctor) modalApptDoctor.textContent = row.getAttribute('data-doctor') || 'Dr. Rohit Mehra';
        if (modalApptDuration) modalApptDuration.textContent = row.getAttribute('data-duration') || '45 min';
        if (modalApptAgenda) modalApptAgenda.textContent = row.getAttribute('data-agenda') || 'Lorem ipsum simple tx Lorem ipsumLorem ipsum simple tx Lorem ipsum';
        if (modalApptPrescription) modalApptPrescription.textContent = row.getAttribute('data-prescription') || 'Lorem ipsum simple tx Lorem ipsumLorem ipsum simple tx Lorem ipsum';

        closeAllDropdowns();
        openModal(viewModal);
      }
    }
  });

  // --------------------------------------------------------------------------
  // Live Search Filter
  // --------------------------------------------------------------------------
  function filterAppointments() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    if (clearSearchBtn) {
      clearSearchBtn.classList.toggle('active', query.length > 0);
    }

    let matchCount = 0;
    rows.forEach(row => {
      const patient = (row.getAttribute('data-patient') || '').toLowerCase();
      const doctor = (row.getAttribute('data-doctor') || '').toLowerCase();
      const pkg = (row.getAttribute('data-package') || '').toLowerCase();

      if (patient.includes(query) || doctor.includes(query) || pkg.includes(query)) {
        row.style.display = '';
        matchCount++;
      } else {
        row.style.display = 'none';
      }
    });

    if (apptShowingEnd) {
      apptShowingEnd.textContent = query ? matchCount : '5';
    }
    if (apptShowingStart) {
      apptShowingStart.textContent = matchCount > 0 ? '1' : '0';
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterAppointments);
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        filterAppointments();
        searchInput.focus();
      }
    });
  }

  // --------------------------------------------------------------------------
  // Pagination Controls
  // --------------------------------------------------------------------------
  function updatePaginationUI() {
    if (apptPageIndicator) {
      apptPageIndicator.textContent = `${currentPage} of ${totalPages}`;
    }
    if (apptPrevPageBtn) {
      apptPrevPageBtn.disabled = currentPage === 1;
    }
    if (apptNextPageBtn) {
      apptNextPageBtn.disabled = currentPage === totalPages;
    }
    if (apptShowingStart && apptShowingEnd) {
      const start = (currentPage - 1) * 5 + 1;
      const end = Math.min(currentPage * 5, 20);
      apptShowingStart.textContent = start;
      apptShowingEnd.textContent = end;
    }
  }

  if (apptPrevPageBtn) {
    apptPrevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        updatePaginationUI();
      }
    });
  }

  if (apptNextPageBtn) {
    apptNextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        updatePaginationUI();
      }
    });
  }
});
