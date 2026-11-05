// Verifies free redirect resolution without calling Google or spending Treg credit.
// Unknown destinations remain unknown, and external destination pages are never fetched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveOrganicDomains } from '../scripts/seo/resolve-domains.js';

const response = items => ({ result: { tasks: [{ status_code: 20000, result: [{ items }] }] } });
const settings = { domain: 'splendidmoving.com', query: 'small moves los angeles' };
const wrapped = { type: 'organic', rank_group: 12, domain: 'google.com', url: 'https://google.com/goto?url=opaque', breadcrumb: '20 followers' };

test('redirect evidence can establish a domain and rank without fetching the external page', async () => {
    const requested = [];
    const fetchImpl = async url => {
        requested.push(url);
        return new Response(null, { status: 302, headers: { location: url.startsWith('https://google.com') ? 'https://www.google.com/goto?url=opaque' : 'https://splendidmoving.com/small-moves-los-angeles' } });
    };
    const result = await resolveOrganicDomains(response([wrapped]), settings, fetchImpl);
    assert.equal(result.observed_rank, 12);
    assert.equal(result.unresolved_domains, 0);
    assert.equal(result.matched_results[0].url, 'https://splendidmoving.com/small-moves-los-angeles');
    assert.equal(requested.length, 2);
    assert.ok(requested.every(url => new URL(url).hostname.endsWith('google.com')));
});

test('a Google challenge preserves incomplete evidence instead of claiming absence', async () => {
    const result = await resolveOrganicDomains(response([wrapped]), settings, async () => new Response('challenge', { status: 200 }));
    assert.equal(result.observed_rank, null);
    assert.equal(result.unresolved_domains, 1);
    assert.deepEqual(result.unresolved_result_ranks, [12]);
});

test('known breadcrumb domains remain usable when redirect lookup fails', async () => {
    const item = { ...wrapped, breadcrumb: 'https://splendidmoving.com › local-moving' };
    const result = await resolveOrganicDomains(response([item]), settings, async () => { throw new Error('timeout'); });
    assert.equal(result.observed_rank, 12);
    assert.equal(result.unresolved_domains, 0);
    assert.equal(result.matched_results[0].url, null);
});
