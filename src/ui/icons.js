// Simple SVG line icons (from the approved mockup). No emoji anywhere.

const S = 'width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B1A17" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

export const ICONS = {
  maize: `<svg ${S}><path d="M12 3c3 2 4 6 3 11-.8 3.5-2 5.8-3 7-1-1.2-2.2-3.5-3-7-1-5 0-9 3-11z"/><path d="M12 6v12M9.6 9.5h4.8M9.2 13.5h5.6"/></svg>`,
  power: `<svg ${S}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>`,
  tourism: `<svg ${S}><circle cx="7" cy="16" r="4"/><circle cx="17" cy="16" r="4"/><path d="M11 16h2M4.5 13 7 5h3l1 8M19.5 13 17 5h-3l-1 8"/></svg>`,
  copper: `<svg ${S}><path d="M4 9c4.5-4.5 11.5-4.5 16 0"/><path d="M14.5 6.5 6 21"/></svg>`,
  soya: `<svg ${S}><path d="M12 21V11"/><path d="M12 11c0-4-3-6-7-6 0 4 3 6 7 6zM12 13c0-4 3-6 7-6 0 4-3 6-7 6z"/></svg>`,
  beef: `<svg ${S}><path d="M4 6c2 0 3 1 4 2h8c1-1 2-2 4-2"/><path d="M8 8v7a4 4 0 0 0 8 0V8"/><path d="M10.5 16h.01M13.5 16h.01"/></svg>`,
  sugar: `<svg ${S}><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/></svg>`,
  wheat: `<svg ${S}><path d="M12 22V8"/><path d="M12 8c-2-1-3-3-3-5 2 1 3 3 3 5zM12 8c2-1 3-3 3-5-2 1-3 3-3 5zM12 13c-2-1-4-2-4-5 2 0 4 2 4 5zM12 13c2-1 4-2 4-5-2 0-4 2-4 5zM12 18c-2-1-4-2-4-5 2 0 4 2 4 5zM12 18c2-1 4-2 4-5-2 0-4 2-4 5z"/></svg>`,
  coin: `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="#FFD23F" stroke="#1B1A17" stroke-width="2.5"/><circle cx="12" cy="12" r="5" fill="none" stroke="#1B1A17" stroke-width="2"/></svg>`,
  star: `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="#FFFFFF" stroke="#1B1A17" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
  badge: `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 14 7 22l5-3 5 3-1.5-8" fill="#E5383B" stroke="#1B1A17" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="9" r="6.5" fill="#FF9F1C" stroke="#1B1A17" stroke-width="2.2"/></svg>`,
  back: `<svg ${S.replace('stroke-width="2.4"', 'stroke-width="3"')}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>`,
  lock: `<svg ${S}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
  user: `<svg ${S}><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>`,
  check: `<svg ${S} ><path d="M5 12.5 10 17l9-10"/></svg>`,
  cross: `<svg ${S}><path d="M6 6l12 12M18 6 6 18"/></svg>`,
};

// Jimmy — the guide in the orange hard hat.
export const JIMMY = `<svg viewBox="0 0 110 110" aria-hidden="true">
<circle cx="55" cy="62" r="38" fill="#9C6B3F" stroke="#1B1A17" stroke-width="4"/>
<path d="M19 50 A36 30 0 0 1 91 50 Z" fill="#FF9F1C" stroke="#1B1A17" stroke-width="4"/>
<rect x="10" y="45" width="90" height="11" rx="5.5" fill="#FF9F1C" stroke="#1B1A17" stroke-width="4"/>
<circle cx="42" cy="70" r="6" fill="#1B1A17"/><circle cx="68" cy="70" r="6" fill="#1B1A17"/>
<circle cx="44" cy="68" r="2" fill="#FFFFFF"/><circle cx="70" cy="68" r="2" fill="#FFFFFF"/>
<path d="M42 83 q13 13 26 0" stroke="#1B1A17" stroke-width="5" fill="none" stroke-linecap="round"/>
</svg>`;
