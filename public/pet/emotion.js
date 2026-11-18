// These poses and effects are transient. They never change the pet's save.
export function petEmotion(creature, { reaction = '', phase = 'chase', parked = false, snack = false, startled = false } = {}) {
  if (creature.mood === 'cracked') return { face: 'sad', effect: 'storm' };
  if (creature.mood === 'recovering') return { face: 'sleepy', effect: 'healing' };
  if (creature.mood === 'overwhelmed') return { face: 'sad', effect: startled ? 'startle' : 'rain' };
  if (creature.mood === 'sleepy' || parked) return { face: 'sleepy', effect: 'moon' };
  if (phase === 'flop') return { face: 'sleepy', effect: 'puff' };
  if (phase === 'peek') return { face: 'curious', effect: 'curious' };
  if (snack) return { face: 'happy', effect: creature.id === 'moss' ? 'hearts' : 'sparkles' };
  if (reaction === 'comfort') return { face: 'happy', effect: 'healing' };
  if (reaction === 'pet') return { face: 'happy', effect: 'hearts' };
  if (reaction === 'change') return { face: 'curious', effect: 'curious' };
  return { face: 'content', effect: '' };
}

const heart = (x, y, scale, color) => `<g transform="translate(${x} ${y}) scale(${scale})"><path class="feel-rise" d="M0 15C-3 12-13 6-13 0C-13-8-4-10 0-4C4-10 13-8 13 0C13 6 3 12 0 15Z" fill="${color}"/></g>`;
const star = (x, y, scale) => `<g transform="translate(${x} ${y}) scale(${scale})"><path class="feel-twinkle" d="M0-9Q2-2 8 0Q2 2 0 9Q-2 2-8 0Q-2-2 0-9Z" fill="#f4d585"/></g>`;
const cloud = '<path class="feel-cloud" d="M30 28C22 28 22 16 31 15C31 5 45 3 50 12C57 8 65 12 65 18C75 17 77 29 68 29Z" fill="#bdc5dd"/>';
const drop = (x, y, delay) => `<path class="feel-drop" style="animation-delay:${delay}s" d="M${x} ${y}q-7 9-2 12q6 2 6-3q0-3-4-9Z" fill="#9ecada"/>`;
const rain = cloud + drop(34, 31, -.2) + drop(46, 32, -.7) + drop(62, 31, -.4);
const effects = {
  hearts: heart(30, 32, .52, '#ebb4bf') + heart(54, 24, .83, '#e89cae') + heart(74, 18, .4, '#f3c5cd'),
  healing: heart(49, 26, .68, '#ebb4bf') + star(24, 27, .58) + star(74, 16, .65),
  rain,
  storm: rain + '<path class="feel-bolt" d="M53 27L44 41H51L47 53L62 36H54L60 27Z" fill="#f3d397"/>',
  startle: '<path class="feel-startle" d="M49 8L50 21M28 15L37 26M70 16L61 27" fill="none" stroke="#e3ae87" stroke-width="4" stroke-linecap="round"/>' + star(49, 38, .7),
  sparkles: star(26, 28, .7) + star(50, 18, 1) + star(74, 30, .64),
  moon: '<path class="feel-drift" d="M55 8C42 11 40 29 55 35C46 40 33 34 33 23C33 13 43 6 55 8Z" fill="#f2d59c"/>' + star(64, 12, .45),
  curious: '<circle class="feel-twinkle" cx="38" cy="28" r="4" fill="#b4c78e"/><circle class="feel-twinkle" cx="51" cy="22" r="5" fill="#c6d5a1"/><circle class="feel-twinkle" cx="65" cy="17" r="3" fill="#decae3"/>',
  puff: '<g class="feel-drift" fill="#e1d9e4"><circle cx="39" cy="31" r="7"/><circle cx="51" cy="25" r="10"/><circle cx="63" cy="31" r="6"/></g>'
};

export function emotionEffectSVG(effect, fixedRain = false, time = 0) {
  if (!Object.hasOwn(effects, effect)) return '';
  const art = fixedRain && effect === 'rain' ? cloud + [34,46,62].map((x,i) =>
    `<g transform="translate(0 ${((time*10+i*3)%9)})">${drop(x,30,0)}</g>`).join('') : effects[effect];
  return `<svg viewBox="0 0 100 56" aria-hidden="true" fill="none" stroke="#756658" stroke-width="1.5" stroke-linejoin="round">${art}</svg>`;
}
