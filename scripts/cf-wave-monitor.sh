#!/bin/bash
# Монитор DPI-волн: каждые 5 минут бьёт в 4 цели и пишет JSONL.
# direct  = eddytester.com напрямую (голый IP сервера: 000 = TLS режется)
# cf      = боевой лендинг через Cloudflare, полная страница: ~137000 байт = чисто, ~19000 = волна режет поток
# mirror  = зеркало на Яндексе, полная страница: ~140000 байт = чисто (если режется и оно — волна добралась до Яндекса)
# control = ya.ru (если упал и он — проблема в локальной сети, не в волне)
LOG="$HOME/cf-wave-monitor/log.jsonl"
mkdir -p "$(dirname "$LOG")"

probe() {
  curl -s -o /dev/null --max-time 20 -w '%{http_code} %{time_total}' "$1" 2>/dev/null
}

probe_full() {
  curl -s -o /dev/null --max-time 25 -w '%{http_code} %{size_download} %{time_total}' "$1" 2>/dev/null
}

ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
d=$(probe "https://85.193.81.51/")
c=$(probe_full "https://eddytester.com/?v=wavemon")
m=$(probe_full "https://video-practicum.website.yandexcloud.net/test/practicum.html?v=wavemon")
y=$(probe "https://ya.ru")
echo "{\"ts\":\"$ts\",\"direct\":\"$d\",\"cf\":\"$c\",\"mirror\":\"$m\",\"control\":\"$y\"}" >> "$LOG"
