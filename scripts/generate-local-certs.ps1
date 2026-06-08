param(
    [Parameter(Mandatory = $true)]
    [string]$LanIp
)

$certDirectory = Join-Path $PSScriptRoot "..\certs"
New-Item -ItemType Directory -Force -Path $certDirectory | Out-Null
$resolvedCertDirectory = (Resolve-Path $certDirectory).Path

docker run --rm `
    -v "${resolvedCertDirectory}:/certs" `
    alpine:3.22 sh -c @"
apk add --no-cache openssl >/dev/null &&
openssl genrsa -out /certs/echotalk-ca.key 2048 &&
openssl req -x509 -new -nodes -key /certs/echotalk-ca.key -sha256 -days 3650 \
  -out /certs/echotalk-ca.crt -subj '/CN=EchoTalk Local Development CA' &&
openssl genrsa -out /certs/echotalk.key 2048 &&
openssl req -new -key /certs/echotalk.key -out /certs/echotalk.csr -subj '/CN=$LanIp' &&
printf 'subjectAltName=IP:$LanIp,DNS:localhost\nextendedKeyUsage=serverAuth\nkeyUsage=digitalSignature,keyEncipherment\n' \
  > /certs/echotalk.ext &&
openssl x509 -req -in /certs/echotalk.csr -CA /certs/echotalk-ca.crt \
  -CAkey /certs/echotalk-ca.key -CAcreateserial -out /certs/echotalk.crt \
  -days 825 -sha256 -extfile /certs/echotalk.ext &&
rm /certs/echotalk.csr /certs/echotalk.ext /certs/echotalk-ca.srl &&
chmod 644 /certs/*.crt /certs/*.key
"@

if ($LASTEXITCODE -ne 0) {
    throw "Certificate generation failed."
}

Write-Host "Created local HTTPS certificates for $LanIp in $resolvedCertDirectory"
