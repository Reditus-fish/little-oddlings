// Stay poses animate the artwork, never the desktop window.
const peek = {motion: 'peek', face: 'curious', look: -8, duration: 1700};
const blink = {motion: 'blink', face: 'sleepy', duration: 600};
const stretch = {motion: 'stretch', face: 'happy', duration: 1600};
const doze = {motion: 'doze', face: 'sleepy', effect: 'moon', duration: 3600};
const wiggle = {motion: 'wiggle', face: 'curious', look: 8, duration: 1500};

const idlePoses = {
  miso: [peek, blink, doze],
  moss: [stretch, wiggle, doze],
  pip: [peek, wiggle, blink]
};

const touchPoses = {
  miso: {
    pat: {motion: 'lean', face: 'happy', effect: 'hearts', sound: 'comfort', duration: 1450},
    boop: {motion: 'peek', face: 'curious', look: -8, effect: 'curious', sound: 'crawl', duration: 1350}
  },
  moss: {
    pat: {motion: 'wiggle', face: 'happy', effect: 'hearts', sound: 'happy', duration: 1400},
    boop: {motion: 'bounce', face: 'happy', effect: 'sparkles', sound: 'hop', duration: 1350}
  },
  pip: {
    pat: {motion: 'bow', face: 'happy', effect: 'sparkles', sound: 'comfort', duration: 1500},
    boop: {motion: 'peek', face: 'curious', look: 8, effect: 'startle', sound: 'pop', duration: 1250}
  }
};

export function stayTouch(friend, zone, dozing = false) {
  if (dozing) return {motion: 'stretch', face: 'curious', effect: 'curious', sound: 'crawl', duration: 1450};
  return (touchPoses[friend] ?? touchPoses.miso)[zone === 'boop' ? 'boop' : 'pat'];
}

const delay = random => 14000 + random() * 12000;

export function createStayIdle(now, random = Math.random) {
  return {nextAt: now + 5500 + random() * 5000, active: null, last: null};
}

export function stepStayIdle(state, now, friend, eligible, random = Math.random) {
  if (!eligible) {
    if (!state.active && state.nextAt > now) return state;
    return {...state, active: null, nextAt: now + delay(random)};
  }
  if (state.active && now < state.active.until) return state;
  if (now < state.nextAt) return state.active ? {...state, active: null} : state;
  const choices = (idlePoses[friend] ?? idlePoses.miso).filter(pose => pose.motion !== state.last);
  const pose = choices[Math.floor(random() * choices.length)];
  return {
    active: {...pose, until: now + pose.duration},
    last: pose.motion,
    nextAt: now + pose.duration + delay(random)
  };
}
