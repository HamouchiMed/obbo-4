<#
Auto-setup PowerShell script for Obbo backend.

This script will:
- Prompt securely for your MongoDB Atlas password
- Build and write `backend/.env` (ATLAS_uri, MONGODB_URI, JWT_SECRET)
- Attempt to connect (node connect.cjs)
- If connection succeeds, run DB init (npm run init-db in backend)
- Optionally attempt to add env vars to Vercel and deploy (requires `vercel` CLI and logged-in session)

Run from repository root in PowerShell:
  .\scripts\auto-setup.ps1

Note: This script keeps secrets in memory and writes `backend/.env` (do not commit).
#>

function Write-Log { param($s) Write-Host "[auto-setup] $s" }

# Ensure Node is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is required but not found in PATH. Install Node.js and try again."
  exit 1
}

# Prompt for DB password securely
$securePw = Read-Host -AsSecureString "Enter MongoDB Atlas password for user 'obbo' (input hidden)"
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePw)
$plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

try {
  # URL-encode the password to safely place in URI
  $enc = [System.Uri]::EscapeDataString($plain)
  $atlasUri = "mongodb+srv://obbo:$enc@obbo.gskmusa.mongodb.net/?retryWrites=true&w=majority&appName=obbo"

  # Generate a JWT secret via Node for better entropy
  $jwt = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

  $envContent = @"
# Local environment variables for backend (DO NOT commit real secrets)
ATLAS_uri=$atlasUri
MONGODB_URI=${ATLAS_uri}
JWT_SECRET=$jwt
CORS_ORIGIN=http://localhost:3000

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
"@

  # Note: Use ${ATLAS_uri} same-style reference is supported by our connect helper
  # But Windows PowerShell will expand ${ATLAS_uri} if used in double quotes; write explicitly
  $envContent = $envContent -replace '\u007f\$\{ATLAS_uri\}', '$${ATLAS_uri}'

  # Write backend/.env
  $envPath = Join-Path -Path (Get-Location) -ChildPath 'backend\.env'
  Write-Log "Writing backend/.env to $envPath"
  $envContent | Out-File -FilePath $envPath -Encoding UTF8 -Force

  # Also save the resolved ATLAS_uri to a temporary file for vercel piping if needed
  $tmpUriPath = Join-Path -Path (Get-Location) -ChildPath 'backend\.atlas_tmp'
  $atlasUri | Out-File -FilePath $tmpUriPath -Encoding UTF8 -Force

  Write-Log "Attempting to connect using node connect.cjs"
  $env:ATLAS_uri = $atlasUri
  $env:MONGODB_URI = $atlasUri

  $connect = Start-Process node -ArgumentList 'connect.cjs' -NoNewWindow -Wait -PassThru -RedirectStandardOutput 'connect_out.txt' -RedirectStandardError 'connect_err.txt'
  $out = Get-Content 'connect_out.txt' -ErrorAction SilentlyContinue
  $err = Get-Content 'connect_err.txt' -ErrorAction SilentlyContinue
  Remove-Item 'connect_out.txt','connect_err.txt' -ErrorAction SilentlyContinue

  if ($connect.ExitCode -ne 0) {
    Write-Error "Connection test failed. Error output:\n$err\n$out"
    Write-Log "You can retry by running the secure test in the README or ensure Atlas user/password and Network Access are correct."
    exit $connect.ExitCode
  }

  Write-Log "Connection test succeeded. Running DB initialization..."
  Push-Location backend
  npm run init-db
  Pop-Location

  # Optional: attempt to add env vars to Vercel and deploy
  if (Get-Command vercel -ErrorAction SilentlyContinue) {
    $doVercel = Read-Host "vercel CLI is installed. Do you want to attempt to add env vars and deploy? (y/n)"
    if ($doVercel -match '^[Yy]') {
      Write-Log "Adding ATLAS_uri and MONGODB_URI to Vercel preview and production. Be prepared to allow interactive prompts."
      # Pipe the value into vercel env add which prompts for the value
      $atlasUri | vercel env add ATLAS_uri preview
      $atlasUri | vercel env add ATLAS_uri production
      $atlasUri | vercel env add MONGODB_URI preview
      $atlasUri | vercel env add MONGODB_URI production

      Write-Log "Now deploying preview (vercel). This will create a preview deployment."
      vercel
      $doProd = Read-Host "Deploy to production now? (this will run 'vercel --prod') (y/n)"
      if ($doProd -match '^[Yy]') { vercel --prod }
    }
  } else {
    Write-Log "vercel CLI not found. Install it with 'npm i -g vercel' if you want automatic Vercel steps."
  }

  Write-Log "Auto-setup complete. Remember to remove backend/.atlas_tmp if present."

} finally {
  # Clean up secure plain text variables
  [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
  Remove-Variable securePw -ErrorAction SilentlyContinue
  Remove-Variable BSTR -ErrorAction SilentlyContinue
  Remove-Variable plain -ErrorAction SilentlyContinue
}
