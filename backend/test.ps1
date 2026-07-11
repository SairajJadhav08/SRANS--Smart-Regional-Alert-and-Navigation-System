# SRANS Backend Test Script
$BASE = "http://localhost:5000/api"

Write-Host "`n=== 1. Health Check ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "http://localhost:5000/health" | ConvertTo-Json

Write-Host "`n=== 2. GET /alerts (public, empty) ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$BASE/alerts" | ConvertTo-Json

Write-Host "`n=== 3. Login as gov user ===" -ForegroundColor Cyan
$loginBody = '{"username":"govofficial","password":"govpass123"}'
$loginRes = Invoke-RestMethod -Uri "$BASE/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$govToken = $loginRes.token
Write-Host "Token acquired: $($govToken.Substring(0,30))..."

Write-Host "`n=== 4. Create Alert (gov user) ===" -ForegroundColor Cyan
$alertBody = '{"title":"Flooding - Pune Station Road","description":"Heavy rainfall causing flooding. Road impassable. Use Tilak Road diversion.","alert_type":"Weather","location_lat":18.5200,"location_lng":73.8580}'
$headers = @{ Authorization = "Bearer $govToken" }
$newAlert = Invoke-RestMethod -Uri "$BASE/alerts" -Method POST -Body $alertBody -ContentType "application/json" -Headers $headers
$newAlert | ConvertTo-Json
$alertId = $newAlert.id

Write-Host "`n=== 5. GET /alerts (now has 1 alert) ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$BASE/alerts" | ConvertTo-Json -Depth 2

Write-Host "`n=== 6. Save a Route (regular user) ===" -ForegroundColor Cyan
$userLoginBody = '{"username":"testuser","password":"testpass123"}'
$userLoginRes = Invoke-RestMethod -Uri "$BASE/auth/login" -Method POST -Body $userLoginBody -ContentType "application/json"
$userToken = $userLoginRes.token
$userHeaders = @{ Authorization = "Bearer $userToken" }
$routeBody = '{"name":"Home to Work","start_lat":18.5100,"start_lng":73.8450,"end_lat":18.5300,"end_lng":73.8650}'
$newRoute = Invoke-RestMethod -Uri "$BASE/routes" -Method POST -Body $routeBody -ContentType "application/json" -Headers $userHeaders
$newRoute | ConvertTo-Json
$routeId = $newRoute.id

Write-Host "`n=== 7. AI Route Planner ===" -ForegroundColor Cyan
$aiBody = "{`"route_id`":$routeId,`"arrival_time`":`"09:00`"}"
$aiRes = Invoke-RestMethod -Uri "$BASE/ai/routine-planner" -Method POST -Body $aiBody -ContentType "application/json" -Headers $userHeaders
Write-Host $aiRes.recommendation

Write-Host "`n=== 8. AI Chat ===" -ForegroundColor Cyan
$chatBody = '{"message":"Is it safe to travel through Pune Station Road right now?"}'
$chatRes = Invoke-RestMethod -Uri "$BASE/ai/chat" -Method POST -Body $chatBody -ContentType "application/json" -Headers $userHeaders
Write-Host $chatRes.reply

Write-Host "`n=== 9. Superuser: List Gov Users ===" -ForegroundColor Cyan
$superLoginBody = '{"username":"superadmin","password":"admin12345"}'
$superLoginRes = Invoke-RestMethod -Uri "$BASE/auth/login" -Method POST -Body $superLoginBody -ContentType "application/json"
$superToken = $superLoginRes.token
$superHeaders = @{ Authorization = "Bearer $superToken" }
Invoke-RestMethod -Uri "$BASE/auth/admin/gov-users" -Headers $superHeaders | ConvertTo-Json -Depth 2

Write-Host "`n=== All tests passed! ===" -ForegroundColor Green
