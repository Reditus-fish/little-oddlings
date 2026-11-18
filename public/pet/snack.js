export const snackSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 64" aria-hidden="true"><ellipse cx="40" cy="53" rx="30" ry="5" fill="#c8cda9"/><path d="M20 40L61 14" stroke="#8b7358" stroke-width="5" stroke-linecap="round"/><circle cx="27" cy="36" r="12" fill="#efc4b5" stroke="#786450" stroke-width="2"/><circle cx="43" cy="26" r="12" fill="#fff0c8" stroke="#786450" stroke-width="2"/><circle cx="59" cy="16" r="12" fill="#bacc9f" stroke="#786450" stroke-width="2"/></svg>';

// The staged entrance lasts four seconds; eating continues until the shared snack expires.
const arrival = {miso: 2320, moss: 1160, pip: 3120};

export function snackFace(id, partner, elapsed, side) {
  // Pip feigns disinterest until the other friend looks outward.
  if ((id === 'pip' && elapsed < 1920) || (partner === 'pip' && elapsed >= 1920 && elapsed < 3120)) {
    return {expression:'content', look:8*side};
  }
  if (elapsed >= arrival[id]) return {expression:'happy', look:0};
  return {expression:'curious', look:-8*side};
}

// One gesture commits one action. Pointer cancellation, Escape and outside drops
// only discard the preview. Keyboard users can pick up, move and place it too.
export function installSnackToy({ button, surface, preview, drop, cancel, art = () => snackSVG, canStart = () => true }) {
  const token = document.createElement('div');
  token.className = 'snack-token'; token.hidden = true; token.innerHTML = snackSVG;
  token.setAttribute('aria-hidden', 'true'); surface.append(token);
  button.innerHTML = snackSVG;
  let active = false, pointerId = null, point = { x: 50, y: 66 }, inside = true;
  const paint = () => {
    token.hidden = !active; token.style.left = `${point.x}%`; token.style.top = `${point.y}%`;
    token.classList.toggle('outside', !inside); button.setAttribute('aria-pressed', String(active));
    if (active) preview(inside ? point : null);
  };
  const release = () => {
    if (pointerId !== null && button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
    pointerId = null;
  };
  const abort = () => {
    if (!active) return;
    active = false; release(); paint(); cancel();
  };
  const start = () => {
    if (!canStart()) return false;
    active = true; inside = true; point = { x: 50, y: 66 }; token.innerHTML = art(); paint(); return true;
  };
  const place = () => {
    if (!active) return;
    const destination = inside ? { ...point } : null;
    active = false; release(); paint();
    if (destination) drop(destination); else cancel();
  };
  button.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !start()) return;
    e.preventDefault(); pointerId = e.pointerId; button.setPointerCapture(e.pointerId);
    // A tap is a valid default placement; a drag chooses a location.
  });
  button.addEventListener('pointermove', e => {
    if (!active || pointerId !== e.pointerId) return;
    const r = surface.getBoundingClientRect();
    inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    point = { x: Math.max(24, Math.min(76, (e.clientX - r.left) / r.width * 100)),
              y: Math.max(52, Math.min(76, (e.clientY - r.top) / r.height * 100)) };
    paint();
  });
  button.addEventListener('pointerup', e => { if (e.pointerId === pointerId) place(); });
  button.addEventListener('pointercancel', abort);
  button.addEventListener('lostpointercapture', abort);
  button.addEventListener('keydown', e => {
    if (['Enter', ' '].includes(e.key)) { e.preventDefault(); if (active) place(); else start(); }
    const delta = { ArrowLeft: [-3, 0], ArrowRight: [3, 0], ArrowUp: [0, -3], ArrowDown: [0, 3] }[e.key];
    if (delta && active) {
      e.preventDefault(); point = { x: Math.max(24, Math.min(76, point.x + delta[0])), y: Math.max(52, Math.min(76, point.y + delta[1])) }; paint();
    }
  });
  // Assistive-technology clicks have no pointer sequence.
  button.addEventListener('click', e => { if (e.detail === 0 && !active) { if (start()) place(); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') abort(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) abort(); });
  window.addEventListener('blur', abort);
  return { cancel: abort, get active() { return active; } };
}
