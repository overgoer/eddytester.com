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
d=$(probe "https://eddytester.com/glearning")
c=$(probe "https://practicum.eddytester.com/health")
y=$(probe "https://ya.ru")
echo "{\"ts\":\"$ts\",\"direct\":\"$d\",\"cf\":\"$c\",\"control\":\"$y\"}" >> "$LOG"
