# Script para iniciar Expo com IP manual
# Uso: .\start-expo-manual.ps1 -IP "192.168.1.23"

param(
    [Parameter(Mandatory=$false)]
    [string]$IP = "192.168.1.23"
)

Write-Host "🔧 Configurando Expo para usar IP: $IP" -ForegroundColor Cyan
Write-Host ""

# Forçar Expo a usar o IP especificado
$env:EXPO_DEVTOOLS_LISTEN_ADDRESS = "0.0.0.0"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $IP
$env:EXPO_PACKAGER_PROXY_URL = "http://${IP}:8081"

Write-Host "✅ Variáveis configuradas:" -ForegroundColor Green
Write-Host "   EXPO_DEVTOOLS_LISTEN_ADDRESS = $env:EXPO_DEVTOOLS_LISTEN_ADDRESS"
Write-Host "   REACT_NATIVE_PACKAGER_HOSTNAME = $env:REACT_NATIVE_PACKAGER_HOSTNAME"
Write-Host "   EXPO_PACKAGER_PROXY_URL = $env:EXPO_PACKAGER_PROXY_URL"
Write-Host ""

Write-Host "🚀 Iniciando Expo..." -ForegroundColor Cyan
Write-Host "📱 O QR code deve mostrar: exp://$IP:8081" -ForegroundColor Yellow
Write-Host ""

npx expo start --lan --clear













