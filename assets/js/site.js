// Jane online booking page. If emptied, booking buttons go to the /book/ page instead.
var JANE_URL = "https://nutritionbydaynak.janeapp.com/";

(function () {
  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || doc).querySelectorAll(s)); };
  // The motion layer always runs. Add ?static to the address to switch it off (useful for QA captures).
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var motion = !!(gsap && ST) && !/[?&]static\b/.test(location.search);
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var seen = false;
  try { seen = !!sessionStorage.getItem("rn-seen"); sessionStorage.setItem("rn-seen", "1"); } catch (e) {}

  /* ---------- content behaviour (works with or without the motion layer) ---------- */

  if (JANE_URL) {
    $$("[data-book]").forEach(function (a) {
      a.href = JANE_URL; a.target = "_blank"; a.rel = "noopener";
      a.addEventListener("click", function () {
        if (window.gtag) window.gtag("event", "book_click", { link_text: a.textContent.trim() });
      });
    });
  }

  var nav = $(".nav"), burger = $(".nav__burger");
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open);
  });

  // The Rooted Approach diagram (home)
  var orbitText = $("#orbitText"), nodes = $$(".orbit__node"), oTimer, oIdx = -1;
  function setNode(i, user) {
    oIdx = i;
    nodes.forEach(function (n, k) { n.classList.toggle("is-on", k === i); });
    if (motion) gsap.fromTo(orbitText, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: .45, onStart: function () { orbitText.textContent = nodes[i].dataset.t; } });
    else orbitText.textContent = nodes[i].dataset.t;
    if (user) clearInterval(oTimer);
  }
  nodes.forEach(function (n, i) { n.addEventListener("click", function () { setNode(i, true); }); });

  // "Where would you like to start?"
  var picks = $$(".pick"), count = $("#supportCount"), msg = $("#supportMsg"), result = $("#supportResult");
  picks.forEach(function (p) {
    p.addEventListener("click", function () {
      p.setAttribute("aria-pressed", p.getAttribute("aria-pressed") !== "true");
      var on = picks.filter(function (x) { return x.getAttribute("aria-pressed") === "true"; });
      count.textContent = on.length;
      result.classList.toggle("has-picks", on.length > 0);
      msg.textContent = !on.length ? "Tap anything that sounds like you."
        : on.length === 1 ? "We would start with " + on[0].dataset.m + "."
        : "These are connected. Your assessment looks at them together.";
    });
  });

  // FAQ: one open at a time, animated height
  var faqs = $$(".faq details");
  faqs.forEach(function (d) {
    var body = d.querySelector("div"), sum = d.querySelector("summary");
    sum.addEventListener("click", function (e) {
      if (!motion) return;
      e.preventDefault();
      var opening = !d.open;
      faqs.forEach(function (o) {
        if (o !== d && o.open) gsap.to(o.querySelector("div"), { height: 0, duration: .35, ease: "power2.inOut", onComplete: function () { o.open = false; } });
      });
      if (opening) { d.open = true; gsap.fromTo(body, { height: 0 }, { height: "auto", duration: .45, ease: "power2.out" }); }
      else gsap.to(body, { height: 0, duration: .35, ease: "power2.inOut", onComplete: function () { d.open = false; } });
    });
  });

  // product rail: drag to scroll
  $$("[data-drag]").forEach(function (rail) {
    var down = false, sx = 0, sl = 0, moved = 0;
    rail.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; down = true; moved = 0; sx = e.clientX; sl = rail.scrollLeft; });
    window.addEventListener("pointermove", function (e) { if (!down) return; moved = Math.abs(e.clientX - sx); rail.scrollLeft = sl - (e.clientX - sx); if (moved > 6) rail.classList.add("is-drag"); });
    window.addEventListener("pointerup", function () { down = false; setTimeout(function () { rail.classList.remove("is-drag"); }, 0); });
    rail.addEventListener("click", function (e) { if (moved > 6) e.preventDefault(); }, true);
  });

  $("#yr").textContent = new Date().getFullYear();

  var progress = $(".nav__progress");
  var onScroll = function () {
    var y = window.scrollY, max = doc.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle("is-stuck", y > 12);
    doc.body.classList.toggle("show-sticky", y > 700);
    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- without the motion layer everything is simply visible ---------- */
  if (!motion) {
    root.classList.remove("js");
    root.classList.add("static");
    return;
  }

  /* ---------- motion layer ---------- */
  gsap.registerPlugin(ST);
  gsap.defaults({ ease: "power3.out" });
  // keep timed animations on the clock even if the browser hiccups, so the loading curtain can never linger
  gsap.ticker.lagSmoothing(0);

  // Scrolling is left to the browser: native scrolling stays smooth even while the page is busy.
  var lenis = null;
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var t = a.getAttribute("href").length > 1 && $(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -70, duration: 1.3 });
      else t.scrollIntoView({ behavior: "smooth" });
    });
  });

  // page-to-page: a green curtain rises, the next page lifts it
  var loader = $(".loader");
  doc.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname) return;
    e.preventDefault();
    gsap.set(loader, { display: "grid", yPercent: 100 });
    gsap.set(".loader img", { autoAlpha: 0 });
    gsap.to(loader, { yPercent: 0, duration: .55, ease: "expo.inOut", onComplete: function () { location.href = url.href; } });
  });
  window.addEventListener("pageshow", function (e) { if (e.persisted) gsap.set(loader, { display: "none" }); });

  // split a heading into masked words
  function split(el) {
    var holder = doc.createElement("span"), out = [];
    holder.className = "split"; holder.setAttribute("aria-hidden", "true");
    (function walk(node, into) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { into.appendChild(doc.createTextNode(" ")); return; }
            var m = doc.createElement("span"); m.className = "w";
            var i = doc.createElement("span"); i.textContent = w; m.appendChild(i); into.appendChild(m); out.push(i);
          });
        } else { var c = n.cloneNode(false); into.appendChild(c); walk(n, c); }
      });
    })(el, holder);
    el.setAttribute("aria-label", el.textContent);
    el.textContent = ""; el.appendChild(holder);
    return out;
  }

  // plates and fruit turn with the scroll, and drift a little on their own
  var spinEls = $$("[data-spin]");
  if (window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()")) {
    // off the main thread: the turn is tied to the scroll position by the browser itself, so it cannot stutter
    var setTurns = function () {
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      spinEls.forEach(function (el) { el.style.setProperty("--turn", Math.round(max * +el.dataset.spin) + "deg"); });
    };
    root.classList.add("scroll-tl");
    setTurns();
    ST.addEventListener("refresh", setTurns);
  } else {
    var spins = spinEls.map(function (el) { return { el: el, k: +el.dataset.spin, r: 0 }; });
    gsap.ticker.add(function () {
      var y = window.scrollY;
      spins.forEach(function (sp) {
        var step = (y * sp.k - sp.r) * 0.2;
        if (step < 0.03 && step > -0.03) return;
        sp.r += step; sp.el.style.rotate = sp.r.toFixed(2) + "deg";
      });
    });
  }
  $$("[data-float]").forEach(function (el) {
    gsap.to(el, { y: +el.dataset.float, ease: "none", scrollTrigger: { trigger: el.closest("section"), start: "top bottom", end: "bottom top", scrub: true } });
  });

  // loader (first visit shows the logo, later pages just lift the curtain), then the hero entrance
  var heroEl = $(".hero"), heroWords = heroEl ? split($("[data-split]", heroEl)) : [];
  var main = ".hero .plate--main", small = ".hero .orb, .hero .plate--bowl, .hero .stage__leaf, .hero .chip";
  gsap.set(heroWords, { yPercent: 115 });
  gsap.set(".hero [data-fade]", { autoAlpha: 0, y: 20 });
  gsap.set(main, { xPercent: 90, rotate: 200, autoAlpha: 0 });
  gsap.set(small, { scale: 0, autoAlpha: 0 });
  if (lenis) lenis.stop();
  var intro = gsap.timeline({ onComplete: function () { if (lenis) lenis.start(); ST.sort(); ST.refresh(); } });
  if (!seen) {
    intro.fromTo(".loader img", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .7 })
      .to(".loader img", { autoAlpha: 0, y: -16, duration: .35, ease: "power2.in" }, "+=.35");
  } else { gsap.set(".loader img", { autoAlpha: 0 }); }
  intro.to(loader, { yPercent: -100, duration: .8, ease: "expo.inOut" })
    .set(loader, { display: "none" })
    // the main plate rolls in from the right
    .to(main, { xPercent: 0, rotate: 0, autoAlpha: 1, duration: 1.7, ease: "expo.out" }, "-=.45")
    .to(heroWords, { yPercent: 0, duration: 1, stagger: .04, ease: "expo.out" }, "<.1")
    .to(".hero [data-fade]", { autoAlpha: 1, y: 0, duration: .8, stagger: .09, clearProps: "opacity,visibility,transform" }, "<.35")
    .to(small, { scale: 1, autoAlpha: 1, duration: 1, stagger: .08, ease: "back.out(1.7)" }, "<.1");

  // as you leave the hero the orbiting fruit spreads out and the plate grows
  if (heroEl) {
    gsap.to(".hero .stage__orbit", { scale: 1.28, ease: "none", scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero .stage", { yPercent: 14, ease: "none", scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: true } });
  }

  // headings, soft fades, cards
  $$("[data-split]").forEach(function (el) {
    if (el.closest(".hero")) return;
    var words = split(el);
    gsap.set(words, { yPercent: 115 });
    // reveals start the moment an element enters the screen and finish fast, so nothing is ever waited for
    ST.create({ trigger: el, start: "top 99%", once: true, onEnter: function () { gsap.to(words, { yPercent: 0, duration: .55, stagger: .025, ease: "power3.out" }); } });
  });
  $$("[data-fade]").forEach(function (el) {
    if (el.closest(".hero")) return;
    gsap.set(el, { autoAlpha: 0, y: 16 });
    ST.create({ trigger: el, start: "top 99%", once: true, onEnter: function () { gsap.to(el, { autoAlpha: 1, y: 0, duration: .45 }); } });
  });
  gsap.set("[data-card]", { autoAlpha: 0, y: 24 });
  ST.batch("[data-card]", { start: "top 99%", once: true,
    onEnter: function (els) { gsap.to(els, { autoAlpha: 1, y: 0, duration: .45, stagger: .05, overwrite: "auto" }); } });

  // fruit is sliced as you scroll: one cut down, one cut across, four pieces fall away
  $$("[data-slice]").forEach(function (sec) {
    var q = function (s) { return $(s, sec); };
    // on a narrow screen the pieces leave toward the top and bottom so the words have the middle to themselves
    var narrow = window.innerWidth < 700, dx = narrow ? 92 : 144, dy = narrow ? 184 : 68;
    // the stage is held in place by CSS (position: sticky), which the browser does natively with no script and no jump
    var tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 62%", end: "bottom bottom", scrub: true } });
    // first half: the whole fruit rolls up to full size as its section arrives. second half: the section is held (CSS sticky) while it is cut
    tl.fromTo(q(".slice__fruit"), { scale: .45, rotate: -120 }, { scale: 1, rotate: 0, duration: 3.6, ease: "none" })
      .fromTo(q(".slice__knife"), { scaleY: 0 }, { scaleY: 1, duration: .45, ease: "power2.in" })
      .to(q(".slice__knife"), { autoAlpha: 0, duration: .12 })
      .to([q(".wedge--tl"), q(".wedge--bl")], { xPercent: -14, duration: .4, ease: "power2.out" }, "<")
      .to([q(".wedge--tr"), q(".wedge--br")], { xPercent: 14, duration: .4, ease: "power2.out" }, "<")
      .fromTo(q(".slice__knife--h"), { scaleX: 0 }, { scaleX: 1, duration: .45, ease: "power2.in" })
      .to(q(".slice__knife--h"), { autoAlpha: 0, duration: .12 })
      .to(q(".wedge--tl"), { xPercent: -dx, yPercent: -dy, rotate: -24, duration: 1.5, ease: "power2.inOut" }, "<")
      .to(q(".wedge--tr"), { xPercent: dx, yPercent: -dy, rotate: 24, duration: 1.5, ease: "power2.inOut" }, "<")
      .to(q(".wedge--bl"), { xPercent: -dx, yPercent: dy, rotate: 18, duration: 1.5, ease: "power2.inOut" }, "<")
      .to(q(".wedge--br"), { xPercent: dx, yPercent: dy, rotate: -18, duration: 1.5, ease: "power2.inOut" }, "<")
      .fromTo(q(".slice__text"), { autoAlpha: 0, scale: .8 }, { autoAlpha: 1, scale: 1, duration: 1, ease: "power2.out" }, "<.4")
      .to({}, { duration: .5 });
  });

  // plates and fruit roll across the page like wheels
  $$(".roll").forEach(function (band) {
    var items = $$(".roll__item", band), n = items.length;
    var gap = function () { return Math.max(window.innerWidth * .2, 190); };
    items.forEach(function (it, i) {
      // a parade: every item keeps its place in line, and turns once per circumference travelled
      var from = function () { return -it.offsetWidth - (n - 1 - i) * gap(); };
      var to = function () { return window.innerWidth + i * gap(); };
      gsap.fromTo(it, { x: from, rotate: 0 },
        { x: to, rotate: function () { return (to() - from()) / (Math.PI * it.offsetWidth) * 360; },
          ease: "none", scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true } });
    });
  });

  // The Rooted Approach page: the text scrolls past normally while one plate stays beside it and changes with each chapter
  $$("[data-story]").forEach(function (sec) {
    var steps = $$(".story__step", sec), imgs = $$(".story__img", sec), plate = $(".story__plate", sec), cur = 0;
    gsap.set(imgs.slice(1), { autoAlpha: 0, scale: .8 });
    function show(i) {
      if (i === cur) return; cur = i;
      imgs.forEach(function (im, k) { gsap.to(im, { autoAlpha: k === i ? 1 : 0, scale: k === i ? 1 : .8, duration: .45, overwrite: true }); });
    }
    steps.forEach(function (st, i) {
      ST.create({ trigger: st, start: "top 62%", end: "bottom 62%", onToggle: function (self) { if (self.isActive) show(i); } });
    });
    gsap.to(plate, { rotate: 300, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true } });
  });
  // orbit: nodes pop in, then cycle
  if (nodes.length) {
    gsap.set(".orbit__node", { scale: 0 });
    ST.create({ trigger: ".orbit", start: "top 70%", once: true, onEnter: function () {
      gsap.to(".orbit__node", { scale: 1, duration: .7, stagger: .12, ease: "back.out(2)", clearProps: "scale" });
      setNode(0);
      oTimer = setInterval(function () { setNode((oIdx + 1) % nodes.length); }, 3600);
    } });
  }

  // marquee: duplicated once and moved by a CSS animation
  var track = $(".marquee__track");
  if (track) { track.innerHTML += track.innerHTML; track.classList.add("is-running"); }

  // a big plate rolls into every booking section
  $$(".book").forEach(function (b) {
    var p = $(".book__plate", b); if (!p) return;
    // on phones and tablets the plate stays on the centre line and grows in (a sideways move would drift, because the plate is also turning); on wide screens it rolls in from the side
    var small = window.innerWidth <= 980;
    gsap.fromTo(p, small ? { scale: .78, autoAlpha: 0 } : { xPercent: 70, autoAlpha: 0 }, small ? { scale: 1, autoAlpha: 1, ease: "none",
      scrollTrigger: { trigger: b, start: "top 95%", end: "top 25%", scrub: true } } : { xPercent: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: b, start: "top 95%", end: "top 25%", scrub: true } });
  });

  if (fine) {
    $$(".magnetic").forEach(function (b) {
      var bx = gsap.quickTo(b, "x", { duration: .5, ease: "power3" }), by = gsap.quickTo(b, "y", { duration: .5, ease: "power3" });
      b.addEventListener("mousemove", function (e) { var r = b.getBoundingClientRect(); bx((e.clientX - r.left - r.width / 2) * .25); by((e.clientY - r.top - r.height / 2) * .35); });
      b.addEventListener("mouseleave", function () { bx(0); by(0); });
    });
    // pointer effects reuse one tween each (quickTo) instead of starting a new one on every mouse movement
    $$(".step, .card, .prod__img").forEach(function (c) {
      var rx, ry;
      c.addEventListener("mouseenter", function () {
        if (rx) return;
        gsap.set(c, { transformPerspective: 900 });
        rx = gsap.quickTo(c, "rotateX", { duration: .4, ease: "power3" }); ry = gsap.quickTo(c, "rotateY", { duration: .4, ease: "power3" });
      });
      c.addEventListener("mousemove", function (e) {
        if (!rx) return;
        var r = c.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - .5) * 7); rx(-((e.clientY - r.top) / r.height - .5) * 7);
      });
      c.addEventListener("mouseleave", function () { if (rx) { rx(0); ry(0); } });
    });
    // the hero plate leans toward the pointer
    if (heroEl && $(main)) {
      var mx = gsap.quickTo(main, "x", { duration: .8, ease: "power3" }), my = gsap.quickTo(main, "y", { duration: .8, ease: "power3" });
      heroEl.addEventListener("mousemove", function (e) {
        mx((e.clientX / window.innerWidth - .5) * 26); my((e.clientY / window.innerHeight - .5) * 26);
      });
    }
  }

  // pinned sections are created out of page order above, so put every trigger back in page order before measuring
  ST.sort(); ST.refresh();
  window.addEventListener("load", function () { ST.sort(); ST.refresh(); });
})();
