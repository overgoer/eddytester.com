# Live server configs — snapshot 2026-06-26

Снято с timeweb (85.193.81.51) командой `cat`, без изменений на сервере.

## Что где лежит на сервере

| Файл | Путь на сервере |
|---|---|
| `apache/eddytester.com.conf` | `/etc/apache2/sites-enabled/eddytester.com.conf` |
| `apache/eddytester.com-le-ssl.conf` | `/etc/apache2/sites-enabled/eddytester.com-le-ssl.conf` |
| `apache/mpm_event.conf` | `/etc/apache2/mods-enabled/mpm_event.conf` |
| `apache/apache2.conf` | `/etc/apache2/apache2.conf` |
| `apache/dot-htaccess` | `/var/www/eddytester.com/.htaccess` |
| `fail2ban/jail.local` | `/etc/fail2ban/jail.local` |

## Восстановление

В случае проблем — скопировать файлы обратно на сервер и `sudo apachectl configtest && sudo apachectl -k graceful`.
