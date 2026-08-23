// E2E-прогон /glearning: вход, обход уроков, кейсы верно/неверно, счётчик, сбросы
const fs = require('fs');
const { chromium } = require('playwright');

const KEY = fs.readFileSync('/tmp/e2e_key.txt', 'utf-8').trim();
const SHOTS = '/tmp/e2e';
fs.mkdirSync(SHOTS, { recursive: true });

const consoleErrors = [];
const pageErrors = [];
const report = { steps: [], counterLog: [] };

function log(step, ok, detail) {
    report.steps.push({ step, ok, detail });
    console.log((ok ? '✅' : '❌') + ' ' + step + (detail ? ' — ' + detail : ''));
}

async function readCounter(page) {
    return page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('*')).filter(e =>
            e.tagName !== 'SCRIPT' && e.tagName !== 'STYLE' &&
            /Прогресс:\s*\d+\/\d+/.test(e.textContent || ''));
        if (!els.length) return null;
        const el = els[els.length - 1];
        const m = (el.textContent || '').match(/Прогресс:\s*(\d+)\/(\d+)/);
        return m ? m[1] + '/' + m[2] : null;
    });
}

async function checkboxByBugId(page, bugId, checked) {
    return page.evaluate(({ bugId, checked }) => {
        const cb = document.querySelector('.lesson-block.active input[data-bug-id="' + bugId + '"]');
        if (!cb) return false;
        cb.checked = checked;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }, { bugId, checked });
}

async function submitTest(page) {
    await page.evaluate(() => {
        document.querySelector('.lesson-block.active .test-btn-primary').click();
    });
    await page.waitForTimeout(1500);
}

async function countSections(page, lessonNum) {
    return page.evaluate(n => document.querySelectorAll('#l' + n + ' .test-section').length, lessonNum);
}

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => pageErrors.push(String(e)));

    try {
        await page.goto('https://eddytester.com/glearning', { waitUntil: 'domcontentloaded', timeout: 90000 });
        await page.waitForSelector('#gk-input', { timeout: 30000 });
        await page.screenshot({ path: SHOTS + '/01-overlay.png' });
        log('страница открылась, оверлей ключа виден', true);

        await page.fill('#gk-input', KEY);
        await page.click('#gk-btn');
        await page.waitForFunction(() => {
            const o = document.getElementById('gk-overlay');
            return o && (o.style.display === 'none' || !o.offsetParent);
        }, { timeout: 30000 });
        await page.waitForTimeout(2000);
        log('вход по ключу', true);

        const counter0 = await readCounter(page);
        report.counterLog.push({ when: 'после входа', value: counter0 });
        log('счётчик после входа', true, counter0);

        // Обход всех 13 уроков
        for (let n = 1; n <= 13; n++) {
            const ok = await page.evaluate(n => {
                const btn = document.getElementById('btn-l' + n);
                if (!btn) return { err: 'нет кнопки' };
                btn.click();
                const block = document.getElementById('l' + n);
                if (!block) return { err: 'нет блока' };
                const cbs = block.querySelectorAll('.test-section input[type="checkbox"]').length;
                return { cbs, active: block.classList.contains('active') };
            }, n).catch(e => ({ err: String(e) }));
            if (ok.err) { log('урок l' + n, false, ok.err); continue; }
            log('урок l' + n + ' открылся, чекбоксов: ' + ok.cbs, true);
        }
        await page.screenshot({ path: SHOTS + '/02-lessons-list.png' });

        // Кейс 1: l1 квиз — неверный выбор
        await page.click('#btn-l1');
        await checkboxByBugId(page, 'figma', true);
        await submitTest(page);
        let sub = await page.textContent('.lesson-block.active .test-subtitle').catch(() => '');
        let wrongBadge = await page.evaluate(() => !!document.querySelector('.lesson-block.active .wrong-badge:not([style*="display"]) , .lesson-block.active .test-bug-item.wrong'));
        log('l1 неверный выбор (figma)', !/Тест успешно пройден|Пройден/.test(sub), 'подзаголовок: ' + sub.trim());
        const dupAfterFail = await countSections(page, 1);
        report.counterLog.push({ when: 'секций теста в l1 после неверной попытки', value: String(dupAfterFail) });
        await page.screenshot({ path: SHOTS + '/03-l1-wrong.png' });

        // Кейс 2: l1 квиз — верный выбор
        await checkboxByBugId(page, 'figma', false);
        for (const id of ['documentation', 'postman', 'templates', 'support']) {
            await checkboxByBugId(page, id, true);
        }
        await submitTest(page);
        sub = await page.textContent('.lesson-block.active .test-subtitle').catch(() => '');
        const c1 = await readCounter(page);
        report.counterLog.push({ when: 'после прохождения l1', value: c1 });
        log('l1 верный выбор → пройден', /Тест успешно пройден/.test(sub), sub.trim());
        await page.screenshot({ path: SHOTS + '/04-l1-passed.png' });

        // Кейс 3: l9 (PRAC) — часть багов + дистрактор
        await page.click('#btn-l9');
        await checkboxByBugId(page, 'g_status_case', true);
        await checkboxByBugId(page, 'g_cache', true);
        await checkboxByBugId(page, 'g_pagination', true); // дистрактор
        await submitTest(page);
        sub = await page.textContent('.lesson-block.active .test-subtitle').catch(() => '');
        log('l9 неполный выбор + дистрактор → не пройден', !/нашёл все баги/.test(sub), sub.trim());
        await page.screenshot({ path: SHOTS + '/05-l9-wrong.png' });

        // Кейс 4: l9 — полный верный набор
        await checkboxByBugId(page, 'g_pagination', false);
        for (const id of ['g_comma', 'g_security', 'g_content_type', 'g_cache_info', 'g_status_any']) {
            await checkboxByBugId(page, id, true);
        }
        await submitTest(page);
        sub = await page.textContent('.lesson-block.active .test-subtitle').catch(() => '');
        const c2 = await readCounter(page);
        report.counterLog.push({ when: 'после прохождения l9', value: c2 });
        log('l9 полный набор → пройден', /нашёл все баги/.test(sub), sub.trim());
        await page.screenshot({ path: SHOTS + '/06-l9-passed.png' });

        // Кейс 5: сброс пройденного урока (l2 чек-лист)
        await page.click('#btn-l2');
        for (const id of ['postman_installed', 'collection_imported', 'key_configured', 'first_request_success', 'db_reset_success']) {
            await checkboxByBugId(page, id, true);
        }
        await submitTest(page);
        const c3 = await readCounter(page);
        report.counterLog.push({ when: 'после прохождения l2', value: c3 });
        log('l2 чек-лист пройден', true, c3);
        await page.evaluate(() => {
            document.querySelector('.lesson-block.active .test-btn-secondary').click();
        }); // «Пройти заново»
        await page.waitForTimeout(1200);
        const c4 = await readCounter(page);
        report.counterLog.push({ when: 'после «Пройти заново» l2', value: c4 });
        log('сброс l2 («Пройти заново») вернул счётчик', c4 !== c3, c4);

        // Чистка: сбросить ВСЕ уроки этого ключа
        const lessons = ['tutorial', 'postman_setup', 'what-is-api', 'bug-report', 'boundary-values', 'test-plan', 'database', 'crud', 'get-users', 'get-user', 'post-users', 'patch-user', 'delete-user'];
        const cleaned = await page.evaluate(async ({ KEY, lessons }) => {
            let done = 0;
            for (const id of lessons) {
                const r = await fetch('/save-progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ api_key: KEY, lesson_id: id, selected_bugs: [] }),
                });
                if (r.ok) done++;
            }
            return done;
        }, { KEY, lessons });
        const c5 = await readCounter(page);
        report.counterLog.push({ when: 'после чистки', value: c5 });
        log('чистка прогресса ключа', cleaned === lessons.length, 'сброшено уроков: ' + cleaned + ', счётчик: ' + c5);
    } catch (e) {
        log('НЕПРЕДВИДЕННАЯ ОШИБКА', false, String(e).slice(0, 300));
        await page.screenshot({ path: SHOTS + '/99-error.png' }).catch(() => {});
    }

    await browser.close();
    report.consoleErrors = consoleErrors;
    report.pageErrors = pageErrors;
    fs.writeFileSync(SHOTS + '/summary.json', JSON.stringify(report, null, 2));
    console.log('\nconsole errors:', consoleErrors.length, '| page errors:', pageErrors.length);
    if (consoleErrors.length) console.log(consoleErrors.slice(0, 5));
})();
