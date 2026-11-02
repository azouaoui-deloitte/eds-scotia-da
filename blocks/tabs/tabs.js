import { loadCSS } from '../../scripts/aem.js';
import decorateCards from '../cards/cards.js';

/**
 * When a `cards` block is authored inside a tab cell, the EDS/DA content pipeline
 * flattens it into loose default content (picture + heading + paragraphs per card,
 * with the wrapping block div removed). This rebuilds a proper
 * `<div class="cards marketing">` block out of that flattened content so the cards
 * block decorator and styles apply. A new card starts at every element containing
 * a <picture>.
 */
function rebuildCards(panel) {
  const content = [...panel.children];
  const splitIdx = content.findIndex((el) => el.querySelector && el.querySelector('picture'));
  if (splitIdx < 0) return null;

  const block = document.createElement('div');
  block.className = 'cards marketing block';
  let row = null;
  content.slice(splitIdx).forEach((el) => {
    const pic = el.querySelector ? el.querySelector('picture') : null;
    if (pic) {
      row = document.createElement('div');
      const imgDiv = document.createElement('div');
      imgDiv.append(pic);
      const bodyDiv = document.createElement('div');
      row.append(imgDiv, bodyDiv);
      block.append(row);
      el.remove(); // drop the now-empty wrapper paragraph
    } else if (row) {
      row.lastElementChild.append(el); // move into the current card body
    }
  });
  panel.append(block);
  return block;
}

export default async function decorate(block) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/cards/cards.css`);

  const rows = [...block.children];
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');
  const panels = document.createElement('div');
  panels.className = 'tabs-panels';

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const label = (cells[0] ? cells[0].textContent : `Tab ${i + 1}`).trim();
    const panelContent = cells[1] || document.createElement('div');

    const id = `tab-${i}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
    const btn = document.createElement('button');
    btn.className = 'tabs-tab';
    btn.id = `${id}-tab`;
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-controls', `${id}-panel`);
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.tabIndex = i === 0 ? 0 : -1;
    btn.textContent = label;

    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    panel.id = `${id}-panel`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `${id}-tab`);
    if (i !== 0) panel.hidden = true;
    while (panelContent.firstElementChild) panel.append(panelContent.firstElementChild);

    // Rebuild a cards block from the flattened content, then decorate it.
    let cards = panel.querySelector('.cards');
    if (!cards) cards = rebuildCards(panel);
    if (cards) decorateCards(cards);

    btn.addEventListener('click', () => {
      tablist.querySelectorAll('[role="tab"]').forEach((t) => { t.setAttribute('aria-selected', 'false'); t.tabIndex = -1; });
      panels.querySelectorAll('[role="tabpanel"]').forEach((p) => { p.hidden = true; });
      btn.setAttribute('aria-selected', 'true');
      btn.tabIndex = 0;
      panel.hidden = false;
    });

    tablist.append(btn);
    panels.append(panel);
  });

  // keyboard navigation
  tablist.addEventListener('keydown', (e) => {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const idx = tabs.indexOf(document.activeElement);
    if (idx < 0) return;
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    else return;
    e.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  });

  block.replaceChildren(tablist, panels);
}
