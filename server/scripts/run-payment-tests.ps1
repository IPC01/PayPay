$ErrorActionPreference = 'Stop'

function Invoke-Api {
  param(
    [Parameter(Mandatory=$true)][string]$Method,
    [Parameter(Mandatory=$true)][string]$Uri,
    [hashtable]$Headers,
    $Body
  )

  try {
    $json = $null
    if ($null -ne $Body) {
      $json = $Body | ConvertTo-Json -Depth 8
    }

    $response = Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers -Body $json -ContentType 'application/json'
    return [pscustomobject]@{ ok = $true; status = 200; body = $response }
  }
  catch {
    $statusCode = -1
    try { $statusCode = [int]$_.Exception.Response.StatusCode } catch {}

    $details = $null
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
      $details = $_.ErrorDetails.Message
    } else {
      $details = $_.Exception.Message
    }

    return [pscustomobject]@{ ok = $false; status = $statusCode; body = $details }
  }
}

$health = Invoke-Api -Method 'Get' -Uri 'http://localhost:8000/health'
if (-not $health.ok) {
  throw "API indisponivel: $($health.body)"
}

$login = Invoke-Api -Method 'Post' -Uri 'http://localhost:8000/api/auth/login' -Body @{
  email = 'admin@test.com'
  password = '123456'
}
if (-not $login.ok) {
  throw "Falha no login: $($login.body)"
}

$token = $login.body.token
$authHeaders = @{ Authorization = "Bearer $token" }

$wallet = Invoke-Api -Method 'Post' -Uri 'http://localhost:8000/api/wallets' -Headers $authHeaders -Body @{
  walletName = 'Wallet Teste B2C C2B'
  walletTypeId = 1
  currency = 'MZN'
}
if (-not $wallet.ok) {
  throw "Falha ao criar wallet: $($wallet.body)"
}

$walletCode = $wallet.body.wallet.walletCode

$apiKeyResp = Invoke-Api -Method 'Post' -Uri 'http://localhost:8000/api/keys/api-keys' -Headers $authHeaders -Body @{
  name = ('key-test-' + [Guid]::NewGuid().ToString('N').Substring(0, 8))
  scopes = @('wallet:deposit', 'wallet:withdraw')
}
if (-not $apiKeyResp.ok) {
  throw "Falha ao criar API key: $($apiKeyResp.body)"
}

$apiKey = $apiKeyResp.body.apiKey
$keyHeaders = @{ 'x-api-key' = $apiKey }

$c2b = Invoke-Api -Method 'Post' -Uri 'http://localhost:8000/api/v1/mpesa/mock/c2b' -Headers $keyHeaders -Body @{
  walletCode = $walletCode
  amount = 10
  phone = '258841234567'
  reference = ('C2B-' + [Guid]::NewGuid().ToString('N').Substring(0, 8))
}

$b2c = Invoke-Api -Method 'Post' -Uri 'http://localhost:8000/api/v1/mpesa/mock/b2c' -Headers $keyHeaders -Body @{
  walletCode = $walletCode
  amount = 10
  phone = '258841234567'
  reference = ('B2C-' + [Guid]::NewGuid().ToString('N').Substring(0, 8))
}

$result = [pscustomobject]@{
  walletCode = $walletCode
  c2b = [pscustomobject]@{
    ok = $c2b.ok
    status = $c2b.status
    body = $c2b.body
  }
  b2c = [pscustomobject]@{
    ok = $b2c.ok
    status = $b2c.status
    body = $b2c.body
  }
}

$result | ConvertTo-Json -Depth 12
