const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const pool = require('../config/database');
const { normalizeEmail } = require('../services/validationService');
const { sendConfirmationEmail } = require('../services/emailService');
const { execSync } = require('child_process');
const path = require('path');

// --- Провиженинг студента (такой же, как в основном webhook) ---
function provisionStudent(email, apiKey) {
    const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (!username || username.length < 2) {
        console.warn('Cannot provision: invalid username from email:', email);
        return null;
    }

    const scriptPath = path.join(__dirname, '../../scripts/add-student.sh');
    const cmd = `bash "${scriptPath}" "${username}" "${email}" "${apiKey}"`;

    try {
        const output = execSync(cmd, {
            timeout: 15000,
            maxBuffer: 1024 * 1024
        }).toString();

        const machineMatch = output.match(/===MACHINE_OUTPUT===\n([\s\S]*?)===MACHINE_END===/);
        if (!machineMatch) {
            console.error('Provision: no MACHINE_OUTPUT in script output');
            return null;
        }

        const kv = {};
        machineMatch[1].split('\n').forEach(line => {
            const idx = line.indexOf('=');
            if (idx > 0) kv[line.slice(0, idx)] = line.slice(idx + 1);
        });

        return {
            username: kv.STUDENT_USERNAME,
            password: kv.STUDENT_PASSWORD,
            sshHost: kv.STUDENT_SSH_HOST,
            sshPort: kv.STUDENT_SSH_PORT,
            dbHost: kv.STUDENT_DB_HOST,
            dbPort: kv.STUDENT_DB_PORT,
            dbName: kv.STUDENT_DB_NAME
        };
    } catch (err) {
        console.error('Provision failed (non-fatal):', err.message);
        return null;
    }
}

/**
 * POST /webhook/yookassa
 * Принимает уведомления от ЮKassa (payment.succeeded)
 *
 * Формат от ЮKassa:
 * {
 *   "type": "notification",
 *   "event": "payment.succeeded",
 *   "object": {
 *     "id": "2f2b...",
 *     "status": "succeeded",
 *     "amount": {"value": "2900.00", "currency": "RUB"},
 *     "metadata": {
 *       "email": "user@example.com"
 *     }
 *   }
 * }
 */
router.post('/yookassa', express.json(), async (req, res) => {
    console.log('[yookassa-webhook] Received:', JSON.stringify(req.body, null, 2));

    // Всегда отвечаем 200 — ЮKassa ждёт подтверждения
    const ack = () => res.status(200).json({ message: 'OK' });

    const body = req.body;

    // Проверяем, что это уведомление
    if (body.type !== 'notification') {
        console.log('[yookassa-webhook] Not a notification, ignoring');
        return ack();
    }

    // Нас интересует только payment.succeeded
    if (body.event !== 'payment.succeeded') {
        console.log('[yookassa-webhook] Event not payment.succeeded, ignoring:', body.event);
        return ack();
    }

    const payment = body.object;
    if (!payment || payment.status !== 'succeeded') {
        console.log('[yookassa-webhook] Payment not succeeded, ignoring');
        return ack();
    }

    // Извлекаем email из metadata
    const email = payment.metadata?.email;
    if (!email) {
        console.error('[yookassa-webhook] No email in metadata for payment:', payment.id);
        // ЮKassa не ждёт ошибок — отвечаем 200, но пишем ошибку
        return ack();
    }

    const amount = parseFloat(payment.amount?.value || '0');
    const currency = payment.amount?.currency || 'RUB';

    try {
        const normalizedEmail = normalizeEmail(email);
        console.log('[yookassa-webhook] Processing for:', normalizedEmail);

        // Генерируем API ключ
        const { v4: uuidv4 } = require('uuid');
        const apiKey = uuidv4();

        // Сохраняем в базу данных
        const result = await pool.query(
            'INSERT INTO api_keys (api_key, email, amount, currency) VALUES ($1, $2, $3, $4) RETURNING *',
            [apiKey, normalizedEmail, amount, currency]
        );
        console.log('[yookassa-webhook] API key saved:', result.rows[0].api_key);

        // Провиженинг (только в production)
        let credentials = null;
        if (process.env.NODE_ENV === 'production') {
            try {
                credentials = provisionStudent(normalizedEmail, apiKey);
                if (credentials) {
                    console.log('[yookassa-webhook] Student provisioned:', credentials.username);
                    try {
                        await pool.query(
                            'UPDATE api_keys SET credentials = $1 WHERE api_key = $2',
                            [JSON.stringify(credentials), apiKey]
                        );
                    } catch (dbErr) {
                        console.error('[yookassa-webhook] Failed to persist credentials:', dbErr.message);
                    }
                }
            } catch (provErr) {
                console.error('[yookassa-webhook] Provision error:', provErr.message);
            }
        }

        // Отправляем email
        const learningLink = 'https://practicum.eddytester.com';
        const telegramLink = 'https://t.me/api_praktikum_bot';

        try {
            await sendConfirmationEmail(normalizedEmail, apiKey, learningLink, telegramLink, credentials);
            console.log('[yookassa-webhook] Email sent to:', normalizedEmail);
        } catch (emailErr) {
            console.error('[yookassa-webhook] Email failed:', emailErr.message);
        }

        console.log('[yookassa-webhook] Successfully processed payment:', payment.id);
        return ack();
    } catch (error) {
        console.error('[yookassa-webhook] Error:', error.message);
        // Даже при ошибке отвечаем 200 — ЮKassa не должна переотправлять
        return ack();
    }
});

module.exports = router;
