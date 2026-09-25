@echo off
title RentHubR Stress Test
echo ========================================================
echo   RentHubR - REAL-TIME HIGH TRAFFIC STRESS TEST
echo ========================================================
echo Target: https://rent-hub-r.vercel.app
echo Simulating up to 250 concurrent users hitting your live site and APIs...
echo.
"C:\Users\dask6\AppData\Local\k6_studio\app-2.1.0\resources\x86_64\k6.exe" run "c:\Users\dask6\OneDrive\Desktop\jk\RentHubR\stress-test.js"
pause
