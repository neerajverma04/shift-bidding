@echo off
title YUL Shift Bidding Live Assistant
echo =======================================================
echo    YUL Montreal-Trudeau Airport - Shift Bidding
echo    Live Filter, Free Shift Tracker & Seniority Planner
echo =======================================================
echo.
echo Starting local web server...
start http://localhost:3000
node server.js
pause
