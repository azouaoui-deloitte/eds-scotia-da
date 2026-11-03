/**
 * Hero: art-directed background per viewport.
 * The image cell authors three crops in order: desktop, tablet, mobile.
 * We collapse them into a single <picture> with art-directed <source> breakpoints.
 */
function buildArtDirectedPicture(imgs) {
  const base = (img) => img.getAttribute('src').split('?')[0];
  const alt = imgs[0].getAttribute('alt') || '';
  const desktop = imgs[0];
  const tablet = imgs[1] || imgs[0];
  const mobile = imgs[2] || tablet;
  const pic = document.createElement('picture');
  const s1 = document.createElement('source');
  s1.media = '(min-width: 1200px)';
  s1.type = 'image/webp';
  s1.srcset = `${base(desktop)}?width=2400&format=webply&optimize=medium`;
  const s2 = document.createElement('source');
  s2.media = '(min-width: 600px)';
  s2.type = 'image/webp';
  s2.srcset = `${base(tablet)}?width=1600&format=webply&optimize=medium`;
  const img = document.createElement('img');
  img.loading = 'eager';
  img.alt = alt;
  img.src = `${base(mobile)}?width=800&format=webply&optimize=medium`;
  pic.append(s1, s2, img);
  return pic;
}

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
    if (imgs.length) imageRow.replaceChildren(buildArtDirectedPicture(imgs));
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

export default function decorate(block) {
  if (block.classList.contains('split')) {
    decorateSplit(block);
    return;
  }
  const row = block.querySelector(':scope > div');
  if (!row) return;
  const cells = [...row.children];
  // identify image cell (the one whose only meaningful content is picture/img)
  let imageCell = cells.find((c) => c.querySelector('picture, img') && c.textContent.trim() === '');
  let contentCell = cells.find((c) => c !== imageCell);
  if (!imageCell && cells.length === 2) {
    [contentCell, imageCell] = cells;
  }
  if (imageCell) {
    imageCell.classList.add('hero-media');
    const imgs = [...imageCell.querySelectorAll('img')];
    if (imgs.length >= 2) {
      imageCell.replaceChildren(buildArtDirectedPicture(imgs));
    }
  }
  if (contentCell) {
    contentCell.classList.add('hero-content');
    // the leading paragraph that holds the brand logo image -> logo row
    const logo = [...contentCell.querySelectorAll('p')].find((p) => p.querySelector('img, picture'));
    if (logo) logo.classList.add('hero-logo');
    // the DA pipeline strips the authored button-wrapper class, so detect standalone links
    // (a <p> whose only content is a single <a>) and promote them to buttons.
    const btnWrappers = [...contentCell.querySelectorAll('p')].filter((p) => {
      const a = p.querySelector('a');
      return a && p.children.length === 1 && p.textContent.trim() === a.textContent.trim();
    });
    btnWrappers.forEach((p, i) => {
      p.classList.add('button-wrapper');
      const a = p.querySelector('a');
      a.classList.add('button', i === 0 ? 'primary' : 'secondary');
    });
    if (btnWrappers.length) {
      const ctaRow = document.createElement('div');
      ctaRow.className = 'hero-cta-row';
      btnWrappers.forEach((bw) => {
        const group = document.createElement('div');
        group.className = 'hero-cta-group';
        const label = bw.previousElementSibling;
        if (label && label.tagName === 'P' && !label.classList.contains('button-wrapper')) {
          label.classList.add('hero-cta-label');
          group.append(label);
        }
        group.append(bw);
        ctaRow.append(group);
      });
      contentCell.append(ctaRow);
    }
  }
}
