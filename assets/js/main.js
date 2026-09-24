/* ==========================================================================
   Lord, Saint, Sinner — site behaviour
   ========================================================================== */

document.documentElement.classList.remove("no-js");

/* ---------- Header: scrolled state + mobile menu ---------- */

(function header() {
  const headerEl = document.querySelector(".site-header");
  const toggle = document.querySelector(".menu-toggle");
  if (!headerEl) return;

  const onScroll = () => headerEl.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.querySelectorAll(".nav a").forEach((a) =>
      a.addEventListener("click", () => {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }
})();

/* ---------- Reveal on scroll ---------- */

(function reveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px" }
  );
  items.forEach((el) => io.observe(el));
})();

/* ---------- Filters (artists, releases, events, news) ---------- */

(function filters() {
  document.querySelectorAll("[data-filters]").forEach((group) => {
    const scope = document.querySelector(group.dataset.filters);
    if (!scope) return;
    const buttons = group.querySelectorAll(".filter-btn");
    buttons.forEach((btn) =>
      btn.addEventListener("click", () => {
        const value = btn.dataset.value;
        buttons.forEach((b) => {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-pressed", String(b === btn));
        });
        scope.querySelectorAll("[data-filter-item]").forEach((item) => {
          const tags = item.dataset.filterItem.split(" ");
          item.classList.toggle("is-hidden", value !== "all" && !tags.includes(value));
        });
      })
    );
  });
})();

/* ---------- Forms (client-side only demo) ---------- */

(function forms() {
  document.querySelectorAll("form[data-validate]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll("[required]").forEach((field) => {
        const error = field.closest(".field")?.querySelector(".error");
        const ok = field.type === "checkbox" ? field.checked : field.checkValidity() && field.value.trim() !== "";
        if (error) error.textContent = ok ? "" : field.dataset.error || "This field is required.";
        if (!ok) valid = false;
      });
      if (!valid) return;
      form.classList.add("is-sent");
      form.querySelector(".form-success")?.focus();
      form.reset();
    });
  });

  document.querySelectorAll("form.newsletter").forEach((form) => {
    const note = form.parentElement.querySelector(".newsletter-note");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[type=email]");
      if (!input.checkValidity() || !input.value) {
        if (note) note.textContent = "Please enter a valid email address.";
        return;
      }
      if (note) note.textContent = "You're on the list. First drop lands in your inbox soon.";
      form.reset();
    });
  });
})();

/* ---------- Footer year ---------- */

document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

/* ---------- Player: a small WebAudio synth standing in for real audio ---------- */

(function player() {
  const TRACKS = [
    { title: "Halfway", artist: "Lord, Saint, Sinner", duration: 204, root: 57, prog: [0, 8, 3, 10], bpm: 96 },
    { title: "Hide", artist: "Lord, Saint, Sinner", duration: 221, root: 55, prog: [0, 5, 3, 7], bpm: 78 },
    { title: "FU money", artist: "Lord, Saint, Sinner", duration: 178, root: 52, prog: [0, 3, 8, 10], bpm: 112 },
    { title: "Neva Chop White Jeans", artist: "Lord, Saint, Sinner", duration: 190, root: 60, prog: [0, 9, 5, 7], bpm: 88 },
    { title: "ZA ODA", artist: "Lord, Saint, Sinner", duration: 212, root: 50, prog: [0, 10, 8, 7], bpm: 104 },
  ];

  const root = document.documentElement;
  const q = (sel) => document.querySelectorAll(sel);
  if (!document.querySelector("[data-player-toggle]")) return;

  let index = 0;
  let playing = false;
  let elapsed = 0;
  let lastTick = 0;
  let raf = 0;
  let ctx = null;
  let master = null;
  let schedulerTimer = 0;
  let nextBeatTime = 0;
  let beat = 0;

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function render() {
    const t = TRACKS[index];
    q("[data-player-title]").forEach((el) => (el.textContent = t.title));
    q("[data-player-artist]").forEach((el) => (el.textContent = t.artist));
    q("[data-player-duration]").forEach((el) => (el.textContent = fmt(t.duration)));
    q("[data-player-current]").forEach((el) => (el.textContent = fmt(elapsed)));
    q("[data-player-bar]").forEach((el) => (el.style.width = `${(elapsed / t.duration) * 100}%`));
    q("[data-player-toggle]").forEach((el) => el.setAttribute("aria-label", playing ? "Pause" : "Play"));
    root.classList.toggle("is-playing", playing);
  }

  function ensureAudio() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1800;
    master.connect(filter).connect(ctx.destination);
  }

  function voice(freq, start, length, type, gain) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + Math.min(0.08, length / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(start + length + 0.05);
  }

  function kick(start) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(140, start);
    osc.frequency.exponentialRampToValueAtTime(42, start + 0.18);
    g.gain.setValueAtTime(0.5, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(start + 0.32);
  }

  function schedule() {
    const t = TRACKS[index];
    const spb = 60 / t.bpm;
    while (nextBeatTime < ctx.currentTime + 0.2) {
      const bar = Math.floor(beat / 4) % t.prog.length;
      const chordRoot = t.root + t.prog[bar];
      if (beat % 4 === 0) {
        const minor = [0, 3, 7, 10];
        minor.forEach((iv) => {
          voice(midiToHz(chordRoot + iv), nextBeatTime, spb * 4, "sawtooth", 0.035);
          voice(midiToHz(chordRoot + iv) * 1.004, nextBeatTime, spb * 4, "triangle", 0.03);
        });
        voice(midiToHz(chordRoot - 24), nextBeatTime, spb * 3.5, "sine", 0.22);
      }
      kick(nextBeatTime);
      const arp = [0, 7, 12, 15, 19, 15, 12, 7];
      voice(midiToHz(chordRoot + 12 + arp[(beat * 2) % 8]), nextBeatTime, spb * 0.45, "triangle", 0.05);
      voice(midiToHz(chordRoot + 12 + arp[(beat * 2 + 1) % 8]), nextBeatTime + spb / 2, spb * 0.45, "triangle", 0.04);
      nextBeatTime += spb;
      beat++;
    }
  }

  function tick(now) {
    if (!playing) return;
    elapsed += (now - lastTick) / 1000;
    lastTick = now;
    if (elapsed >= TRACKS[index].duration) {
      change(1);
      return;
    }
    render();
    raf = requestAnimationFrame(tick);
  }

  function play() {
    ensureAudio();
    playing = true;
    if (ctx) {
      ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.55, ctx.currentTime, 0.2);
      nextBeatTime = ctx.currentTime + 0.05;
      clearInterval(schedulerTimer);
      schedulerTimer = setInterval(schedule, 50);
      schedule();
    }
    lastTick = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
    render();
  }

  function pause() {
    playing = false;
    cancelAnimationFrame(raf);
    clearInterval(schedulerTimer);
    if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    render();
  }

  function change(dir) {
    const wasPlaying = playing;
    index = (index + dir + TRACKS.length) % TRACKS.length;
    elapsed = 0;
    beat = 0;
    if (wasPlaying) {
      pause();
      play();
    } else render();
  }

  q("[data-player-toggle]").forEach((b) => b.addEventListener("click", () => (playing ? pause() : play())));
  q("[data-player-prev]").forEach((b) => b.addEventListener("click", () => change(-1)));
  q("[data-player-next]").forEach((b) => b.addEventListener("click", () => change(1)));
  q("[data-play-track]").forEach((b) =>
    b.addEventListener("click", () => {
      index = Number(b.dataset.playTrack) % TRACKS.length;
      elapsed = 0;
      beat = 0;
      if (playing) pause();
      play();
    })
  );

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target === document.body) {
      e.preventDefault();
      playing ? pause() : play();
    }
  });

  elapsed = 64;
  render();
})();
