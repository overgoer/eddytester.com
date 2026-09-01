#!/bin/bash
# Монитор DPI-волн: каждые 5 минут бьёт в 3 цели и пишет JSONL.
# direct  = eddytester.com напрямую (DNS only, жертва волн)
# cf      = practicum.eddytester.com через Cloudflare-прокси
# control = ya.ru (если упал и он — проблема в локальной сети, не в волне)
LOG="$HOME/cf-wave-monitor/log.jsonl"
mkdir -p "$(dirname "$LOG")"

probe() {
  curl -s -o /dev/null --max-time 20 -w '%{http_code} %{time_total}' "$1" 2>/dev/null
}

ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
# прямой путь = голый IP сервера: код 51/60 = TLS прошло (волны нет), 000 = TLS режется (волна)
d=$(probe "https://85.193.81.51/")
c=$(probe "https://practicum.eddytester.com/health")
y=$(probe "https://ya.ru")
echo "{\"ts\":\"$ts\",\"direct\":\"$d\",\"cf\":\"$c\",\"control\":\"$y\"}" >> "$LOG"
