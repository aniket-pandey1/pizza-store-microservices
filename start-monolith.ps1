$env:JAVA_HOME = "C:\Program Files\Java\jdk-25"

Write-Host "Starting MySQL Database check..."
# MySQL is already running as a service, we created the database earlier.

Write-Host "Starting Pizza Monolith..."
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "`$env:JAVA_HOME='C:\Program Files\Java\jdk-25'; cd pizza-monolith; .\mvnw.cmd spring-boot:run" -WindowStyle Normal

Start-Sleep -Seconds 5

# Start Frontend
Write-Host "Starting Frontend..."
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd pizza-frontend; npm start" -WindowStyle Normal

Write-Host "The Monolith and Frontend have been instructed to start!"
Write-Host "You should see 2 new PowerShell windows open."
Write-Host "Wait a minute for the Spring Boot app to say 'Started PizzaMonolithApplication', then visit http://localhost:3000"
