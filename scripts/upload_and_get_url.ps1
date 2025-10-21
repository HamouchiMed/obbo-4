<#
Upload a local file to transfer.sh (or alternate host) and print a public URL.
Usage: .\scripts\upload_and_get_url.ps1 -FilePath <path-to-apk>

Note: transfer.sh allows anonymous uploads but has size limits and retention policies. If you have a private server or S3 bucket, prefer that.
#>
Param(
    [Parameter(Mandatory=$true)][string]$FilePath
)

function Write-Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Err($m){ Write-Host "[ERROR] $m" -ForegroundColor Red }

if (-not (Test-Path $FilePath)) { Write-Err "File not found: $FilePath"; exit 1 }

$fname = [System.IO.Path]::GetFileName($FilePath)
$uri = "https://transfer.sh/$fname"

try {
    Write-Info "Uploading $FilePath to transfer.sh..."
    # Use curl if available, otherwise fallback to Invoke-WebRequest with binary
    $curl = Get-Command curl -ErrorAction SilentlyContinue
    if ($curl) {
        & curl -T "$FilePath" "$uri" | Out-Host
    } else {
        $bytes = [System.IO.File]::ReadAllBytes($FilePath)
        $req = [System.Net.WebRequest]::Create($uri)
        $req.Method = "PUT"
        $req.ContentLength = $bytes.Length
        $req.ContentType = "application/octet-stream"
        $reqStream = $req.GetRequestStream()
        $reqStream.Write($bytes, 0, $bytes.Length)
        $reqStream.Close()
        $resp = $req.GetResponse()
        $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $result = $sr.ReadToEnd(); $sr.Close()
        Write-Host $result
    }
    Write-Info "Upload finished. The above line should be the public URL."
} catch {
    Write-Err "Upload failed: $_"
}
