// Checks the public calculator's arithmetic and minimum without submitting a quote.
// Published rates are supplied by the existing quote-pricing module at build time.
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHourlySubtotal } from '../scripts/moving-cost-calculator.js';
import { crewFor } from '../lib/quote/pricing.js';

test('short local moves retain the three-hour minimum for each published crew rate', () => {
    for (const size of ['studio', '2-bedroom', '3-bedroom']) {
        const crew = crewFor(size);
        for (const payment of ['cash', 'card']) {
            assert.equal(calculateHourlySubtotal(crew[payment], 1), crew[payment] * 3);
            assert.equal(calculateHourlySubtotal(crew[payment], 0), crew[payment] * 3);
        }
    }
});

test('hours above the minimum use the selected rate and retain cents', () => {
    assert.equal(calculateHourlySubtotal(125, 3.5), 437.5);
    assert.equal(calculateHourlySubtotal(125, 3.25), 406.25);
    assert.equal(calculateHourlySubtotal(145, 4), 580);
    assert.equal(calculateHourlySubtotal(0.5, 3), 1.5);
});

test('invalid inputs have no numerical estimate', () => {
    for (const hours of [NaN, Infinity, -1, '', null]) assert.equal(calculateHourlySubtotal(115, hours), null);
    for (const rate of [NaN, Infinity, -1, 0, '', null]) assert.equal(calculateHourlySubtotal(rate, 3), null);
    assert.equal(calculateHourlySubtotal(Number.MAX_VALUE, Number.MAX_VALUE), null);
});
