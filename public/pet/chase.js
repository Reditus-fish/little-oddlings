// Transient play state: never damages the creature or changes a saved mood.
export function createChase() {
  return { phase: 'chase', effort: 0, until: 0, cooldown: 0, last: null };
}

export function stepChase(previous, { now, speed = 0, distance = 0, active = true }) {
  if (!active) return createChase();
  const next = { ...previous, last: now };
  const dt = previous.last === null ? 0 : Math.max(0, Math.min(100, now - previous.last));
  if (previous.phase === 'flop' && now >= previous.until) {
    next.phase = 'peek'; next.until = now + 900;
  } else if (previous.phase === 'peek' && now >= previous.until) {
    next.phase = 'chase'; next.cooldown = now + 4000; next.effort = 0;
  } else if (previous.phase === 'chase') {
    const tooFast = speed > 900 || distance > 360;
    next.effort = Math.max(0, previous.effort + (tooFast ? dt : -dt * 2));
    if (now >= next.cooldown && next.effort >= 550) {
      next.phase = 'flop'; next.until = now + 2400; next.effort = 0;
    }
  }
  return next;
}

// Browser playground. Pointer events are scoped to the habitat, never global.
export function installPointerPlay({ surface, enabled, target, eligible, move, pose, reset }) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let pointer = null, previousPointer = null, chase = createChase(), last = null, running = false;
  surface.addEventListener('pointermove', e => {
    if (e.pointerType !== 'touch') pointer = { x: e.clientX, y: e.clientY };
  });
  surface.addEventListener('pointerleave', () => { pointer = null; });
  const clear = () => {
    pointer = previousPointer = null; chase = createChase(); last = null;
    if (running) { pose('chase'); reset(); running = false; }
  };
  document.addEventListener('visibilitychange', clear);
  window.addEventListener('blur', clear);
  function frame(now) {
    const node = target();
    if (!enabled() || !eligible() || !node || !pointer || reduced.matches || document.hidden) {
      if (running) { pose('chase'); reset(); running = false; }
      previousPointer = null; chase = createChase(); last = now;
    } else {
      running = true;
      const r = surface.getBoundingClientRect(), n = node.getBoundingClientRect();
      const dt = last === null ? 16 : Math.max(1, Math.min(50, now - last));
      const speed = previousPointer ? Math.hypot(pointer.x - previousPointer.x, pointer.y - previousPointer.y) / dt * 1000 : 0;
      const x = n.left + n.width / 2, y = n.top + n.height * .65;
      chase = stepChase(chase, { now, speed, distance: Math.hypot(pointer.x - x, pointer.y - y) });
      pose(chase.phase);
      if (chase.phase === 'chase') {
        // Crawl at a bounded speed; leave a little space around the click point.
        const dx = pointer.x - 38 - x, dy = pointer.y - y;
        const distance = Math.hypot(dx, dy), factor = Math.min(1, 160 * dt / 1000 / Math.max(distance, 1));
        move(Math.max(14, Math.min(86, (x + dx * factor - r.left) / r.width * 100)),
             Math.max(48, Math.min(82, (y + dy * factor - r.top) / r.height * 100)));
      }
      previousPointer = { ...pointer }; last = now;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { clear };
}
