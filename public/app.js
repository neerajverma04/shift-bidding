/**
 * YUL Airport Shift Bidding Live Client Application
 * Features:
 * - Real-time Google Sheets sync & auto-refresh
 * - Multi-select Gender filtering (Male, Female, Mixed switchable, Open general)
 * - Multi-select Time periods (Early, Morning, Afternoon, Evening)
 * - Custom Time Slot Window (e.g. 10:00 AM to 5:00 PM)
 * - Priority Shortlist with live claim alerts
 * - Seniority Bidding Roster & Position calculator
 * - Dual view: Responsive Schedule Table & Visual Cards
 * - Dark & Light themes
 */

// Application State
const state = {
  shifts: [],
  roster: [],
  stats: null,
  lastUpdated: null,
  activeTab: 'explorer',
  viewMode: localStorage.getItem('yul_view_mode') || (window.innerWidth < 768 ? 'grid' : 'table'),
  theme: localStorage.getItem('yul_theme') || 'dark',
  wishlist: JSON.parse(localStorage.getItem('yul_wishlist') || '[]'),
  selectedShifts: new Set(),
  previouslyFree: new Set(),
  autoRefreshInterval: 30, // seconds
  autoRefreshTimer: null,
  countdownTimer: null,
  secondsUntilNextRefresh: 30,
  filters: {
    search: '',
    status: 'free', // 'free', 'all', 'taken'
    type: 'all',
    location: 'all',
    npstPosts: new Set(['all']),
    pattern: 'all',
    ftpt: 'all',
    daysOff: 'all',
    genders: new Set(['male', 'female', 'mixed', 'open']),
    timeMode: 'periods', // 'periods' or 'custom'
    timePeriods: new Set(['early_morning', 'morning', 'afternoon', 'evening']),
    customTimeFrom: '10:00',
    customTimeTo: '17:00',
    sortBy: 'line_asc'
  }
};

// DOM Elements
const elements = {
  syncStatusLabel: document.getElementById('syncStatusLabel'),
  syncTimeLabel: document.getElementById('syncTimeLabel'),
  autoRefreshSelect: document.getElementById('autoRefreshSelect'),
  refreshBtn: document.getElementById('refreshBtn'),
  installAppBtn: document.getElementById('installAppBtn'),
  themeToggle: document.getElementById('themeToggle'),
  themeIcon: document.getElementById('themeIcon'),
  
  // KPI Cards
  kpiFreeCard: document.getElementById('kpiFreeCard'),
  kpiWeekendCard: document.getElementById('kpiWeekendCard'),
  kpiFTCard: document.getElementById('kpiFTCard'),
  kpiPTCard: document.getElementById('kpiPTCard'),
  kpiTakenCard: document.getElementById('kpiTakenCard'),
  kpiWishlistCard: document.getElementById('kpiWishlistCard'),

  // KPI Values
  kpiFreeCount: document.getElementById('kpiFreeCount'),
  kpiFreePercent: document.getElementById('kpiFreePercent'),
  kpiWeekendCount: document.getElementById('kpiWeekendCount'),
  kpiFTCount: document.getElementById('kpiFTCount'),
  kpiPTCount: document.getElementById('kpiPTCount'),
  kpiTakenCount: document.getElementById('kpiTakenCount'),
  kpiWishlistCount: document.getElementById('kpiWishlistCount'),
  kpiWishlistFree: document.getElementById('kpiWishlistFree'),

  // Tabs & Panes
  navTabs: document.querySelectorAll('.nav-tab'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  explorerTabCounter: document.getElementById('explorerTabCounter'),
  wishlistTabCounter: document.getElementById('wishlistTabCounter'),
  rosterTabCounter: document.getElementById('rosterTabCounter'),

  // Filters
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  statusFilterControl: document.getElementById('statusFilterControl'),
  filterType: document.getElementById('filterType'),
  filterLocation: document.getElementById('filterLocation'),
  filterPattern: document.getElementById('filterPattern'),
  filterFtPt: document.getElementById('filterFtPt'),
  filterDaysOff: document.getElementById('filterDaysOff'),

  // Department & NPST Sub-Post Multi-Select
  deptPillsBar: document.getElementById('deptPillsBar'),
  npstPostSection: document.getElementById('npstPostSection'),
  npstMultiSelect: document.getElementById('npstMultiSelect'),
  cntAllDepts: document.getElementById('cntAllDepts'),
  cntNpst: document.getElementById('cntNpst'),
  cntDi: document.getElementById('cntDi'),
  cntTb: document.getElementById('cntTb'),
  cntNpsv: document.getElementById('cntNpsv'),
  cntHbs: document.getElementById('cntHbs'),
  cntVar: document.getElementById('cntVar'),
  cntPostNpsDi: document.getElementById('cntPostNpsDi'),
  cntPostSupport: document.getElementById('cntPostSupport'),

  // Bulk Actions
  bulkActionsBar: document.getElementById('bulkActionsBar'),
  masterShiftCheckbox: document.getElementById('masterShiftCheckbox'),
  selectedCountBadge: document.getElementById('selectedCountBadge'),
  bulkWishlistCount: document.getElementById('bulkWishlistCount'),
  
  // Gender Multi-Select
  genderMultiSelect: document.getElementById('genderMultiSelect'),
  cntMale: document.getElementById('cntMale'),
  cntFemale: document.getElementById('cntFemale'),
  cntMixed: document.getElementById('cntMixed'),
  cntOpen: document.getElementById('cntOpen'),

  // Time Multi-Select & Custom Slot
  timePeriodSelect: document.getElementById('timePeriodSelect'),
  customTimeToggleBtn: document.getElementById('customTimeToggleBtn'),
  customTimeBox: document.getElementById('customTimeBox'),
  timeFromSelect: document.getElementById('timeFromSelect'),
  timeToSelect: document.getElementById('timeToSelect'),
  customTimeHint: document.getElementById('customTimeHint'),
  cntEarly: document.getElementById('cntEarly'),
  cntMorning: document.getElementById('cntMorning'),
  cntAfternoon: document.getElementById('cntAfternoon'),
  cntEvening: document.getElementById('cntEvening'),

  sortBySelect: document.getElementById('sortBySelect'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),
  matchingCountLabel: document.getElementById('matchingCountLabel'),
  activeFilterChips: document.getElementById('activeFilterChips'),

  // Filter Drawer & Badges
  filterDrawer: document.getElementById('filterDrawer'),
  filterDrawerToggleBtn: document.getElementById('filterDrawerToggleBtn'),
  filterActiveBadge: document.getElementById('filterActiveBadge'),
  dotDrawerTime: document.getElementById('dotDrawerTime'),
  dotDrawerGender: document.getElementById('dotDrawerGender'),
  dotDrawerDaysOff: document.getElementById('dotDrawerDaysOff'),
  dotDrawerPattern: document.getElementById('dotDrawerPattern'),
  dotDrawerLoc: document.getElementById('dotDrawerLoc'),

  // Views
  viewTableBtn: document.getElementById('viewTableBtn'),
  viewGridBtn: document.getElementById('viewGridBtn'),
  shiftsContainer: document.getElementById('shiftsContainer'),

  // Wishlist
  wishlistContainer: document.getElementById('wishlistContainer'),
  wishlistAlertBox: document.getElementById('wishlistAlertBox'),
  clearWishlistBtn: document.getElementById('clearWishlistBtn'),
  exportWishlistBtn: document.getElementById('exportWishlistBtn'),

  // Roster
  rosterSearchInput: document.getElementById('rosterSearchInput'),
  rosterDayFilter: document.getElementById('rosterDayFilter'),
  myRosterPositionCard: document.getElementById('myRosterPositionCard'),
  rosterTableBody: document.getElementById('rosterTableBody'),

  // Analytics
  analyticsDeptList: document.getElementById('analyticsDeptList'),
  analyticsPatternList: document.getElementById('analyticsPatternList'),
  analyticsTimeList: document.getElementById('analyticsTimeList'),
  analyticsWeekendList: document.getElementById('analyticsWeekendList'),

  // Modal
  shiftModal: document.getElementById('shiftModal'),
  modalCloseBtn: document.getElementById('modalCloseBtn'),
  modalCloseFooterBtn: document.getElementById('modalCloseFooterBtn'),
  modalLineBadge: document.getElementById('modalLineBadge'),
  modalTitle: document.getElementById('modalTitle'),
  modalBody: document.getElementById('modalBody'),
  modalWishlistBtn: document.getElementById('modalWishlistBtn')
};

// -------------------------------------------------------------
// Initialize App
// -------------------------------------------------------------
async function init() {
  populateTimeDropdowns();
  applyTheme(state.theme);
  if (state.viewMode === 'grid' && elements.viewGridBtn && elements.viewTableBtn) {
    elements.viewGridBtn.classList.add('active');
    elements.viewTableBtn.classList.remove('active');
  }
  setupEventListeners();
  setupAutoRefresh();
  await loadShiftsData(false);
}

// -------------------------------------------------------------
// Populate Time Dropdowns
// -------------------------------------------------------------
function populateTimeDropdowns() {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      const hStr = h.toString().padStart(2, '0');
      const mStr = m.toString().padStart(2, '0');
      const time24 = `${hStr}:${mStr}`;
      
      const period = h < 12 ? 'AM' : 'PM';
      let h12 = h % 12;
      if (h12 === 0) h12 = 12;
      const label = `${time24} (${h12}:${mStr} ${period})`;
      times.push({ val: time24, label });
    }
  }

  const fromSelect = elements.timeFromSelect;
  const toSelect = elements.timeToSelect;
  if (!fromSelect || !toSelect) return;

  fromSelect.innerHTML = times.map(t => `<option value="${t.val}">${t.label}</option>`).join('');
  
  const toTimes = [...times, { val: '23:59', label: '23:59 (11:59 PM End)' }];
  toSelect.innerHTML = toTimes.map(t => `<option value="${t.val}">${t.label}</option>`).join('');

  fromSelect.value = state.filters.customTimeFrom;
  toSelect.value = state.filters.customTimeTo;
}

// -------------------------------------------------------------
// Google Sheets JSONP Fetcher & Parser (Serverless / GitHub Pages)
// -------------------------------------------------------------
const SPREADSHEET_ID = '19mkckofhK9biJPTpJW-YacQqPaDRYEYx1gOkKI7xQM4';
const GID_ALL_LINES = '738903771';
const GID_ROSTER = '2100178176';

function fetchGoogleSheetsJsonp(gid) {
  return new Promise((resolve, reject) => {
    const cbName = 'gvizCallback_' + Math.random().toString(36).substring(2, 9);
    const timeout = setTimeout(() => {
      delete window[cbName];
      if (script.parentNode) script.remove();
      reject(new Error('Google Sheets request timed out'));
    }, 15000);

    window[cbName] = function(data) {
      clearTimeout(timeout);
      delete window[cbName];
      if (script.parentNode) script.remove();
      if (data && data.table) {
        resolve(data.table);
      } else {
        reject(new Error('Invalid Google Sheets response structure'));
      }
    };

    const script = document.createElement('script');
    script.src = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=responseHandler:${cbName}&gid=${gid}&_t=${Date.now()}`;
    script.onerror = function() {
      clearTimeout(timeout);
      delete window[cbName];
      if (script.parentNode) script.remove();
      reject(new Error(`Failed to load Google Sheets gid ${gid}`));
    };
    document.head.appendChild(script);
  });
}

function parseGoogleSheetsGviz(linesTable, rosterTable) {
  const getVal = (cell) => {
    if (!cell) return '';
    if (cell.f !== undefined && cell.f !== null) return String(cell.f).trim();
    if (cell.v !== undefined && cell.v !== null) return String(cell.v).trim();
    return '';
  };

  const roster = [];
  const takenMap = new Map();
  if (rosterTable && rosterTable.rows) {
    for (let i = 0; i < rosterTable.rows.length; i++) {
      const row = rosterTable.rows[i];
      if (!row || !row.c || row.c.length < 8) continue;
      const rankStr = getVal(row.c[2]);
      if (rankStr && !isNaN(parseInt(rankStr))) {
        const rank = parseInt(rankStr);
        const lineNoStr = getVal(row.c[3]);
        const lineNo = lineNoStr && !isNaN(parseInt(lineNoStr)) ? parseInt(lineNoStr) : null;
        const bidder = {
          date: getVal(row.c[0]),
          time: getVal(row.c[1]),
          rank,
          lineNo,
          pref: getVal(row.c[4]),
          ee: getVal(row.c[5]),
          lms: getVal(row.c[6]),
          name: getVal(row.c[7]),
          ftpt: getVal(row.c[8]),
          gender: getVal(row.c[9]),
          cert: getVal(row.c[10])
        };
        roster.push(bidder);
        if (lineNo) takenMap.set(lineNo, bidder);
      }
    }
  }

  const shifts = [];
  const dayKeys = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
  if (linesTable && linesTable.rows) {
    for (let i = 0; i < linesTable.rows.length; i++) {
      const row = linesTable.rows[i];
      if (!row || !row.c || row.c.length < 5) continue;
      const empNo = getVal(row.c[0]);
      const empName = getVal(row.c[1]);
      const lineNoStr = getVal(row.c[2]);
      if (!lineNoStr || isNaN(parseInt(lineNoStr))) continue;
      const lineNo = parseInt(lineNoStr);

      const schedule = {};
      const offDays = [];
      const workDays = [];
      const startTimes = [];
      const endTimes = [];

      dayKeys.forEach((d, idx) => {
        const rawVal = getVal(row.c[3 + idx]);
        const dayNote = getVal(row.c[17 + idx]);
        const isOff = rawVal === 'X' || rawVal.toUpperCase() === 'X' || !rawVal;
        const locInfo = formatLocationInfo(rawVal);
        let start = null, end = null;
        if (!isOff) {
          const match = rawVal.match(/(\d{2})(\d{2})-(\d{2})(\d{2})/);
          if (match) {
            start = `${match[1]}:${match[2]}`;
            end = `${match[3]}:${match[4]}`;
            startTimes.push(start);
            endTimes.push(end);
          }
          workDays.push(d);
        } else {
          offDays.push(d);
        }
        schedule[d] = {
          raw: rawVal,
          note: dayNote,
          isOff,
          start,
          end,
          location: locInfo.location,
          shortLoc: locInfo.shortLoc,
          locSlug: locInfo.slug
        };
      });

      const shiftLocations = [];
      const shiftShortLocs = [];
      dayKeys.forEach(d => {
        const item = schedule[d];
        if (!item.isOff && item.shortLoc) {
          if (!shiftShortLocs.includes(item.shortLoc)) shiftShortLocs.push(item.shortLoc);
          if (item.location && !shiftLocations.includes(item.location)) shiftLocations.push(item.location);
        }
      });
      const locationSummary = shiftShortLocs.join(' · ');

      const week = getVal(row.c[10]);
      const genderReq = getVal(row.c[11]);
      let genderCategory = 'open';
      const gUpper = genderReq.toUpperCase();
      if (gUpper.includes('FEMALE')) genderCategory = 'female';
      else if (gUpper.includes('MALE')) genderCategory = 'male';
      else if (gUpper.includes('MIX')) genderCategory = 'mixed';

      const shiftPattern = getVal(row.c[12]);
      const hours = parseInt(getVal(row.c[13])) || 40;
      const type = getVal(row.c[14]) || 'Other';
      const notes = getVal(row.c[15]);
      const ftpt = getVal(row.c[26]) || (hours >= 35 ? 'FT' : 'PT');

      const hasEmpInSheet1 = (empNo && empNo !== '-' && empNo !== '') || (empName && empName !== '-' && empName !== '');
      const rosterAssignment = takenMap.get(lineNo);
      const isTaken = hasEmpInSheet1 || !!rosterAssignment;
      let assignedTo = null;
      if (rosterAssignment) {
        assignedTo = {
          name: rosterAssignment.name,
          ee: rosterAssignment.ee,
          rank: rosterAssignment.rank,
          time: rosterAssignment.time,
          date: rosterAssignment.date
        };
      } else if (hasEmpInSheet1) {
        assignedTo = {
          name: empName || 'Assigned',
          ee: empNo || '',
          rank: null,
          time: null,
          date: null
        };
      }

      const primaryStart = startTimes.length > 0 ? startTimes[0] : null;
      let timePeriod = 'Other';
      if (primaryStart) {
        const [h, m] = primaryStart.split(':').map(Number);
        const mins = h * 60 + m;
        if (mins >= 60 && mins <= 330) timePeriod = 'Early Morning (01:00-05:30)';
        else if (mins > 330 && mins <= 700) timePeriod = 'Morning (05:30-11:40)';
        else if (mins > 700 && mins <= 960) timePeriod = 'Afternoon (11:40-16:00)';
        else timePeriod = 'Evening / Night (16:00+)';
      }

      const hasSatOff = offDays.includes('Sat');
      const hasSunOff = offDays.includes('Sun');
      const hasWeekendOff = hasSatOff && hasSunOff;
      const hasFriSatOff = offDays.includes('Fri') && hasSatOff;
      const hasSunMonOff = hasSunOff && offDays.includes('Mon');

      shifts.push({
        lineNo,
        week,
        genderReq,
        genderCategory,
        shiftPattern,
        hours,
        type,
        notes,
        ftpt,
        schedule,
        locations: shiftLocations,
        shortLocations: shiftShortLocs,
        locationSummary,
        offDays,
        workDays,
        primaryStart,
        timePeriod,
        hasSatOff,
        hasSunOff,
        hasWeekendOff,
        hasFriSatOff,
        hasSunMonOff,
        isTaken,
        assignedTo
      });
    }
  }

  const totalLines = shifts.length;
  const takenLines = shifts.filter(s => s.isTaken).length;
  const freeLines = totalLines - takenLines;
  const freeWeekendOff = shifts.filter(s => !s.isTaken && s.hasWeekendOff).length;
  const freeFT = shifts.filter(s => !s.isTaken && s.ftpt === 'FT').length;
  const freePT = shifts.filter(s => !s.isTaken && s.ftpt === 'PT').length;

  return {
    timestamp: new Date().toISOString(),
    stats: {
      totalLines,
      takenLines,
      freeLines,
      freeWeekendOff,
      freeFT,
      freePT,
      totalBidders: roster.length,
      awardedBidders: takenMap.size
    },
    shifts,
    roster
  };
}

// -------------------------------------------------------------
// Data Fetching & Syncing
// -------------------------------------------------------------
async function loadShiftsData(force = false) {
  const spinIcon = elements.refreshBtn ? elements.refreshBtn.querySelector('.spin-icon') : null;
  if (spinIcon) spinIcon.classList.add('spinning');
  if (elements.syncStatusLabel) elements.syncStatusLabel.textContent = 'Syncing...';

  try {
    let data = null;
    const isGitHubPages = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';

    // 1. Try local node server if not running on GitHub Pages
    if (!isGitHubPages) {
      try {
        const url = `/api/data${force ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        if (response.ok) {
          data = await response.json();
          if (elements.syncStatusLabel) elements.syncStatusLabel.textContent = 'Live Connected';
        }
      } catch (e) {
        console.info('Node /api/data endpoint unavailable, switching to direct Google Sheets live fetch.');
      }
    }

    // 2. Fetch directly from Google Sheets via JSONP (works 100% on GitHub Pages & phones with no server)
    if (!data) {
      try {
        const [linesTable, rosterTable] = await Promise.all([
          fetchGoogleSheetsJsonp(GID_ALL_LINES),
          fetchGoogleSheetsJsonp(GID_ROSTER)
        ]);
        data = parseGoogleSheetsGviz(linesTable, rosterTable);
        if (elements.syncStatusLabel) elements.syncStatusLabel.textContent = 'Live Connected (Google)';
      } catch (gvizErr) {
        console.warn('Direct Google Sheets fetch failed, falling back to cached/static data:', gvizErr);
        // 3. Fallback to static shifts_data.json if offline
        const staticRes = await fetch('shifts_data.json');
        if (staticRes.ok) {
          data = await staticRes.json();
          if (elements.syncStatusLabel) elements.syncStatusLabel.textContent = 'Offline (Cached Data)';
        } else {
          throw gvizErr;
        }
      }
    }

    state.shifts = data.shifts || [];
    state.shifts.forEach(normalizeShiftLocations);
    state.roster = data.roster || [];
    state.stats = data.stats || {};
    state.lastUpdated = new Date();

    // Check if any wishlist items were taken
    checkWishlistAlerts();

    // Remember currently free items
    state.previouslyFree = new Set(
      state.shifts.filter(s => !s.isTaken).map(s => s.lineNo)
    );

    updateSyncTimeDisplay();
    updateKpis();
    renderExplorer();
    renderWishlist();
    renderRoster();
    renderAnalytics();
  } catch (err) {
    console.error('Failed to load data:', err);
    if (elements.syncStatusLabel) elements.syncStatusLabel.textContent = 'Sync Warning (Offline)';
    if (elements.syncTimeLabel) elements.syncTimeLabel.textContent = 'Retrying automatically...';
  } finally {
    if (spinIcon) spinIcon.classList.remove('spinning');
    state.secondsUntilNextRefresh = state.autoRefreshInterval;
  }
}

function updateSyncTimeDisplay() {
  if (!state.lastUpdated) return;
  const now = new Date();
  const diffSecs = Math.floor((now - state.lastUpdated) / 1000);
  
  let timeStr = 'Just now';
  if (diffSecs > 5) timeStr = `${diffSecs}s ago`;
  if (diffSecs > 60) timeStr = `${Math.floor(diffSecs / 60)}m ago`;

  if (state.autoRefreshInterval > 0) {
    elements.syncTimeLabel.textContent = `Updated: ${timeStr} • Next in ${state.secondsUntilNextRefresh}s`;
  } else {
    elements.syncTimeLabel.textContent = `Updated: ${timeStr} • Auto-refresh paused`;
  }
}

function setupAutoRefresh() {
  if (state.autoRefreshTimer) clearInterval(state.autoRefreshTimer);
  if (state.countdownTimer) clearInterval(state.countdownTimer);

  state.secondsUntilNextRefresh = state.autoRefreshInterval;

  if (state.autoRefreshInterval > 0) {
    state.countdownTimer = setInterval(() => {
      state.secondsUntilNextRefresh--;
      if (state.secondsUntilNextRefresh <= 0) {
        state.secondsUntilNextRefresh = state.autoRefreshInterval;
        loadShiftsData(true);
      }
      updateSyncTimeDisplay();
    }, 1000);
  } else {
    updateSyncTimeDisplay();
  }
}

// -------------------------------------------------------------
// Gender Category Helper
// -------------------------------------------------------------
function getShiftGenderCat(shift) {
  if (shift.genderCategory) return shift.genderCategory;
  const g = (shift.genderReq || '').toUpperCase();
  if (g.includes('FEMALE')) return 'female';
  if (g.includes('MALE')) return 'male';
  if (g.includes('MIX')) return 'mixed';
  return 'open';
}

function formatLocationInfo(rawVal) {
  if (!rawVal || rawVal === 'X' || rawVal.toUpperCase() === 'X') {
    return { location: '', shortLoc: '', slug: '' };
  }
  let loc = rawVal.replace(/^\s*\d{2}\d{2}\s*-\s*\d{2}\d{2}\s*:?/, '').trim();
  loc = loc.replace(/[:\-]+$/, '').trim().replace(/\s+/g, ' ');
  if (!loc && rawVal) {
    loc = rawVal;
  }
  
  const u = loc.toUpperCase();
  let shortLoc = loc;
  let slug = 'default';

  if (u.includes('51')) {
    shortLoc = '51';
    slug = '51';
  } else if (u.includes('CTX')) {
    if (u.includes('CTRL')) {
      shortLoc = 'CTX Ctrl';
      slug = 'ctx-ctrl';
    } else if (u.includes('SEARCH') || u.includes('SRCH')) {
      shortLoc = 'CTX Srch';
      slug = 'ctx-srch';
    } else {
      shortLoc = 'CTX';
      slug = 'ctx';
    }
  } else if (u.includes('GATE 79') || u.includes('G79')) {
    shortLoc = 'Gate 79';
    slug = 'g79';
  } else if (u.includes('JAVA U') || u.includes('JAVAU')) {
    shortLoc = 'Java U';
    slug = 'javau';
  } else if (u.includes('Y38')) {
    shortLoc = 'Y38';
    slug = 'y38';
  } else if (u.includes('SP1')) {
    shortLoc = 'SP1';
    slug = 'sp1';
  } else if (u.includes('SP2')) {
    shortLoc = 'SP2';
    slug = 'sp2';
  } else if (u.includes('SP4')) {
    shortLoc = 'SP4';
    slug = 'sp4';
  } else if (u.includes('SP5')) {
    shortLoc = 'SP5';
    slug = 'sp5';
  } else if (u.includes('SP6')) {
    shortLoc = 'SP6';
    slug = 'sp6';
  } else if (u.includes('CHARLIE')) {
    shortLoc = 'Charlie';
    slug = 'charlie';
  } else if (u.includes('DELTA')) {
    shortLoc = 'Delta';
    slug = 'delta';
  } else if (u.includes('ECHO')) {
    shortLoc = 'Echo';
    slug = 'echo';
  } else if (u.includes('BRK RLF') || u.includes('BREAK')) {
    shortLoc = 'Brk Rlf';
    slug = 'brk-rlf';
  } else if (u.includes('VAR')) {
    shortLoc = 'Variable';
    slug = 'var';
  } else if (u.includes('PBS TB')) {
    shortLoc = 'PBS TB';
    slug = 'pbs-tb';
  } else if (u.includes('PBS')) {
    shortLoc = 'PBS';
    slug = 'pbs';
  } else if (u.includes('ITI')) {
    shortLoc = 'ITI';
    slug = 'iti';
  } else if (u.includes('ITD')) {
    shortLoc = 'ITD';
    slug = 'itd';
  } else if (u.includes('TB')) {
    shortLoc = 'TB';
    slug = 'tb';
  } else if (u.includes('NPST DI') || u.includes('NPS DI') || u.includes('NPS-DI')) {
    shortLoc = 'NPS DI';
    slug = 'nps-di';
  } else if (u.includes('DI') || u.includes('ID')) {
    shortLoc = 'DI';
    slug = 'di';
  } else if (u.includes('OSB')) {
    shortLoc = 'OSB';
    slug = 'osb';
  } else if (shortLoc.length > 8) {
    shortLoc = shortLoc.slice(0, 8);
  }

  return { location: loc, shortLoc, slug };
}

function normalizeShiftLocations(shift) {
  if (!shift || !shift.schedule) return;
  const days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
  const shiftLocations = [];
  const shiftShortLocs = [];

  days.forEach(d => {
    const dayData = shift.schedule[d];
    if (!dayData) return;
    if (!dayData.isOff) {
      if (!dayData.shortLoc || !dayData.location) {
        const info = formatLocationInfo(dayData.raw);
        dayData.location = info.location;
        dayData.shortLoc = info.shortLoc;
        dayData.locSlug = info.slug;
      }
      if (dayData.shortLoc && !shiftShortLocs.includes(dayData.shortLoc)) {
        shiftShortLocs.push(dayData.shortLoc);
      }
      if (dayData.location && !shiftLocations.includes(dayData.location)) {
        shiftLocations.push(dayData.location);
      }
    }
  });

  if (!shift.locations || shift.locations.length === 0) {
    shift.locations = shiftLocations;
  }
  if (!shift.shortLocations || shift.shortLocations.length === 0) {
    shift.shortLocations = shiftShortLocs;
  }
  if (!shift.locationSummary) {
    shift.locationSummary = shiftShortLocs.join(' · ');
  }

  // Pre-classify NPST Post Slugs with 100% precision
  if (shift.type === 'NPST') {
    const rawAll = Object.values(shift.schedule || {}).map(d => d.raw).filter(Boolean).join(' ').toUpperCase();
    if (rawAll.includes('51')) shift.npstPostSlug = '51';
    else if (rawAll.includes('CTX')) shift.npstPostSlug = 'ctx';
    else if (rawAll.includes('GATE 79') || rawAll.includes('G79')) shift.npstPostSlug = 'g79';
    else if (rawAll.includes('JAVA')) shift.npstPostSlug = 'javau';
    else if (rawAll.includes('Y38')) shift.npstPostSlug = 'y38';
    else if (rawAll.includes('SP1') || rawAll.includes('SP 1')) shift.npstPostSlug = 'sp1';
    else if (rawAll.includes('BRK') || rawAll.includes('BREAK')) shift.npstPostSlug = 'brk-rlf';
    else if (rawAll.includes('NPST DI') || rawAll.includes('NPS DI') || rawAll.includes('PBS') || rawAll.includes('DI')) shift.npstPostSlug = 'nps-di';
    else shift.npstPostSlug = 'nps-di';
  }
}

const ALL_NPST_SLUGS = ['51', 'ctx', 'nps-di', 'brk-rlf', 'sp1', 'g79', 'javau', 'y38'];

function getPostSlug(loc) {
  if (!loc) return 'nps-di';
  const u = loc.toUpperCase();
  if (u.includes('51')) return '51';
  if (u.includes('CTX')) return 'ctx';
  if (u.includes('SP1') || u.includes('SP 1')) return 'sp1';
  if (u.includes('GATE 79') || u.includes('G79')) return 'g79';
  if (u.includes('JAVA U') || u.includes('JAVAU')) return 'javau';
  if (u.includes('Y38')) return 'y38';
  if (u.includes('BRK') || u.includes('BREAK')) return 'brk-rlf';
  if (u.includes('NPST DI') || u.includes('NPS DI') || u.includes('NPS-DI') || u.includes('PBS') || u === 'DI') return 'nps-di';
  return 'nps-di';
}

function setDeptFilter(dept) {
  state.filters.type = dept;
  if (dept === 'NPST') {
    state.filters.npstPosts = new Set(['all']);
    syncNpstButtonsWithState();
  }
  syncDeptButtonsWithState();
  renderExplorer();
}

function selectOnlyNpst() {
  state.filters.type = 'NPST';
  state.filters.npstPosts = new Set(['all']);
  syncDeptButtonsWithState();
  syncNpstButtonsWithState();
  renderExplorer();
}

function syncDeptButtonsWithState() {
  const bar = elements.deptPillsBar;
  if (!bar) return;
  const currentDept = state.filters.type;
  bar.querySelectorAll('.dept-pill-btn, .dept-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.dept === currentDept);
  });
  if (elements.filterType) elements.filterType.value = currentDept;

  if (elements.npstPostSection) {
    if (currentDept === 'NPST') {
      elements.npstPostSection.classList.remove('hidden');
      elements.npstPostSection.style.borderColor = '#38bdf8';
      elements.npstPostSection.style.boxShadow = '0 0 14px rgba(56, 189, 248, 0.25)';
    } else {
      elements.npstPostSection.classList.add('hidden');
      elements.npstPostSection.style.borderColor = 'rgba(56, 189, 248, 0.35)';
      elements.npstPostSection.style.boxShadow = 'none';
    }
  }
}

function setNpstPreset(preset) {
  state.filters.type = 'NPST';
  syncDeptButtonsWithState();

  if (preset === 'all') {
    state.filters.npstPosts = new Set(['all']);
  } else if (preset === 'nps_di' || preset === 'nps-di') {
    state.filters.npstPosts = new Set(['nps-di']);
  } else if (preset === '51_ctx' || preset === '51-ctx') {
    state.filters.npstPosts = new Set(['51', 'ctx']);
  } else if (preset === 'fixed_gates' || preset === 'fixed-gates') {
    state.filters.npstPosts = new Set(['51', 'ctx', 'nps-di', 'sp1', 'g79', 'javau', 'y38']);
  } else if (preset === 'brk_rlf' || preset === 'brk-rlf') {
    state.filters.npstPosts = new Set(['brk-rlf']);
  } else if (preset === 'clear') {
    state.filters.npstPosts = new Set();
  }

  syncNpstButtonsWithState();
  renderExplorer();
}

function toggleNpstPost(slug) {
  state.filters.type = 'NPST';
  syncDeptButtonsWithState();

  if (state.filters.npstPosts.has('all')) {
    state.filters.npstPosts = new Set(ALL_NPST_SLUGS);
    state.filters.npstPosts.delete(slug);
  } else if (state.filters.npstPosts.has(slug)) {
    if (state.filters.npstPosts.size > 1) {
      state.filters.npstPosts.delete(slug);
    } else {
      state.filters.npstPosts = new Set(['all']);
    }
  } else {
    state.filters.npstPosts.add(slug);
    if (state.filters.npstPosts.size === ALL_NPST_SLUGS.length) {
      state.filters.npstPosts = new Set(['all']);
    }
  }

  syncNpstButtonsWithState();
  renderExplorer();
}

function syncNpstButtonsWithState() {
  const container = elements.npstMultiSelect;
  if (!container) return;
  const isAll = state.filters.npstPosts.has('all');
  container.querySelectorAll('.npst-post-btn').forEach(btn => {
    const slug = btn.dataset.slug;
    const isActive = isAll || state.filters.npstPosts.has(slug);
    btn.classList.toggle('active', isActive);
    const box = btn.querySelector('.check-box');
    if (box) box.textContent = isActive ? '✓' : '';
  });
}

// -------------------------------------------------------------
// Bulk Selection Helpers
// -------------------------------------------------------------
function toggleShiftSelection(lineNo, isChecked) {
  if (isChecked) {
    state.selectedShifts.add(lineNo);
  } else {
    state.selectedShifts.delete(lineNo);
  }
  updateBulkActionBar();
  const tr = document.querySelector(`tr[data-line="${lineNo}"]`);
  if (tr) tr.classList.toggle('is-selected-row', isChecked);
}

function toggleSelectAllVisible(isChecked) {
  const visible = getFilteredShifts();
  if (isChecked) {
    visible.forEach(s => state.selectedShifts.add(s.lineNo));
  } else {
    visible.forEach(s => state.selectedShifts.delete(s.lineNo));
  }
  updateBulkActionBar();
  renderExplorer();
}

function selectAllNpstShifts() {
  state.shifts.filter(s => s.type === 'NPST').forEach(s => state.selectedShifts.add(s.lineNo));
  updateBulkActionBar();
  renderExplorer();
}

function selectOnlyFreeNpstShifts() {
  state.shifts.filter(s => s.type === 'NPST' && !s.isTaken).forEach(s => state.selectedShifts.add(s.lineNo));
  updateBulkActionBar();
  renderExplorer();
}

function clearSelectedShifts() {
  state.selectedShifts.clear();
  updateBulkActionBar();
  renderExplorer();
}

function addSelectedToWishlist() {
  if (state.selectedShifts.size === 0) {
    alert('Please select one or more shifts first using the checkboxes.');
    return;
  }
  let addedCount = 0;
  state.selectedShifts.forEach(lineNo => {
    if (!state.wishlist.includes(lineNo)) {
      state.wishlist.push(lineNo);
      addedCount++;
    }
  });
  localStorage.setItem('yul_wishlist', JSON.stringify(state.wishlist));
  updateKpis();
  renderExplorer();
  
  if (elements.wishlistAlertBox) {
    elements.wishlistAlertBox.innerHTML = `
      <span>⭐ Added <strong>${state.selectedShifts.size} shifts</strong> to your Priority Bidding Shortlist! (${addedCount} newly added)</span>
    `;
    elements.wishlistAlertBox.classList.remove('hidden');
    setTimeout(() => {
      elements.wishlistAlertBox.classList.add('hidden');
    }, 4500);
  }
}

function copySelectedLineNumbers() {
  if (state.selectedShifts.size === 0) {
    alert('No shifts selected to copy.');
    return;
  }
  const lines = Array.from(state.selectedShifts).sort((a, b) => a - b).join(', ');
  navigator.clipboard.writeText(lines).then(() => {
    alert(`Copied ${state.selectedShifts.size} shift line numbers to clipboard: \n${lines}`);
  }).catch(() => {
    prompt('Copy selected lines:', lines);
  });
}

function updateBulkActionBar() {
  const count = state.selectedShifts.size;
  if (elements.selectedCountBadge) {
    elements.selectedCountBadge.textContent = count;
  }
  if (elements.bulkWishlistCount) {
    elements.bulkWishlistCount.textContent = count;
  }
  if (elements.bulkActionsBar) {
    elements.bulkActionsBar.classList.toggle('highlight', count > 0);
  }
  
  const visible = getFilteredShifts();
  const allVisibleSelected = visible.length > 0 && visible.every(s => state.selectedShifts.has(s.lineNo));
  if (elements.masterShiftCheckbox) {
    elements.masterShiftCheckbox.checked = allVisibleSelected;
    elements.masterShiftCheckbox.indeterminate = !allVisibleSelected && visible.some(s => state.selectedShifts.has(s.lineNo));
  }
  const masterTableCheck = document.getElementById('masterTableCheckbox');
  if (masterTableCheck) {
    masterTableCheck.checked = allVisibleSelected;
    masterTableCheck.indeterminate = !allVisibleSelected && visible.some(s => state.selectedShifts.has(s.lineNo));
  }
}

function toggleGenderOption(val) {
  if (state.filters.genders.has(val)) {
    if (state.filters.genders.size > 1) {
      state.filters.genders.delete(val);
    } else {
      state.filters.genders = new Set(['male', 'female', 'mixed', 'open']);
    }
  } else {
    state.filters.genders.add(val);
  }
  syncGenderButtonsWithState();
  renderExplorer();
}

function setGenderPreset(preset) {
  if (preset === 'all') {
    state.filters.genders = new Set(['male', 'female', 'mixed', 'open']);
  } else if (preset === 'male_mixed') {
    state.filters.genders = new Set(['male', 'mixed']);
  } else if (preset === 'female_mixed') {
    state.filters.genders = new Set(['female', 'mixed']);
  } else if (preset === 'male_all') {
    state.filters.genders = new Set(['male', 'mixed', 'open']);
  } else if (preset === 'female_all') {
    state.filters.genders = new Set(['female', 'mixed', 'open']);
  } else if (preset === 'mixed_only') {
    state.filters.genders = new Set(['mixed']);
  }
  syncGenderButtonsWithState();
  renderExplorer();
}

function syncGenderButtonsWithState() {
  const container = elements.genderMultiSelect;
  if (!container) return;
  container.querySelectorAll('.gender-toggle-btn').forEach(btn => {
    const val = btn.dataset.val;
    const isActive = state.filters.genders.has(val);
    btn.classList.toggle('active', isActive);
    const box = btn.querySelector('.check-box');
    if (box) box.textContent = isActive ? '✓' : '';
  });
}

// -------------------------------------------------------------
// Time Period & Custom Slot Helpers
// -------------------------------------------------------------
function isTimeInMinutes(timeStr, minMins, maxMins) {
  if (!timeStr) return false;
  const [h, m] = timeStr.split(':').map(Number);
  const mins = h * 60 + m;
  return mins >= minMins && mins <= maxMins;
}

function toggleTimePeriod(val) {
  state.filters.timeMode = 'periods';
  elements.customTimeBox.classList.add('hidden');
  elements.customTimeToggleBtn.classList.remove('active');

  if (state.filters.timePeriods.has(val)) {
    if (state.filters.timePeriods.size > 1) {
      state.filters.timePeriods.delete(val);
    } else {
      state.filters.timePeriods = new Set(['early_morning', 'morning', 'afternoon', 'evening']);
    }
  } else {
    state.filters.timePeriods.add(val);
  }

  syncTimeButtonsWithState();
  renderExplorer();
}

function setTimePreset(preset) {
  state.filters.timeMode = 'periods';
  elements.customTimeBox.classList.add('hidden');
  elements.customTimeToggleBtn.classList.remove('active');

  if (preset === 'all') {
    state.filters.timePeriods = new Set(['early_morning', 'morning', 'afternoon', 'evening']);
  } else if (preset === 'early') {
    state.filters.timePeriods = new Set(['early_morning']);
  } else if (preset === 'morning') {
    state.filters.timePeriods = new Set(['morning']);
  } else if (preset === 'afternoon') {
    state.filters.timePeriods = new Set(['afternoon']);
  } else if (preset === 'evening') {
    state.filters.timePeriods = new Set(['evening']);
  }

  syncTimeButtonsWithState();
  renderExplorer();
}

function toggleCustomTimeMode() {
  if (state.filters.timeMode === 'custom') {
    setTimePreset('all');
  } else {
    state.filters.timeMode = 'custom';
    elements.customTimeBox.classList.remove('hidden');
    elements.customTimeToggleBtn.classList.add('active');

    elements.timePeriodSelect.querySelectorAll('.time-toggle-btn[data-val]').forEach(btn => {
      btn.classList.remove('active');
      const box = btn.querySelector('.check-box');
      if (box) box.textContent = '';
    });
    updateCustomTimeHint();
    renderExplorer();
  }
}

function setCustomTimeSlot(fromTime, toTime) {
  state.filters.timeMode = 'custom';
  state.filters.customTimeFrom = fromTime;
  state.filters.customTimeTo = toTime;

  if (elements.timeFromSelect) elements.timeFromSelect.value = fromTime;
  if (elements.timeToSelect) elements.timeToSelect.value = toTime;

  elements.customTimeBox.classList.remove('hidden');
  elements.customTimeToggleBtn.classList.add('active');

  elements.timePeriodSelect.querySelectorAll('.time-toggle-btn[data-val]').forEach(btn => {
    btn.classList.remove('active');
    const box = btn.querySelector('.check-box');
    if (box) box.textContent = '';
  });

  updateCustomTimeHint();
  renderExplorer();
}

function applyCustomTimeRange() {
  state.filters.timeMode = 'custom';
  state.filters.customTimeFrom = elements.timeFromSelect.value;
  state.filters.customTimeTo = elements.timeToSelect.value;
  updateCustomTimeHint();
  renderExplorer();
}

function clearCustomTimeRange() {
  setTimePreset('all');
}

function updateCustomTimeHint() {
  if (!elements.customTimeHint) return;
  const f = state.filters;
  elements.customTimeHint.innerHTML = `Showing shifts with start time between <strong>${f.customTimeFrom}</strong> and <strong>${f.customTimeTo}</strong>`;
}

function syncTimeButtonsWithState() {
  const container = elements.timePeriodSelect;
  if (!container) return;

  const isCustom = state.filters.timeMode === 'custom';
  elements.customTimeToggleBtn.classList.toggle('active', isCustom);
  elements.customTimeBox.classList.toggle('hidden', !isCustom);

  container.querySelectorAll('.time-toggle-btn[data-val]').forEach(btn => {
    const val = btn.dataset.val;
    const isActive = !isCustom && state.filters.timePeriods.has(val);
    btn.classList.toggle('active', isActive);
    const box = btn.querySelector('.check-box');
    if (box) box.textContent = isActive ? '✓' : '';
  });

  if (isCustom) updateCustomTimeHint();
}

// -------------------------------------------------------------
// Filter Drawer & Tab Switcher
// -------------------------------------------------------------
function toggleFilterDrawer(forceState) {
  if (!elements.filterDrawer) return;
  const isCurrentlyHidden = elements.filterDrawer.classList.contains('hidden');
  const shouldOpen = forceState !== undefined ? forceState : isCurrentlyHidden;
  elements.filterDrawer.classList.toggle('hidden', !shouldOpen);
  if (elements.filterDrawerToggleBtn) {
    elements.filterDrawerToggleBtn.classList.toggle('active', shouldOpen);
  }
}

function switchDrawerTab(tabName) {
  const drawer = elements.filterDrawer;
  if (!drawer) return;
  drawer.querySelectorAll('.drawer-tab-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.drawerTab === tabName);
  });
  drawer.querySelectorAll('.drawer-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  const activePane = document.getElementById(`drawerPane${capitalize(tabName)}`);
  if (activePane) activePane.classList.add('active');
}

function resetSecondaryFilters() {
  state.filters.timeMode = 'periods';
  state.filters.timePeriods = new Set(['early_morning', 'morning', 'afternoon', 'evening']);
  state.filters.customTimeFrom = '10:00';
  state.filters.customTimeTo = '17:00';
  state.filters.genders = new Set(['male', 'female', 'mixed', 'open']);
  state.filters.daysOff = 'all';
  state.filters.pattern = 'all';
  state.filters.ftpt = 'all';
  state.filters.location = 'all';

  syncGenderButtonsWithState();
  syncTimeButtonsWithState();
  syncFilterInputsWithState();
  updateDrawerIndicators();
  renderExplorer();
}

function updateDrawerIndicators() {
  const f = state.filters;
  let activeSecondaryCount = 0;

  // Time indicator
  const hasTimeFilter = (f.timeMode === 'custom') || (f.timePeriods && f.timePeriods.size < 4);
  if (elements.dotDrawerTime) elements.dotDrawerTime.classList.toggle('hidden', !hasTimeFilter);
  if (hasTimeFilter) activeSecondaryCount++;

  // Gender indicator
  const hasGenderFilter = (f.genders && f.genders.size < 4);
  if (elements.dotDrawerGender) elements.dotDrawerGender.classList.toggle('hidden', !hasGenderFilter);
  if (hasGenderFilter) activeSecondaryCount++;

  // Days Off indicator
  const hasDaysOffFilter = (f.daysOff !== 'all');
  if (elements.dotDrawerDaysOff) elements.dotDrawerDaysOff.classList.toggle('hidden', !hasDaysOffFilter);
  if (hasDaysOffFilter) activeSecondaryCount++;

  // Pattern / Type indicator
  const hasPatternFilter = (f.pattern !== 'all' || f.ftpt !== 'all');
  if (elements.dotDrawerPattern) elements.dotDrawerPattern.classList.toggle('hidden', !hasPatternFilter);
  if (hasPatternFilter) activeSecondaryCount++;

  // Location indicator
  const hasLocFilter = (f.location && f.location !== 'all');
  if (elements.dotDrawerLoc) elements.dotDrawerLoc.classList.toggle('hidden', !hasLocFilter);
  if (hasLocFilter) activeSecondaryCount++;

  // Badge on "⚙️ More Filters" button
  if (elements.filterActiveBadge) {
    if (activeSecondaryCount > 0) {
      elements.filterActiveBadge.textContent = activeSecondaryCount;
      elements.filterActiveBadge.classList.remove('hidden');
    } else {
      elements.filterActiveBadge.classList.add('hidden');
    }
  }
}

// -------------------------------------------------------------
// KPI Summary Calculation
// -------------------------------------------------------------
function updateKpis() {
  const shifts = state.shifts;
  if (!shifts || shifts.length === 0) return;

  const total = shifts.length;
  const freeShifts = shifts.filter(s => !s.isTaken);
  const freeCount = freeShifts.length;
  const takenCount = total - freeCount;
  const freePercent = Math.round((freeCount / total) * 100);

  const weekendFree = freeShifts.filter(s => s.hasWeekendOff).length;
  const ftFree = freeShifts.filter(s => s.ftpt === 'FT').length;
  const ptFree = freeShifts.filter(s => s.ftpt === 'PT').length;

  const wishlistShifts = shifts.filter(s => state.wishlist.includes(s.lineNo));
  const wishlistFree = wishlistShifts.filter(s => !s.isTaken).length;

  elements.kpiFreeCount.textContent = freeCount;
  elements.kpiFreePercent.textContent = `${freePercent}%`;
  elements.kpiWeekendCount.textContent = weekendFree;
  elements.kpiFTCount.textContent = ftFree;
  elements.kpiPTCount.textContent = ptFree;
  elements.kpiTakenCount.textContent = takenCount;

  elements.kpiWishlistCount.textContent = state.wishlist.length;
  elements.kpiWishlistFree.textContent = wishlistFree;

  // Gender counts
  const cntMale = shifts.filter(s => (s.genderCategory || getShiftGenderCat(s)) === 'male').length;
  const cntFemale = shifts.filter(s => (s.genderCategory || getShiftGenderCat(s)) === 'female').length;
  const cntMixed = shifts.filter(s => (s.genderCategory || getShiftGenderCat(s)) === 'mixed').length;
  const cntOpen = shifts.filter(s => (s.genderCategory || getShiftGenderCat(s)) === 'open').length;

  if (elements.cntMale) elements.cntMale.textContent = cntMale;
  if (elements.cntFemale) elements.cntFemale.textContent = cntFemale;
  if (elements.cntMixed) elements.cntMixed.textContent = cntMixed;
  if (elements.cntOpen) elements.cntOpen.textContent = cntOpen;

  // Time period counts
  const cntEarly = shifts.filter(s => isTimeInMinutes(s.primaryStart, 60, 330)).length;
  const cntMorning = shifts.filter(s => isTimeInMinutes(s.primaryStart, 331, 700)).length;
  const cntAfternoon = shifts.filter(s => isTimeInMinutes(s.primaryStart, 701, 960)).length;
  const cntEvening = shifts.filter(s => isTimeInMinutes(s.primaryStart, 961, 1440)).length;

  if (elements.cntEarly) elements.cntEarly.textContent = cntEarly;
  if (elements.cntMorning) elements.cntMorning.textContent = cntMorning;
  if (elements.cntAfternoon) elements.cntAfternoon.textContent = cntAfternoon;
  if (elements.cntEvening) elements.cntEvening.textContent = cntEvening;

  // Department pill counts
  if (elements.cntAllDepts) elements.cntAllDepts.textContent = shifts.length;
  if (elements.cntNpst) elements.cntNpst.textContent = shifts.filter(s => s.type === 'NPST').length;
  if (elements.cntDi) elements.cntDi.textContent = shifts.filter(s => s.type === 'DI').length;
  if (elements.cntTb) elements.cntTb.textContent = shifts.filter(s => s.type === 'TB').length;
  if (elements.cntNpsv) elements.cntNpsv.textContent = shifts.filter(s => s.type === 'NPSV').length;
  if (elements.cntHbs) elements.cntHbs.textContent = shifts.filter(s => s.type === 'HBS').length;
  if (elements.cntVar) elements.cntVar.textContent = shifts.filter(s => s.type === 'Variable').length;

  const npstShifts = shifts.filter(s => s.type === 'NPST');
  const cntNpsDi = npstShifts.filter(s => (s.npstPostSlug === 'nps-di' || getPostSlug(s.locationSummary || '') === 'nps-di')).length;
  if (elements.cntPostNpsDi) elements.cntPostNpsDi.textContent = cntNpsDi;
  if (elements.cntPostSupport) elements.cntPostSupport.textContent = cntNpsDi;

  elements.explorerTabCounter.textContent = freeCount;
  elements.wishlistTabCounter.textContent = `${wishlistFree}/${state.wishlist.length}`;
  elements.rosterTabCounter.textContent = state.roster.length;
}

// -------------------------------------------------------------
// Shift Filtering & Sorting Logic
// -------------------------------------------------------------
function getFilteredShifts() {
  const f = state.filters;
  let result = state.shifts.filter(shift => {
    // 1. Availability Status
    if (f.status === 'free' && shift.isTaken) return false;
    if (f.status === 'taken' && !shift.isTaken) return false;

    // 2. Search query
    if (f.search) {
      const q = f.search.toLowerCase().trim();
      const matchLine = shift.lineNo.toString() === q || `line ${shift.lineNo}`.toLowerCase().includes(q);
      const matchType = shift.type.toLowerCase().includes(q);
      const matchPattern = shift.shiftPattern.toLowerCase().includes(q);
      const matchNotes = (shift.notes || '').toLowerCase().includes(q);
      const matchEmp = shift.assignedTo && shift.assignedTo.name && shift.assignedTo.name.toLowerCase().includes(q);
      const matchLocSummary = (shift.locationSummary || '').toLowerCase().includes(q);
      const matchLocs = (shift.locations || []).some(l => l.toLowerCase().includes(q));
      const matchShortLocs = (shift.shortLocations || []).some(l => l.toLowerCase() === q || l.toLowerCase().includes(q));
      const matchSchedule = Object.values(shift.schedule || {}).some(d => (d.raw || '').toLowerCase().includes(q) || (d.location || '').toLowerCase().includes(q));
      if (!matchLine && !matchType && !matchPattern && !matchNotes && !matchEmp && !matchLocSummary && !matchLocs && !matchShortLocs && !matchSchedule) {
        return false;
      }
    }

    // 3. Bid Type / Department
    if (f.type !== 'all' && shift.type !== f.type) return false;

    // NPST Sub-Post Multi-Select Filter
    if (shift.type === 'NPST' && f.npstPosts && !f.npstPosts.has('all')) {
      const slug = shift.npstPostSlug || getPostSlug(shift.locationSummary || '');
      const hasMatch = f.npstPosts.has(slug) || (slug === 'nps-di' && f.npstPosts.has('support'));
      if (!hasMatch) return false;
    }

    // Location / Specific Post Filter
    if (f.location && f.location !== 'all') {
      const targetLoc = f.location.toLowerCase();
      const hasLoc = (shift.shortLocations || []).some(l => l.toLowerCase() === targetLoc || l.toLowerCase().includes(targetLoc)) ||
                     (shift.locations || []).some(l => l.toLowerCase().includes(targetLoc)) ||
                     Object.values(shift.schedule || {}).some(d => !d.isOff && (
                       (d.shortLoc && (d.shortLoc.toLowerCase() === targetLoc || d.shortLoc.toLowerCase().includes(targetLoc))) ||
                       (d.location && d.location.toLowerCase().includes(targetLoc)) ||
                       (d.raw && d.raw.toLowerCase().includes(targetLoc))
                     ));
      if (!hasLoc) return false;
    }

    // 4. Shift Pattern
    if (f.pattern !== 'all' && shift.shiftPattern !== f.pattern) return false;

    // 5. FT / PT
    if (f.ftpt !== 'all' && shift.ftpt !== f.ftpt) return false;

    // 6. Start Time Filtering (Multi-Select Periods or Custom Slot Range)
    if (shift.primaryStart) {
      const [h, m] = shift.primaryStart.split(':').map(Number);
      const shiftMins = h * 60 + m;

      if (f.timeMode === 'custom') {
        const [fromH, fromM] = f.customTimeFrom.split(':').map(Number);
        const [toH, toM] = f.customTimeTo.split(':').map(Number);
        const fromMins = fromH * 60 + fromM;
        const toMins = toH * 60 + toM;

        if (shiftMins < fromMins || shiftMins > toMins) {
          return false;
        }
      } else if (f.timePeriods && f.timePeriods.size < 4) {
        let period = 'other';
        if (shiftMins >= 60 && shiftMins <= 330) period = 'early_morning';
        else if (shiftMins > 330 && shiftMins <= 700) period = 'morning';
        else if (shiftMins > 700 && shiftMins <= 960) period = 'afternoon';
        else if (shiftMins > 960) period = 'evening';

        if (!f.timePeriods.has(period)) {
          return false;
        }
      }
    } else {
      if (f.timeMode === 'custom' || (f.timePeriods && f.timePeriods.size < 4)) {
        return false;
      }
    }

    // 7. Days Off Preference
    if (f.daysOff !== 'all') {
      if (f.daysOff === 'weekend' && !shift.hasWeekendOff) return false;
      if (f.daysOff === 'sat' && !shift.hasSatOff) return false;
      if (f.daysOff === 'sun' && !shift.hasSunOff) return false;
      if (f.daysOff === 'frisat' && !shift.hasFriSatOff) return false;
      if (f.daysOff === 'sunmon' && !shift.hasSunMonOff) return false;
      if (f.daysOff === 'consecutive') {
        const off = shift.offDays;
        const daysOrder = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
        let has3Consec = false;
        for (let i = 0; i < 7; i++) {
          const d1 = daysOrder[i];
          const d2 = daysOrder[(i + 1) % 7];
          const d3 = daysOrder[(i + 2) % 7];
          if (off.includes(d1) && off.includes(d2) && off.includes(d3)) {
            has3Consec = true;
            break;
          }
        }
        if (!has3Consec) return false;
      }
    }

    // 8. Gender Multi-Select Restriction (Male, Female, Mixed, Open)
    if (f.genders && f.genders.size > 0 && f.genders.size < 4) {
      const cat = shift.genderCategory || getShiftGenderCat(shift);
      if (!f.genders.has(cat)) return false;
    }

    return true;
  });

  // Sort
  result.sort((a, b) => {
    if (f.sortBy === 'line_asc') return a.lineNo - b.lineNo;
    if (f.sortBy === 'line_desc') return b.lineNo - a.lineNo;
    if (f.sortBy === 'time_earliest') {
      const tA = a.primaryStart || '99:99';
      const tB = b.primaryStart || '99:99';
      return tA.localeCompare(tB);
    }
    if (f.sortBy === 'time_latest') {
      const tA = a.primaryStart || '00:00';
      const tB = b.primaryStart || '00:00';
      return tB.localeCompare(tA);
    }
    if (f.sortBy === 'weekend_first') {
      if (a.hasWeekendOff && !b.hasWeekendOff) return -1;
      if (!a.hasWeekendOff && b.hasWeekendOff) return 1;
      return a.lineNo - b.lineNo;
    }
    if (f.sortBy === 'hours_desc') return b.hours - a.hours;
    return a.lineNo - b.lineNo;
  });

  return result;
}

// -------------------------------------------------------------
// Rendering Shifts (Explorer Tab)
// -------------------------------------------------------------
function renderExplorer() {
  const filtered = getFilteredShifts();
  elements.matchingCountLabel.textContent = `Showing ${filtered.length} of ${state.shifts.length} lines`;
  renderActiveFilterChips();

  if (filtered.length === 0) {
    elements.shiftsContainer.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🔎</span>
        <h3>No matching shifts found</h3>
        <p>Try adjusting your search criteria, start time window, or resetting filters to see available shifts.</p>
        <button class="btn btn-secondary mt-3" onclick="resetAllFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  if (state.viewMode === 'table') {
    renderTableView(filtered);
  } else {
    renderGridView(filtered);
  }
}

function renderTableView(shifts) {
  const days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
  const allVisibleSelected = shifts.length > 0 && shifts.every(s => state.selectedShifts.has(s.lineNo));

  let html = `
    <div class="shifts-table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 36px; text-align: center;">
              <input type="checkbox" id="masterTableCheckbox" class="styled-checkbox" ${allVisibleSelected ? 'checked' : ''} onchange="toggleSelectAllVisible(this.checked)" title="Select / Deselect All Visible Shifts">
            </th>
            <th style="width: 38px; text-align: center;">⭐</th>
            <th style="width: 70px;">Line #</th>
            <th style="width: 100px;">Status</th>
            <th style="width: 80px;">Type</th>
            <th style="width: 90px;">Pattern</th>
            <th style="width: 70px;">Hours</th>
            <th style="width: 125px;">Primary Time & Post</th>
            <th style="min-width: 410px;">Weekly Schedule (Sun - Sat)</th>
            <th style="width: 130px;">Days Off</th>
            <th style="width: 90px;">Gender</th>
            <th style="width: 70px; text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
  `;

  for (const s of shifts) {
    const isStarred = state.wishlist.includes(s.lineNo);
    const starClass = isStarred ? 'star-btn starred' : 'star-btn';
    const isTakenClass = s.isTaken ? 'is-taken-row' : '';
    const isSelected = state.selectedShifts.has(s.lineNo);
    const selectedRowClass = isSelected ? 'is-selected-row' : '';

    const statusBadge = s.isTaken
      ? `<span class="status-badge taken" title="Awarded to ${s.assignedTo?.name || 'Assigned'}">🔴 TAKEN</span>`
      : `<span class="status-badge free">🟢 FREE</span>`;

    const deptBadge = `<span class="dept-badge dept-${s.type}">${s.type}</span>`;
    const patternBadge = `<span class="pattern-badge">${s.shiftPattern || '-'}</span>`;

    // Days chips with location badge
    let daysHtml = '<div class="day-schedule-grid">';
    days.forEach(d => {
      const dayData = s.schedule[d];
      if (dayData.isOff) {
        daysHtml += `<div class="day-chip off"><span class="day-chip-name">${d.slice(0, 2)}</span><span class="day-chip-time">OFF</span></div>`;
      } else {
        const timeStr = dayData.start ? `${dayData.start}` : 'WORK';
        let periodClass = 'day';
        if (dayData.start) {
          const h = parseInt(dayData.start.split(':')[0]);
          if (h < 6) periodClass = 'early';
          else if (h >= 14) periodClass = 'evening';
        }
        const locSlug = dayData.locSlug || 'default';
        const locBadge = dayData.shortLoc
          ? `<span class="day-chip-loc loc-${locSlug}">${dayData.shortLoc}</span>`
          : '';
        daysHtml += `
          <div class="day-chip ${periodClass}" title="${d}: ${dayData.raw || ''}">
            <span class="day-chip-name">${d.slice(0, 2)}</span>
            <span class="day-chip-time">${timeStr}</span>
            ${locBadge}
          </div>
        `;
      }
    });
    daysHtml += '</div>';

    // Days off string
    let daysOffStr = s.offDays.join('/');
    const isWeekend = s.hasWeekendOff;
    const daysOffPill = isWeekend
      ? `<span class="days-off-pill weekend" title="Sat & Sun Off">🏖️ Sat/Sun Off</span>`
      : `<span class="days-off-pill">${daysOffStr || 'None'}</span>`;

    const cat = s.genderCategory || getShiftGenderCat(s);
    let genderBadge = `<span style="color: var(--text-dim); font-size: 0.72rem;">Open</span>`;
    if (cat === 'male') {
      genderBadge = `<span class="dept-badge" style="background: rgba(59, 130, 246, 0.18); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.35);">♂ MALE</span>`;
    } else if (cat === 'female') {
      genderBadge = `<span class="dept-badge" style="background: rgba(244, 63, 94, 0.18); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.35);">♀ FEMALE</span>`;
    } else if (cat === 'mixed') {
      genderBadge = `<span class="dept-badge" style="background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);" title="Switchable M/F Rotation">🔄 MIXED</span>`;
    }

    html += `
      <tr class="${isTakenClass} ${selectedRowClass}" data-line="${s.lineNo}">
        <td style="text-align: center;">
          <input type="checkbox" class="shift-row-check styled-checkbox" data-line="${s.lineNo}" ${isSelected ? 'checked' : ''} onchange="toggleShiftSelection(${s.lineNo}, this.checked)">
        </td>
        <td style="text-align: center;">
          <button class="${starClass}" onclick="toggleWishlist(${s.lineNo})" title="Toggle Shortlist">★</button>
        </td>
        <td>
          <button class="line-no-btn" onclick="openShiftModal(${s.lineNo})">#${s.lineNo}</button>
        </td>
        <td>${statusBadge}</td>
        <td>${deptBadge}</td>
        <td>${patternBadge}</td>
        <td><span class="hours-tag">${s.hours}h</span> <small style="color:var(--text-dim);">${s.ftpt}</small></td>
        <td>
          <div class="primary-time-cell">
            <strong class="time-main">${s.primaryStart || '-'}</strong>
            ${s.locationSummary ? `<span class="shift-loc-summary" title="${(s.locations || []).join(', ')}">📍 ${s.locationSummary}</span>` : ''}
          </div>
        </td>
        <td>${daysHtml}</td>
        <td>${daysOffPill}</td>
        <td>${genderBadge}</td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-icon" style="padding: 4px 8px; font-size: 0.75rem;" onclick="openShiftModal(${s.lineNo})">Details</button>
        </td>
      </tr>
    `;
  }

  html += `
        </tbody>
      </table>
    </div>
  `;

  elements.shiftsContainer.innerHTML = html;
  updateBulkActionBar();
}

function renderGridView(shifts) {
  const days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
  let html = `<div class="shifts-cards-grid">`;

  for (const s of shifts) {
    const isStarred = state.wishlist.includes(s.lineNo);
    const starClass = isStarred ? 'star-btn starred' : 'star-btn';
    const isTakenClass = s.isTaken ? 'is-taken-card' : '';
    const isSelected = state.selectedShifts.has(s.lineNo);
    const selectedCardClass = isSelected ? 'is-selected-card' : '';

    const statusBadge = s.isTaken
      ? `<span class="status-badge taken">🔴 TAKEN</span>`
      : `<span class="status-badge free">🟢 FREE</span>`;

    const deptBadge = `<span class="dept-badge dept-${s.type}">${s.type}</span>`;
    const daysOffPill = s.hasWeekendOff
      ? `<span class="days-off-pill weekend">🏖️ Sat/Sun Off</span>`
      : `<span class="days-off-pill">${s.offDays.join('/')} Off</span>`;

    let scheduleHtml = `<div class="card-schedule-strip">`;
    days.forEach(d => {
      const dayData = s.schedule[d];
      if (dayData.isOff) {
        scheduleHtml += `<div class="day-chip off"><span class="day-chip-name">${d.slice(0, 2)}</span><span class="day-chip-time">OFF</span></div>`;
      } else {
        const timeStr = dayData.start || 'ON';
        const locSlug = dayData.locSlug || 'default';
        const locBadge = dayData.shortLoc
          ? `<span class="day-chip-loc loc-${locSlug}">${dayData.shortLoc}</span>`
          : '';
        scheduleHtml += `
          <div class="day-chip day" title="${d}: ${dayData.raw || ''}">
            <span class="day-chip-name">${d.slice(0, 2)}</span>
            <span class="day-chip-time">${timeStr}</span>
            ${locBadge}
          </div>
        `;
      }
    });
    scheduleHtml += `</div>`;

    const cat = s.genderCategory || getShiftGenderCat(s);
    let genderBadge = '';
    if (cat === 'male') {
      genderBadge = `<span class="dept-badge" style="background: rgba(59, 130, 246, 0.18); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.35);">♂ MALE</span>`;
    } else if (cat === 'female') {
      genderBadge = `<span class="dept-badge" style="background: rgba(244, 63, 94, 0.18); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.35);">♀ FEMALE</span>`;
    } else if (cat === 'mixed') {
      genderBadge = `<span class="dept-badge" style="background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);">🔄 MIXED</span>`;
    }

    html += `
      <div class="shift-card ${isTakenClass} ${selectedCardClass}">
        <div class="card-top">
          <div class="card-title-group" style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" class="shift-row-check styled-checkbox" data-line="${s.lineNo}" ${isSelected ? 'checked' : ''} onchange="toggleShiftSelection(${s.lineNo}, this.checked)">
            <span class="card-line-no">#${s.lineNo}</span>
            ${deptBadge}
            ${genderBadge}
            <span class="pattern-badge">${s.shiftPattern}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${statusBadge}
            <button class="${starClass}" onclick="toggleWishlist(${s.lineNo})">★</button>
          </div>
        </div>

        <div class="card-time-row">
          <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
            <span class="card-time-main">${s.primaryStart ? s.primaryStart : 'Various Times'}</span>
            ${s.locationSummary ? `<span class="shift-loc-summary">📍 ${s.locationSummary}</span>` : ''}
          </div>
          <span class="hours-tag">• ${s.hours} Hours (${s.ftpt})</span>
        </div>

        ${scheduleHtml}

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
          ${daysOffPill}
          <button class="btn btn-secondary btn-icon" style="padding: 4px 8px; font-size: 0.75rem;" onclick="openShiftModal(${s.lineNo})">Inspect Line</button>
        </div>
      </div>
    `;
  }

  html += `</div>`;
  elements.shiftsContainer.innerHTML = html;
  updateBulkActionBar();
}

function renderActiveFilterChips() {
  const f = state.filters;
  const chips = [];

  if (f.status !== 'free') {
    chips.push({ label: `Status: ${f.status.toUpperCase()}`, key: 'status', def: 'free' });
  }
  if (f.type !== 'all') {
    if (f.type === 'NPST' && f.npstPosts && !f.npstPosts.has('all')) {
      const activePosts = Array.from(f.npstPosts).map(p => {
        if (p === 'nps-di' || p === 'support') return 'NPS DI';
        return p.toUpperCase();
      }).join(' + ');
      chips.push({ label: `NPST Posts: ${activePosts}`, key: 'npstPosts', def: 'all' });
    } else {
      chips.push({ label: `Dept: ${f.type}`, key: 'type', def: 'all' });
    }
  }
  if (f.pattern !== 'all') {
    chips.push({ label: `Pattern: ${f.pattern}`, key: 'pattern', def: 'all' });
  }
  if (f.ftpt !== 'all') {
    chips.push({ label: `Type: ${f.ftpt}`, key: 'ftpt', def: 'all' });
  }

  // Time Chip
  if (f.timeMode === 'custom') {
    chips.push({ label: `Starts: ${f.customTimeFrom} - ${f.customTimeTo}`, key: 'timeCustom', def: 'all' });
  } else if (f.timePeriods && f.timePeriods.size < 4) {
    const labels = {
      early_morning: 'Early',
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening'
    };
    const active = Array.from(f.timePeriods).map(p => labels[p] || p).join(' + ');
    chips.push({ label: `Time: ${active}`, key: 'timePeriods', def: 'all' });
  }

  if (f.daysOff !== 'all') {
    chips.push({ label: `Off: ${f.daysOff}`, key: 'daysOff', def: 'all' });
  }

  // Location Chip
  if (f.location && f.location !== 'all') {
    chips.push({ label: `Location: ${f.location}`, key: 'location', def: 'all' });
  }

  // Gender Chip
  if (f.genders && f.genders.size < 4) {
    const labels = Array.from(f.genders).map(g => g.toUpperCase()).join(' + ');
    chips.push({ label: `Gender: ${labels}`, key: 'genders', def: 'all' });
  }

  if (f.search) {
    chips.push({ label: `Search: "${f.search}"`, key: 'search', def: '' });
  }

  updateDrawerIndicators();

  if (chips.length === 0) {
    elements.activeFilterChips.innerHTML = '';
    return;
  }

  elements.activeFilterChips.innerHTML = chips.map(c => `
    <span class="filter-chip">
      ${c.label}
      <button class="filter-chip-remove" onclick="removeFilterChip('${c.key}', '${c.def}')">&times;</button>
    </span>
  `).join('');
}

function removeFilterChip(key, defaultVal) {
  if (key === 'genders') {
    setGenderPreset('all');
  } else if (key === 'timeCustom' || key === 'timePeriods') {
    setTimePreset('all');
  } else if (key === 'location') {
    state.filters.location = 'all';
    if (elements.filterLocation) elements.filterLocation.value = 'all';
  } else if (key === 'type') {
    setDeptFilter('all');
  } else if (key === 'npstPosts') {
    setNpstPreset('all');
  } else {
    state.filters[key] = defaultVal;
    syncFilterInputsWithState();
  }
  renderExplorer();
}

function resetAllFilters() {
  state.filters = {
    search: '',
    status: 'free',
    type: 'all',
    location: 'all',
    npstPosts: new Set(['all']),
    pattern: 'all',
    ftpt: 'all',
    daysOff: 'all',
    genders: new Set(['male', 'female', 'mixed', 'open']),
    timeMode: 'periods',
    timePeriods: new Set(['early_morning', 'morning', 'afternoon', 'evening']),
    customTimeFrom: '10:00',
    customTimeTo: '17:00',
    sortBy: 'line_asc'
  };
  state.selectedShifts.clear();
  syncFilterInputsWithState();
  syncDeptButtonsWithState();
  syncNpstButtonsWithState();
  syncGenderButtonsWithState();
  syncTimeButtonsWithState();
  updateBulkActionBar();
  renderExplorer();
}

function syncFilterInputsWithState() {
  elements.searchInput.value = state.filters.search;
  elements.clearSearchBtn.classList.toggle('hidden', !state.filters.search);
  elements.filterType.value = state.filters.type;
  if (elements.filterLocation) elements.filterLocation.value = state.filters.location;
  elements.filterPattern.value = state.filters.pattern;
  elements.filterFtPt.value = state.filters.ftpt;
  elements.filterDaysOff.value = state.filters.daysOff;
  elements.sortBySelect.value = state.filters.sortBy;

  // Sync segmented buttons
  elements.statusFilterControl.querySelectorAll('.seg-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === state.filters.status);
  });

  syncDeptButtonsWithState();
  syncNpstButtonsWithState();
}

// -------------------------------------------------------------
// Wishlist / Shortlist Logic
// -------------------------------------------------------------
function toggleWishlist(lineNo) {
  const idx = state.wishlist.indexOf(lineNo);
  if (idx >= 0) {
    state.wishlist.splice(idx, 1);
  } else {
    state.wishlist.push(lineNo);
  }
  localStorage.setItem('yul_wishlist', JSON.stringify(state.wishlist));
  updateKpis();
  renderExplorer();
  renderWishlist();
}

function renderWishlist() {
  const container = elements.wishlistContainer;
  if (state.wishlist.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⭐</span>
        <h3>Your shortlist is empty</h3>
        <p>Star shifts in the Explorer to build your ranked priority list. You'll get instant visual alerts if anyone takes them during bidding!</p>
        <button class="btn btn-primary mt-3" onclick="switchTab('explorer')">Explore Shifts</button>
      </div>
    `;
    return;
  }

  const shiftsMap = new Map(state.shifts.map(s => [s.lineNo, s]));
  const items = state.wishlist.map(lineNo => shiftsMap.get(lineNo)).filter(Boolean);

  let freeCount = items.filter(i => !i.isTaken).length;

  let html = `
    <div style="margin-bottom: 14px; font-size: 0.85rem; color: var(--text-muted);">
      <strong>${freeCount}</strong> of your <strong>${items.length}</strong> shortlisted shifts are currently <strong>FREE</strong>.
    </div>
    <div class="shifts-table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 50px; text-align: center;">Priority</th>
            <th style="width: 70px;">Line #</th>
            <th style="width: 100px;">Status</th>
            <th style="width: 80px;">Type</th>
            <th style="width: 80px;">Pattern</th>
            <th style="width: 100px;">Hours</th>
            <th style="width: 125px;">Primary Time & Post</th>
            <th>Weekly Schedule</th>
            <th style="width: 130px;">Days Off</th>
            <th style="width: 90px;">Gender</th>
            <th style="width: 110px; text-align: right;">Reorder / Del</th>
          </tr>
        </thead>
        <tbody>
  `;

  items.forEach((s, idx) => {
    const isTakenClass = s.isTaken ? 'is-taken-row' : '';
    const statusBadge = s.isTaken
      ? `<span class="status-badge taken" title="Taken by: ${s.assignedTo?.name || 'Assigned'}">🔴 CLAIMED</span>`
      : `<span class="status-badge free">🟢 AVAILABLE</span>`;

    const deptBadge = `<span class="dept-badge dept-${s.type}">${s.type}</span>`;
    const daysOffPill = s.hasWeekendOff
      ? `<span class="days-off-pill weekend">🏖️ Sat/Sun Off</span>`
      : `<span class="days-off-pill">${s.offDays.join('/')}</span>`;

    const cat = s.genderCategory || getShiftGenderCat(s);
    let genderBadge = `<span style="color: var(--text-dim); font-size: 0.72rem;">Open</span>`;
    if (cat === 'male') {
      genderBadge = `<span class="dept-badge" style="background: rgba(59, 130, 246, 0.18); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.35);">♂ MALE</span>`;
    } else if (cat === 'female') {
      genderBadge = `<span class="dept-badge" style="background: rgba(244, 63, 94, 0.18); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.35);">♀ FEMALE</span>`;
    } else if (cat === 'mixed') {
      genderBadge = `<span class="dept-badge" style="background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);">🔄 MIXED</span>`;
    }

    const days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
    let schedHtml = '<div class="day-schedule-grid">';
    days.forEach(d => {
      const dayData = s.schedule[d];
      if (dayData.isOff) {
        schedHtml += `<div class="day-chip off"><span class="day-chip-name">${d.slice(0, 2)}</span><span class="day-chip-time">OFF</span></div>`;
      } else {
        const timeStr = dayData.start || 'ON';
        const locSlug = dayData.locSlug || 'default';
        const locBadge = dayData.shortLoc
          ? `<span class="day-chip-loc loc-${locSlug}">${dayData.shortLoc}</span>`
          : '';
        schedHtml += `
          <div class="day-chip day" title="${d}: ${dayData.raw || ''}">
            <span class="day-chip-name">${d.slice(0, 2)}</span>
            <span class="day-chip-time">${timeStr}</span>
            ${locBadge}
          </div>
        `;
      }
    });
    schedHtml += '</div>';

    html += `
      <tr class="${isTakenClass}">
        <td style="text-align: center; font-weight: 800; font-family: var(--font-mono); color: var(--accent-amber);">
          #${idx + 1}
        </td>
        <td>
          <button class="line-no-btn" onclick="openShiftModal(${s.lineNo})">#${s.lineNo}</button>
        </td>
        <td>${statusBadge}</td>
        <td>${deptBadge}</td>
        <td><span class="pattern-badge">${s.shiftPattern}</span></td>
        <td>${s.hours}h (${s.ftpt})</td>
        <td>
          <div class="primary-time-cell">
            <strong class="time-main">${s.primaryStart || '-'}</strong>
            ${s.locationSummary ? `<span class="shift-loc-summary" title="${(s.locations || []).join(', ')}">📍 ${s.locationSummary}</span>` : ''}
          </div>
        </td>
        <td>${schedHtml}</td>
        <td>${daysOffPill}</td>
        <td>${genderBadge}</td>
        <td style="text-align: right;">
          <button class="btn btn-ghost btn-icon" style="padding: 2px 6px;" onclick="moveWishlist(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} title="Move Up">▲</button>
          <button class="btn btn-ghost btn-icon" style="padding: 2px 6px;" onclick="moveWishlist(${idx}, 1)" ${idx === items.length - 1 ? 'disabled' : ''} title="Move Down">▼</button>
          <button class="btn btn-ghost btn-icon" style="padding: 2px 6px; color: var(--accent-rose);" onclick="toggleWishlist(${s.lineNo})" title="Remove">✕</button>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

function moveWishlist(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= state.wishlist.length) return;
  const temp = state.wishlist[index];
  state.wishlist[index] = state.wishlist[newIndex];
  state.wishlist[newIndex] = temp;
  localStorage.setItem('yul_wishlist', JSON.stringify(state.wishlist));
  renderWishlist();
}

function checkWishlistAlerts() {
  if (!state.previouslyFree || state.previouslyFree.size === 0) return;

  const newlyTakenWishlist = [];
  const shiftsMap = new Map(state.shifts.map(s => [s.lineNo, s]));

  for (const lineNo of state.wishlist) {
    if (state.previouslyFree.has(lineNo)) {
      const current = shiftsMap.get(lineNo);
      if (current && current.isTaken) {
        newlyTakenWishlist.push(current);
      }
    }
  }

  if (newlyTakenWishlist.length > 0) {
    const names = newlyTakenWishlist.map(s => `Line #${s.lineNo}`).join(', ');
    elements.wishlistAlertBox.innerHTML = `
      <span>⚠️ <strong>Shift Alert:</strong> ${names} on your shortlist was just claimed during live bidding!</span>
    `;
    elements.wishlistAlertBox.classList.remove('hidden');
  }
}

// -------------------------------------------------------------
// Seniority Roster Rendering
// -------------------------------------------------------------
function renderRoster() {
  const q = elements.rosterSearchInput.value.toLowerCase().trim();
  const day = elements.rosterDayFilter.value;

  let filtered = state.roster.filter(r => {
    if (day !== 'all' && r.date !== day) return false;
    if (q) {
      const matchName = (r.name || '').toLowerCase().includes(q);
      const matchEE = (r.ee || '').toLowerCase().includes(q);
      const matchLms = (r.lms || '').toLowerCase().includes(q);
      const matchRank = r.rank.toString() === q;
      const matchLine = r.lineNo && r.lineNo.toString() === q;
      if (!matchName && !matchEE && !matchLms && !matchRank && !matchLine) return false;
    }
    return true;
  });

  if (q && filtered.length >= 1 && filtered.length <= 3) {
    const target = filtered[0];
    const picksBefore = target.rank - (state.stats?.awardedBidders || 0);
    elements.myRosterPositionCard.innerHTML = `
      <div>
        <h3 style="font-size: 1.1rem; font-weight: 800;">${target.name} (EE #${target.ee})</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 3px;">
          Rank #${target.rank} • Scheduled: <strong>${target.date} at ${target.time}</strong> • Cert: ${target.cert || 'Standard'}
        </p>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 1.3rem; font-weight: 800; font-family: var(--font-mono); color: var(--accent-primary);">
          ${target.lineNo ? `Awarded Line #${target.lineNo}` : `${picksBefore > 0 ? picksBefore : 0} picks to go`}
        </span>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${target.lineNo ? 'Selection Confirmed' : 'Estimated turn'}</div>
      </div>
    `;
    elements.myRosterPositionCard.classList.remove('hidden');
  } else {
    elements.myRosterPositionCard.classList.add('hidden');
  }

  if (filtered.length === 0) {
    elements.rosterTableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
          No bidders match your search criteria.
        </td>
      </tr>
    `;
    return;
  }

  elements.rosterTableBody.innerHTML = filtered.map(r => {
    const isAwarded = r.lineNo !== null;
    const statusHtml = isAwarded
      ? `<span class="status-badge taken">Awarded #${r.lineNo}</span>`
      : `<span class="status-badge" style="background-color: var(--bg-tertiary); color: var(--text-muted);">Pending Bid</span>`;

    return `
      <tr>
        <td style="font-family: var(--font-mono); font-weight: 700;">#${r.rank}</td>
        <td>${r.date || '-'}</td>
        <td style="font-family: var(--font-mono); font-weight: 600;">${r.time || '-'}</td>
        <td><strong>${r.name}</strong></td>
        <td style="font-family: var(--font-mono); color: var(--text-muted);">${r.ee || '-'}</td>
        <td><span class="hours-tag">${r.ftpt}</span></td>
        <td>${r.cert || '-'}</td>
        <td>
          ${r.lineNo ? `<button class="line-no-btn" onclick="openShiftModal(${r.lineNo})">Line #${r.lineNo}</button>` : '-'}
        </td>
        <td>${statusHtml}</td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// Analytics Tab Rendering
// -------------------------------------------------------------
function renderAnalytics() {
  const shifts = state.shifts;
  if (!shifts || shifts.length === 0) return;

  function renderStatBars(container, data) {
    container.innerHTML = data.map(item => {
      const pct = Math.round((item.free / item.total) * 100) || 0;
      return `
        <div class="stat-bar-item">
          <div class="stat-bar-header">
            <span>${item.label}</span>
            <span><strong>${item.free}</strong> free / ${item.total} (${pct}%)</span>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Depts
  const depts = ['DI', 'TB', 'NPST', 'NPSV', 'HBS', 'Variable'];
  const deptData = depts.map(d => {
    const matches = shifts.filter(s => s.type === d);
    return {
      label: d,
      total: matches.length,
      free: matches.filter(s => !s.isTaken).length
    };
  });
  renderStatBars(elements.analyticsDeptList, deptData);

  // Patterns
  const patterns = ['4x10', '5x8', '4x6', '3x8', '5x4', '2x10'];
  const patData = patterns.map(p => {
    const matches = shifts.filter(s => s.shiftPattern === p);
    return {
      label: p,
      total: matches.length,
      free: matches.filter(s => !s.isTaken).length
    };
  });
  renderStatBars(elements.analyticsPatternList, patData);

  // Time windows
  const timeData = [
    { label: 'Early Morning (01:00-05:30)', free: shifts.filter(s => !s.isTaken && isTimeInMinutes(s.primaryStart, 60, 330)).length, total: shifts.filter(s => isTimeInMinutes(s.primaryStart, 60, 330)).length },
    { label: 'Morning (05:30-11:40)', free: shifts.filter(s => !s.isTaken && isTimeInMinutes(s.primaryStart, 331, 700)).length, total: shifts.filter(s => isTimeInMinutes(s.primaryStart, 331, 700)).length },
    { label: 'Afternoon (11:40-16:00)', free: shifts.filter(s => !s.isTaken && isTimeInMinutes(s.primaryStart, 701, 960)).length, total: shifts.filter(s => isTimeInMinutes(s.primaryStart, 701, 960)).length },
    { label: 'Evening / Night (16:00+)', free: shifts.filter(s => !s.isTaken && isTimeInMinutes(s.primaryStart, 961, 1440)).length, total: shifts.filter(s => isTimeInMinutes(s.primaryStart, 961, 1440)).length }
  ];
  renderStatBars(elements.analyticsTimeList, timeData);

  // Weekend
  const weekendData = [
    { label: '🏖️ Sat & Sun Both Off', free: shifts.filter(s => !s.isTaken && s.hasWeekendOff).length, total: shifts.filter(s => s.hasWeekendOff).length },
    { label: 'Saturday Off', free: shifts.filter(s => !s.isTaken && s.hasSatOff).length, total: shifts.filter(s => s.hasSatOff).length },
    { label: 'Sunday Off', free: shifts.filter(s => !s.isTaken && s.hasSunOff).length, total: shifts.filter(s => s.hasSunOff).length },
    { label: 'Fri & Sat Off', free: shifts.filter(s => !s.isTaken && s.hasFriSatOff).length, total: shifts.filter(s => s.hasFriSatOff).length },
    { label: 'Sun & Mon Off', free: shifts.filter(s => !s.isTaken && s.hasSunMonOff).length, total: shifts.filter(s => s.hasSunMonOff).length }
  ];
  renderStatBars(elements.analyticsWeekendList, weekendData);
}

// -------------------------------------------------------------
// Shift Line Details Modal
// -------------------------------------------------------------
function openShiftModal(lineNo) {
  const shift = state.shifts.find(s => s.lineNo === lineNo);
  if (!shift) return;

  elements.modalLineBadge.textContent = `Line #${shift.lineNo}`;
  elements.modalTitle.textContent = `${shift.type} Screening Shift (${shift.shiftPattern})`;

  const isStarred = state.wishlist.includes(shift.lineNo);
  elements.modalWishlistBtn.textContent = isStarred ? '★ Remove from Shortlist' : '⭐ Add to Shortlist';
  elements.modalWishlistBtn.onclick = () => {
    toggleWishlist(shift.lineNo);
    openShiftModal(shift.lineNo);
  };

  const days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
  let schedRows = days.map(d => {
    const day = shift.schedule[d];
    const locSlug = day.locSlug || 'default';
    const locBadge = day.shortLoc
      ? `<span class="day-chip-loc loc-${locSlug}" style="font-size:0.75rem; padding: 2px 6px;">${day.shortLoc}</span>`
      : '';
    const locFull = day.location || day.raw || '-';

    return `
      <tr>
        <td><strong>${d}</strong></td>
        <td>${day.isOff ? '<span style="color: var(--text-dim); font-weight:700;">OFF</span>' : `<span style="font-family: var(--font-mono); font-weight:700;">${day.start ? `${day.start} – ${day.end}` : 'WORK'}</span>`}</td>
        <td>${day.isOff ? '-' : `<div style="display:flex; align-items:center; gap:6px;">${locBadge} <strong>${locFull}</strong></div>`}</td>
        <td style="color: var(--text-muted); font-size: 0.82rem;">${day.note || (day.isOff ? 'Scheduled Day Off' : day.raw)}</td>
      </tr>
    `;
  }).join('');

  let assignmentInfo = '';
  if (shift.isTaken) {
    const a = shift.assignedTo;
    assignmentInfo = `
      <div style="background-color: var(--badge-taken-bg); border: 1px solid var(--badge-taken-border); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 16px;">
        <strong style="color: var(--badge-taken-text);">🔴 Claimed by:</strong>
        <div style="margin-top: 4px; font-size: 0.95rem; font-weight: 700;">${a?.name || 'Assigned Officer'}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">
          ${a?.rank ? `Rank #${a.rank} • ` : ''} ${a?.ee ? `EE #${a.ee} • ` : ''} ${a?.date ? `Bid Time: ${a.date} ${a.time}` : ''}
        </div>
      </div>
    `;
  } else {
    assignmentInfo = `
      <div style="background-color: var(--badge-free-bg); border: 1px solid var(--badge-free-border); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 16px;">
        <strong style="color: var(--badge-free-text);">🟢 Available for Selection:</strong>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">This line has not been selected yet and can be bid on when your turn arrives.</p>
      </div>
    `;
  }

  const cat = shift.genderCategory || getShiftGenderCat(shift);
  let genderDesc = '🌐 Open (No gender restriction - anyone can take this shift)';
  if (cat === 'male') genderDesc = '♂️ MALE (Restricted to Male officers)';
  if (cat === 'female') genderDesc = '♀️ FEMALE (Restricted to Female officers)';
  if (cat === 'mixed') genderDesc = '🔄 MIXED (Switchable M/F Rotation - anyone male or female can take this shift)';

  elements.modalBody.innerHTML = `
    ${assignmentInfo}

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
      <div class="kpi-card" style="padding: 10px;">
        <div class="kpi-content">
          <span class="kpi-label">Shift Pattern</span>
          <span class="kpi-value" style="font-size: 1.1rem;">${shift.shiftPattern}</span>
        </div>
      </div>
      <div class="kpi-card" style="padding: 10px;">
        <div class="kpi-content">
          <span class="kpi-label">Weekly Hours</span>
          <span class="kpi-value" style="font-size: 1.1rem;">${shift.hours} hrs (${shift.ftpt})</span>
        </div>
      </div>
      <div class="kpi-card" style="padding: 10px;">
        <div class="kpi-content">
          <span class="kpi-label">Days Off</span>
          <span class="kpi-value" style="font-size: 1.1rem;">${shift.hasWeekendOff ? '🏖️ Weekend' : shift.offDays.join('/')}</span>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 12px; font-size: 0.85rem; display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
      <strong>Assigned Location(s):</strong>
      <span class="shift-loc-summary" style="font-size: 0.82rem; padding: 2px 8px; max-width: none;">📍 ${shift.locations?.length > 0 ? shift.locations.join(' • ') : (shift.locationSummary || 'General')}</span>
    </div>

    <div style="margin-bottom: 12px; font-size: 0.85rem;">
      <strong>Gender Requirement:</strong> <span style="font-weight: 600;">${genderDesc}</span>
    </div>

    ${shift.notes ? `<p style="font-size: 0.82rem; margin-bottom: 12px; color: var(--accent-amber);"><strong>Note:</strong> ${shift.notes}</p>` : ''}

    <h4 style="font-size: 0.88rem; margin-bottom: 6px;">7-Day Detailed Schedule & Specific Posts:</h4>
    <table class="modal-schedule-table">
      <thead>
        <tr>
          <th>Day</th>
          <th>Shift Hours</th>
          <th>Location / Specific Post</th>
          <th>Details & Raw</th>
        </tr>
      </thead>
      <tbody>
        ${schedRows}
      </tbody>
    </table>
  `;

  elements.shiftModal.classList.remove('hidden');
}

function closeShiftModal() {
  elements.shiftModal.classList.add('hidden');
}

// -------------------------------------------------------------
// Tabs Navigation
// -------------------------------------------------------------
function switchTab(tabId) {
  state.activeTab = tabId;
  elements.navTabs.forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabId);
  });
  elements.tabPanes.forEach(p => {
    p.classList.remove('active');
  });
  const targetPane = document.getElementById(`pane${capitalize(tabId)}`);
  if (targetPane) targetPane.classList.add('active');

  if (tabId === 'wishlist') renderWishlist();
  if (tabId === 'roster') renderRoster();
  if (tabId === 'analytics') renderAnalytics();
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// -------------------------------------------------------------
// Theme Management
// -------------------------------------------------------------
function applyTheme(theme) {
  state.theme = theme;
  if (theme === 'light') {
    document.body.classList.remove('dark');
    document.body.classList.add('light');
    elements.themeIcon.textContent = '☀️';
  } else {
    document.body.classList.remove('light');
    document.body.classList.add('dark');
    elements.themeIcon.textContent = '🌙';
  }
  localStorage.setItem('yul_theme', theme);
}

// -------------------------------------------------------------
// Event Listeners Setup
// -------------------------------------------------------------
function setupEventListeners() {
  // Theme Toggle
  elements.themeToggle.addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  // Refresh Button
  elements.refreshBtn.addEventListener('click', () => {
    loadShiftsData(true);
  });

  // Auto Refresh Select
  elements.autoRefreshSelect.addEventListener('change', (e) => {
    state.autoRefreshInterval = parseInt(e.target.value);
    setupAutoRefresh();
  });

  // Nav Tabs
  elements.navTabs.forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });

  // KPI Quick Filters
  elements.kpiFreeCard.addEventListener('click', () => {
    state.filters.status = 'free';
    syncFilterInputsWithState();
    switchTab('explorer');
    renderExplorer();
  });
  elements.kpiWeekendCard.addEventListener('click', () => {
    state.filters.status = 'free';
    state.filters.daysOff = 'weekend';
    syncFilterInputsWithState();
    switchTab('explorer');
    renderExplorer();
  });
  elements.kpiFTCard.addEventListener('click', () => {
    state.filters.status = 'free';
    state.filters.ftpt = 'FT';
    syncFilterInputsWithState();
    switchTab('explorer');
    renderExplorer();
  });
  elements.kpiPTCard.addEventListener('click', () => {
    state.filters.status = 'free';
    state.filters.ftpt = 'PT';
    syncFilterInputsWithState();
    switchTab('explorer');
    renderExplorer();
  });
  elements.kpiTakenCard.addEventListener('click', () => {
    state.filters.status = 'taken';
    syncFilterInputsWithState();
    switchTab('explorer');
    renderExplorer();
  });
  elements.kpiWishlistCard.addEventListener('click', () => {
    switchTab('wishlist');
  });

  // Search Input with Debounce
  let searchTimer;
  elements.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.filters.search = e.target.value;
      elements.clearSearchBtn.classList.toggle('hidden', !e.target.value);
      renderExplorer();
    }, 200);
  });

  elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.filters.search = '';
    elements.clearSearchBtn.classList.add('hidden');
    renderExplorer();
  });

  // Segmented Availability Control
  elements.statusFilterControl.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      elements.statusFilterControl.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filters.status = btn.dataset.val;
      renderExplorer();
    });
  });

  // Dropdown Filters
  elements.filterType.addEventListener('change', (e) => {
    state.filters.type = e.target.value;
    renderExplorer();
  });
  if (elements.filterLocation) {
    elements.filterLocation.addEventListener('change', (e) => {
      state.filters.location = e.target.value;
      renderExplorer();
    });
  }
  elements.filterPattern.addEventListener('change', (e) => {
    state.filters.pattern = e.target.value;
    renderExplorer();
  });
  elements.filterFtPt.addEventListener('change', (e) => {
    state.filters.ftpt = e.target.value;
    renderExplorer();
  });
  elements.filterDaysOff.addEventListener('change', (e) => {
    state.filters.daysOff = e.target.value;
    renderExplorer();
  });

  elements.timeFromSelect.addEventListener('change', applyCustomTimeRange);
  elements.timeToSelect.addEventListener('change', applyCustomTimeRange);

  elements.sortBySelect.addEventListener('change', (e) => {
    state.filters.sortBy = e.target.value;
    renderExplorer();
  });

  elements.resetFiltersBtn.addEventListener('click', resetAllFilters);

  // View Mode Toggle (Table / Grid)
  elements.viewTableBtn.addEventListener('click', () => {
    state.viewMode = 'table';
    elements.viewTableBtn.classList.add('active');
    elements.viewGridBtn.classList.remove('active');
    localStorage.setItem('yul_view_mode', 'table');
    renderExplorer();
  });

  elements.viewGridBtn.addEventListener('click', () => {
    state.viewMode = 'grid';
    elements.viewGridBtn.classList.add('active');
    elements.viewTableBtn.classList.remove('active');
    localStorage.setItem('yul_view_mode', 'grid');
    renderExplorer();
  });

  // Wishlist Actions
  elements.clearWishlistBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your priority bidding shortlist?')) {
      state.wishlist = [];
      localStorage.setItem('yul_wishlist', '[]');
      updateKpis();
      renderWishlist();
      renderExplorer();
    }
  });

  elements.exportWishlistBtn.addEventListener('click', () => {
    window.print();
  });

  // Roster Search
  let rosterSearchTimer;
  elements.rosterSearchInput.addEventListener('input', () => {
    clearTimeout(rosterSearchTimer);
    rosterSearchTimer = setTimeout(renderRoster, 200);
  });
  elements.rosterDayFilter.addEventListener('change', renderRoster);

  // Modal Close
  elements.modalCloseBtn.addEventListener('click', closeShiftModal);
  elements.modalCloseFooterBtn.addEventListener('click', closeShiftModal);
  elements.shiftModal.addEventListener('click', (e) => {
    if (e.target === elements.shiftModal) closeShiftModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.shiftModal.classList.contains('hidden')) {
      closeShiftModal();
    }
  });
}

// Global helpers for inline HTML onclick handlers
window.toggleWishlist = toggleWishlist;
window.openShiftModal = openShiftModal;
window.moveWishlist = moveWishlist;
window.removeFilterChip = removeFilterChip;
window.resetAllFilters = resetAllFilters;
window.switchTab = switchTab;

window.toggleGenderOption = toggleGenderOption;
window.setGenderPreset = setGenderPreset;

window.toggleTimePeriod = toggleTimePeriod;
window.setTimePreset = setTimePreset;
window.toggleCustomTimeMode = toggleCustomTimeMode;
window.setCustomTimeSlot = setCustomTimeSlot;
window.applyCustomTimeRange = applyCustomTimeRange;
window.clearCustomTimeRange = clearCustomTimeRange;

window.setDeptFilter = setDeptFilter;
window.selectOnlyNpst = selectOnlyNpst;
window.setNpstPreset = setNpstPreset;
window.toggleNpstPost = toggleNpstPost;

window.toggleShiftSelection = toggleShiftSelection;
window.toggleSelectAllVisible = toggleSelectAllVisible;
window.selectAllNpstShifts = selectAllNpstShifts;
window.selectOnlyFreeNpstShifts = selectOnlyFreeNpstShifts;
window.clearSelectedShifts = clearSelectedShifts;
window.addSelectedToWishlist = addSelectedToWishlist;
window.copySelectedLineNumbers = copySelectedLineNumbers;

// PWA Installation & Service Worker Registration
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (elements.installAppBtn) {
    elements.installAppBtn.classList.remove('hidden');
    elements.installAppBtn.style.display = 'inline-flex';
  }
});

if (elements.installAppBtn) {
  elements.installAppBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      alert('To install this app:\n• On Android (Chrome): Tap browser menu (⋮) -> "Add to Home screen" or "Install app".\n• On iPhone (Safari): Tap Share icon -> "Add to Home Screen".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User install outcome: ${outcome}`);
    deferredPrompt = null;
    elements.installAppBtn.classList.add('hidden');
    elements.installAppBtn.style.display = 'none';
  });
}

window.addEventListener('appinstalled', () => {
  console.log('App installed as PWA');
  if (elements.installAppBtn) {
    elements.installAppBtn.classList.add('hidden');
    elements.installAppBtn.style.display = 'none';
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('PWA Service Worker registered:', reg.scope))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}

// Start app
document.addEventListener('DOMContentLoaded', init);
