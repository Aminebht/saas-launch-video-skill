// Style-neutral motion helpers (window.FX). Load once from the root index.html with a
// script tag pointing at lib/fx.js, before any composition script.
// (Never write a closing script tag inside a comment here: HyperFrames inlines this file into
// the page, and that text would end the script early and print the rest on screen.)
// Every helper only adds tweens/sets to the GSAP timeline it is given, so all motion stays
// seekable and deterministic: HyperFrames renders by seeking frame by frame.
window.FX = (function () {
  const EXPO = "expo.out";
  // Punch-in ease: fast start, long soft landing
  const PUNCH = "cubic-bezier(0.16, 1, 0.3, 1)";

  // One span per character (.ch). Elements marked data-unit stay one unit (icons, chips).
  function split(el) {
    const units = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const c of n.textContent) {
            if (c === "\n") continue;
            const s = document.createElement("span");
            s.className = "ch";
            s.textContent = c;
            frag.appendChild(s);
            units.push(s);
          }
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          if (n.hasAttribute("data-unit")) units.push(n);
          else walk(n);
        }
      });
    };
    walk(el);
    return units;
  }

  // One inline-block span per word (.w), for kinetic word reveals. Spaces stay text nodes.
  function splitWords(el) {
    const text = el.textContent;
    el.textContent = "";
    const words = [];
    text.split(/(\s+)/).forEach((w) => {
      if (/^\s+$/.test(w)) el.appendChild(document.createTextNode(w));
      else if (w) {
        const s = document.createElement("span");
        s.className = "w";
        s.style.display = "inline-block";
        s.textContent = w;
        el.appendChild(s);
        words.push(s);
      }
    });
    return words;
  }

  // Offset of `node` relative to `ancestor` in layout space (ignores transforms).
  function offsetIn(node, ancestor) {
    let x = 0, y = 0, n = node;
    while (n && n !== ancestor) {
      x += n.offsetLeft;
      y += n.offsetTop;
      n = n.offsetParent;
    }
    return { x, y };
  }

  // Caret positions per unit. Call while the text is laid out (display != none): hidden
  // elements measure as 0.
  function measure(units, box) {
    return units.map((u) => {
      const o = offsetIn(u, box);
      return { x: o.x, y: o.y, w: u.offsetWidth };
    });
  }

  // Typing with an optional caret (absolutely positioned inside `box`). Pass opts.pos from
  // measure() when the text is hidden at build time.
  function typewriter(tl, units, at, cps, caret, box, opts) {
    opts = opts || {};
    const pos = opts.pos || measure(units, box);
    units.forEach((u) => (u.style.opacity = 0));
    const step = 1 / cps;
    if (caret) tl.set(caret, { x: pos[0].x, y: pos[0].y + (opts.caretDy || 0), opacity: 1 }, at - 0.05);
    units.forEach((u, i) => {
      const t = at + i * step;
      tl.set(u, { opacity: 1 }, t);
      if (caret) tl.set(caret, { x: pos[i].x + pos[i].w + (opts.caretGap || 2), y: pos[i].y + (opts.caretDy || 0) }, t);
    });
    const end = at + units.length * step;
    if (caret && opts.hideCaret !== false) tl.set(caret, { opacity: 0 }, end + (opts.caretHold || 0.3));
    return end;
  }

  // Streaming AI text: words appear at `wps`; the newest are lit in `accent`, then settle.
  function stream(tl, el, at, wps, accent, opts) {
    opts = opts || {};
    const finalColor = opts.color || getComputedStyle(el).color;
    const text = el.textContent;
    el.textContent = "";
    const spans = [];
    text.split(/(\s+)/).forEach((w) => {
      if (/^\s+$/.test(w)) el.appendChild(document.createTextNode(w));
      else if (w) {
        const s = document.createElement("span");
        s.textContent = w;
        s.style.opacity = 0;
        el.appendChild(s);
        spans.push(s);
      }
    });
    spans.forEach((s, i) => {
      const t = at + i / wps;
      tl.fromTo(s, { opacity: 0, color: accent }, { opacity: 1, duration: 0.08, ease: "none" }, t);
      tl.to(s, { color: finalColor, duration: 0.4, ease: "power1.out" }, t + 0.12);
    });
    return at + spans.length / wps;
  }

  // Directional motion-blur whip. feBlur is an <feGaussianBlur> inside the SVG filter that
  // `el` uses; stdDeviation "44 0" smears horizontally.
  function whipIn(tl, el, at, fromX, feBlur) {
    const d = 4 / 30;
    tl.set(el, { filter: "url(#" + feBlur.parentNode.id + ")" }, at);
    tl.fromTo(el, { x: fromX, opacity: 0.4 }, { x: 0, opacity: 1, duration: d, ease: EXPO }, at);
    tl.fromTo(feBlur, { attr: { stdDeviation: "44 0" } }, { attr: { stdDeviation: "0 0" }, duration: d + 1 / 30, ease: EXPO }, at);
    tl.set(el, { filter: "none" }, at + d + 2 / 30);
    return at + d;
  }

  // Mask reveal: clip-path wipes the element in from a side ("left" | "right" | "up" | "down").
  function maskReveal(tl, el, at, dur, from, ease) {
    const start = { left: "inset(0 100% 0 0)", right: "inset(0 0 0 100%)", up: "inset(100% 0 0 0)", down: "inset(0 0 100% 0)" }[from || "left"];
    tl.fromTo(el, { clipPath: start }, { clipPath: "inset(0 0% 0 0)", duration: dur, ease: ease || "power3.inOut" }, at);
    return at + dur;
  }

  // Cursor glide on a curve: x and y take different eases, which bends the path.
  function glide(tl, cur, to, at, dur) {
    tl.to(cur, { x: to.x, duration: dur, ease: "power2.inOut" }, at);
    tl.to(cur, { y: to.y, duration: dur, ease: "power3.out" }, at);
    return at + dur;
  }

  // Click: cursor dips to 0.9 for 80 ms, the button presses to 0.94.
  function click(tl, cur, btn, at) {
    tl.to(cur, { scale: 0.9, duration: 0.08, ease: "power1.out" }, at);
    tl.to(cur, { scale: 1, duration: 0.14, ease: "power2.out" }, at + 0.08);
    if (btn) {
      tl.to(btn, { scale: 0.94, duration: 0.08, ease: "power1.out" }, at);
      tl.to(btn, { scale: 1, duration: 0.22, ease: "back.out(2)" }, at + 0.08);
    }
    return at + 0.2;
  }

  // Number count-up written into el.textContent. fmt(n) formats the value (default: grouped integer).
  function countUp(tl, el, from, to, at, dur, fmt, ease) {
    const f = fmt || ((n) => Math.round(n).toLocaleString("en-US"));
    const o = { v: from };
    el.textContent = f(from);
    tl.fromTo(o, { v: from }, { v: to, duration: dur, ease: ease || "power2.out", onUpdate: () => (el.textContent = f(o.v)) }, at);
    return at + dur;
  }

  // Draw an SVG stroke on (path, line, polyline, circle...).
  function drawPath(tl, pathEl, at, dur, ease) {
    const len = pathEl.getTotalLength();
    pathEl.style.strokeDasharray = len;
    tl.fromTo(pathEl, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: dur, ease: ease || "power2.inOut" }, at);
    return at + dur;
  }

  // Move an element along an SVG path (both in the same coordinate space). The element is
  // centred on the path point; pathEl must be laid out (in the DOM, not display:none).
  function alongPath(tl, el, pathEl, at, dur, ease) {
    const len = pathEl.getTotalLength();
    const o = { p: 0 };
    const place = () => {
      const pt = pathEl.getPointAtLength(o.p * len);
      gsap.set(el, { x: pt.x - el.offsetWidth / 2, y: pt.y - el.offsetHeight / 2 });
    };
    place();
    tl.fromTo(o, { p: 0 }, { p: 1, duration: dur, ease: ease || "power1.inOut", onUpdate: place }, at);
    return at + dur;
  }

  // Gradient text shimmer: background-position drifts (pair with background-clip: text).
  function shimmer(tl, els, at, dur) {
    tl.fromTo(els, { backgroundPosition: "0% 0%" }, { backgroundPosition: "60% 0%", duration: dur, ease: "none" }, at);
  }

  return { EXPO, PUNCH, split, splitWords, offsetIn, measure, typewriter, stream, whipIn, maskReveal, glide, click, countUp, drawPath, alongPath, shimmer };
})();
