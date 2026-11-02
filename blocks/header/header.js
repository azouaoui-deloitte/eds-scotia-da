import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const MQ = window.matchMedia('(min-width: 1024px)');

function closeAllMenus(nav) {
  nav.querySelectorAll('.nav-item[aria-expanded="true"]').forEach((li) => li.setAttribute('aria-expanded', 'false'));
  const overlay = nav.querySelector('.nav-overlay');
  if (overlay) overlay.classList.remove('open');
}

function toggleMenu(nav, li) {
  const open = li.getAttribute('aria-expanded') === 'true';
  closeAllMenus(nav);
  if (!open) {
    li.setAttribute('aria-expanded', 'true');
    const overlay = nav.querySelector('.nav-overlay');
    if (overlay && MQ.matches) overlay.classList.add('open');
  }
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/ca/en/nav';
  const fragment = await loadFragment(navPath);
  if (!fragment) return;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const sections = [...nav.children];
  const [brandWrap, segmentsWrap, toolsWrap] = sections;
  // every section after tools is a mega-menu category (the DA pipeline emits one per category)
  const menuSections = sections.slice(3);
  if (brandWrap) brandWrap.classList.add('nav-brand');
  if (segmentsWrap) segmentsWrap.classList.add('nav-segments');
  if (toolsWrap) toolsWrap.classList.add('nav-tools');

  // --- segments: mark active + icon-less ---
  if (segmentsWrap) {
    const segLink = segmentsWrap.querySelector('a[href$="/personal"], a[href$="/personal.html"]');
    if (segLink) segLink.classList.add('active');
  }

  // --- tools: search box + cta icons + sign in ---
  if (toolsWrap) {
    const form = document.createElement('form');
    form.className = 'nav-search';
    form.setAttribute('role', 'search');
    form.action = 'https://www.scotiabank.com/search/en/_jcr_content.dcsearchpage.json/search.html';
    form.method = 'get';
    form.target = '_blank';
    form.innerHTML = '<label class="sr-only" for="nav-search-input">Begin Your Search</label>'
      + '<input id="nav-search-input" name="q" type="search" placeholder="Begin Your Search" autocomplete="off" />'
      + '<button type="submit" aria-label="Search"><span class="icon icon-search"></span></button>';

    // first ul = cta icon links
    const ctaUl = toolsWrap.querySelector('ul');
    const iconFor = { location: 'location', contact: 'phone', offer: 'offers' };
    if (ctaUl) {
      ctaUl.classList.add('nav-cta');
      ctaUl.querySelectorAll('a').forEach((a) => {
        const t = a.textContent.trim().toLowerCase();
        const key = Object.keys(iconFor).find((k) => t.includes(k)) || 'location';
        const span = document.createElement('span');
        span.className = `icon icon-${iconFor[key]}`;
        a.prepend(span);
      });
    }

    // sign in: button + message paragraph
    const signin = document.createElement('div');
    signin.className = 'nav-signin';
    const signinLink = [...toolsWrap.querySelectorAll('a')].find((a) => /sign\s*in/i.test(a.textContent) || /secure\.scotiabank/i.test(a.href || ''));
    if (signinLink) {
      signinLink.classList.add('button');
      signinLink.innerHTML = `<span class="icon icon-lock"></span>${signinLink.textContent.trim()}`;
      signin.append(signinLink.closest('p') || signinLink);
    }
    const msgP = [...toolsWrap.querySelectorAll('p')].find((p) => /new to scotia/i.test(p.textContent));
    if (msgP) { msgP.classList.add('nav-signin-msg'); signin.append(msgP); }

    toolsWrap.prepend(form);
    toolsWrap.append(signin);
  }

  // --- build mega menu from the remaining sections (each section = one category) ---
  if (menuSections.length) {
    const menuWrap = document.createElement('div');
    menuWrap.className = 'nav-menu';
    const items = [];
    let current = null;
    menuSections.forEach((sec) => {
      // h2/h3/ul live inside a default-content-wrapper after section decoration
      [...sec.querySelectorAll('h2, h3, ul')].forEach((child) => {
        if (child.tagName === 'H2') {
          current = { head: child, cols: [] };
          items.push(current);
        } else if (current) {
          if (child.tagName === 'H3') current.cols.push({ title: child, links: null });
          else if (child.tagName === 'UL') {
            if (current.cols.length && !current.cols[current.cols.length - 1].links) {
              current.cols[current.cols.length - 1].links = child;
            } else {
              current.cols.push({ title: null, links: child });
            }
          }
        }
      });
    });
    const ul = document.createElement('ul');
    ul.className = 'nav-menu-list';
    items.forEach((it) => {
      const li = document.createElement('li');
      li.className = 'nav-item';
      li.setAttribute('aria-expanded', 'false');
      const a = it.head.querySelector('a');
      const label = a ? a.textContent.trim() : it.head.textContent.trim();
      const href = a ? a.getAttribute('href') : '#';
      const hasDd = it.cols.length > 0;
      const btn = document.createElement(hasDd ? 'button' : 'a');
      btn.className = 'nav-item-link';
      if (hasDd) {
        btn.type = 'button';
        btn.setAttribute('aria-haspopup', 'true');
        btn.innerHTML = `<span>${label}</span><span class="icon icon-chevron"></span>`;
      } else {
        btn.href = href;
        btn.textContent = label;
      }
      li.append(btn);
      if (hasDd) {
        const dd = document.createElement('div');
        dd.className = 'nav-dropdown';
        const grid = document.createElement('div');
        grid.className = 'nav-dropdown-grid';
        it.cols.forEach((c) => {
          const col = document.createElement('div');
          col.className = 'nav-col';
          if (c.title) { const p = document.createElement('p'); p.className = 'nav-col-title'; p.textContent = c.title.textContent.trim(); col.append(p); }
          if (c.links) col.append(c.links);
          grid.append(col);
        });
        dd.append(grid);
        const viewAll = document.createElement('a');
        viewAll.className = 'nav-view-all';
        viewAll.href = href;
        viewAll.textContent = `View all ${label}`;
        dd.append(viewAll);
        li.append(dd);
        btn.addEventListener('click', (e) => { e.preventDefault(); toggleMenu(nav, li); });
        if (MQ.matches) {
          li.addEventListener('mouseenter', () => { if (MQ.matches) toggleMenu(nav, li); });
          li.addEventListener('mouseleave', () => { if (MQ.matches) li.setAttribute('aria-expanded', 'false'); });
        }
      }
      ul.append(li);
    });
    menuSections.forEach((sec) => sec.remove());
    menuWrap.append(ul);
    nav.append(menuWrap);
  }

  // overlay
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  overlay.addEventListener('click', () => closeAllMenus(nav));
  nav.append(overlay);

  // hamburger
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.type = 'button';
  hamburger.setAttribute('aria-label', 'Open menu');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span></span><span></span><span></span>';
  hamburger.addEventListener('click', () => {
    const exp = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!exp));
    nav.classList.toggle('nav-open', !exp);
    document.body.classList.toggle('nav-locked', !exp);
    hamburger.setAttribute('aria-label', exp ? 'Open menu' : 'Close menu');
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllMenus(nav); });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(hamburger, nav);
  block.append(navWrapper);
}
