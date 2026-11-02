import { createOptimizedPicture } from '../../scripts/aem.js';

function decorateInterest(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const pics = row.querySelectorAll('picture');
    const bg = pics[0];
    const cardArt = pics[1];
    const link = row.querySelector('a');
    const href = link ? link.getAttribute('href') : null;
    // title = first heading or strong text
    const heading = row.querySelector('h2, h3, h4');
    let title = '';
    if (heading) title = heading.textContent.trim();
    else if (link) title = link.textContent.trim();
    const cta = link ? link.textContent.trim() : 'Learn more';
    const a = document.createElement('a');
    a.className = 'card-tile';
    if (href) a.href = href;
    const media = document.createElement('div');
    media.className = 'card-tile-media';
    if (bg) media.append(bg);
    a.append(media);
    if (cardArt) {
      const art = document.createElement('div');
      art.className = 'card-tile-art';
      art.append(cardArt);
      a.append(art);
    }
    const overlay = document.createElement('div');
    overlay.className = 'card-tile-overlay';
    overlay.innerHTML = `<span class="card-tile-title">${title}</span><span class="card-tile-cta">${cta}</span>`;
    a.append(overlay);
    li.append(a);
    ul.append(li);
  });
  block.replaceChildren(ul);
}

function decorateMarketing(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'card-mkt-image';
      else div.className = 'card-mkt-body';
    });
    // badge: a paragraph whose text is short and marked (em/strong) at top of body
    const body = li.querySelector('.card-mkt-body');
    if (body) {
      const badge = body.querySelector('p em, p strong');
      if (badge && badge.parentElement.textContent.trim() === badge.textContent.trim()) {
        const p = badge.parentElement;
        p.className = 'card-mkt-badge';
      }
      body.querySelectorAll('a').forEach((a) => a.classList.add('card-mkt-link'));
    }
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}

export default function decorate(block) {
  if (block.classList.contains('interest')) { decorateInterest(block); return; }
  if (block.classList.contains('marketing')) { decorateMarketing(block); return; }
  // default boilerplate behaviour
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
