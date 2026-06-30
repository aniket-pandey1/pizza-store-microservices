$env:JAVA_HOME = "C:\Program Files\Java\jdk-25"
$services = @("service-registry", "user-service", "admin-service", "order-service", "payment-service", "notification-service")

Write-Host "Starting MySQL Database check..."
# MySQL is already running as a service, we created the database.

foreach ($svc in $services) {
    Write-Host "Starting $svc..."
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "`$env:JAVA_HOME='C:\Program Files\Java\jdk-25'; cd $svc; .\mvnw spring-boot:run" -WindowStyle Normal
    Start-Sleep -Seconds 15 # Wait a bit for the previous service to initialize, especially Eureka
}

# Start Frontend
Write-Host "Starting Frontend..."
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd pizza-frontend; npm install; npm start" -WindowStyle Normal

Write-Host "All services have been instructed to start!"
Write-Host "You should see 7 new PowerShell windows open, one for each service."
Write-Host "Wait a minute for them all to say 'Started ...Application', then visit http://localhost:3000"
