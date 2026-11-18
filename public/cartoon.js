// Flat, small-scale-readable alternative to the original soft-shaded renderer.
export function cartoonCreatureSVG(c, color, unique = 'main') {
  const sad = ['overwhelmed', 'cracked'].includes(c.mood) || c.expression === 'sad';
  const asleep = ['sleepy', 'recovering'].includes(c.mood) || c.expression === 'sleepy';
  const happy = !sad && !asleep && c.expression === 'happy';
  const look = Number.isFinite(c.look) ? Math.max(-8, Math.min(8, c.look)) : 0;
  const hat = Number.isFinite(c.hat) ? Math.max(-28,Math.min(28,c.hat)) : 0;
  const eyeHeight = c.expression === 'startled' ? 22 : 18;
  const body = 'M43 151C38 124 66 87 103 77C138 67 186 69 219 86C254 104 275 133 277 155C280 177 237 185 160 185C88 185 45 177 43 151Z';
  const markings = c.pattern === 'stripes'
    ? '<path d="M99 68Q125 112 112 181M160 65Q184 116 173 185M220 75Q243 124 232 181" fill="none" stroke="#fff7ef" stroke-width="15"/>'
    : Array.from({length: 9}, (_, i) => `<circle cx="${72 + (i * 43) % 183}" cy="${99 + (i * 23) % 62}" r="${c.pattern === 'spots' ? 7 : 2.7}" fill="#c48c80" opacity=".48"/>`).join('');
  const jobs = {
    none: '',
    gardener: '<path d="M160 73L169 42" stroke="#655348" stroke-width="3.5"/><path d="M167 57Q141 60 146 40Q167 36 167 57M170 49Q175 28 195 36Q192 55 170 49" fill="#a8cc89" stroke="#655348" stroke-width="3.5"/>',
    intern: '<path d="M154 167L165 167L169 176L162 188L153 178Z" fill="#b3a0cf" stroke="#655348" stroke-width="3"/><circle cx="159" cy="128" r="24" fill="none" stroke="#655348" stroke-width="3"/><path d="M183 128L223 114" stroke="#655348" stroke-width="3"/>',
    chef: '<path d="M130 79L129 57Q111 54 118 39Q123 28 137 32Q148 14 161 29Q180 18 188 34Q206 39 195 55L188 79Z" fill="#fffdf4" stroke="#655348" stroke-width="3.5" stroke-linejoin="round"/><path d="M132 66L187 66" stroke="#e9d9c5" stroke-width="3"/>'
  };
  const robe = c.costume === 'fortune' ? `<g clip-path="url(#flat-body-${unique})" stroke-linejoin="round">
    <path d="M40 131Q63 133 91 147Q122 165 159 170Q204 167 245 139L282 126V195H36Z" fill="#486c71" stroke="#46565b" stroke-width="3"/>
    <path d="M45 135Q104 163 162 175L148 182Q91 171 41 147Z" fill="#e5cf94"/>
    <path d="M278 130Q232 162 179 175L131 190H105Q153 169 179 164Q236 150 272 126Z" fill="#eee3bc" stroke="#526a69" stroke-width="2"/>
    <path d="M91 169q-12 4-21-5m8 9q-8 1-13-3m165-15q8 3 14-3m-8 8q6 1 10-2" fill="none" stroke="#a8c9be" stroke-linecap="round" stroke-width="2.5"/>
    <path d="M182 166q14 2 22 15m-21-14q13 7 14 17" fill="none" stroke="#c48066" stroke-width="4"/>
    <circle cx="182" cy="166" r="4.5" fill="#ddba70" stroke="#615d55" stroke-width="1.6"/>
  </g>` : '';
  const crown = `<g stroke="#57565a" stroke-width="2.5" stroke-linejoin="round">
    <path d="M132 76Q138 64 139 55Q140 48 146 53L152 58Q156 48 163 44Q170 49 170 58L178 53Q183 52 183 58L183 72Z" fill="#587d7c"/>
    <path d="M132 71Q158 65 185 69L184 77Q155 73 133 80Z" fill="#dfc38d"/>
    <path d="M144 65l39-13" fill="none" stroke="#966849" stroke-width="3"/><circle cx="186" cy="51" r="4" fill="#e3a68a"/>
  </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" overflow="visible" role="img" aria-label="A Japanese-style cartoon one-eyed egg creature, ${c.mood}">
    <defs><clipPath id="flat-body-${unique}"><path d="${body}"/></clipPath></defs>
    <ellipse cx="160" cy="187" rx="108" ry="8" fill="#d7dcc4"/>
    <path d="${body}" fill="${color}" stroke="#655348" stroke-width="3.5" stroke-linejoin="round"/>
    <g clip-path="url(#flat-body-${unique})">${markings}</g>
    <path d="M53 120L66 126L76 119L88 127M228 109L237 117L246 113L256 122" fill="none" stroke="#a18a74" stroke-width="2.5" stroke-linejoin="round"/>
    <ellipse cx="115" cy="148" rx="13" ry="5" fill="${c.hot?'#d97671':'#efa9a7'}"/><ellipse cx="204" cy="148" rx="13" ry="5" fill="${c.hot?'#d97671':'#efa9a7'}"/>
    ${happy ? '<path d="M145 132Q159 112 175 132" fill="none" stroke="#655348" stroke-width="5" stroke-linecap="round"/>' : asleep ? '<path d="M144 131Q160 143 175 131" fill="none" stroke="#655348" stroke-width="5" stroke-linecap="round"/>' : `<g transform="translate(${look} 0)"><ellipse cx="159" cy="128" rx="13" ry="${eyeHeight}" fill="#4c413b"/><ellipse cx="155" cy="121" rx="4" ry="5" fill="#fffdf5"/></g>`}
    ${c.expression === 'grumpy' ? '<path d="M143 102L156 110M175 102L162 110M151 158Q160 152 169 158" fill="none" stroke="#655348" stroke-width="3.5" stroke-linecap="round"/>' : ''}
    ${c.expression === 'startled' ? '<ellipse cx="160" cy="154" rx="6" ry="7" fill="#d78f8d" stroke="#655348" stroke-width="2"/>' : ''}
    ${c.expression === 'curious' ? '<path d="M143 104Q154 94 167 100" fill="none" stroke="#655348" stroke-width="3" stroke-linecap="round"/>' : ''}
    ${c.expression === 'nibble' ? '<ellipse data-bite-mouth="" cx="160" cy="155" rx="8.5" ry="6" fill="#945e56" stroke="#655348" stroke-width="2.4"/>' : happy ? '<path d="M150 151Q160 169 171 151Z" fill="#efa9a7" stroke="#655348" stroke-width="2"/>' : sad ? '<path d="M147 105Q159 111 171 105" fill="none" stroke="#655348" stroke-width="3" stroke-linecap="round"/><path d="M143 143Q128 160 139 164Q152 166 147 150M178 143Q164 160 177 164Q189 161 181 149" fill="#a6d6e9" stroke="#779aa9" stroke-width="2"/>' : '<path d="M155 154Q160 159 165 154" fill="none" stroke="#655348" stroke-width="2.5" stroke-linecap="round"/>'}
    ${c.mood === 'cracked' ? '<path d="M180 73L173 86L183 95M247 131L237 143L245 151" fill="none" stroke="#655348" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' : ''}
    ${robe}
    ${robe ? crown : hat && c.job === 'chef' ? `<g transform="translate(0 ${-hat})">${jobs.chef}</g>` : jobs[c.job] || ''}
    ${c.mood === 'recovering' ? '<path d="M46 158Q99 149 159 168Q222 149 275 158L272 179Q159 195 48 179Z" fill="#bbd9c3" stroke="#655348" stroke-width="3"/><path d="M51 163Q99 154 159 174Q220 154 270 163" fill="none" stroke="#fff9ed" stroke-width="5"/><path d="M208 101L215 113M215 101L208 113" stroke="#edbf79" stroke-width="7" stroke-linecap="round"/>' : ''}
  </svg>`;
}
