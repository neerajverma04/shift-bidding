/**
 * Shift Bidding Live Server
 * Zero external dependencies (uses standard Node.js http/https/fs)
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;
const SPREADSHEET_ID = '19mkckofhK9biJPTpJW-YacQqPaDRYEYx1gOkKI7xQM4';
const GID_ALL_LINES = '738903771';
const GID_ROSTER = '2100178176';

// Cache for live data
let cachedData = null;
let lastFetchTime = null;
let isFetching = false;

// Helper to download content following redirects
function fetchUrl(targetUrl) {
  return new Promise((resolve, reject) => {
    const handleResponse = (res) => {
      // Follow 301, 302, 307 redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          const parsed = new URL(targetUrl);
          redirectUrl = `${parsed.origin}${redirectUrl}`;
        }
        https.get(redirectUrl, handleResponse).on('error', reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP status ${res.statusCode}`));
        return;
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    };

    https.get(targetUrl, handleResponse).on('error', reject);
  });
}

function parseCSV(text) {
  const lines = text.split('\n');
  const rows = [];
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    let p = '', q = false, r = [];
    for (let i = 0; i < line.length; i++) {
      let c = line[i];
      if (c === '"') {
        if (q && line[i+1] === '"') { p += '"'; i++; }
        else { q = !q; }
      } else if (c === ',' && !q) {
        r.push(p);
        p = '';
      } else {
        p += c;
      }
    }
    r.push(p);
    rows.push(r);
  }
  return rows;
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

async function loadData(forceRefresh = false) {
  const now = Date.now();
  // Cache for 15 seconds unless forced
  if (!forceRefresh && cachedData && lastFetchTime && (now - lastFetchTime < 15000)) {
    return cachedData;
  }

  if (isFetching) {
    if (cachedData) return cachedData;
  }

  isFetching = true;
  try {
    let linesCsvText = '';
    let rosterCsvText = '';

    try {
      console.log(`[${new Date().toLocaleTimeString()}] Fetching live sheets from Google...`);
      const linesUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID_ALL_LINES}`;
      const rosterUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID_ROSTER}`;
      
      const [lRes, rRes] = await Promise.all([
        fetchUrl(linesUrl),
        fetchUrl(rosterUrl)
      ]);
      linesCsvText = lRes;
      rosterCsvText = rRes;

      // Save local backup copies
      fs.writeFileSync(path.join(__dirname, 'sheet_738903771.csv'), linesCsvText, 'utf8');
      fs.writeFileSync(path.join(__dirname, 'sheet_2100178176.csv'), rosterCsvText, 'utf8');
      console.log('Successfully fetched live Google Sheets data and updated local backup.');
    } catch (fetchErr) {
      console.warn('Network fetch from Google failed, using local backup files:', fetchErr.message);
      if (fs.existsSync(path.join(__dirname, 'sheet_738903771.csv'))) {
        linesCsvText = fs.readFileSync(path.join(__dirname, 'sheet_738903771.csv'), 'utf8');
      }
      if (fs.existsSync(path.join(__dirname, 'sheet_2100178176.csv'))) {
        rosterCsvText = fs.readFileSync(path.join(__dirname, 'sheet_2100178176.csv'), 'utf8');
      }
    }

    if (!linesCsvText) {
      throw new Error('No line data available (both remote and local failed)');
    }

    // 1. Process Roster
    const roster = [];
    const takenMap = new Map(); // lineNo -> bidder object

    if (rosterCsvText) {
      const rosterRaw = parseCSV(rosterCsvText);
      for (let i = 4; i < rosterRaw.length; i++) {
        const row = rosterRaw[i];
        if (!row || row.length < 8) continue;
        const date = row[0]?.trim();
        const time = row[1]?.trim();
        const rankStr = row[2]?.trim();
        const lineNoStr = row[3]?.trim();
        const pref = row[4]?.trim();
        const ee = row[5]?.trim();
        const lms = row[6]?.trim();
        const name = row[7]?.trim();
        const ftpt = row[8]?.trim();
        const gender = row[9]?.trim();
        const cert = row[10]?.trim();

        if (rankStr && !isNaN(parseInt(rankStr))) {
          const rank = parseInt(rankStr);
          const lineNo = lineNoStr && !isNaN(parseInt(lineNoStr)) ? parseInt(lineNoStr) : null;
          const bidder = {
            date,
            time,
            rank,
            lineNo,
            pref,
            ee,
            lms,
            name,
            ftpt,
            gender,
            cert
          };
          roster.push(bidder);
          if (lineNo) {
            takenMap.set(lineNo, bidder);
          }
        }
      }
    }

    // 2. Process All Lines
    const linesRaw = parseCSV(linesCsvText);
    const shifts = [];
    const dayKeys = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];

    for (let i = 1; i < linesRaw.length; i++) {
      const row = linesRaw[i];
      if (!row || row.length < 5) continue;
      const empNo = row[0]?.trim();
      const empName = row[1]?.trim();
      const lineNoStr = row[2]?.trim();
      if (!lineNoStr || isNaN(parseInt(lineNoStr))) continue;
      const lineNo = parseInt(lineNoStr);

      const schedule = {};
      const offDays = [];
      const workDays = [];
      const startTimes = [];
      const endTimes = [];

      dayKeys.forEach((d, idx) => {
        const rawVal = row[3 + idx]?.trim() || '';
        const dayNote = row[17 + idx]?.trim() || '';
        const isOff = rawVal === 'X' || rawVal.toUpperCase() === 'X' || !rawVal;
        
        const locInfo = formatLocationInfo(rawVal);
        let start = null;
        let end = null;
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

      // Collect locations
      const shiftLocations = [];
      const shiftShortLocs = [];
      dayKeys.forEach(d => {
        const item = schedule[d];
        if (!item.isOff && item.shortLoc) {
          if (!shiftShortLocs.includes(item.shortLoc)) {
            shiftShortLocs.push(item.shortLoc);
          }
          if (item.location && !shiftLocations.includes(item.location)) {
            shiftLocations.push(item.location);
          }
        }
      });
      const locationSummary = shiftShortLocs.join(' · ');

      const week = row[10]?.trim() || '';
      const genderReq = row[11]?.trim() || '';
      let genderCategory = 'open';
      const gUpper = genderReq.toUpperCase();
      if (gUpper.includes('FEMALE')) {
        genderCategory = 'female';
      } else if (gUpper.includes('MALE')) {
        genderCategory = 'male';
      } else if (gUpper.includes('MIX')) {
        genderCategory = 'mixed';
      }
      const shiftPattern = row[12]?.trim() || '';
      const hours = parseInt(row[13]?.trim()) || 40;
      const type = row[14]?.trim() || 'Other';
      const notes = row[15]?.trim() || '';
      const ftpt = row[26]?.trim() || (hours >= 35 ? 'FT' : 'PT');

      // Check taken status
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

      // Primary start time
      const primaryStart = startTimes.length > 0 ? startTimes[0] : null;

      // Time category
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

    // Stats
    const totalLines = shifts.length;
    const takenLines = shifts.filter(s => s.isTaken).length;
    const freeLines = totalLines - takenLines;
    const freeWeekendOff = shifts.filter(s => !s.isTaken && s.hasWeekendOff).length;
    const freeFT = shifts.filter(s => !s.isTaken && s.ftpt === 'FT').length;
    const freePT = shifts.filter(s => !s.isTaken && s.ftpt === 'PT').length;

    cachedData = {
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
    lastFetchTime = now;
    return cachedData;
  } finally {
    isFetching = false;
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = reqUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (pathname === '/api/data') {
    try {
      const force = reqUrl.searchParams.get('refresh') === 'true';
      const data = await loadData(force);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (pathname === '/api/refresh') {
    try {
      const data = await loadData(true);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, timestamp: data.timestamp, stats: data.stats }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // Serve Static files from public/
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(__dirname, 'public', 'index.html');
    }
    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/html' });
      res.end(content);
    });
  });
});

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    // prioritize Wi-Fi or Ethernet
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && !name.toLowerCase().includes('vmware') && !name.toLowerCase().includes('virtual')) {
        return iface.address;
      }
    }
  }
  return '192.168.0.104';
}

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`=======================================================`);
  console.log(`✈️  YUL Shift Bidding Live System is running!`);
  console.log(`💻 On your computer:  http://localhost:${PORT}`);
  console.log(`📱 On your phone:     http://${localIp}:${PORT}`);
  console.log(`🔄 Auto-fetching Google Sheets: W26 Shift Bid`);
  console.log(`=======================================================`);
});
