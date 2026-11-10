// Turns named guide panels into accessible, static reading aids.
// The copy lives beside the Markdown; checklists use native controls and need no client-side library.
import { readFileSync } from 'node:fs';
import { escapeHtml as e } from './site-data.js';

const { panels } = JSON.parse(readFileSync(new URL('../content/guide-panels.json', import.meta.url)));
const paths = {
    box: '<path d="m3 7 9-4 9 4v11l-9 4-9-4zM3 7l9 4 9-4M12 11v11M7 5l9 4"/>',
    document: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18m-13 5 3 3 5-5"/>',
    cup: '<path d="M5 4h12v10a6 6 0 0 1-12 0zM17 6h2a3 3 0 0 1 0 6h-2M3 22h16"/>',
    monitor: '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8M12 16v5M7 7h10"/>',
    truck: '<path d="M2 5h12v12H2zM14 9h4l4 5v3h-8M2 17h3m4 0h6m4 0h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    building: '<path d="M5 22V3h14v19M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 22v-3h4v3"/>',
    route: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h8a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6h8"/>',
    door: '<path d="M4 22V3h15v19M19 3 8 6v16M11 13v1M2 22h20"/>',
    plan: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 12h9V3M12 21v-9h9M6 7h3M15 7h3M6 17h3"/>',
};
const icon = name => `<svg class="guide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.box}</svg>`;

function cards(panel) {
    return `<div class="guide-cards guide-cards--${panel.items.length}">${panel.items.map(item => `<div class="guide-card">${icon(item.icon)}<h3>${e(item.title)}</h3><p>${e(item.text)}</p>${item.note ? `<span class="guide-card__note">${e(item.note)}</span>` : ''}</div>`).join('')}</div>`;
}

function checklist(panel, key) {
    return `<ul class="guide-checklist">${panel.items.map((item, index) => `<li><label for="${key}-${index}"><input type="checkbox" id="${key}-${index}"><span>${e(item)}</span></label></li>`).join('')}</ul>`;
}

function timeline(panel) {
    return `<ol class="guide-timeline">${panel.items.map((item, index) => `<li><span class="guide-timeline__step" aria-hidden="true">${index + 1}</span><h3>${e(item.title)}</h3><p>${e(item.text)}</p></li>`).join('')}</ol>`;
}

function inventory(panel) {
    return `<div class="inventory-sheet"><div class="inventory-sheet__head" aria-hidden="true"><span>Room</span><span>Item and quantity</span><span>What the mover needs to know</span></div>${panel.items.map(item => `<dl class="inventory-sheet__row"><div><dt>Room</dt><dd>${e(item.room)}</dd></div><div><dt>Item and quantity</dt><dd>${e(item.item)}</dd></div><div><dt>Handling notes</dt><dd>${e(item.detail)}</dd></div></dl>`).join('')}</div>`;
}

function stairs(panel) {
    return `<div class="stair-plan"><svg viewBox="0 0 460 240" role="img" aria-label="Illustrative stair route: measure the clear doorway, usable stair width, and space to turn on the landing. This is not a fit assessment."><path d="M35 205h105v-45h70v-45h70V70h135" fill="none" stroke="#032449" stroke-width="5"/><path d="M35 177h80v-45h70V87h70V42h160" fill="none" stroke="#d7b589" stroke-width="10"/><path d="M44 151h58m-58-5v10m58-10v10M307 93h70m-70-5v10m70-10v10" stroke="#0065c9" stroke-width="2"/><path d="M152 151c25-2 28-32 49-35" fill="none" stroke="#0065c9" stroke-width="2" stroke-dasharray="5 4"/><g fill="#032449" font-family="sans-serif" font-size="14"><text x="35" y="133">Door opening</text><text x="145" y="188">Landing + turn</text><text x="305" y="122">Stair width</text></g><rect x="331" y="14" width="42" height="26" rx="2" fill="#deedff" stroke="#0065c9" stroke-width="2"/></svg><div class="stair-plan__notes">${panel.items.map(item => `<div><h3>${e(item.title)}</h3><p>${e(item.text)}</p></div>`).join('')}</div></div>`;
}

function route(panel) {
    return `<ol class="guide-route">${panel.items.map(item => `<li>${icon(item.icon)}<h3>${e(item.title)}</h3><p>${e(item.text)}</p></li>`).join('')}</ol>`;
}

function amounts(panel) {
    return `<div class="guide-amounts guide-amounts--${panel.type}">${panel.items.map(item => `<div><h3>${e(item.title)}</h3><strong>${e(item.value)}</strong><p>${e(item.text)}</p></div>`).join('')}</div>`;
}

export function renderGuidePanel(key) {
    const panel = panels[key];
    if (!panel) throw new Error(`Unknown guide panel: ${key}`);
    const render = { cards, checklist, timeline, inventory, stairs, route, example: amounts, minimum: amounts }[panel.type];
    if (!render) throw new Error(`Unknown guide panel type: ${panel.type}`);
    return `<section class="guide-panel guide-panel--${panel.type}" aria-labelledby="${key}-title"><h2 id="${key}-title">${e(panel.title)}</h2>${panel.text ? `<p class="guide-panel__intro">${e(panel.text)}</p>` : ''}${render(panel, key)}${panel.note ? `<p class="guide-panel__note">${e(panel.note)}</p>` : ''}</section>`;
}

export function enhanceGuideMarkup(article, page) {
    article('guide-panel').each((_, element) => {
        const key = article(element).attr('name');
        article(element).replaceWith(renderGuidePanel(key));
    });
    if (page.path === 'blog/how-much-do-movers-cost-los-angeles') {
        const table = article('table').first();
        const rates = table.find('tbody tr').map((_, row) => {
            const cells = article(row).find('td').map((_, cell) => article(cell).text()).get();
            return `<div class="crew-rate"><h3>${e(cells[0])}</h3><dl><div><dt>Cash</dt><dd>${e(cells[1].replace('/hour', ''))}<span>/hour</span></dd></div><div><dt>Card</dt><dd>${e(cells[2].replace('/hour', ''))}<span>/hour</span></dd></div></dl><p>Three-hour hourly subtotal<br><strong>${e(cells[3])}</strong> <span>cash / card</span></p></div>`;
        }).get().join('');
        table.replaceWith(`<section class="guide-panel guide-panel--rates" aria-labelledby="crew-rate-heading"><h2 id="crew-rate-heading">Local moving rates</h2><div class="crew-rates">${rates}</div></section>`);
    }
    if (page.kind === 'article') {
        article('h2').filter((_, h) => !article(h).closest('.guide-panel').length).each((_, heading) => {
            const section = article('<section class="guide-section"></section>');
            const contents = article(heading).nextUntil('h2');
            article(heading).before(section);
            section.append(heading).append(contents);
        });
    }
    article('h2 + .guide-panel').each((_, element) => {
        const panel = article(element);
        panel.attr('aria-labelledby', panel.prev('h2').attr('id'));
        panel.children('h2').remove();
    });
}
