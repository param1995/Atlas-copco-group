$response = Invoke-WebRequest -Uri "http://localhost:3000/api/dashboard" -Method Get
$response.Content
