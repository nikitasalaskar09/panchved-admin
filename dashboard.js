/**
 * Panchved Admin Dashboard - Interactive Logic & REST API Integration
 */

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = window.API_BASE_URL || 'api';

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

        if (sidebar && sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
          sidebarOverlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
    });
  });

  // 3. Stat Card Elements
  const statTotalPatients = document.getElementById('statTotalPatients');
  const statTotalDoctors = document.getElementById('statTotalDoctors');
  const statTotalPackages = document.getElementById('statTotalPackages');
  const statTotalWorkshops = document.getElementById('statTotalWorkshops');

  // Chart Elements
  const chartTooltip = document.getElementById('chartTooltip');
  const chartStroke = document.querySelector('.chart-stroke');
  const chartArea = document.querySelector('.chart-area');
  const chartPointsGroup = document.querySelector('.chart-points');
  const selectedTimeRange = document.getElementById('selectedTimeRange');
  const timeFilterSelect = document.getElementById('timeFilterSelect');
  const prevYearBtn = document.getElementById('prevYearBtn');
  const nextYearBtn = document.getElementById('nextYearBtn');
  const currentYearText = document.getElementById('currentYearText');

  let currentYear = 2026;

  // 4. Fetch Dashboard Statistics
  async function fetchDashboardData(year = currentYear) {
    try {
      const response = await fetch(`${API_BASE}/get_dashboard_stats.php?year=${year}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error('Network error');

      const result = await response.json();
      if (result.status === '1' && result.data) {
        const d = result.data;
        if (statTotalPatients) statTotalPatients.textContent = d.total_patients;
        if (statTotalDoctors) statTotalDoctors.textContent = d.total_doctors;
        if (statTotalPackages) statTotalPackages.textContent = d.total_packages;
        if (statTotalWorkshops) statTotalWorkshops.textContent = d.total_workshops;

        if (d.chart_data && Array.isArray(d.chart_data)) {
          updateChartData(d.chart_data);
        }
      }
    } catch (err) {
      console.warn('Could not fetch dashboard stats from API, retaining UI state:', err);
    }
  }

  // Helper to map values (0 to 200) to SVG coordinates (baseline y=340 to peak y=40, width x=75 to 872)
  function updateChartData(chartData) {
    if (!chartData || chartData.length === 0) return;

    const xCoords = [75, 147, 220, 292, 365, 437, 510, 582, 655, 727, 800, 872];
    const maxVal = 200;
    const yBaseline = 340;
    const yTop = 40;
    const yRange = yBaseline - yTop; // 300px

    const points = chartData.map((item, index) => {
      const val = Number(item.value) || 0;
      const x = xCoords[index] || 75 + index * 72;
      const y = Math.max(yTop, Math.min(yBaseline, yBaseline - (val / maxVal) * yRange));
      return { x, y, val, month: item.month };
    });

    // Rebuild points DOM
    if (chartPointsGroup) {
      chartPointsGroup.innerHTML = '';
      points.forEach((pt, idx) => {
        const isActive = idx === 4; // Feb default active point
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pt.x);
        circle.setAttribute('cy', pt.y);
        circle.setAttribute('r', '4.5');
        circle.setAttribute('class', `point-circle ${isActive ? 'active-point' : ''}`);
        circle.setAttribute('data-month', pt.month);
        circle.setAttribute('data-val', pt.val);

        const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        halo.setAttribute('cx', pt.x);
        halo.setAttribute('cy', pt.y);
        halo.setAttribute('r', '9');
        halo.setAttribute('class', `point-halo ${isActive ? 'active-halo' : ''}`);

        chartPointsGroup.appendChild(circle);
        chartPointsGroup.appendChild(halo);

        const activatePoint = () => {
          document.querySelectorAll('.point-circle').forEach(c => c.classList.remove('active-point'));
          document.querySelectorAll('.point-halo').forEach(h => h.classList.remove('active-halo'));
          circle.classList.add('active-point');
          halo.classList.add('active-halo');

          if (chartTooltip) {
            chartTooltip.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
            const valEl = chartTooltip.querySelector('.tooltip-value');
            if (valEl) valEl.textContent = pt.val;
          }
        };

        circle.addEventListener('mouseenter', activatePoint);
        circle.addEventListener('click', activatePoint);

        if (isActive && chartTooltip) {
          chartTooltip.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
          const valEl = chartTooltip.querySelector('.tooltip-value');
          if (valEl) valEl.textContent = pt.val;
        }
      });
    }

    // Build smooth bezier spline
    if (points.length > 1) {
      let dPath = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) / 2;
        const cpY1 = p0.y;
        const cpX2 = p0.x + (p1.x - p0.x) / 2;
        const cpY2 = p1.y;
        dPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
      }

      if (chartStroke) chartStroke.setAttribute('d', dPath);

      const firstX = points[0].x;
      const lastX = points[points.length - 1].x;
      const areaPath = `M ${firstX} ${yBaseline} L ${firstX} ${points[0].y} ` + dPath.substring(dPath.indexOf('C')) + ` L ${lastX} ${yBaseline} Z`;
      if (chartArea) chartArea.setAttribute('d', areaPath);
    }
  }

  // 5. Time Filter Selector
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

  // 6. Year Navigator
  if (prevYearBtn && nextYearBtn && currentYearText) {
    prevYearBtn.addEventListener('click', () => {
      currentYear -= 1;
      currentYearText.textContent = currentYear;
      fetchDashboardData(currentYear);
    });

    nextYearBtn.addEventListener('click', () => {
      currentYear += 1;
      currentYearText.textContent = currentYear;
      fetchDashboardData(currentYear);
    });
  }

  // Initial Fetch
  fetchDashboardData(currentYear);
});
