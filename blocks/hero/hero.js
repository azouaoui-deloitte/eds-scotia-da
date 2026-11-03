/**
 * "split" variant (L1 category pages), same DOM as the xwalk sibling: rows [images] [text]
 * -> .hero-image (desktop / tablet / mobile crops in one picture)
 * + .hero-content > .hero-content-inner.
 * Only links standing alone in their paragraph become CTAs.
 */
function decorateSplit(block) {
  const [imageRow, contentRow] = block.children;
  if (imageRow) {
    imageRow.className = 'hero-image';
    const imgs = [...imageRow.querySelectorAll('img')];
    if (imgs.length) {
      // prod breakpoints: desktop >= 992px, tablet 768-991px, mobile <= 767px
      const base = (img) => img.getAttribute('src').split('?')[0];
      const [desktop, tablet = desktop, mobile = tablet] = imgs;
      const pic = document.createElement('picture');
      [[mobile, '(max-width: 767px)', 800], [tablet, '(max-width: 991px)', 1200]].forEach(([im, media, w]) => {
        const src = document.createElement('source');
        src.media = media;
        src.type = 'image/webp';
        src.srcset = `${base(im)}?width=${w}&format=webply&optimize=medium`;
        pic.append(src);
      });
      const img = document.createElement('img');
      img.loading = 'eager';
      img.alt = desktop.getAttribute('alt') || '';
      img.src = `${base(desktop)}?width=2000&format=webply&optimize=medium`;
      pic.append(img);
      imageRow.replaceChildren(pic);
    }
  }
  if (!contentRow) return;
  contentRow.className = 'hero-content';
  const inner = contentRow.firstElementChild || contentRow;
  inner.classList.add('hero-content-inner');
  const first = inner.firstElementChild;
  if (first?.tagName === 'P' && first.nextElementSibling?.matches('h1, h2')) {
    first.classList.add('hero-eyebrow');
  }
  inner.querySelector('h1 + p, h2 + p')?.classList.add('hero-lead');
  const brand = inner.querySelector('picture');
  if (brand) brand.closest('p')?.classList.add('hero-brands');
  [...inner.querySelectorAll('p')].filter((p) => {
    const a = p.querySelector('a');
    return a && p.textContent.trim() === a.textContent.trim();
  }).forEach((p, i) => {
    const a = p.querySelector('a');
    a.classList.add('button', i === 0 ? 'primary' : 'secondary');
    p.classList.add('hero-cta');
  });
}

/**
 * Default hero (personal page), same DOM as the xwalk sibling so both share hero.css:
 * authored as one row [content] [desktop / tablet / mobile crops] -> rows
 * .hero-image (art-directed picture) + .hero-content > .hero-content-inner; the brand lockup
 * paragraph -> .hero-brands; each "label" paragraph + standalone CTA link paragraph merge into
 * one p.hero-cta (label text, then the button), first CTA primary, second secondary.
 */
function decorateDefault(block) {
  const row = block.querySelector(':scope > div');
  if (!row) return;
  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture, img') && c.textContent.trim() === '');
  const contentCell = cells.find((c) => c !== imageCell);
  const imageRow = document.createElement('div');
  imageRow.className = 'hero-image';
  const imgs = imageCell ? [...imageCell.querySelectorAll('img')] : [];
  if (imgs.length) {
    // prod breakpoints: desktop >= 992px, tablet 768-991px, mobile <= 767px
    const base = (img) => img.getAttribute('src').split('?')[0];
    const [desktop, tablet = desktop, mobile = tablet] = imgs;
    const pic = document.createElement('picture');
    [[mobile, '(max-width: 767px)', 800], [tablet, '(max-width: 991px)', 1200]].forEach(([im, media, w]) => {
      const src = document.createElement('source');
      src.media = media;
      src.type = 'image/webp';
      src.srcset = `${base(im)}?width=${w}&format=webply&optimize=medium`;
      pic.append(src);
    });
    const img = document.createElement('img');
    img.loading = 'eager';
    img.alt = desktop.getAttribute('alt') || '';
    img.src = `${base(desktop)}?width=2000&format=webply&optimize=medium`;
    pic.append(img);
    const cell = document.createElement('div');
    cell.append(pic);
    imageRow.append(cell);
  }
  const contentRow = document.createElement('div');
  contentRow.className = 'hero-content';
  const inner = document.createElement('div');
  inner.className = 'hero-content-inner';
  if (contentCell) inner.append(...contentCell.childNodes);
  contentRow.append(inner);
  inner.querySelector('picture')?.closest('p')?.classList.add('hero-brands');
  const ctas = [...inner.querySelectorAll('p')].filter((p) => {
    const a = p.querySelector('a');
    return a && p.textContent.trim() === a.textContent.trim();
  });
  ctas.forEach((p, i) => {
    const a = p.querySelector('a');
    a.classList.add('button', i === 0 ? 'primary' : 'secondary');
    const label = p.previousElementSibling;
    if (label?.tagName === 'P' && !label.querySelector('a, picture') && !ctas.includes(label)) {
      p.prepend(`${label.textContent.trim()} `);
      label.remove();
    }
    p.className = 'hero-cta';
  });
  block.replaceChildren(imageRow, contentRow);
}

export default function decorate(block) {
  if (block.classList.contains('split')) {
    decorateSplit(block);
    return;
  }
  decorateDefault(block);
}
