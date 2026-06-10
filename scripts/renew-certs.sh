#!/bin/bash
# Renew Let's Encrypt certificates and notify admin on failure

LOG="/var/log/certbot-renew.log"
DATE=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
ADMIN="eddy@eddytester.com"

# Run certbot renew
OUTPUT=$(certbot renew --quiet 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    # Failure — send email alert
    echo "$DATE FAILED (exit $EXIT_CODE)" >> "$LOG"
    echo "$OUTPUT" >> "$LOG"

    {
        echo "Subject: [FAIL] Let's Encrypt cert renewal"
        echo "To: $ADMIN"
        echo ""
        echo "Certbot renew failed on $(hostname) at $DATE"
        echo ""
        echo "Exit code: $EXIT_CODE"
        echo ""
        echo "Output:"
        echo "$OUTPUT"
    } | msmtp -a mailru "$ADMIN"
else
    echo "$DATE OK" >> "$LOG"
fi
