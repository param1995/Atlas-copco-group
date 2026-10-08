$response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method Get
$response.Content
