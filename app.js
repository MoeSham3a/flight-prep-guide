/**
 * Emirates Flight Preparation Guide - Interactive Web Application
 * Version 5.0 (Dec 2025)
 * Script: app.js
 */

(function () {
  'use strict';

  // --- Constants & Keys ---
  const STORAGE_KEY = 'emirates_flight_prep_guide_v5';
  const THEME_KEY = 'emirates_flight_prep_theme';

  // --- State & DOM References ---
  const form = document.getElementById('flightPrepForm');
  const utcClock = document.getElementById('utcClock');
  const saveStatus = document.getElementById('saveStatus');
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const navTabs = document.querySelectorAll('.nav-tab');
  const pages = document.querySelectorAll('.sheet-page');
  const btnPrint = document.getElementById('btnPrint');
  const btnSampleFlight = document.getElementById('btnSampleFlight');
  const btnExportJson = document.getElementById('btnExportJson');
  const btnImportJson = document.getElementById('btnImportJson');
  const jsonFileInput = document.getElementById('jsonFileInput');
  const btnResetForm = document.getElementById('btnResetForm');
  const resetModal = document.getElementById('resetModal');
  const btnCancelReset = document.getElementById('btnCancelReset');
  const btnConfirmReset = document.getElementById('btnConfirmReset');
  const btnToggleAllPrep = document.getElementById('btnToggleAllPrep');
  const toastContainer = document.getElementById('toastContainer');

  // Dynamic Table Containers
  const enrouteThreatsBody = document.getElementById('enrouteThreatsBody');
  const btnAddEnrouteThreatRow = document.getElementById('btnAddEnrouteThreatRow');
  const waypointsBody = document.getElementById('waypointsBody');
  const btnAddWaypointRow = document.getElementById('btnAddWaypointRow');
  const airportsBody = document.getElementById('airportsBody');
  const btnAddAirportRow = document.getElementById('btnAddAirportRow');

  // Matrix
  const briefingsMatrix = document.getElementById('briefingsMatrix');
  const btnClearMatrixHighlight = document.getElementById('btnClearMatrixHighlight');

  let activeTabId = 'page-1';
  let saveTimeout = null;

  // --- Initializer ---
  function init() {
    initClock();
    initTheme();
    initTabs();
    initMatrix();
    initQuickTokens();
    initDynamicTables();
    initPersistence();
    initActions();

    // Load saved or defaults
    const loaded = loadFromStorage();
    if (!loaded) {
      seedDefaultRows();
    }
  }

  // --- 1. Live UTC Clock ---
  function initClock() {
    function update() {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timeStr = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`;
      utcClock.textContent = timeStr;
    }
    update();
    setInterval(update, 1000);
  }

  // --- 2. Theme Management (Day / Night Cockpit) ---
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'day';
    applyTheme(savedTheme);

    btnThemeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'day';
      const next = current === 'day' ? 'night' : 'day';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
      showToast(`Switched to ${next === 'night' ? 'Night Cockpit' : 'Day'} Mode`);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    btnThemeToggle.textContent = theme === 'night' ? '☀️' : '🌙';
    btnThemeToggle.title = theme === 'night' ? 'Switch to Day Mode' : 'Switch to Night Cockpit Mode';
  }

  // --- 3. Step Tab Navigation & View All ---
  function initTabs() {
    navTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-target');
        switchTab(target);
      });
    });
  }

  function switchTab(targetId) {
    activeTabId = targetId;

    navTabs.forEach((tab) => {
      if (tab.getAttribute('data-target') === targetId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    if (targetId === 'all-pages') {
      pages.forEach((page) => page.classList.remove('hidden'));
    } else {
      pages.forEach((page) => {
        if (page.id === targetId) {
          page.classList.remove('hidden');
        } else {
          page.classList.add('hidden');
        }
      });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- 4. Interactive OM-C / OM-A Reference Matrix ---
  function initMatrix() {
    if (!briefingsMatrix) return;

    // Highlight row on label click
    briefingsMatrix.querySelectorAll('tbody tr').forEach((row) => {
      const label = row.querySelector('.area-label');
      if (label) {
        label.addEventListener('click', () => {
          const isCurrentlyActive = row.classList.contains('active-row');
          clearMatrixHighlights();

          if (!isCurrentlyActive) {
            row.classList.add('active-row');
            // Also highlight cells that have an 'x'
            row.querySelectorAll('td.has-x').forEach((cell) => {
              cell.classList.add('active-cell');
              const colKey = cell.getAttribute('data-col');
              if (colKey) {
                const header = briefingsMatrix.querySelector(`th[data-col="${colKey}"]`);
                if (header) header.classList.add('active-col');
              }
            });

            // Quick hint
            const areaName = label.textContent.trim();
            showToast(`Highlighted briefings for: ${areaName}`);
          }
        });
      }
    });

    // Column header click to highlight all areas in that region
    briefingsMatrix.querySelectorAll('th.col-region').forEach((header) => {
      header.addEventListener('click', () => {
        const colKey = header.getAttribute('data-col');
        if (!colKey) return;

        const isCurrentlyActive = header.classList.contains('active-col');
        clearMatrixHighlights();

        if (!isCurrentlyActive) {
          header.classList.add('active-col');
          briefingsMatrix.querySelectorAll(`tbody td[data-col="${colKey}"]`).forEach((cell) => {
            if (cell.classList.contains('has-x')) {
              cell.classList.add('active-cell');
              cell.closest('tr').classList.add('active-row');
            }
          });
          showToast(`Filtered by Region: ${header.getAttribute('title') || colKey.toUpperCase()}`);
        }
      });
    });

    if (btnClearMatrixHighlight) {
      btnClearMatrixHighlight.addEventListener('click', () => {
        clearMatrixHighlights();
        showToast('Matrix highlights cleared');
      });
    }
  }

  function clearMatrixHighlights() {
    briefingsMatrix.querySelectorAll('.active-row').forEach((el) => el.classList.remove('active-row'));
    briefingsMatrix.querySelectorAll('.active-col').forEach((el) => el.classList.remove('active-col'));
    briefingsMatrix.querySelectorAll('.active-cell').forEach((el) => el.classList.remove('active-cell'));
  }

  // --- 5. Quick Token Chips ---
  function initQuickTokens() {
    document.querySelectorAll('.token-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const targetId = chip.getAttribute('data-target');
        const targetLast = chip.getAttribute('data-target-last');
        const textToInsert = chip.getAttribute('data-text');

        if (targetId) {
          const el = document.getElementById(targetId);
          if (el) {
            el.value = (el.value ? el.value.trim() + ' ' : '') + textToInsert;
            el.focus();
            triggerAutoSave();
          }
        } else if (targetLast === 'waypoint-spec') {
          // Append to the last non-empty or newly added waypoint row's spec req field
          const rows = waypointsBody.querySelectorAll('tr');
          if (rows.length > 0) {
            const lastRow = rows[rows.length - 1];
            const input = lastRow.querySelector('input[name="wp_req[]"]');
            if (input) {
              input.value = (input.value ? input.value.trim() + ' ' : '') + textToInsert;
              input.focus();
              triggerAutoSave();
            }
          }
        }
      });
    });
  }

  // --- 6. Dynamic Tables (Add / Remove Rows) ---
  function initDynamicTables() {
    // 6.1 En-route Threats Table
    btnAddEnrouteThreatRow.addEventListener('click', () => {
      addEnrouteThreatRow('', '', '');
      triggerAutoSave();
    });

    // 6.2 Waypoints Table
    btnAddWaypointRow.addEventListener('click', () => {
      addWaypointRow('', '', '');
      triggerAutoSave();
    });

    // 6.3 En-route Airports Table
    btnAddAirportRow.addEventListener('click', () => {
      addAirportRow('', '', '', '', '', '');
      triggerAutoSave();
    });
  }

  function addEnrouteThreatRow(area = '', threat = '', mitigation = '') {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="table-input" name="enroute_area[]" value="${escapeHtml(area)}" placeholder="e.g. Iraq / FIR Baghdad / Alps"></td>
      <td><textarea class="tem-textarea" name="enroute_threat[]" placeholder="Weather, airspace constraints, terrain...">${escapeHtml(threat)}</textarea></td>
      <td><textarea class="tem-textarea" name="enroute_mitigation[]" placeholder="Routing, oxygen escape route, contingency...">${escapeHtml(mitigation)}</textarea></td>
      <td class="no-print" style="text-align: center;">
        <button type="button" class="btn-remove-row" title="Delete row">✕</button>
      </td>
    `;
    tr.querySelector('.btn-remove-row').addEventListener('click', () => {
      tr.remove();
      triggerAutoSave();
    });
    enrouteThreatsBody.appendChild(tr);
  }

  function addWaypointRow(waypoint = '', fir = '', requirements = '') {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="table-input input-uppercase" name="wp_name[]" value="${escapeHtml(waypoint)}" placeholder="e.g. KUBSO"></td>
      <td><input type="text" class="table-input input-uppercase" name="wp_fir[]" value="${escapeHtml(fir)}" placeholder="e.g. OMAE"></td>
      <td><input type="text" class="table-input" name="wp_req[]" value="${escapeHtml(requirements)}" placeholder="CRAR, ADIZ contact, CPDLC, HF, SLOP, Emergency, etc."></td>
      <td class="no-print" style="text-align: center;">
        <button type="button" class="btn-remove-row" title="Delete row">✕</button>
      </td>
    `;
    tr.querySelector('.btn-remove-row').addEventListener('click', () => {
      tr.remove();
      triggerAutoSave();
    });
    waypointsBody.appendChild(tr);
  }

  function addAirportRow(airport = '', classVal = '', weather = '', rwy = '', app = '', threats = '') {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="table-input input-uppercase" name="apt_code[]" value="${escapeHtml(airport)}" placeholder="e.g. OERK / RUH"></td>
      <td><input type="text" class="table-input input-uppercase" name="apt_class[]" value="${escapeHtml(classVal)}" placeholder="Adequate / A"></td>
      <td><input type="text" class="table-input" name="apt_wx[]" value="${escapeHtml(weather)}" placeholder="Wx vs Minima, CAVOK"></td>
      <td><input type="text" class="table-input input-uppercase" name="apt_rwy[]" value="${escapeHtml(rwy)}" placeholder="33R / LDA"></td>
      <td><input type="text" class="table-input" name="apt_app[]" value="${escapeHtml(app)}" placeholder="ILS Cat I"></td>
      <td><textarea class="tem-textarea" name="apt_threats[]" placeholder="Stop, turnaround, single engine climb, curfew...">${escapeHtml(threats)}</textarea></td>
      <td class="no-print" style="text-align: center;">
        <button type="button" class="btn-remove-row" title="Delete row">✕</button>
      </td>
    `;
    tr.querySelector('.btn-remove-row').addEventListener('click', () => {
      tr.remove();
      triggerAutoSave();
    });
    airportsBody.appendChild(tr);
  }

  function seedDefaultRows() {
    // 5 default En-route threat rows
    for (let i = 0; i < 5; i++) {
      addEnrouteThreatRow();
    }
    // 10 default Waypoint rows
    for (let i = 0; i < 10; i++) {
      addWaypointRow();
    }
    // 8 default Airport rows
    for (let i = 0; i < 8; i++) {
      addAirportRow();
    }
  }

  // --- 7. Persistence (Auto-save / Restore / Reset) ---
  function initPersistence() {
    form.addEventListener('input', () => triggerAutoSave());
    form.addEventListener('change', () => triggerAutoSave());

    // Toggle All Prep Checklists
    btnToggleAllPrep.addEventListener('click', () => {
      const boxes = document.querySelectorAll('#prepChecklist input[type="checkbox"]');
      const allChecked = Array.from(boxes).every((b) => b.checked);
      boxes.forEach((b) => {
        b.checked = !allChecked;
        const parent = b.closest('.checklist-item');
        if (parent) parent.classList.toggle('checked', b.checked);
      });
      btnToggleAllPrep.textContent = allChecked ? 'Select All Checklists' : 'Deselect All Checklists';
      triggerAutoSave();
    });

    // Style checklist items on change
    document.querySelectorAll('.checklist-item input[type="checkbox"]').forEach((box) => {
      box.addEventListener('change', () => {
        const parent = box.closest('.checklist-item');
        if (parent) parent.classList.toggle('checked', box.checked);
      });
    });
  }

  function triggerAutoSave() {
    setSaveStatus('Saving...', 'var(--color-warning)');
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveToStorage();
    }, 300);
  }

  function setSaveStatus(text, color) {
    if (saveStatus) {
      saveStatus.textContent = text;
      const indicator = saveStatus.previousElementSibling;
      if (indicator) indicator.style.backgroundColor = color;
    }
  }

  function serializeFormData() {
    const data = {
      standardInputs: {},
      checkboxes: {},
      enrouteThreats: [],
      waypoints: [],
      airports: [],
      timestamp: new Date().toISOString(),
      version: '5.0'
    };

    // Standard inputs & textareas with distinct names
    form.querySelectorAll('input:not([type="checkbox"]):not([name$="[]"]), textarea:not([name$="[]"])').forEach((el) => {
      if (el.name) {
        data.standardInputs[el.name] = el.value;
      }
    });

    // Checkboxes
    form.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      if (box.name) {
        data.checkboxes[box.name] = box.checked;
      }
    });

    // Dynamic: Enroute threats
    enrouteThreatsBody.querySelectorAll('tr').forEach((row) => {
      const area = row.querySelector('input[name="enroute_area[]"]')?.value || '';
      const threat = row.querySelector('textarea[name="enroute_threat[]"]')?.value || '';
      const mitigation = row.querySelector('textarea[name="enroute_mitigation[]"]')?.value || '';
      data.enrouteThreats.push({ area, threat, mitigation });
    });

    // Dynamic: Waypoints
    waypointsBody.querySelectorAll('tr').forEach((row) => {
      const waypoint = row.querySelector('input[name="wp_name[]"]')?.value || '';
      const fir = row.querySelector('input[name="wp_fir[]"]')?.value || '';
      const req = row.querySelector('input[name="wp_req[]"]')?.value || '';
      data.waypoints.push({ waypoint, fir, req });
    });

    // Dynamic: Airports
    airportsBody.querySelectorAll('tr').forEach((row) => {
      const airport = row.querySelector('input[name="apt_code[]"]')?.value || '';
      const classVal = row.querySelector('input[name="apt_class[]"]')?.value || '';
      const weather = row.querySelector('input[name="apt_wx[]"]')?.value || '';
      const rwy = row.querySelector('input[name="apt_rwy[]"]')?.value || '';
      const app = row.querySelector('input[name="apt_app[]"]')?.value || '';
      const threats = row.querySelector('textarea[name="apt_threats[]"]')?.value || '';
      data.airports.push({ airport, classVal, weather, rwy, app, threats });
    });

    return data;
  }

  function saveToStorage() {
    try {
      const data = serializeFormData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      const now = new Date();
      const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} Z`;
      setSaveStatus(`Saved at ${timeStr}`, 'var(--color-success)');
    } catch (e) {
      console.error('Failed to save to local storage', e);
      setSaveStatus('Save Failed', 'var(--color-danger)');
    }
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      applyDataToForm(data);
      return true;
    } catch (e) {
      console.warn('Could not parse saved storage data', e);
      return false;
    }
  }

  function applyDataToForm(data) {
    if (!data) return;

    // Standard inputs
    if (data.standardInputs) {
      Object.keys(data.standardInputs).forEach((name) => {
        const el = form.querySelector(`[name="${name}"]`);
        if (el) {
          el.value = data.standardInputs[name];
        }
      });
    }

    // Checkboxes
    if (data.checkboxes) {
      Object.keys(data.checkboxes).forEach((name) => {
        const box = form.querySelector(`input[type="checkbox"][name="${name}"]`);
        if (box) {
          box.checked = !!data.checkboxes[name];
          const parent = box.closest('.checklist-item');
          if (parent) parent.classList.toggle('checked', box.checked);
        }
      });
    }

    // Dynamic: Enroute threats
    if (Array.isArray(data.enrouteThreats) && data.enrouteThreats.length > 0) {
      enrouteThreatsBody.innerHTML = '';
      data.enrouteThreats.forEach((row) => addEnrouteThreatRow(row.area, row.threat, row.mitigation));
    }

    // Dynamic: Waypoints
    if (Array.isArray(data.waypoints) && data.waypoints.length > 0) {
      waypointsBody.innerHTML = '';
      data.waypoints.forEach((row) => addWaypointRow(row.waypoint, row.fir, row.req));
    }

    // Dynamic: Airports
    if (Array.isArray(data.airports) && data.airports.length > 0) {
      airportsBody.innerHTML = '';
      data.airports.forEach((row) => addAirportRow(row.airport, row.classVal, row.weather, row.rwy, row.app, row.threats));
    }

    setSaveStatus('Loaded locally', 'var(--color-success)');
  }

  // --- 8. Export / Import / Print / Reset Actions ---
  function initActions() {
    // 8.1 Export JSON
    btnExportJson.addEventListener('click', () => {
      const data = serializeFormData();
      const flt = data.standardInputs['flight_number'] || 'Flight';
      const dep = data.standardInputs['dep_aerodrome'] || 'DEP';
      const arr = data.standardInputs['arr_aerodrome'] || 'ARR';
      const filename = `Emirates_Prep_${flt.replace(/\s+/g, '')}_${dep.replace(/[^A-Za-z0-9]/g, '')}-${arr.replace(/[^A-Za-z0-9]/g, '')}.json`;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Flight data exported as JSON');
    });

    // 8.2 Import JSON
    btnImportJson.addEventListener('click', () => {
      jsonFileInput.value = '';
      jsonFileInput.click();
    });

    jsonFileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          applyDataToForm(parsed);
          saveToStorage();
          showToast('Flight data imported successfully!');
        } catch (err) {
          alert('Invalid JSON file format.');
        }
      };
      reader.readAsText(file);
    });

    // 8.3 Print / PDF
    btnPrint.addEventListener('click', () => {
      // Ensure all pages are visible before printing
      const previousTab = activeTabId;
      switchTab('all-pages');

      setTimeout(() => {
        window.print();
        // Restore tab after print dialog closes
        setTimeout(() => {
          if (previousTab !== 'all-pages') {
            switchTab(previousTab);
          }
        }, 500);
      }, 150);
    });

    // 8.4 Reset Modal
    btnResetForm.addEventListener('click', () => {
      resetModal.classList.add('active');
    });

    btnCancelReset.addEventListener('click', () => {
      resetModal.classList.remove('active');
    });

    btnConfirmReset.addEventListener('click', () => {
      resetModal.classList.remove('active');
      localStorage.removeItem(STORAGE_KEY);
      form.reset();

      document.querySelectorAll('.checklist-item').forEach((item) => item.classList.remove('checked'));
      clearMatrixHighlights();

      enrouteThreatsBody.innerHTML = '';
      waypointsBody.innerHTML = '';
      airportsBody.innerHTML = '';
      seedDefaultRows();

      triggerAutoSave();
      showToast('Form cleared and reset to fresh flight.');
    });

    // 8.5 Sample Flight (DXB -> LHR, EK007)
    btnSampleFlight.addEventListener('click', () => {
      loadSampleFlight();
    });
  }

  function loadSampleFlight() {
    const sample = {
      standardInputs: {
        flight_number: 'EK 007',
        callsign: 'UAE 7',
        registration: 'A6-EOE',
        engines: 'EA GP7200',
        dep_aerodrome: 'DXB / OMDB',
        dep_utc: 'STD 03:00 Z',
        dep_lt: 'STD 07:00 LT (+4)',
        dep_comp_freq: '131.725',
        arr_aerodrome: 'LHR / EGLL',
        arr_utc: 'ETA 10:45 Z',
        arr_lt: 'ETA 10:45 LT (0)',
        arr_comp_freq: '131.850',
        altn_aerodrome: 'LGW / EGKK',
        altn_utc: 'ETA 11:30 Z',
        altn_lt: 'ETA 11:30 LT (0)',
        altn_comp_freq: '131.600',

        // Departure
        dep_weather: 'OMDB 250200Z 12006KT CAVOK 28/19 Q1014 NOSIG. RWY 30R in use. Nil sig weather.',
        dep_preflight_threats: 'APU bleed deferred per MEL 36-11-01 (Cross-bleed start required). Busy morning pushback window.',
        dep_preflight_mitigations: 'Coordinate external air start unit with ground early. Cross-bleed engine start checklist. Cabin crew sterile brief.',
        dep_taxi_threats: 'TWY K & M complex intersection hot spot. Heavy morning departures, high taxi speeds on outer perimeter.',
        dep_taxi_mitigations: 'Both pilots on airport moving map. Verify all crossing clearances explicitly. Monitor ground radar frequency.',
        dep_takeoff_threats: 'High ambient temperature (34°C forecast), high gross weight takeoff (560t). Density altitude effect on climb gradient.',
        dep_takeoff_mitigations: 'NADP 1 noise abatement profile. Review EOSID profile RWY 30R (climb straight ahead to 4.0 DME DX then right turn to radial 345). TOGA thrust verified.',
        dep_climb_threats: 'NABIX departure level-off at 4000ft constraint. Crossing traffic in Dubai TMA.',
        dep_climb_mitigations: 'Verify altitude constraint armed on MCP & FMA. Both pilots actively scan TCAS.',

        // Notes
        waypoint_other_notes: 'Kuwait FIR: CPDLC login OKAC. Baghdad FIR: CPDLC ORBB, secondary HF 8867 kHz. Ankara FIR: CPDLC LTAA. Oceanic contingency not applicable.',
        airports_other_notes: 'LTAC (Ankara) & EPWA (Warsaw) adequate and suitable. Full A380 ground handling available at EDDF if divert needed.',

        // Arrival
        arr_weather: 'EGLL 250920Z 24014G22KT 9999 BKN025 14/09 Q1018 TEMPO 4000 -RA BKN012. Expected RWY 27L.',
        arr_star_threats: 'BIG 1E STAR high traffic density, holding likely at BNN or OCK stacks. Speed constraints at 250kt below FL100.',
        arr_star_mitigations: 'Early top-of-descent calculation. Configure speed brakes proactively to comply with 220kt at holding fix.',
        arr_app_threats: 'Gusty crosswind (240/14G22KT on RWY 27L), low clouds (BKN012 TEMPO). Wake turbulence separation behind preceding heavy.',
        arr_app_mitigations: 'ILS CAT I stabilized approach criteria by 1000ft. Flap 30 landing, autobrake 3. Crosscheck wake separation.',
        arr_missed_threats: 'MISAP altitude 3000ft straight ahead to LON VOR, close proximity to RAF Northolt airspace.',
        arr_missed_mitigations: 'Pre-brief missed approach altitude on MCP before FAF. Positive climb gear up, TOGA thrust.',
        arr_landing_threats: 'Wet runway during rain showers, high exit speed on rapid exit taxiways (N or R).',
        arr_landing_mitigations: 'Autobrake 3 with prompt reverse idle to reverse max. Do not force rapid exit taxiway if speed > 40kt.',
        arr_taxi_threats: 'Complex taxiway network, crossing RWY 27R active. Congestion around Terminal 3 stands.',
        arr_taxi_mitigations: 'Stop before any runway holding point. Wait for explicit crossing clearance. Follow green taxiway centerlines.',
        arr_postflight_threats: 'Fatigue after 7.5 hr flight leg.',
        arr_postflight_mitigations: 'Structured LIFUS debrief with trainer. Complete electronic flight log (eTechLog).',

        // Alternate
        altn_weather: 'EGKK 250920Z 23015KT 9999 BKN030 15/10 Q1018 NOSIG. RWY 26L in use.',
        altn_div_threats: 'Divert from London holding stack with minimum diversion fuel (5.2t). High ATC workload on London control.',
        altn_div_mitigations: 'Declare diversion to ATC promptly. Follow pre-briefed route MAY VOR to EGKK. Monitor reserve fuel strictly.',
        altn_arr_threats: 'TIMBA STAR into Gatwick with intermediate speed restrictions.',
        altn_arr_mitigations: 'Review Gatwick charts early in cruise. Program ALTN F-PLN in FMS.',
        altn_app_threats: 'Single runway operations at Gatwick, high runway occupancy time.',
        altn_app_mitigations: 'Brief ILS RWY 26L, vacate expeditiously via rapid exit taxiway.',
        altn_missed_threats: 'Limited secondary diversion fuel remaining if missed approach executed.',
        altn_missed_mitigations: 'Commit to land at Gatwick once below minimum divert fuel.',
        altn_landing_threats: 'Downslope on RWY 26L, wet surface.',
        altn_landing_mitigations: 'Autobrake MED/3, full reverse thrust until safe taxi speed.',
        altn_taxi_threats: 'Unfamiliar taxi routes, Pier 6 stands.',
        altn_taxi_mitigations: 'Request progressive taxi from Gatwick Ground.',
        altn_postflight_threats: 'Emirates diversion handling, passenger disembarkation away from hub.',
        altn_postflight_mitigations: 'Establish contact with Emirates Hub Control (IOC) via SATCOM/VHF.'
      },
      checkboxes: {
        prep_fci_fcn: true,
        prep_lido_mbriefing: true,
        prep_lido_mpilot: true,
        prep_cci_aoi: true,
        prep_asr: true,
        prep_flight_pulse: true,
        prep_omc_brief: true,
        prep_lido_rsi: true,
        prep_lido_crar: true,
        prep_noaa_space: true,
        prep_layover_brief: true,
        enroute_omc_brief: true,
        enroute_lido_rsi: true,
        enroute_lido_crar: true,
        enroute_notams: true
      },
      enrouteThreats: [
        {
          area: 'Middle East (OMAE / OBBB / OKAC)',
          threat: 'High level military exercise areas & restricted airspace activations.',
          mitigation: 'Verify route compliance per current NOTAMs and LIDO briefing. Stay strictly on published airway.'
        },
        {
          area: 'Baghdad FIR (ORBB)',
          threat: 'Contingency routing, civil unrest advisory, radio comms handover delays.',
          mitigation: 'Dual VHF listening watch (121.5 / 128.0). Maintain FL360+ per Emirates security directive.'
        },
        {
          area: 'Ankara FIR (LTAA) / Turkey',
          threat: 'Mountain waves and clear air turbulence (CAT) over Anatolian plateau.',
          mitigation: 'Seatbelt signs ON prior to turbulent sector. Speed buffer margin Vmo-20kt.'
        },
        {
          area: 'Central Europe (Romania / Hungary / Austria)',
          threat: 'High traffic congestion in Maastricht / Karlsruhe airspace during peak arrival banks.',
          mitigation: 'Maintain CPDLC connectivity. Monitor fuel burn vs flight plan closely.'
        },
        {
          area: 'Western Europe / UK FIR (EGTT)',
          threat: 'Weather frontal system, icing layer between FL140-FL220 on descent.',
          mitigation: 'Engine anti-ice ON in icing conditions. Early descent planning to avoid holding in severe icing.'
        }
      ],
      waypoints: [
        { waypoint: 'NABIX', fir: 'OMAE', req: 'SID limit 4000ft. Cross-check RADAR climb.' },
        { waypoint: 'KUBSO', fir: 'OBBB', req: 'FIR boundary. Bahrain ATC transfer.' },
        { waypoint: 'TASMI', fir: 'OKAC', req: 'Kuwait FIR. CPDLC logon OKAC.' },
        { waypoint: 'ALVAP', fir: 'ORBB', req: 'Baghdad FIR boundary. LIDO CRAR oxygen escape route 2.' },
        { waypoint: 'SISIN', fir: 'ORBB', req: 'Maintain FL380 minimum. Strict tactical tracking.' },
        { waypoint: 'LONSU', fir: 'LTAA', req: 'Ankara FIR transfer. CPDLC logon LTAA. HF secondary 5598.' },
        { waypoint: 'TEGRI', fir: 'LBSR', req: 'Sofia FIR. European airspace entry.' },
        { waypoint: 'BAGNO', fir: 'LHCC', req: 'Budapest FIR.' },
        { waypoint: 'LUXEM', fir: 'EDVV', req: 'Maastricht UAC. Speed limit 250kt below FL100.' },
        { waypoint: 'KENTO', fir: 'EGTT', req: 'London Control. Prepare for BIG 1E arrival.' }
      ],
      airports: [
        { airport: 'OERK (RUH)', classVal: 'Adequate', weather: 'CAVOK 30°C', rwy: '33L/33R', app: 'ILS CAT I', threats: 'High density altitude in summer, adequate for B777/A380.' },
        { airport: 'ORBI (BGW)', classVal: 'Emergency Only', weather: 'CAVOK 25°C', rwy: '15L', app: 'ILS', threats: 'Security restrictions; use only in dire emergency.' },
        { airport: 'LTAC (ESB)', classVal: 'Suitable', weather: 'BKN040 16°C', rwy: '03R', app: 'ILS Cat II', threats: 'High terrain south of aerodrome. Engine out climb profile.' },
        { airport: 'LBSF (SOF)', classVal: 'Suitable', weather: 'FEW030 18°C', rwy: '09', app: 'ILS Cat I', threats: 'Mountainous terrain on approach; follow charted STAR.' },
        { airport: 'LHBP (BUD)', classVal: 'Suitable', weather: 'CAVOK 19°C', rwy: '31R', app: 'ILS Cat I', threats: 'Good alternate, standard turnaround services.' },
        { airport: 'EDDF (FRA)', classVal: 'Major Suitable', weather: 'BKN020 15°C', rwy: '25L/07R', app: 'ILS Cat III', threats: 'A380/B777 hub handling, slots & curfew after 21:00Z.' },
        { airport: 'EBBR (BRU)', classVal: 'Suitable', weather: 'SCT025 14°C', rwy: '25L', app: 'ILS Cat II', threats: 'Close to LHR, excellent fuel divert choice.' },
        { airport: 'EGKK (LGW)', classVal: 'Commercial ALTN', weather: 'BKN030 15°C', rwy: '26L', app: 'ILS Cat I', threats: 'Designated flight plan alternate, 45 min ground transit.' }
      ]
    };

    applyDataToForm(sample);
    saveToStorage();

    // Also highlight Middle East & Europe in Matrix
    const meRow = briefingsMatrix.querySelector('tr[data-row="middle-east"]');
    if (meRow) {
      meRow.classList.add('active-row');
      meRow.querySelectorAll('td.has-x').forEach((cell) => cell.classList.add('active-cell'));
    }

    showToast('Loaded sample flight EK007 (DXB → LHR)');
  }

  // --- 9. Utility: Toast Notification ---
  function showToast(message) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 20);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Run on DOM loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
