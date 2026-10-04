// Builds the root timeline ("main") for every type card, the light leak and the end fade.
// The card DOM is written statically by scripts/build.mjs from video.config.json; this file
// reads the same beat list from window.VIDEO.beats and adds the motion. Scenes (sub-compositions)
// own their own timelines and are not touched here.
document.fonts.ready.then(function () {
  const FX = window.FX;
  const V = window.VIDEO;
  const tl = gsap.timeline({ paused: true });
  const $ = (id) => document.getElementById(id);
  const push = (sel, at, dur, to) => tl.fromTo(sel, { scale: 1 }, { scale: to || 1.04, duration: dur, ease: "none" }, at);

  const builders = {
    // T1 letter fade-on + tracking tighten, then T4: logo shrinks away and the next word slides in
    "logo-intro"(b) {
      const word = $(b.id + "-word");
      const letters = FX.split(word);
      const track = 0.15 * parseFloat(getComputedStyle(word).fontSize);
      letters.forEach((l, i) => {
        l.style.display = "inline-block";
        tl.fromTo(l, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out" }, b.start + 0.12 + i / 30);
        tl.fromTo(l, { x: (i - (letters.length - 1) / 2) * track }, { x: 0, duration: 0.55, ease: "power3.out" }, b.start + 0.1);
      });
      tl.fromTo("#" + b.id + "-mark", { opacity: 0, rotation: -24, scale: 0.7 }, { opacity: 1, rotation: 0, scale: 1, duration: 0.6, ease: "expo.out" }, b.start + 0.05);
      tl.fromTo("#" + b.id + "-logo", { scale: 0.85 }, { scale: 1, duration: 0.5, ease: "power3.out" }, b.start + 0.05);
      const shrinkAt = b.start + (b.shrinkAt || 1.2);
      tl.to("#" + b.id + "-logo", { scale: 1.05, duration: shrinkAt - b.start - 0.55, ease: "none" }, b.start + 0.55);
      if (!b.next) return;
      const logo = $(b.id + "-logo");
      const next = $(b.id + "-next");
      const s = 0.5, gap = 40;
      const lw = logo.offsetWidth * s, pw = next.offsetWidth, total = lw + gap + pw;
      const blur1 = $(b.id + "-whip1-blur"), blur2 = $(b.id + "-whip2-blur");
      tl.set(logo, { filter: "url(#" + b.id + "-whip1)" }, shrinkAt);
      tl.to(logo, { scale: s, x: -total / 2 + lw / 2, duration: 0.12, ease: "expo.out" }, shrinkAt);
      tl.fromTo(blur1, { attr: { stdDeviation: "36 0" } }, { attr: { stdDeviation: "0 0" }, duration: 0.18, ease: "expo.out" }, shrinkAt);
      tl.set(logo, { filter: "none" }, shrinkAt + 0.22);
      const nx = total / 2 - pw / 2;
      tl.set(next, { filter: "url(#" + b.id + "-whip2)" }, shrinkAt);
      tl.fromTo(next, { x: nx + 520, opacity: 0 }, { x: nx, opacity: 1, duration: 0.16, ease: "expo.out" }, shrinkAt + 0.01);
      tl.fromTo(blur2, { attr: { stdDeviation: "44 0" } }, { attr: { stdDeviation: "0 0" }, duration: 0.2, ease: "expo.out" }, shrinkAt + 0.01);
      tl.set(next, { filter: "none" }, shrinkAt + 0.25);
      push("#" + b.id + "-stage", shrinkAt, b.start + b.duration - shrinkAt, 1.045);
      FX.shimmer(tl, next, shrinkAt, b.start + b.duration - shrinkAt);
    },

    // One line of type. enter: cut | whip-left | whip-right | type | rise
    text(b) {
      const line = $(b.id + "-line");
      const g = "#" + b.id + "-line .g";
      const enter = b.enter || "cut";
      if (enter === "whip-left" || enter === "whip-right") {
        FX.whipIn(tl, line, b.start, enter === "whip-left" ? -680 : 680, $(b.id + "-whip-blur"));
      } else if (enter === "type") {
        const kw = line.querySelector(".g");
        const units = FX.split(kw);
        FX.typewriter(tl, units, b.start + (b.typeDelay || 0.15), b.cps || 14, $(b.id + "-caret"), line, { caretDy: 10, caretHold: 0.25 });
      } else if (enter === "rise") {
        tl.fromTo(line, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "expo.out" }, b.start);
        if (b.sub) tl.fromTo("#" + b.id + " .sub", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "expo.out" }, b.start + 0.12);
      }
      push("#" + b.id + " .card-inner", b.start, b.duration, b.size === "hero" ? 1.09 : 1.04);
      if (line.querySelector(".g")) FX.shimmer(tl, g, b.start, b.duration);
    },

    // Icon-chip tokens popping in one after another ("copy / images / layout")
    tokens(b) {
      document.querySelectorAll("#" + b.id + " .tok").forEach((tok, i) => {
        const at = b.start + 0.05 + i * (b.stagger || 0.3);
        tl.fromTo(tok, { y: 40, scale: 0.82, opacity: 0, filter: "blur(10px)" }, { y: 0, scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "back.out(1.8)" }, at);
        tl.set(tok, { filter: "none" }, at + 0.46);
        tl.fromTo(tok.querySelector(".chip"), { rotation: -20 }, { rotation: 0, duration: 0.5, ease: "expo.out" }, at);
      });
      push("#" + b.id + "-row", b.start, b.duration, 1.035);
    },

    // T5 slot word swap, then a logo lockup and the only crossfade (to black)
    tagline(b) {
      const slots = b.words.map((_, i) => $(b.id + "-w" + i));
      const slot = $(b.id + "-slot");
      slot.style.width = Math.max(...slots.map((el) => el.offsetWidth)) + "px";
      slots.slice(1).forEach((el) => Object.assign(el.style, { position: "absolute", left: "0", top: "0" }));
      gsap.set(slots.slice(1), { opacity: 0 });
      tl.fromTo("#" + b.id + "-line", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, b.start);
      const every = b.swapEvery || 0.7;
      const d = 3 / 30;
      for (let i = 1; i < slots.length; i++) {
        const at = b.start + (b.firstSwap || 0.7) + (i - 1) * every;
        tl.to(slots[i - 1], { y: -46, opacity: 0, filter: "blur(10px)", duration: d, ease: "power2.in" }, at);
        tl.fromTo(slots[i], { y: 46, opacity: 0, filter: "blur(10px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: d + 2 / 30, ease: "expo.out" }, at + d);
      }
      if (b.lockup) {
        const at = b.start + (b.lockup.at || 2.7);
        tl.fromTo("#" + b.id + "-logo", { y: 24, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "expo.out" }, at);
        tl.fromTo("#" + b.id + "-url", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, at + 0.25);
      }
      push("#" + b.id + " .card-inner", b.start, b.duration, 1.05);
      FX.shimmer(tl, slots, b.start, b.duration);
      if (b.fadeOut) tl.to("#fade-black", { opacity: 1, duration: b.fadeOut, ease: "power1.in" }, b.start + b.duration - b.fadeOut);
    },

    // C7 light-leak wipe (a plain overlay, not a clip, so nothing hides it)
    leak(b) {
      const dur = b.duration || 0.8;
      tl.fromTo("#leak", { x: -1900 }, { x: 1700, duration: dur, ease: "power2.inOut" }, b.start);
      tl.fromTo("#leak", { opacity: 0 }, { opacity: 1, duration: dur * 0.38, ease: "power2.out" }, b.start);
      tl.fromTo("#leak", { opacity: 1 }, { opacity: 0, duration: dur * 0.38, ease: "power2.in" }, b.start + dur * 0.62);
    },

    scene() {},
  };

  V.beats.forEach((b) => {
    const build = builders[b.type];
    if (!build) throw new Error("Unknown beat type: " + b.type);
    build(b);
  });

  window.__timelines["main"] = tl;
});
