cd C:\Users\Lynn\biblelessonspark
git checkout ui-sidebar
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd C:\Users\Lynn\biblelessonspark; npm run dev'
Write-Host "Dev server starting -- open http://localhost:8080/dashboard in your browser"
Write-Host "If port 8080 is busy, try 8081 or 8082"
