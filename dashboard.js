/**
 * Panchved Admin Dashboard - Interactive Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Sidebar Navigation Toggle
  const menuToggleBtn = document.getElementById('menuToggleBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (menuToggleBtn && sidebar && sidebarOverlay) {
    const openSidebar = () => {
      sidebar.classList.add('open');
      sidebarOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeSidebar = () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    menuToggleBtn.addEventListener('click', openSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        closeSidebar();
      }
    });
  }

  // 2. Navigation Active State Switcher
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      if (this.getAttribute('href').startsWith('#')) {
        e.preventDefault();
        navLinks.forEach((l) => l.classList.remove('active'));
        this.classList.add('active');

        // Close sidebar on mobile when item is selected
        if (sidebar && sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
          sidebarOverlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
    });
  });

  // 3. Interactive Chart Data Points & Tooltip
  const pointCircles = document.querySelectorAll('.point-circle');
  const chartTooltip = document.getElementById('chartTooltip');

  if (chartTooltip && pointCircles.length > 0) {
    const tooltipValue = chartTooltip.querySelector('.tooltip-value');
    const pointHalos = document.querySelectorAll('.point-halo');

    pointCircles.forEach((circle, index) => {
      const showTooltipForPoint = () => {
        const cx = circle.getAttribute('cx');
        const cy = circle.getAttribute('cy');
        const val = circle.getAttribute('data-val');

        // Update active class
        pointCircles.forEach((c) => c.classList.remove('active-point'));
        pointHalos.forEach((h) => h.classList.remove('active-halo'));

        circle.classList.add('active-point');
        if (pointHalos[index]) {
          pointHalos[index].classList.add('active-halo');
        }

        // Reposition tooltip
        chartTooltip.setAttribute('transform', `translate(${cx}, ${cy})`);
        if (tooltipValue && val) {
          tooltipValue.textContent = val;
        }
      };

      circle.addEventListener('mouseenter', showTooltipForPoint);
      circle.addEventListener('click', showTooltipForPoint);
    });
  }

  // 4. Time Range Dropdown Selector
  const timeFilterSelect = document.getElementById('timeFilterSelect');
  const selectedTimeRange = document.getElementById('selectedTimeRange');

  const timeRanges = [
    'Last 12 months',
    'Last 6 months',
    'Last 3 months',
    'This Year (2026)',
    'Previous Year (2025)'
  ];
  let timeRangeIndex = 0;

  if (timeFilterSelect && selectedTimeRange) {
    timeFilterSelect.addEventListener('click', () => {
      timeRangeIndex = (timeRangeIndex + 1) % timeRanges.length;
      selectedTimeRange.textContent = timeRanges[timeRangeIndex];
    });

    timeFilterSelect.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        timeFilterSelect.click();
      }
    });
  }

  // 5. Year Navigator
  const prevYearBtn = document.getElementById('prevYearBtn');
  const nextYearBtn = document.getElementById('nextYearBtn');
  const currentYearText = document.getElementById('currentYearText');
  let currentYear = 2026;

  if (prevYearBtn && nextYearBtn && currentYearText) {
    prevYearBtn.addEventListener('click', () => {
      currentYear -= 1;
      currentYearText.textContent = currentYear;
    });

    nextYearBtn.addEventListener('click', () => {
      currentYear += 1;
      currentYearText.textContent = currentYear;
    });
  }
});
