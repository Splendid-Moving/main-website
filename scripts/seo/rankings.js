// Compares measured positions without inventing ranks for absent results.
// Provider and search settings must match before movement can be reported.
export function compareRankings(baseline, current) {
    const keys = ['provider', 'location', 'language', 'device', 'requested_depth'];
    const compared = baseline.map(before => {
        const after = current.find(row => row.query === before.query && (row.channel || 'organic') === (before.channel || 'organic'));
        const result = { query: before.query, channel: before.channel || 'organic', before: before.observed_rank, after: after?.observed_rank ?? null, change: null };
        if (!after) return { ...result, status: 'not measured' };
        if (keys.some(key => before[key] !== after[key])) return { ...result, status: 'not comparable' };
        if (before.unresolved_domains || after.unresolved_domains || before.partial_results || after.partial_results || !after.organic_rows_examined) return { ...result, status: 'incomplete evidence' };
        if (before.observed_rank == null && after.observed_rank == null) return { ...result, status: 'absent from both examined sets' };
        if (before.observed_rank == null) return { ...result, status: 'entered examined results' };
        if (after.observed_rank == null) return { ...result, status: 'left examined results' };
        const change = before.observed_rank - after.observed_rank;
        return { ...result, change, status: change > 0 ? 'improved' : change < 0 ? 'declined' : 'unchanged' };
    });
    const added = current.filter(after => !baseline.some(before => before.query === after.query && (before.channel || 'organic') === (after.channel || 'organic')));
    return [...compared, ...added.map(after => ({ query: after.query, channel: after.channel || 'organic', before: null, after: after.observed_rank, change: null, status: after.partial_results || after.unresolved_domains || !after.organic_rows_examined ? 'incomplete evidence' : 'new measurement' }))];
}

function host(value) {
    try { return new URL(value.includes('://') ? value : `https://${value}`).hostname.toLowerCase().replace(/^www\./, ''); } catch { return null; }
}

export function resultDomain(item) {
    for (const value of [item.url, item.domain, item.breadcrumb?.split(/\s[›>]/)[0]]) {
        if (!value || /\s/.test(value)) continue;
        const domain = host(value);
        if (domain?.includes('.') && !/(^|\.)google\.[a-z.]+$/.test(domain)) return domain;
    }
    return null;
}

export function parseOrganic(response, settings) {
    const data = response.result ?? response;
    const task = data.tasks?.[0];
    if (![20000, 40106].includes(task?.status_code) || !task.result?.[0]) throw new Error('No successful DataForSEO task; inspect saved raw response before retrying.');
    const items = task.result[0].items?.filter(item => item.type === 'organic') || [];
    const matches = items.filter(item => resultDomain(item) === settings.domain);
    const ranks = matches.map(item => item.rank_group).filter(value => Number.isInteger(value) && value > 0);
    return { ...settings, provider_status_code: task.status_code, partial_results: task.status_code === 40106, organic_rows_examined: items.length, unresolved_domains: items.filter(item => !resultDomain(item)).length, observed_rank: ranks.length ? Math.min(...ranks) : null, checked_at_utc: task.result[0].datetime || new Date().toISOString() };
}
