/* ─────────────────────────────────────────────
   소리를 그리는 글자 — main.js
   ───────────────────────────────────────────── */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const hasAnim = !!(G && ST);
  if (hasAnim) G.registerPlugin(ST);
  else document.documentElement.classList.add('no-anim');

  /* ── Hangul ── */
  const CHO = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
  const JUNG = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
  const JONG = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
  const compose = (c, j, t = 0) => String.fromCharCode(0xAC00 + (c * 21 + j) * 28 + t);
  const randSyl = () => String.fromCharCode(0xAC00 + Math.floor(Math.random() * 11172));

  /* ── text splitting ── */
  function splitChars(el) {
    const out = [];
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          if (!n.textContent.trim()) { n.remove(); return; }
          const frag = document.createDocumentFragment();
          [...n.textContent.replace(/\s+/g, ' ')].forEach(c => {
            const s = document.createElement('span');
            s.className = 'ch';
            const i = document.createElement('span');
            i.className = 'ch-in';
            i.textContent = c === ' ' ? ' ' : c;
            s.appendChild(i);
            frag.appendChild(s);
            out.push(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return out;
  }

  function splitWords(el) {
    const out = [];
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span');
          s.className = 'w';
          s.textContent = p;
          frag.appendChild(s);
          out.push(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) {
        n.classList.add('w');
        out.push(n);
      }
    });
    return out;
  }

  function scramble(el, final, frames = 12, speed = 40) {
    return new Promise(res => {
      let f = 0;
      const id = setInterval(() => {
        f++;
        el.textContent = [...final].map((c, i) => (f > frames - (final.length - i) * 2 ? c : randSyl())).join('');
        if (f >= frames) { clearInterval(id); el.textContent = final; res(); }
      }, speed);
    });
  }

  /* ── pointer & scroll state ── */
  let mx = innerWidth / 2, my = innerHeight / 2, lastMove = -1e9;
  let vel = 0, lastY = scrollY, scrollDir = 1;
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; lastMove = performance.now(); }, { passive: true });

  /* ── Lenis smooth scroll ── */
  let lenis = null;
  if (window.Lenis && hasAnim && !reduce) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add(t => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
    lenis.stop();
  }

  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = $(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { duration: 1.8, easing: x => 1 - Math.pow(1 - x, 4) });
    else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ── clock ── */
  const clock = $('#clock');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tickClock = () => { clock.textContent = fmt.format(new Date()); };
  tickClock(); setInterval(tickClock, 1000);

  /* ── D-day to 한글날 (Oct 9) ── */
  (() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let target = new Date(now.getFullYear(), 9, 9);
    if (target < today) target = new Date(now.getFullYear() + 1, 9, 9);
    const d = Math.round((target - today) / 86400000);
    $('#dday').textContent = d === 0 ? '오늘은 한글날입니다 ✳' : `한글날까지 D-${d}`;
  })();

  /* ── cursor ── */
  const cur = $('.cursor'), curLabel = $('.cursor-label');
  let cx = mx, cy = my;
  if (fine) {
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor], a, button, input, [contenteditable]');
      cur.classList.toggle('is-hover', !!t);
      curLabel.textContent = t ? (t.dataset.cursor || '') : '';
    });
    addEventListener('pointerdown', () => cur.classList.add('is-down'));
    addEventListener('pointerup', () => cur.classList.remove('is-down'));
  }

  /* ─────────────── HERO ─────────────── */
  const heroChars = splitChars($('#heroTitle'));
  const heroW = heroChars.map(() => 200);
  let heroReady = false;

  function heroTick(t) {
    if (!heroReady || scrollY > innerHeight * 1.1) return;
    const idle = !fine || performance.now() - lastMove > 2600;
    const rects = idle ? null : heroChars.map(c => c.getBoundingClientRect());
    const reach = Math.max(260, innerWidth * 0.3);
    heroChars.forEach((c, i) => {
      let target;
      if (idle) target = 480 + 380 * Math.sin(t / 650 - i * 0.55);
      else {
        const r = rects[i];
        const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
        target = 900 - clamp(d / reach, 0, 1) * 800;
      }
      heroW[i] = lerp(heroW[i], target, 0.12);
    });
    heroChars.forEach((c, i) => { c.style.fontWeight = Math.round(heroW[i]); });
  }

  function heroIn() {
    const tl = G.timeline({ onStart() { heroReady = true; } });
    tl.from(heroChars.map(c => c.firstChild), { yPercent: 118, rotate: 8, duration: 1.6, ease: 'expo.out', stagger: 0.05 })
      .from('.hero-meta > *, .hero-foot > *, .hero-vert, .nav', { opacity: 0, y: 24, duration: 1.1, ease: 'power3.out', stagger: 0.06 }, 0.35);
    return tl;
  }

  /* ─────────────── INTRO ─────────────── */
  async function intro() {
    const introEl = $('#intro'), comp = $('#compose'), keysEl = $('#introKeys');
    const counter = $('#counter'), bar = $('#introBar');
    const steps = [['ㅎ', 'ㅎ'], ['ㅏ', '하'], ['ㄴ', '한'], ['ㄱ', '한ㄱ'], ['ㅡ', '한그'], ['ㄹ', '한글']];
    const keys = steps.map(([k]) => {
      const s = document.createElement('span');
      s.className = 'k'; s.textContent = k; keysEl.appendChild(s);
      return s;
    });

    const done = () => {
      introEl.remove();
      document.body.classList.remove('is-loading');
      lenis && lenis.start();
      ST.refresh();
    };

    if (reduce) {
      done();
      heroIn().progress(1);
      $('.wipe').remove();
      return;
    }

    await Promise.race([
      Promise.all([
        document.fonts.load('100 100px "Noto Sans KR"', '한글ㅎㅏㄴㄱㅡㄹ소리를그리는글자'),
        document.fonts.load('900 100px "Noto Sans KR"', '한글'),
      ]).catch(() => {}),
      wait(2500),
    ]);

    const tl = G.timeline();
    const cnt = { v: 0 };
    tl.to(cnt, {
      v: 100, duration: 4.1, ease: 'power2.inOut',
      onUpdate() {
        counter.textContent = String(Math.round(cnt.v)).padStart(3, '0');
        bar.style.transform = `scaleX(${cnt.v / 100})`;
      },
    }, 0);
    tl.from(keys, { opacity: 0, y: 12, duration: .6, stagger: .04, ease: 'power3.out' }, 0);
    steps.forEach(([, s], i) => tl.call(() => { comp.textContent = s; keys[i].classList.add('on'); }, null, 0.35 + i * 0.34));

    const w = { v: 100, ls: 0.02 };
    tl.call(() => { $('.caret').style.display = 'none'; }, null, 2.45)
      .to(w, {
        v: 900, ls: -0.07, duration: 1.1, ease: 'expo.inOut',
        onUpdate() { comp.style.fontWeight = Math.round(w.v); comp.parentNode.style.letterSpacing = w.ls + 'em'; },
      }, 2.45)
      .to(keys, { opacity: 0, y: -10, duration: .5, stagger: .03 }, 2.6)
      .call(() => scramble(comp, '한글', 14, 38), null, 3.55)
      .to('.wipe', { clipPath: 'inset(0% 0 0 0)', duration: .85, ease: 'expo.inOut' }, 4.25)
      .call(done, null, 5.1)
      .to('.wipe', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, 5.15)
      .add(heroIn(), 5.25)
      .call(() => $('.wipe').remove());

    introEl.addEventListener('click', () => tl.timeScale(4), { once: true });
  }

  /* ─────────────── SCROLL ANIMATIONS ─────────────── */
  function scrollAnims() {
    // split titles
    $$('[data-split]').forEach(el => {
      const chs = splitChars(el).map(c => c.firstChild);
      G.from(chs, { yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: 0.035, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });

    // section heads
    $$('.sec-head').forEach(el => {
      G.from(el.children, { opacity: 0, y: 14, duration: .9, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: el, start: 'top 90%' } });
    });

    // manifesto word reveal
    const words = splitWords($('#manifesto'));
    G.to(words, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: '#manifesto', start: 'top 78%', end: 'bottom 45%', scrub: 0.6 },
    });
    G.from('.preface-foot > *', { opacity: 0, y: 30, duration: 1, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.preface-foot', start: 'top 90%' } });

    // numbers
    $$('.num-v').forEach(el => {
      const end = +el.dataset.count, plain = el.hasAttribute('data-plain');
      const o = { v: 0 };
      G.to(o, {
        v: end, duration: 2.2, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
        onUpdate() { const v = Math.round(o.v); el.textContent = plain ? v : v.toLocaleString('en-US'); },
      });
    });
    G.from('.num', { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.num-grid', start: 'top 85%' } });

    cjiAnim();
    consonantsAnim();

    // composer / field entrance
    G.from('.comp-display, .picker, #compRandom', { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.comp-grid', start: 'top 80%' } });

    // footer giant
    G.from('#footGiant', { yPercent: 40, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '#foot', start: 'top 70%' } });
  }

  /* 천지인 */
  function cjiAnim() {
    const dot = $('.cj-dot'), h = $('.cj-h'), v = $('.cj-v');
    const glyph = $('#cjiGlyph'), desc = $('#cjiDesc'), steps = $$('#cjiSteps span');
    const STATES = [
      ['ㆍㅡㅣ', '점(ㆍ)은 둥근 하늘, 누운 선(ㅡ)은 평평한 땅, 선 선(ㅣ)은 서 있는 사람.'],
      ['ㅏ', '사람(ㅣ)의 바깥쪽에 하늘을 찍으면 — ㅏ. 해가 뜨는 쪽의 밝은 소리.'],
      ['ㅓ', '안쪽으로 옮기면 — ㅓ. 같은 두 원소, 정반대의 어두운 소리.'],
      ['ㅗ', '땅(ㅡ) 위로 하늘이 떠오르면 — ㅗ.'],
      ['ㅜ', '땅 아래로 내려앉으면 — ㅜ. 세 개의 원소로 모든 모음이 태어난다.'],
    ];
    G.set([dot, h, v], { xPercent: -50, yPercent: -50 });
    let cur = 0;
    const setState = i => {
      if (i === cur) return;
      cur = i;
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      G.fromTo(glyph, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .6, ease: 'expo.out', overwrite: true });
      glyph.textContent = STATES[i][0];
      desc.textContent = STATES[i][1];
    };

    const tl = G.timeline({
      defaults: { ease: 'power3.inOut', duration: 1 },
      scrollTrigger: { trigger: '#cji', start: 'top top', end: '+=380%', pin: true, scrub: 0.8 },
      onUpdate() {
        const t = this.time();
        setState(t < 1 ? 0 : Math.min(4, 1 + Math.floor((t - 1) / 1.5)));
      },
    });
    tl.to({}, { duration: 0.5 })
      // ㅏ
      .to(v, { left: '42%', width: '8%', height: '76%' }, 0.5)
      .to(dot, { left: '64%' }, 0.5)
      .to(h, { width: '0%', opacity: 0 }, 0.5)
      .to('.cj-tag', { opacity: 0, duration: .4 }, 0.5)
      // ㅓ
      .to(dot, { left: '20%' }, 2)
      .to(v, { left: '58%' }, 2)
      // ㅗ
      .to(v, { height: '0%', opacity: 0 }, 3.5)
      .to(h, { left: '50%', top: '64%', width: '76%', height: '8%', opacity: 1 }, 3.5)
      .to(dot, { left: '50%', top: '38%' }, 3.5)
      // ㅜ
      .to(h, { top: '38%' }, 5)
      .to(dot, { top: '64%' }, 5)
      .to({}, { duration: 0.5 });
  }

  /* 닿소리 horizontal */
  const CONS = [
    ['ㄱ', '기역', 'g / k', '어금닛소리', '혀뿌리가 목구멍을 막는 모양', true],
    ['ㄴ', '니은', 'n', '혓소리', '혀끝이 윗잇몸에 닿는 모양', true],
    ['ㄷ', '디귿', 'd / t', '혓소리', 'ㄴ에 획 하나를 더했다', false],
    ['ㄹ', '리을', 'r / l', '반혓소리', '가획의 원리를 벗어난 이체자', false],
    ['ㅁ', '미음', 'm', '입술소리', '다문 입의 모양', true],
    ['ㅂ', '비읍', 'b / p', '입술소리', 'ㅁ에 획을 더했다', false],
    ['ㅅ', '시옷', 's', '잇소리', '이의 모양', true],
    ['ㅇ', '이응', '— / ng', '목구멍소리', '둥근 목구멍의 모양', true],
    ['ㅈ', '지읒', 'j', '잇소리', 'ㅅ에 획을 더했다', false],
    ['ㅊ', '치읓', 'ch', '잇소리', 'ㅈ에 획을 더해 거세졌다', false],
    ['ㅋ', '키읔', 'k', '어금닛소리', 'ㄱ에 획을 더해 거세졌다', false],
    ['ㅌ', '티읕', 't', '혓소리', 'ㄷ에 획을 더해 거세졌다', false],
    ['ㅍ', '피읖', 'p', '입술소리', 'ㅂ에 획을 더해 거세졌다', false],
    ['ㅎ', '히읗', 'h', '목구멍소리', 'ㅇ에 획을 더했다', false],
  ];
  const track = $('#hsTrack');
  CONS.forEach(([g, name, rom, place, note, basic], i) => {
    const a = document.createElement('article');
    a.className = 'card' + (i % 2 ? ' serif' : '') + (basic ? ' basic' : '');
    a.dataset.big = g;
    a.dataset.cursor = name;
    a.innerHTML = `
      <div class="card-top mono"><span>${String(i + 1).padStart(2, '0')} / 14</span><span>${rom}</span></div>
      <div class="card-glyph">${g}</div>
      <div class="card-bot"><h3>${name}</h3><p>${note}</p><span class="tag mono">${basic ? '기본자' : '가획 · 이체'} — ${place}</span></div>`;
    track.appendChild(a);
  });
  const cardGlyphs = $$('.card-glyph', track);

  function updateCardGlyphs() {
    const W = innerWidth;
    const rects = cardGlyphs.map(g => g.getBoundingClientRect());
    cardGlyphs.forEach((g, i) => {
      const r = rects[i];
      const d = clamp(Math.abs(r.left + r.width / 2 - W / 2) / (W * 0.55), 0, 1);
      g.style.fontWeight = Math.round(900 - d * 800);
      g.style.transform = `scale(${1.08 - d * 0.16})`;
    });
  }

  function consonantsAnim() {
    const bar = $('#hsBar');
    const dist = () => track.scrollWidth - innerWidth;
    G.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '#consonants', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
      },
      onUpdate() { bar.style.transform = `scaleX(${this.progress()})`; updateCardGlyphs(); },
    });
    updateCardGlyphs();
  }

  /* ─────────────── PARTICLES ─────────────── */
  const pc = $('#pcanvas'), pctx = pc.getContext('2d');
  const WORDS = [
    { t: '훈민정음', f: '"Noto Sans KR"' },
    { t: '訓民正音', f: '"Noto Serif KR"' },
    { t: '한글', f: '"Noto Sans KR"' },
    { t: 'ㄱㄴㅁㅅㅇ', f: '"Noto Serif KR"' },
  ];
  let P = [], pW = 0, pH = 0, pDpr = 1, pStep = 5, pWord = 0, pVisible = false, pLastSwap = 0;
  const pMouse = { x: -1e4, y: -1e4 };

  function pTargets(word) {
    const off = document.createElement('canvas');
    off.width = pW; off.height = pH;
    const o = off.getContext('2d');
    let fs = pH * 0.4;
    o.font = `900 ${fs}px ${word.f}`;
    const mw = o.measureText(word.t).width;
    if (mw > pW * 0.86) { fs *= (pW * 0.86) / mw; o.font = `900 ${fs}px ${word.f}`; }
    o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle';
    o.fillText(word.t, pW / 2, pH / 2);
    const data = o.getImageData(0, 0, pW, pH).data;
    pStep = Math.max(4, Math.round(Math.min(pW, 1600) / 230));
    const pts = [];
    for (let y = 0; y < pH; y += pStep) for (let x = 0; x < pW; x += pStep) if (data[(y * pW + x) * 4 + 3] > 130) pts.push([x, y]);
    for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
    return pts;
  }

  function pSetWord(i) {
    pWord = (i + WORDS.length) % WORDS.length;
    $('#pWord').textContent = `${pWord + 1} / ${WORDS.length}`;
    if (!pW || !pH) return;
    const pts = pTargets(WORDS[pWord]);
    while (P.length < pts.length) {
      P.push({ x: Math.random() * pW, y: Math.random() * pH, vx: 0, vy: 0, tx: 0, ty: 0, red: Math.random() < 0.07, k: 0.035 + Math.random() * 0.04 });
    }
    P.length = pts.length;
    P.forEach((p, k) => { p.tx = pts[k][0]; p.ty = pts[k][1]; });
    pLastSwap = performance.now();
  }

  function pResize() {
    pDpr = Math.min(devicePixelRatio || 1, 2);
    pW = pc.clientWidth; pH = pc.clientHeight;
    pc.width = pW * pDpr; pc.height = pH * pDpr;
    pctx.setTransform(pDpr, 0, 0, pDpr, 0, 0);
    pSetWord(pWord);
  }

  function pExplode() {
    P.forEach(p => {
      const a = Math.random() * Math.PI * 2, s = 10 + Math.random() * 30;
      p.vx += Math.cos(a) * s; p.vy += Math.sin(a) * s;
    });
  }

  function pTick(now) {
    if (!pVisible) return;
    if (pc.clientWidth !== pW || pc.clientHeight !== pH) pResize();
    const r = pc.getBoundingClientRect();
    pMouse.x = mx - r.left; pMouse.y = my - r.top;
    if (now - pLastSwap > 6500) { pExplode(); pSetWord(pWord + 1); }
    pctx.clearRect(0, 0, pW, pH);
    const R = Math.max(90, pW * 0.09), R2 = R * R;
    const s = Math.max(2, pStep * 0.62);
    pctx.fillStyle = '#efe8dc';
    const reds = [];
    for (const p of P) {
      const dx = p.x - pMouse.x, dy = p.y - pMouse.y, d2 = dx * dx + dy * dy;
      if (d2 < R2) {
        const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 5;
        p.vx += (dx / d) * f; p.vy += (dy / d) * f;
      }
      p.vx = (p.vx + (p.tx - p.x) * p.k) * 0.84;
      p.vy = (p.vy + (p.ty - p.y) * p.k) * 0.84;
      p.x += p.vx; p.y += p.vy;
      if (p.red) reds.push(p); else pctx.fillRect(p.x, p.y, s, s);
    }
    pctx.fillStyle = '#ff3d24';
    for (const p of reds) pctx.fillRect(p.x, p.y, s, s);
  }

  pc.parentNode.addEventListener('click', () => { pExplode(); setTimeout(() => pSetWord(pWord + 1), 220); });
  new IntersectionObserver(([e]) => { pVisible = e.isIntersecting; if (pVisible) pLastSwap = performance.now(); }).observe(pc);
  Promise.race([
    Promise.all(WORDS.map(w => document.fonts.load(`900 100px ${w.f}`, w.t))).catch(() => {}),
    wait(3000),
  ]).then(pResize);

  /* ─────────────── COMPOSER ─────────────── */
  const compSec = $('#compose-sec');
  const cGlyph = $('#compGlyph'), cFormula = $('#compFormula'), cCode = $('#compCode'), cIndex = $('#compIndex');
  const state = { c: 18, j: 0, t: 4 };
  const pickers = { c: $('#pickCho'), j: $('#pickJung'), t: $('#pickJong') };
  [[pickers.c, CHO, 'c'], [pickers.j, JUNG, 'j'], [pickers.t, JONG, 't']].forEach(([el, arr, key]) => {
    arr.forEach((ch, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pk'; b.textContent = ch || '∅';
      b.setAttribute('aria-label', ch || '받침 없음');
      b.addEventListener('click', () => { state[key] = i; renderComp(true); });
      el.appendChild(b);
    });
  });

  function renderComp(anim) {
    const s = compose(state.c, state.j, state.t);
    const code = s.charCodeAt(0);
    cGlyph.textContent = s;
    cFormula.textContent = `${CHO[state.c]} + ${JUNG[state.j]}${JONG[state.t] ? ' + ' + JONG[state.t] : ''} = ${s}`;
    cCode.textContent = 'U+' + code.toString(16).toUpperCase();
    cIndex.textContent = `#${(code - 0xAC00 + 1).toLocaleString('en-US')} / 11,172`;
    Object.entries(pickers).forEach(([k, el]) => [...el.children].forEach((b, i) => b.classList.toggle('on', i === state[k])));
    if (anim && hasAnim && !reduce) {
      G.fromTo(cGlyph, { scale: 0.82, opacity: 0.2, fontWeight: 100 }, { scale: 1, opacity: 1, fontWeight: 800, duration: 0.8, ease: 'expo.out', overwrite: true });
    }
  }
  renderComp(false);

  $('#compRandom').addEventListener('click', () => {
    let n = 0;
    const id = setInterval(() => {
      state.c = (Math.random() * 19) | 0; state.j = (Math.random() * 21) | 0; state.t = (Math.random() * 28) | 0;
      renderComp(false);
      if (++n > 9) { clearInterval(id); renderComp(true); }
    }, 45);
  });

  // type tester
  const tText = $('#tText'), tW = $('#tW'), tS = $('#tS');
  const applyTester = () => {
    const size = Math.min(+tS.value, innerWidth * 0.16 + 20);
    tText.style.fontWeight = tW.value; tText.style.fontSize = size + 'px';
    $('#tWo').textContent = tW.value; $('#tSo').textContent = tS.value;
  };
  tW.addEventListener('input', applyTester); tS.addEventListener('input', applyTester);
  $$('.seg button').forEach(b => b.addEventListener('click', () => {
    $$('.seg button').forEach(x => x.classList.toggle('on', x === b));
    compSec.classList.toggle('is-serif', b.dataset.fam === 'serif');
  }));
  applyTester();

  /* ─────────────── FIELD ─────────────── */
  const grid = $('#fieldGrid'), seenN = $('#seenN'), seenBar = $('#seenBar');
  let cells = [], cols = 0;
  const seen = new Set(), anim = new Map();

  function buildField() {
    const w = grid.clientWidth;
    const size = w < 700 ? 46 : 70;
    cols = Math.max(6, Math.floor(w / size));
    const rows = w < 700 ? 10 : 7;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.innerHTML = '';
    anim.clear();
    cells = [];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < cols * rows; i++) {
      const s = document.createElement('span');
      s.className = 'fc'; s.textContent = randSyl(); s.dataset.i = i;
      frag.appendChild(s); cells.push(s);
    }
    grid.appendChild(frag);
  }
  const hit = (cell, delay = 0) => { if (!anim.has(cell)) anim.set(cell, { at: performance.now() + delay, n: 7 + ((Math.random() * 6) | 0), last: 0 }); };

  function fieldTick(now) {
    if (!anim.size) return;
    for (const [cell, a] of anim) {
      if (now < a.at || now - a.last < 42) continue;
      a.last = now;
      cell.textContent = randSyl();
      cell.classList.add('hot');
      if (--a.n <= 0) {
        anim.delete(cell);
        cell.classList.remove('hot');
        cell.classList.add('lit');
        const ch = cell.textContent;
        if (!seen.has(ch)) {
          seen.add(ch);
          seenN.textContent = seen.size.toLocaleString('en-US');
          seenBar.style.transform = `scaleX(${Math.min(1, seen.size / 11172 * 20)})`;
        }
      }
    }
  }

  grid.addEventListener('pointerover', e => { const c = e.target.closest('.fc'); if (c) hit(c); });
  grid.addEventListener('click', e => {
    const c = e.target.closest('.fc');
    if (!c) return;
    const i = +c.dataset.i, x0 = i % cols, y0 = (i / cols) | 0;
    cells.forEach((cell, j) => hit(cell, Math.hypot((j % cols) - x0, ((j / cols) | 0) - y0) * 55));
  });
  buildField();

  /* ─────────────── MARQUEE ─────────────── */
  const mqs = $$('.mq').map(el => ({ el, inner: $('.mq-inner', el), x: 0, dir: +el.dataset.dir || 1, w: 0, vis: false }));
  const mqMeasure = () => mqs.forEach(m => { m.w = m.inner.scrollWidth / 2; });
  const mqIO = new IntersectionObserver(es => es.forEach(e => { const m = mqs.find(q => q.el === e.target); if (m) m.vis = e.isIntersecting; }));
  mqs.forEach(m => mqIO.observe(m.el));
  document.fonts.ready.then(mqMeasure);
  mqMeasure();

  function mqTick() {
    const skew = clamp(-vel * 0.35, -14, 14);
    mqs.forEach(m => {
      if (!m.vis || !m.w) return;
      const speed = (reduce ? 0.2 : 0.9 + Math.min(Math.abs(vel) * 0.35, 30)) * m.dir * scrollDir;
      m.x -= speed;
      if (m.x <= -m.w) m.x += m.w;
      if (m.x > 0) m.x -= m.w;
      m.inner.style.transform = `translate3d(${m.x}px,0,0) skewX(${reduce ? 0 : skew}deg)`;
    });
  }

  /* ─────────────── FOOTER ─────────────── */
  const footGiant = $('#footGiant'), foot = $('#foot');
  let footW = 900, footTarget = 900;
  foot.addEventListener('pointermove', e => {
    const r = foot.getBoundingClientRect();
    footTarget = 100 + ((e.clientX - r.left) / r.width) * 800;
  });
  foot.addEventListener('pointerleave', () => { footTarget = 900; });

  /* ─────────────── MAIN LOOP ─────────────── */
  const progress = $('#progressBar');
  function loop(t) {
    const y = scrollY;
    const dy = y - lastY;
    if (dy) scrollDir = dy > 0 ? 1 : -1;
    vel = lerp(vel, dy, 0.18);
    lastY = y;

    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    if (fine) {
      cx = lerp(cx, mx, 0.2); cy = lerp(cy, my, 0.2);
      cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
    }
    heroTick(t);
    pTick(t);
    fieldTick(t);
    mqTick();
    if (Math.abs(footW - footTarget) > 1) {
      footW = lerp(footW, footTarget, 0.1);
      footGiant.style.fontWeight = Math.round(footW);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ─────────────── RESIZE ─────────────── */
  let rw = innerWidth, rT;
  addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      pResize(); mqMeasure(); applyTester();
      if (innerWidth !== rw) { rw = innerWidth; buildField(); }
      hasAnim && ST.refresh();
    }, 180);
  });

  /* ─────────────── BOOT ─────────────── */
  if (hasAnim) {
    scrollAnims();
    intro();
    document.fonts.ready.then(() => ST.refresh());
  } else {
    heroReady = true;
    document.body.classList.remove('is-loading');
    $('#intro')?.remove();
    $('.wipe')?.remove();
    $$('.num-v').forEach(el => { const v = +el.dataset.count; el.textContent = el.hasAttribute('data-plain') ? v : v.toLocaleString('en-US'); });
  }
})();
