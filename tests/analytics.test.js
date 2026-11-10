// Checks that enquiry measurement records accepted requests without customer details.
// A fake browser and tag queue keep these tests offline and out of real analytics.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function browser(hostname = 'splendidmoving.com', stored = new Map()) {
    const listeners = {};
    const scripts = [];
    const window = { location: { hostname, pathname: '/packing-services-los-angeles', origin: `https://${hostname}` } };
    const sessionStorage = { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) };
    const document = { addEventListener: (name, fn) => { listeners[name] = fn; }, createElement: () => ({}), head: { appendChild: tag => scripts.push(tag) } };
    runInNewContext(readFileSync('scripts/analytics.js', 'utf8'), { window, document, sessionStorage, URL });
    return { window, listeners, scripts, stored, events: () => (window.dataLayer || []).map(args => Array.from(args)).filter(args => args[0] === 'event') };
}

test('local and preview visits never initialize analytics or send enquiries', () => {
    for (const host of ['localhost', '127.0.0.1', 'main-website-preview.vercel.app']) {
        const b = browser(host);
        assert.equal(b.scripts.length, 0);
        assert.equal(b.window.splendidAnalytics, undefined);
    }
});

test('one accepted quote request is counted once across repeat callbacks and reloads', () => {
    const b = browser();
    b.window.splendidAnalytics.quoteSaved({ requestId: 'request-one', quoteType: 'local' });
    b.window.splendidAnalytics.quoteSaved({ requestId: 'request-one', quoteType: 'local' });
    assert.equal(b.events().length, 1);
    assert.equal(b.events()[0][1], 'generate_lead');
    const reload = browser('splendidmoving.com', b.stored);
    reload.window.splendidAnalytics.quoteSaved({ requestId: 'request-one', quoteType: 'local' });
    assert.equal(reload.events().length, 0);
    reload.window.splendidAnalytics.quoteSaved({ requestId: 'request-two', quoteType: 'office' });
    assert.equal(reload.events().length, 1);
});

test('tracking sends only the approved event fields and never forwards customer data', () => {
    const b = browser();
    b.window.splendidAnalytics.quoteSaved({ requestId: 'private-request-id', quoteType: 'local', phone: '8185054576', email: 'private@example.com', address: 'private address' });
    const event = b.events()[0];
    assert.deepEqual(Object.keys(event[2]).sort(), ['method', 'quote_type', 'source_page']);
    assert.doesNotMatch(JSON.stringify(event), /private|8185054576/);
});

test('telephone links record click intent without changing navigation or claiming a completed call', () => {
    const b = browser();
    const anchor = { href: 'tel:+13236452636', getAttribute: () => 'tel:+13236452636', closest: selector => selector === 'header' ? {} : null };
    b.listeners.click({ target: { closest: () => anchor } });
    assert.equal(b.events()[0][1], 'phone_click');
    assert.equal(b.events()[0][2].link_location, 'header');
    assert.doesNotMatch(JSON.stringify(b.events()), /323|completed_call|generate_lead/);
});
