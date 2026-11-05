// Resolves opaque Google result links using free HTTP redirect evidence.
// It never fetches the external destination or guesses a domain from a result title.
import { parseOrganic, resultDomain } from './rankings.js';

const isGoogle = url => /^https:\/\/(www\.)?google\.com\//.test(url);

async function redirectTarget(original, fetchImpl) {
    let url = original;
    const steps = [];
    try {
        for (let hop = 0; hop < 5 && isGoogle(url); hop++) {
            const response = await fetchImpl(url, { redirect: 'manual', signal: AbortSignal.timeout(10000) });
            const location = response.headers.get('location');
            steps.push({ url, status: response.status, location });
            await response.body?.cancel();
            if (!location || response.status < 300 || response.status >= 400) break;
            url = new URL(location, url).href;
            if (!isGoogle(url)) {
                const domain = resultDomain({ url });
                return { original, url: domain ? url : null, domain, steps };
            }
        }
        return { original, url: null, domain: null, steps, note: 'No external destination established' };
    } catch {
        return { original, url: null, domain: null, steps, note: 'Redirect lookup failed; destination remains unknown' };
    }
}

export async function resolveOrganicDomains(response, settings, fetchImpl = fetch) {
    const parsed = parseOrganic(response, settings);
    const items = ((response.result ?? response).tasks[0].result[0].items || []).filter(item => item.type === 'organic');
    const publishers = [];
    const resolution = [];
    for (const item of items) {
        let domain = resultDomain(item);
        let url = isGoogle(item.url || '') ? null : item.url || null;
        if (isGoogle(item.url || '') && (!domain || domain === settings.domain)) {
            const resolved = await redirectTarget(item.url, fetchImpl);
            resolution.push({ rank: item.rank_group, ...resolved });
            if (resolved.domain) { domain = resolved.domain; url = resolved.url; }
        }
        publishers.push({ rank: item.rank_group, domain, url });
    }
    const matches = publishers.filter(item => item.domain === settings.domain);
    return { ...parsed, raw_unresolved_domains: parsed.unresolved_domains, unresolved_domains: publishers.filter(item => !item.domain).length, unresolved_result_ranks: publishers.filter(item => !item.domain).map(item => item.rank), observed_rank: matches.length ? Math.min(...matches.map(item => item.rank)) : null, matched_results: matches, domain_resolution: resolution };
}
