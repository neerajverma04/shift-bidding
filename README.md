# ✈️ YUL Shift Bidding Live Assistant (W26)

A dedicated, real-time web application built for the **Montreal-Trudeau Airport (YUL) Shift Bidding** process. It connects directly to the live Google Spreadsheet, tracks available vs claimed shifts as officers bid, and provides instant filtering by department/bid type, start times, days off, and full-time/part-time status.

---

## 🚀 Quick Start

### Option 1: Double-Click Launcher (Windows)
Double-click `Start-Shift-Bid.bat`.  
This starts the local live server and opens `http://localhost:3000` automatically in your browser.

### Option 2: Command Line
```powershell
node server.js
```
Then visit [http://localhost:3000](http://localhost:3000).

---

## ✨ Key Features

1. **🔴 Live Google Sheets Sync**
   - Automatically polls Google Sheets (configurable: every 15s, 30s, 60s, or manual "Refresh Now").
   - Cross-checks both **"All Lines"** (`gid=738903771`) and **"FT and PT Bid"** (`gid=2100178176`) to ensure no taken line is missed.
   - Shows live connection status and countdown to next refresh.

2. **🔍 Advanced Shift Filtering**
   - **Availability Status:** `Free Only` (default), `All Lines`, `Taken Only`.
   - **Bid Type / Department:** `DI` (Domestic & International), `TB` (Transborder / US), `NPST` (Vehicles & NPS), `NPSV` (Non-Passenger Screening), `HBS` (Hold Baggage Screening), `Variable / Relief`.
   - **Shift Pattern:** `4x10` (4 days / 10h), `5x8` (5 days / 8h), `4x6` (24h PT), `3x8` (24h PT), `5x4` (20h PT), `2x10` (20h PT).
   - **Employment Type:** Full-Time (40h), Part-Time (20h - 24h).
   - **Start Time Window:** Early Morning (01:00-05:30), Morning (05:30-11:40), Afternoon/Swing (11:40-16:00), Evening/Night (16:00+).
   - **Days Off:** 🏖️ Sat & Sun (Full Weekend Off), Saturday Off, Sunday Off, Fri/Sat Off, Sun/Mon Off, or 3 Consecutive Days Off.
   - **Gender:** Any/Open, Female Only, Male Only lines.
   - **Search:** Instant search by Line number, note, employee name, or time.

3. **⭐ Priority Bidding Shortlist (Wishlist)**
   - Star any shift line to build your ranked priority list.
   - Reorder priorities (Priority #1, #2, #3...) using Up/Down controls.
   - **Live Alert:** If someone bids on one of your shortlisted lines while you wait, the app immediately flags it with an alert banner so you can pivot to your next choice.
   - Shortlist is saved in your browser (`localStorage`) and can be exported or printed.

4. **👥 Seniority Bidding Roster**
   - Search by your name, Employee # (EE#), LMS#, or Seniority Rank.
   - Instantly highlights your scheduled bid date and time, how many picks remain until your turn, and who has already selected which line.

5. **📊 Department & Schedule Analytics**
   - Live visual progress bars showing free vs taken lines by department, shift pattern, time window, and weekend-off availability.

6. **🎨 Customization & Views**
   - Switch between **Table View** and **Visual Card Grid View**.
   - Built-in **Dark Mode** and **Light Mode** toggle.
