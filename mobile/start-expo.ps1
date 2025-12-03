# Descobrir IP da rede local (excluindo localhost e IPs automáticos)
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    ($_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*" -or $_.InterfaceAlias -like "*Ethernet*") -and
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*"
} | Select-Object -First 1).IPAddress

if (-not $ip) {
    Write-Host "❌ IP não detectado automaticamente. Usando IP padrão: 192.168.1.23" -ForegroundColor Yellow
   # $ip = "192.168.1.23"
    $ip = "10.132.50.166"

} else {
    Write-Host "✅ IP detectado: $ip" -ForegroundColor Green
}

Write-Host "🔧 Configurando variáveis de ambiente..." -ForegroundColor Yellow

# Forçar Expo a usar o IP da rede local
$env:EXPO_DEVTOOLS_LISTEN_ADDRESS = "0.0.0.0"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
$env:EXPO_PACKAGER_PROXY_URL = "http://$ip:8081"

Write-Host "🚀 Iniciando Expo com LAN no IP: $ip" -ForegroundColor Cyan
Write-Host "📱 Escaneie o QR code no Expo Go" -ForegroundColor Cyan
Write-Host ""

# Limpar cache e iniciar
npx expo start --lan --clear
