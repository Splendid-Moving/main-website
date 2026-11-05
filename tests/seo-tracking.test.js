// Keeps ranking comparisons honest when a query was absent or the search settings changed.
// Fixtures are synthetic and never call Treg or use paid credit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { compareRankings, parseOrganic, resultDomain } from '../scripts/seo/rankings.js';

const base = { query: 'local movers los angeles', provider: 'DataForSEO', location: 'Los Angeles, California, US (1013962)', language: 'en', device: 'desktop', requested_depth: 50, observed_rank: null, organic_rows_examined: 48, unresolved_domains: 0 };

test('entering the observed results is not an invented move from position 51', () => {
    const [change] = compareRankings([base], [{ ...base, observed_rank: 28 }]);
    assert.equal(change.change, null);
    assert.equal(change.status, 'entered examined results');
});

test('matching measured ranks yield the correct directional movement', () => {
    const [change] = compareRankings([{ ...base, observed_rank: 28 }], [{ ...base, observed_rank: 19 }]);
    assert.equal(change.change, 9);
    assert.equal(change.status, 'improved');
});

test('different provider or location is not treated as ranking movement', () => {
    for (const altered of [{ provider: 'Other provider' }, { location: 'United States' }, { device: 'mobile' }]) {
        const [change] = compareRankings([base], [{ ...base, ...altered, observed_rank: 1 }]);
        assert.equal(change.change, null);
        assert.equal(change.status, 'not comparable');
    }
});

test('unresolved search results cannot establish a newly absent ranking', () => {
    const [change] = compareRankings([{ ...base, observed_rank: 10 }], [{ ...base, unresolved_domains: 2 }]);
    assert.equal(change.status, 'incomplete evidence');
    assert.equal(change.change, null);
});

test('Google redirect wrappers use real breadcrumb domains and retain unresolved evidence', () => {
    assert.equal(resultDomain({ url: 'https://google.com/goto?url=opaque', domain: 'google.com', breadcrumb: 'https://splendidmoving.com › local-moving' }), 'splendidmoving.com');
    assert.equal(resultDomain({ url: 'https://google.com/goto?url=opaque', breadcrumb: '70+ followers' }), null);
    const response = { result: { tasks: [{ status_code: 20000, result: [{ items: [
        { type: 'organic', rank_group: 7, url: 'https://splendidmoving.com/local-moving' },
        { type: 'organic', rank_group: 8, url: 'https://google.com/goto?url=opaque' },
        { type: 'paid', rank_group: 1, url: 'https://splendidmoving.com' }
    ] }] }] } };
    const parsed = parseOrganic(response, { ...base, domain: 'splendidmoving.com' });
    assert.equal(parsed.observed_rank, 7);
    assert.equal(parsed.organic_rows_examined, 2);
    assert.equal(parsed.unresolved_domains, 1);
    assert.throws(() => parseOrganic({ result: { tasks: [{ status_code: 40000 }] } }, base));
});
