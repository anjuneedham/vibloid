/* Gold Journal Studio: deterministic scene animations for video 001, drawn in "The Study".
   Every scene is a pure function of time: STUDIO.svg(sceneIndex, seconds) returns an SVG string (1920x1080).
   Durations here are preview lengths; scale them to the voiceover when the audio is ready. */
(function () {
  const W = 1920, H = 1080;
  const SERIF = "font-family=\"Fraunces,Georgia,'Liberation Serif',serif\"";
  const SANS = "font-family=\"Inter,system-ui,'DejaVu Sans',sans-serif\"";
  const INK = '#0e1726', GOLD = '#d4a937', GOLDD = '#9c7a16', PAPER = '#f5ecd6', TEAL = '#2a7f7f', RED = '#c2493d';
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const pr = (t, a, b) => cl((t - a) / (b - a));
  const eo = (p) => 1 - Math.pow(1 - p, 3);
  const eio = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const bounce = (p) => {
    if (p <= 0) return 0; if (p >= 1) return 1;
    const n = 7.5625, d = 2.75; let x = p;
    if (x < 1 / d) return n * x * x;
    if (x < 2 / d) { x -= 1.5 / d; return n * x * x + 0.75; }
    if (x < 2.5 / d) { x -= 2.25 / d; return n * x * x + 0.9375; }
    x -= 2.625 / d; return n * x * x + 0.984375;
  };
  const lerp = (a, b, p) => a + (b - a) * p;
  const hex = (h) => (Array.isArray(h) ? h : [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const mixA = (a, b, p) => { const A = hex(a), B = hex(b); return A.map((v, i) => Math.round(lerp(v, B[i], p))); };
  const mix = (a, b, p) => 'rgb(' + mixA(a, b, p).join(',') + ')';
  const n1 = (n) => (Math.round(n * 10) / 10);
  const ty = (s, p) => s.slice(0, Math.round(s.length * cl(p)));
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const txt = (x, y, s, size, fill, o = {}) =>
    `<text x="${n1(x)}" y="${n1(y)}" font-size="${size}" fill="${fill}" text-anchor="${o.a || 'start'}" ${o.sans ? SANS : SERIF} font-weight="${o.w || 500}"${o.i ? ' font-style="italic"' : ''}${o.op != null ? ` opacity="${o.op}"` : ''}>${esc(s)}</text>`;

  /* ---------- the room ---------- */
  function room(e) {
    const sky = mix(mixA('#1d2a3d', '#4b4f57', e.grey || 0), '#f2b95f', e.dawn || 0);
    const sun = 290 - (e.dawn || 0) * 70;
    let s = `<defs>
<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1f17"/><stop offset="1" stop-color="#4a3626"/></linearGradient>
<radialGradient id="lampg" cx="1500" cy="320" r="950" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd98a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
<radialGradient id="spot" cx="960" cy="830" r="700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity=".8"/></radialGradient>
<radialGradient id="dawng" cx="350" cy="300" r="1300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd98a" stop-opacity=".7"/><stop offset="1" stop-color="#ffb35f" stop-opacity="0"/></radialGradient>
<pattern id="stripe" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="24" height="24" fill="#e9dfc3"/><rect width="12" height="24" fill="#efe6cd"/></pattern>
<clipPath id="win"><rect x="147" y="147" width="406" height="286"/></clipPath>
<marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${INK}"/></marker>
</defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#wall)"/>`;
    // window
    s += `<g clip-path="url(#win)"><rect x="140" y="140" width="420" height="300" fill="${sky}"/><circle cx="350" cy="${n1(sun)}" r="${70 + (e.dawn || 0) * 20}" fill="${mix('#d4a937', '#fff2c0', e.dawn || 0)}" opacity="${0.85}"/>
<path d="M140 440V400l60-30 60 20 70-40 60 30 70-20 60 40V440z" fill="#0b1220" opacity="${0.8 - (e.dawn || 0) * 0.3}"/></g>
<rect x="140" y="140" width="420" height="300" rx="6" fill="none" stroke="#8a6240" stroke-width="14"/><path d="M350 140V440M140 290H560" stroke="#8a6240" stroke-width="8"/>`;
    // shelf, books, globe
    s += `<rect x="1280" y="610" width="540" height="14" fill="#8a6240"/>`;
    const bk = [['#7a2e2e', 70], ['#2e4a6b', 90], ['#d4a937', 60], ['#3f6b4a', 80], ['#5a3a6b', 70], ['#8a6240', 95], ['#2a7f7f', 65]];
    let bx = 1310; bk.forEach(([c, h]) => { s += `<rect x="${bx}" y="${610 - h}" width="34" height="${h}" fill="${c}"/>`; bx += 38; });
    // lamp
    s += `<rect x="1280" y="120" width="500" height="22" fill="#8a6240"/><rect x="1300" y="142" width="22" height="120" fill="#8a6240"/><path d="M1500 300q-80-80 0-150 80 70 0 150z" fill="#ffe19a"/>`;
    // desk
    s += `<rect y="760" width="${W}" height="320" fill="#6b4a30"/><rect y="750" width="${W}" height="14" fill="#8a6240"/><path d="M0 880H1920M0 985H1920" stroke="#000" stroke-opacity=".12" stroke-width="2"/>`;
    // globe
    s += `<g transform="translate(1760 700)"><rect x="-6" y="40" width="12" height="40" fill="#8a6240"/><ellipse cx="0" cy="82" rx="36" ry="8" fill="#8a6240"/><circle r="52" fill="#2e4a6b"/><path d="M-30-20q20-20 40-8-6 24-26 28zM6 10q24-6 30 14-18 14-30-2z" fill="#3f6b4a"/><circle r="52" fill="none" stroke="${GOLD}" stroke-width="5"/></g>`;
    return s;
  }
  function overlays(e) {
    let s = '';
    s += `<rect width="${W}" height="${H}" fill="url(#lampg)" opacity="${n1((e.lamp ?? 1) * 100) / 100}" style="mix-blend-mode:screen"/>`;
    s += `<rect width="${W}" height="${H}" fill="#000" opacity="${n1((1 - (e.lamp ?? 1)) * 55) / 100}"/>`;
    if (e.dawn) s += `<rect width="${W}" height="${H}" fill="url(#dawng)" opacity="${e.dawn}" style="mix-blend-mode:screen"/>`;
    return s;
  }

  /* ---------- characters and props ---------- */
  function wren(cx, t) {
    const b = Math.sin(t * 2) * 3;
    return `<g transform="translate(${n1(cx)} 0)">
<rect x="-100" y="640" width="200" height="190" rx="30" fill="#3a2a1d"/>
<path d="M-92 800Q-96 660 -52 640H52Q96 660 92 800Z" fill="${TEAL}"/><path d="M-60 664Q0 700 60 664" fill="none" stroke="#1d5656" stroke-width="6"/><path d="M0 690V790" stroke="#1d5656" stroke-width="5"/>
<g transform="translate(0 ${n1(b)})"><circle cx="0" cy="590" r="54" fill="#6a4428"/><path d="M-40 560Q0 530 40 560" fill="none" stroke="#8a5e3a" stroke-width="7" stroke-linecap="round"/><path d="M-50 598Q0 640 50 598" fill="#e9c9a4"/><circle cx="-54" cy="596" r="9" fill="#e9c9a4"/><circle cx="54" cy="596" r="9" fill="#e9c9a4"/></g>
<rect x="64" y="742" width="92" height="12" rx="3" fill="${PAPER}" transform="rotate(-6 110 748)"/></g>`;
  }
  function flick(x, y, t, dir = 1, flap = 28) {
    const fl = Math.sin(t * 30) * flap;
    return `<g transform="translate(${n1(x)} ${n1(y)}) scale(${dir} 1)">
<path d="M-30 4L-86 20 -60 -4z" fill="${GOLD}"/>
<g transform="rotate(${n1(-20 + fl)} -6 -8)"><path d="M-6-8Q-30-70-96-84-70-30-30 0z" fill="#f4b45a"/></g>
<ellipse rx="40" ry="26" fill="#e8892f"/><circle cx="38" cy="-14" r="17" fill="#e8892f"/><path d="M52-18L96-26 52-6z" fill="${GOLD}"/><circle cx="43" cy="-18" r="3.6" fill="${INK}"/>
<g transform="rotate(${n1(-10 + fl * 0.6)} -6 -8)"><path d="M-6-8Q-24-52-70-58-52-20-24 2z" fill="${GOLD}"/></g></g>`;
  }
  function book(cx, cy, open, sealP, sc = 1) {
    const w = 440, h = 112;
    let s = `<g transform="translate(${cx} ${cy}) scale(${sc}) translate(${-cx} ${-cy})">`;
    s += `<ellipse cx="${cx}" cy="${cy + h - 2}" rx="${w / 2 + 34}" ry="22" fill="#000" opacity=".3"/>`;
    s += `<rect x="${cx - w / 2}" y="${cy}" width="${w}" height="${h}" rx="8" fill="${GOLD}"/>`;
    if (open > 0.02) {
      const pw = (w / 2 - 14) * open;
      s += `<rect x="${n1(cx - pw)}" y="${cy - 20}" width="${n1(pw)}" height="${h - 8}" rx="4" fill="${PAPER}"/><rect x="${cx}" y="${cy - 20}" width="${n1(pw)}" height="${h - 8}" rx="4" fill="#efe4c8"/><line x1="${cx}" y1="${cy - 20}" x2="${cx}" y2="${cy + h - 28}" stroke="#b39a5e" stroke-width="3"/>`;
      if (open > 0.8) s += `<path d="M${cx - 160} ${cy + 10}H${cx - 20}M${cx - 160} ${cy + 34}H${cx - 60}M${cx + 20} ${cy + 10}H${cx + 160}" stroke="#c9b889" stroke-width="3"/>`;
    }
    const co = 1 - open;
    if (co > 0.02) {
      s += `<g opacity="${co}"><rect x="${cx - w / 2 + 14}" y="${cy + 14}" width="${w - 28}" height="${h - 28}" rx="5" fill="none" stroke="${GOLDD}" stroke-width="4"/>
<circle cx="${cx}" cy="${cy + h / 2}" r="26" fill="none" stroke="${GOLDD}" stroke-width="4"/><path d="M${cx} ${cy + h / 2 - 26}V${cy + h / 2 + 26}M${cx - 26} ${cy + h / 2}H${cx + 26}" stroke="${GOLDD}" stroke-width="3"/><path d="M${cx + w / 2 - 70} ${cy}v${h * 0.55}l10-10 10 10V${cy}z" fill="${RED}"/></g>`;
    }
    if (sealP > 0) {
      const sc2 = lerp(2.4, 1, bounce(sealP));
      s += `<g transform="translate(${cx} ${cy + h / 2}) scale(${n1(sc2 * 100) / 100})" opacity="${cl(sealP * 4)}"><circle r="44" fill="#b8901f" stroke="${GOLDD}" stroke-width="6"/><circle r="30" fill="none" stroke="#5a4300" stroke-width="3"/><path d="M0-30V30M-30 0H30M-21-21L21 21M21-21L-21 21" stroke="#5a4300" stroke-width="3"/></g>`;
    }
    return s + '</g>';
  }
  function paper(x, y, w, h, rot, inner, op = 1) {
    return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${rot})" opacity="${op}"><rect x="6" y="10" width="${w}" height="${h}" rx="6" fill="#000" opacity=".4"/><rect width="${w}" height="${h}" rx="6" fill="${PAPER}"/><path d="M0 0h34L0 34z" fill="${GOLD}"/><path d="M${w} ${h}h-34l34-34z" fill="${GOLD}"/>${inner}</g>`;
  }
  function slot(x, y, w, h, rot, id, label, t0, t, tag) {
    const p = pr(t, t0, t0 + 1.1);
    if (p <= 0) return '';
    const yo = (1 - bounce(p)) * -560;
    const inner = `<rect x="14" y="14" width="${w - 28}" height="${h - 28}" fill="url(#stripe)"/>${txt(w / 2, h / 2 - 6, id, 46, '#6b5a35', { a: 'middle', w: 700 })}${txt(w / 2, h / 2 + 34, label, 24, '#6b5a35', { a: 'middle', sans: true, w: 500 })}`;
    let s = paper(x, y + yo, w, h, rot, inner);
    if (tag && p >= 1) s += `<g transform="translate(${x + 20} ${y - 6}) rotate(-4)"><rect width="150" height="34" rx="4" fill="#fff3c9"/>${txt(75, 24, tag, 20, '#5a4300', { a: 'middle', w: 700, sans: true })}</g>`;
    return s;
  }
  const tagged = (x, y, label, color, t0, t, w = 300) => {
    const p = pr(t, t0, t0 + 0.6); if (p <= 0) return '';
    return `<g transform="translate(${x} ${n1(y + (1 - eo(p)) * 24)})" opacity="${p}"><rect width="${w}" height="56" rx="8" fill="${PAPER}" stroke="${color}" stroke-width="4"/>${txt(w / 2, 38, label, 28, INK, { a: 'middle', w: 600 })}</g>`;
  };

  /* ---------- scenes ---------- */
  const scenes = [];

  // S0 cold open
  scenes.push({ id: 'S0', title: 'Cold open', dur: 16, env: (t) => ({ lamp: 0.25 + 0.75 * eo(pr(t, 0, 3)) }),
    draw(t) {
      let g = '';
      g += book(960, 820, eo(pr(t, 1.5, 3.5)), 0);
      g += wren(lerp(-160, 330, eo(pr(t, 0, 2.2))), t);
      const rise = eo(pr(t, 3.4, 5)), fade = 1 - pr(t, 9, 9.8);
      if (rise > 0 && fade > 0) {
        const inner = txt(350, 140, ty('FIRST $5K', pr(t, 4.2, 5.8)), 110, INK, { a: 'middle', w: 700 }) +
          txt(350, 210, ty('THE HONEST ROADMAP', pr(t, 6, 8)), 40, TEAL, { a: 'middle', w: 600 }) +
          `<path d="M120 236H${120 + 460 * pr(t, 7.6, 8.6)}" stroke="${GOLD}" stroke-width="6" stroke-linecap="round"/>`;
        g += paper(610, lerp(400, 110, rise), 700, 290, -1.5, inner, fade);
      }
      g += slot(620, 90, 680, 380, 1.5, 'R01', 'Your empty income tracker, $0', 9.3, t);
      const d = ty('Education only. Not financial advice.', pr(t, 12, 15));
      g += txt(960, 1000, d, 44, GOLD, { a: 'middle', i: true });
      return g;
    } });

  // S1 equation
  scenes.push({ id: 'S1', title: 'The 5K equation', dur: 16, env: () => ({ lamp: 1 }),
    draw(t) {
      let g = book(960, 840, 1, 0);
      g += wren(330, t);
      const base = 790, TH = 240, xs = [560, 940, 1300];
      const cards = ['$50 × 100', '$500 × 10', '$1,000 × 5'];
      xs.forEach((x, i) => {
        const p = eo(pr(t, 0.6 + i * 0.5, 1.8 + i * 0.5));
        g += `<g transform="translate(${x - 140} ${n1(lerp(-120, 410, p))})"><rect x="6" y="8" width="280" height="86" rx="8" fill="#000" opacity=".4"/><rect width="280" height="86" rx="8" fill="${PAPER}"/>${txt(140, 58, cards[i], 40, INK, { a: 'middle', w: 700 })}</g>`;
      });
      const lp = pr(t, 2.6, 3.8);
      g += `<path d="M440 ${base - TH}H${440 + 1200 * lp}" stroke="#ffe19a" stroke-width="4" stroke-dasharray="14 12"/>`;
      if (lp > 0.95) g += txt(1650, base - TH - 14, '$5,000', 44, '#ffe19a', { a: 'end', w: 700 });
      const grow = pr(t, 3.4, 9.4);
      [[9, 74, 24], [5, 104, 45], [3, 140, 77]].forEach(([n, w, h], i) => {
        const shown = grow * n;
        for (let k = 0; k < n; k++) {
          const q = cl(shown - k); if (q <= 0) continue;
          const yy = base - (k + 1) * (h + 3) + (1 - eo(q)) * -90;
          g += `<g opacity="${q}"><ellipse cx="${xs[i]}" cy="${n1(yy + h / 2)}" rx="${w / 2}" ry="${h / 2 + 2}" fill="${GOLD}" stroke="#9c7a16" stroke-width="3"/><ellipse cx="${xs[i] - w * 0.12}" cy="${n1(yy + h / 2 - h * 0.12)}" rx="${w * 0.25}" ry="${Math.max(2, h * 0.12)}" fill="#f3d57a" opacity=".7"/></g>`;
        }
      });
      const hp = pr(t, 9.6, 10.2);
      if (hp > 0) g += `<g transform="translate(1500 330) rotate(-4)" opacity="${hp}"><rect width="230" height="40" rx="5" fill="#fff3c9"/>${txt(115, 29, 'HYPOTHETICAL', 22, '#5a4300', { a: 'middle', w: 700, sans: true })}</g>`;
      g += slot(720, 40, 480, 270, 1.5, 'R02', 'Three formulas that each equal 5000', 11, t, 'Example');
      return g;
    } });

  // S2 flat zone
  scenes.push({ id: 'S2', title: 'Why people fail', dur: 20, env: (t) => ({ lamp: 1 - 0.45 * eio(pr(t, 6, 9)), grey: eio(pr(t, 5, 9)) }),
    draw(t) {
      const px = 500, py = 36, X = (w) => 80 + 780 * w / 20, Y = (v) => 380 - 300 * v;
      const f = (w) => (Math.exp(0.22 * w) - 1) / (Math.exp(0.22 * 20) - 1);
      let c = `<rect x="${X(0)}" y="80" width="${X(9) - X(0)}" height="300" fill="${INK}" opacity="${0.08 * pr(t, 1.2, 2)}"/>`;
      c += `<path d="M80 380H860M80 380V80" stroke="${INK}" stroke-width="3" fill="none"/>`;
      for (let w = 0; w <= 20; w += 4) c += txt(X(w), 408, String(w), 22, '#5a5340', { a: 'middle', sans: true });
      c += txt(470, 446, 'Weeks of steady work', 22, '#5a5340', { a: 'middle', sans: true });
      c += txt(80, 66, 'Results', 22, '#5a5340', { sans: true });
      if (pr(t, 1.2, 2) > 0.5) c += txt(X(4.5), 112, 'The flat zone: looks like nothing', 24, '#5a5340', { a: 'middle', sans: true });
      const wmax = 20 * pr(t, 2, 12);
      let pts = ''; for (let w = 0; w <= wmax; w += 0.25) pts += `${n1(X(w))},${n1(Y(f(w)))} `;
      if (wmax > 0) c += `<polyline points="${pts}" fill="none" stroke="#b8901f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
      const qw = 7 * pr(t, 2, 4.8); let qp = ''; for (let w = 0; w <= qw; w += 0.25) qp += `${n1(X(w))},${n1(Y(f(w)))} `;
      if (qw > 0) c += `<polyline points="${qp}" fill="none" stroke="${RED}" stroke-width="8" stroke-linecap="round"/>`;
      const qx = pr(t, 4.8, 5.4);
      if (qx > 0) c += `<g opacity="${qx}"><path d="M${X(7) - 14} ${Y(f(7)) - 14}l28 28M${X(7) + 14} ${Y(f(7)) - 14}l-28 28" stroke="${RED}" stroke-width="8" stroke-linecap="round"/>${txt(X(7), Y(f(7)) - 56, 'Quit at week 7', 28, RED, { a: 'middle', w: 700 })}</g>`;
      if (wmax > 14) c += txt(X(16), Y(f(16)) - 40, 'Keep going: the line bends', 28, '#8a6a10', { a: 'end', w: 700, op: cl((wmax - 14) / 2) });
      for (let k = 0; k < 6; k++) { const p = pr(t, 12.5 + k * 0.35, 13 + k * 0.35); if (p > 0) c += txt(X(3 + 3 * k), 470, '↺', 36, INK, { a: 'middle', op: p }); }
      if (pr(t, 14, 15) > 0) c += txt(80, 506, 'Switch ideas: the clock resets to zero each time', 24, '#5a5340', { sans: true, op: pr(t, 14, 15) });
      let g = paper(px, py, 940, 530, -0.6, c);
      g += book(1640, 840, 1, 0, 0.7);
      g += wren(330, t);
      // Flick hops between shiny things
      const stops = [[260, 640], [980, 700], [1600, 690], [1120, 620], [600, 690]];
      const T0 = 3, seg = 1.6; const k = Math.floor(Math.max(0, t - T0) / seg);
      const fp = ((t - T0) / seg) % 1;
      const a = stops[k % stops.length], b = stops[(k + 1) % stops.length];
      const fx = t < T0 ? lerp(-160, stops[0][0], eo(pr(t, 0, T0))) : lerp(a[0], b[0], eio(fp));
      const fy = (t < T0 ? lerp(500, stops[0][1], eo(pr(t, 0, T0))) : lerp(a[1], b[1], eio(fp))) - Math.sin(fp * Math.PI) * 90;
      const dir = (t < T0 || b[0] >= a[0]) ? 1 : -1;
      for (let j = 0; j < Math.min(5, k); j++) { const s2 = stops[(j + 1) % stops.length]; g += `<rect x="${s2[0] - 26}" y="${s2[1] + 48}" width="52" height="68" rx="3" fill="${PAPER}" transform="rotate(${(j * 37) % 40 - 20} ${s2[0]} ${s2[1] + 80})" opacity=".92"/>`; }
      g += flick(fx, fy, t, dir);
      ['1 Shiny objects', '2 No distribution', '3 Wrong fit', '4 The flat zone'].forEach((s, i) => { g += tagged(260 + i * 350, 790, s, RED, 12 + i * 1.6, t, 320); });
      return g;
    } });

  // S3 fit filter
  scenes.push({ id: 'S3', title: 'Choose your fit', dur: 20, env: () => ({ lamp: 0.9 }),
    draw(t) {
      const cols = [280, 440, 600, 760], gx = 985;
      const rows = [['Freelance work', [4, 3, 1, 3]], ['Digital products', [3, 4, 1, 3]], ['Affiliate content', [2, 4, 1, 4]], ['Local services', [3, 3, 2, 5]], ['Print on demand', [2, 3, 4, 3]]];
      const you = [4, 3, 1, 3];
      let c = txt(24, 56, 'Asks of you (1 to 5)', 24, '#5a5340', { sans: true, op: pr(t, 0.4, 1) });
      ['Skill', 'Time', 'Cash', 'Temperament'].forEach((h, i) => { c += txt(cols[i] + 60, 56, h, 30, INK, { a: 'middle', w: 700, op: pr(t, 0.8, 1.5) }); });
      c += txt(gx + 20, 56, 'Gaps', 30, INK, { a: 'middle', w: 700, op: pr(t, 0.8, 1.5) });
      const dots = (x, y, n, col, t0) => { let s = ''; for (let i = 0; i < 5; i++) { const on = i < n; const p = pr(t, t0 + i * 0.07, t0 + i * 0.07 + 0.25); s += `<circle cx="${x + i * 30}" cy="${y}" r="11" fill="${on ? col : 'none'}" stroke="${on ? col : '#cbbf9c'}" stroke-width="2.5" opacity="${on ? p : pr(t, t0 - 0.3, t0)}"/>`; } return s; };
      const py = pr(t, 1.6, 2.2);
      c += `<rect x="10" y="84" width="1080" height="64" rx="10" fill="${TEAL}" opacity="${0.18 * py}" stroke="${TEAL}" stroke-width="3"/>` + txt(24, 126, 'Your profile', 26, INK, { w: 700, op: py });
      you.forEach((v, i) => { c += dots(cols[i] + 10, 116, v, TEAL, 2); });
      rows.forEach(([name, dem], r) => {
        const y = 215 + r * 76, ts = 3.6 + r * 1.9;
        const rp = pr(t, ts - 0.4, ts);
        c += txt(24, y + 10, name, 30, INK, { op: rp });
        let gaps = 0;
        dem.forEach((d, i) => { const over = d > you[i]; gaps += over; c += dots(cols[i] + 10, y, d, over ? RED : '#b8901f', ts + i * 0.28); });
        const gp = pr(t, ts + 1.3, ts + 1.7);
        c += txt(gx + 20, y + 14, String(gaps), 44, gaps === 0 ? '#2f7a3a' : gaps > 1 ? RED : '#8a6a10', { a: 'middle', w: 700, op: gp });
      });
      const hl = pr(t, 15, 15.8);
      c += `<rect x="10" y="${215 - 38}" width="1080" height="72" rx="12" fill="none" stroke="#b8901f" stroke-width="7" opacity="${hl}"/>`;
      c += `<circle cx="40" cy="${215 + 5 * 76 - 16}" r="11" fill="#b8901f"/>` + txt(60, 215 + 5 * 76 - 6, 'Within what you have', 24, '#5a5340', { sans: true, op: pr(t, 3, 4) }) + `<circle cx="330" cy="${215 + 5 * 76 - 16}" r="11" fill="${RED}"/>` + txt(350, 215 + 5 * 76 - 6, 'More than you have today (a gap)', 24, '#5a5340', { sans: true, op: pr(t, 3, 4) });
      let g = paper(410, 26, 1110, 600, -0.4, c);
      g += book(1640, 840, 1, 0, 0.7);
      g += wren(330, t);
      const hats = [[TEAL, 'Freelance'], ['#c2493d', 'Maker'], ['#d4a937', 'Recommend'], ['#4a6fa5', 'Local'], ['#7a5a8a', 'Seller']];
      hats.forEach(([col, nm], i) => {
        let hx = 760 + i * 150, hy = 805;
        const lift = i === 0 ? eio(pr(t, 15.8, 18)) : 0;
        if (i === 0) { hx = lerp(hx, 330, lift); hy = lerp(hy, 515 + Math.sin(t * 2) * 3, lift); }
        const hp = pr(t, 1 + i * 0.3, 1.6 + i * 0.3);
        g += `<g transform="translate(${n1(hx)} ${n1(hy)})" opacity="${hp}"><ellipse cy="14" rx="50" ry="10" fill="${col}"/><path d="M-32 14Q-30-34 0-34T32 14z" fill="${col}"/>${i === 0 && lift < 0.1 ? '' : ''}</g>`;
        if (lift < 0.9) g += txt(hx, hy + 52, nm, 22, PAPER, { a: 'middle', sans: true, w: 600, op: hp });
      });
      return g;
    } });

  // S4 one one ninety
  scenes.push({ id: 'S4', title: 'One · one · ninety', dur: 18, env: (t) => ({ lamp: 0.9, focus: eio(pr(t, 6.5, 9)) * 0.9 }),
    draw(t) {
      const names = ['Dropship', 'Newsletter', 'Channel', 'Course'];
      const dimL = 1 - 0.6 * pr(t, 6.5, 8);
      let c = `<g opacity="${dimL}">` + txt(30, 56, 'Scattered', 36, RED, { w: 700, op: pr(t, 0.3, 1) });
      const mp = eo(pr(t, 0.6, 1.4));
      c += `<circle cx="300" cy="${n1(lerp(-40, 130, mp))}" r="34" fill="${TEAL}"/>` + txt(300, n1(lerp(-40, 130, mp)) + 8, 'You', 24, '#fff', { a: 'middle', w: 700, sans: true });
      names.forEach((n, i) => {
        const bx = 30 + i * 150, ap = pr(t, 1.6 + i * 0.35, 2.4 + i * 0.35), dp = pr(t, 3.6 + i * 0.4, 4.2 + i * 0.4);
        c += `<path d="M300 164C300 230 ${bx + 60} 210 ${bx + 60} 290" fill="none" stroke="${INK}" stroke-width="4" pathLength="1" stroke-dasharray="${n1(ap * 100) / 100} 1" ${ap > 0.98 ? 'marker-end="url(#ah)"' : ''}/>`;
        c += `<g opacity="${ap}"><rect x="${bx}" y="296" width="124" height="64" rx="8" fill="none" stroke="${RED}" stroke-width="4"/>${txt(bx + 62, 336, n, 24, INK, { a: 'middle', w: 600 })}</g>`;
        c += txt(bx + 62, 408, '↺ day 0', 26, RED, { a: 'middle', sans: true, w: 600, op: dp });
      });
      c += txt(300, 480, 'Four starts, none reaching the bend', 24, '#5a5340', { a: 'middle', sans: true, op: pr(t, 5, 6) }) + '</g>';
      c += `<path d="M640 60V500" stroke="#cbbf9c" stroke-width="3" stroke-dasharray="10 10" opacity="${pr(t, 6, 7)}"/>`;
      const rp = pr(t, 7, 8);
      c += txt(670, 56, 'One · one · ninety', 36, '#8a6a10', { w: 700, op: rp });
      c += `<circle cx="950" cy="130" r="34" fill="${TEAL}" opacity="${rp}"/>` + txt(950, 138, 'You', 24, '#fff', { a: 'middle', w: 700, sans: true, op: rp });
      const bp = eo(pr(t, 8, 9));
      c += `<g opacity="${bp}"><path d="M950 164V200" stroke="${INK}" stroke-width="4" marker-end="url(#ah)"/><rect x="790" y="204" width="320" height="70" rx="10" fill="none" stroke="#b8901f" stroke-width="5"/>${txt(950, 249, '1 business · 1 channel', 30, INK, { a: 'middle', w: 700 })}</g>`;
      const D = (d) => 700 + 520 * d / 90, ty0 = 390;
      const lp = pr(t, 9.5, 14.5);
      c += `<rect x="${D(0)}" y="${ty0 - 34}" width="${(D(55) - D(0)) * lp}" height="68" fill="${INK}" opacity=".08"/>`;
      c += `<path d="M${D(0)} ${ty0}H${n1(D(0) + 520 * lp)}" stroke="#b8901f" stroke-width="7" stroke-linecap="round"/>`;
      [1, 30, 60, 90].forEach((d) => { if (lp >= d / 90) c += `<path d="M${D(d)} ${ty0 - 10}V${ty0 + 10}" stroke="${INK}" stroke-width="4"/>` + txt(D(d), ty0 + 48, 'Day ' + d, 24, '#5a5340', { a: 'middle', sans: true }); });
      if (lp > 0.2) c += txt(D(28), ty0 - 50, 'Flat zone: keep going', 24, '#5a5340', { a: 'middle', sans: true });
      const rv = pr(t, 14.6, 15.4);
      c += txt(D(90), ty0 - 50, 'Review', 28, '#8a6a10', { a: 'middle', w: 700, op: rv });
      c += txt(950, 490, 'Change course only if the data says so', 24, '#5a5340', { a: 'middle', sans: true, op: pr(t, 15.5, 16.5) });
      let g = paper(330, 36, 1260, 530, -0.4, c);
      g += book(1640, 840, 1, 0, 0.7) + wren(330, t);
      // lit path on desk: a golden thread
      const tp = pr(t, 9, 14);
      g += `<path d="M560 860C760 800 900 900 1100 840S1380 800 1440 830" fill="none" stroke="${GOLD}" stroke-width="8" stroke-linecap="round" pathLength="1" stroke-dasharray="${n1(tp * 100) / 100} 1" opacity=".9"/>`;
      return g;
    } });

  // S5 loop
  scenes.push({ id: 'S5', title: 'The weekly loop', dur: 20, env: (t) => ({ lamp: 1, dawn: 0.9 * eio(pr(t, 0, 20)) }),
    draw(t) {
      const cx = 320, cy = 300, r = 170;
      const pos = (a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
      const nodes = [['Ship', -90], ['Measure', 30], ['Fix', 150]];
      const lead = pr(t, 1, 2.2);
      let c = txt(cx, 54, 'Ship · Measure · Fix', 32, INK, { a: 'middle', w: 700, op: lead });
      [[-90 + 24, 30 - 24, 'publish the minimum', 650, 112, 'end'], [30 + 24, 150 - 24, 'read one number', 320, 540, 'middle'], [150 + 24, 270 - 24, 'change one thing', 30, 118, 'start']].forEach(([a0, a1, lab, lx, ly, an], i) => {
        const ap = pr(t, 1.8 + i * 0.7, 3 + i * 0.7);
        const [x0, y0] = pos(a0), [x1, y1] = pos(a1);
        c += `<path d="M${n1(x0)} ${n1(y0)}A${r} ${r} 0 0 1 ${n1(x1)} ${n1(y1)}" fill="none" stroke="${INK}" stroke-width="6" pathLength="1" stroke-dasharray="${n1(ap * 100) / 100} 1" ${ap > 0.97 ? 'marker-end="url(#ah)"' : ''}/>`;
        c += txt(lx, ly, lab, 24, '#5a5340', { a: an, sans: true, op: ap });
      });
      const turn = pr(t, 4, 14), ang = -90 + 360 * 3 * turn;
      nodes.forEach(([n, a], i) => {
        const [x, y] = pos(a); const d = Math.abs((((ang - a) % 360) + 540) % 360 - 180); const near = turn > 0 && turn < 1 ? Math.max(0, 1 - Math.abs(180 - d) / 40) : 0;
        const np = eo(pr(t, 1.4 + i * 0.4, 2.2 + i * 0.4));
        c += `<g transform="translate(${n1(x)} ${n1(y)}) scale(${n1(np * (1 + near * 0.18) * 100) / 100})"><circle r="56" fill="${near > 0.3 ? '#e6b93f' : GOLD}" stroke="${GOLDD}" stroke-width="5"/>${txt(0, 9, n, 26, INK, { a: 'middle', w: 700 })}</g>`;
      });
      if (turn > 0 && turn < 1) { const [bx, by] = pos(ang + 20); c += `<circle cx="${n1(bx)}" cy="${n1(by)}" r="12" fill="${RED}"/>`; }
      c += txt(cx, cy - 4, 'Every', 26, '#5a5340', { a: 'middle', sans: true }) + txt(cx, cy + 34, 'Friday', 40, '#8a6a10', { a: 'middle', w: 700 });
      let g = paper(340, 30, 680, 600, -0.5, c);
      const items = [['1. What moved', 'two replies, one video took off'], ['2. What did not', 'posting time, the thumbnail'], ['3. One change', 'shorten the first five seconds']];
      let rv = txt(30, 62, 'Friday review · 15 minutes', 34, INK, { w: 700, op: pr(t, 9, 10) });
      items.forEach(([h, a], i) => {
        const t0 = 10 + i * 2.6;
        rv += txt(30, 140 + i * 120, h, 30, INK, { w: 700, op: pr(t, t0, t0 + 0.5) }) + `<path d="M30 ${176 + i * 120}H470" stroke="#cbbf9c" stroke-width="3"/>` + txt(30, 166 + i * 120, ty('e.g. ' + a, pr(t, t0 + 0.4, t0 + 2)), 26, '#5a5340', { sans: true });
      });
      g += paper(1060, 70, 500, 470, 1.2, rv, pr(t, 8.8, 9.6));
      g += book(960, 840, 1, 0, 1) + wren(330 - 160 + 160, t);
      return g;
    } });

  // S6 close
  scenes.push({ id: 'S6', title: 'Close', dur: 14, env: () => ({ lamp: 1, dawn: 1 }),
    draw(t) {
      const open = 1 - eo(pr(t, 1, 3));
      let g = book(960, 820, open, pr(t, 3.2, 4));
      g += wren(330, t);
      g += slot(600, 80, 560, 320, -1.5, 'R20', 'Vibloid review screen, Approve button', 0.6, t);
      const np = pr(t, 5.2, 6.3);
      if (np > 0) { const yo = (1 - bounce(np)) * -520; g += paper(1230, 330 + yo, 460, 220, 3, txt(230, 90, 'NEXT ENTRY', 46, INK, { a: 'middle', w: 700 }) + txt(230, 148, 'Choosing your first business', 30, TEAL, { a: 'middle', w: 600 })); }
      g += txt(960, 1000, ty('Education only. Not financial advice.', pr(t, 8, 11)), 44, GOLD, { a: 'middle', i: true });
      return g;
    } });

  function svg(i, t) {
    const s = scenes[i];
    const e = Object.assign({ lamp: 1, grey: 0, dawn: 0, focus: 0 }, s.env(t));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${room(e)}${e.focus ? `<rect width="${W}" height="${H}" fill="url(#spot)" opacity="${e.focus}"/>` : ''}${s.draw(t)}${overlays(e)}</svg>`;
  }
  window.STUDIO = { scenes, svg, W, H };
})();
