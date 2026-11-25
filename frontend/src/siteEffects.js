import Lenis from 'lenis';
import * as Motion from 'motion';

export function startSiteEffects() {
  const events = new AbortController();
  const cleanups = [];
  const listen = (target, type, listener, options) => {
    target.addEventListener(type, listener, { ...options, signal: events.signal });
  };
  let scrollFrame;
  let canvasFrame;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var $ = function (s, c) {
    return (c || document).querySelector(s);
  };
  var $$ = function (s, c) {
    return Array.prototype.slice.call((c || document).querySelectorAll(s));
  };

  /* Smooth scroll (Lenis) */
  var lenis = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    var raf = function (t) {
      lenis.raf(t);
      scrollFrame = requestAnimationFrame(raf);
    };
    scrollFrame = requestAnimationFrame(raf);
  }
  function goTo(hash) {
    var el = hash === "#top" ? document.body : $(hash);
    if (!el) return;
    if (lenis)
      lenis.scrollTo(hash === "#top" ? 0 : el, { offset: -72, duration: 1.4 });
    else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  /* Nav + mobile menu */
  var nav = $("#nav"),
    burger = $("#burger"),
    menu = $("#mmenu");
  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 30);
  }
  listen(window, "scroll", onScroll, { passive: true });
  onScroll();
  const initialHash = location.hash;
  const initialSection = document.getElementById(initialHash.slice(1));
  if (initialSection) {
    document.fonts.ready.then(() => {
      if (!events.signal.aborted && location.hash === initialHash) {
        initialSection.scrollIntoView({ behavior: 'instant' });
      }
    });
  }
  function setMenu(open) {
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("open", open);
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  listen(burger, "click", function () {
    setMenu(burger.getAttribute("aria-expanded") !== "true");
  });
  listen(document, "keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });
  $$('a[href^="#"]').forEach(function (a) {
    listen(a, "click", function (e) {
      var h = a.getAttribute("href");
      if (h.length < 2) return;
      e.preventDefault();
      setMenu(false);
      goTo(h);
    });
  });
  $("#to-top").addEventListener("click", function () {
    goTo("#top");
  });

  /* Hero 3D tilt */
  var hero = $(".hero"),
    tilt = $("#tilt");
  if (fine && !reduce) {
    listen(hero, "pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5,
        y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform =
        "rotateY(" + x * 14 + "deg) rotateX(" + -y * 12 + "deg)";
    });
    listen(hero, "pointerleave", function () {
      tilt.style.transform = "";
    });
  }

  /* Hero canvas: perspective wave of dots */
  var cv = $("#field"),
    ctx = cv.getContext("2d"),
    W,
    H,
    dpr = Math.min(window.devicePixelRatio || 1, 2),
    running = true,
    mouse = { x: 0.5, y: 0.5 };
  function size() {
    W = cv.clientWidth;
    H = cv.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  listen(window, "resize", size);
  listen(hero, "pointermove", function (e) {
    mouse.x = e.clientX / W;
    mouse.y = e.clientY / H;
  });
  function draw(t) {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    var cols = W < 700 ? 28 : 46,
      rows = 22,
      time = t * 0.00045;
    for (var j = 0; j < rows; j++) {
      var zf = j / rows,
        persp = 0.35 + zf * 0.9;
      for (var i = 0; i < cols; i++) {
        var u = i / (cols - 1) - 0.5;
        var wave =
          Math.sin(u * 7 + time * 2 + zf * 5) * Math.cos(zf * 4 - time) * 26 +
          Math.sin((u - (mouse.x - 0.5)) * 3) * 10;
        var x = W / 2 + u * W * 1.5 * persp;
        var y = H * 0.48 + zf * zf * H * 0.62 + wave * persp;
        var a = 0.12 + zf * 0.55;
        ctx.fillStyle =
          (i + j) % 9 === 0
            ? "rgba(45,212,191," + a + ")"
            : "rgba(0,229,255," + a * 0.7 + ")";
        ctx.fillRect(x, y, 1.6 * persp, 1.6 * persp);
      }
    }
    canvasFrame = requestAnimationFrame(draw);
  }
  if (reduce) {
    running = true;
    draw(0);
    running = false;
  } else {
    const canvasObserver = new IntersectionObserver(function (en) {
      var v = en[0].isIntersecting;
      if (v && !running) {
        running = true;
        canvasFrame = requestAnimationFrame(draw);
      }
      running = v;
    });
    canvasObserver.observe(hero);
    cleanups.push(() => canvasObserver.disconnect());
    canvasFrame = requestAnimationFrame(draw);
  }

  /* Magnetic buttons */
  if (fine && !reduce)
    $$(".magnetic").forEach(function (b) {
      listen(b, "pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty(
          "--bx",
          (e.clientX - r.left - r.width / 2) * 0.25 + "px",
        );
        b.style.setProperty(
          "--by",
          (e.clientY - r.top - r.height / 2) * 0.35 + "px",
        );
      });
      listen(b, "pointerleave", function () {
        b.style.setProperty("--bx", "0px");
        b.style.setProperty("--by", "0px");
      });
    });

  /* Spotlight follow */
  $$(".card, .work").forEach(function (c) {
    listen(c, "pointermove", function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", e.clientX - r.left + "px");
      c.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* Motion: scroll reveals, parallax, counters */
  var M = Motion;
  if (M && !reduce) {
    try {
      document.documentElement.classList.add("motion-ready");
      cleanups.push(M.inView(
        "[data-reveal]",
        function (info) {
          var el = info.target || info;
          M.animate(
            el,
            {
              opacity: [0, 1],
              transform: ["translateY(36px)", "translateY(0px)"],
            },
            {
              duration: 1,
              delay: parseFloat(el.dataset.delay || 0),
              ease: [0.22, 1, 0.36, 1],
            },
          );
        },
        { amount: 0.12 },
      ));
      cleanups.push(M.scroll(
        M.animate(
          ".parallax-img",
          { transform: ["translateY(-6%)", "translateY(8%)"] },
          { ease: "linear" },
        ),
        { target: hero, offset: ["start start", "end start"] },
      ));
      var about = $("#about");
      cleanups.push(M.scroll(
        M.animate(
          ".parallax-slow",
          { transform: ["translateY(-8%)", "translateY(0%)"] },
          { ease: "linear" },
        ),
        { target: about, offset: ["start end", "end start"] },
      ));
      cleanups.push(M.inView(
        "[data-count]",
        function (info) {
          var el = info.target || info,
            to = parseFloat(el.dataset.count),
            dec = +(el.dataset.dec || 0),
            suf = el.dataset.suffix || "";
          M.animate(0, to, {
            duration: 1.8,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: function (v) {
              el.textContent = v.toFixed(dec) + suf;
            },
          });
        },
        { amount: 0.3 },
      ));
    } catch (err) {
      document.documentElement.classList.remove("motion-ready");
    }
  }

  /* Portfolio filter */
  var fBtns = $$(".filters button"),
    works = $$(".work");
  fBtns.forEach(function (b) {
    listen(b, "click", function () {
      var f = b.dataset.filter;
      fBtns.forEach(function (x) {
        x.setAttribute("aria-pressed", x === b);
      });
      works.forEach(function (w) {
        var show = b.hasAttribute("data-all") || w.dataset.cat === f;
        w.hidden = !show;
        if (show) {
          w.style.opacity = 1;
          if (M && !reduce)
            M.animate(
              w,
              { opacity: [0, 1], transform: ["scale(.96)", "scale(1)"] },
              { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
            );
        }
      });
    });
  });

  /* Testimonials slider */
  var slider = $("#slider"),
    slides = $$(".slide"),
    dotsWrap = $("#s-dots"),
    cur = 0,
    timer = null,
    DUR = 6500;
  if (slider) {
    slider.style.setProperty("--dur", DUR + "ms");
    slides.forEach(function (_, i) {
      var d = document.createElement("button");
      d.type = "button";
      d.setAttribute("aria-label", "Show testimonial " + (i + 1));
      d.setAttribute("data-testid", "testimonial-dot-" + (i + 1));
      listen(d, "click", function () {
        show(i);
        restart();
      });
      dotsWrap.appendChild(d);
    });
    var dots = $$("button", dotsWrap);
    function show(i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        s.classList.toggle("is-active", k === cur);
        s.setAttribute("aria-hidden", k !== cur);
      });
      dots.forEach(function (d, k) {
        d.removeAttribute("aria-current");
        if (k === cur) {
          void d.offsetWidth;
          d.setAttribute("aria-current", "true");
        }
      });
      $("#s-cur").textContent = String(cur + 1).padStart(2, "0");
    }
    function restart() {
      clearInterval(timer);
      if (!reduce && !slider.classList.contains("paused"))
        timer = setInterval(function () {
          show(cur + 1);
        }, DUR);
    }
    $("#s-prev").addEventListener("click", function () {
      show(cur - 1);
      restart();
    });
    $("#s-next").addEventListener("click", function () {
      show(cur + 1);
      restart();
    });
    listen(slider, "mouseenter", function () {
      slider.classList.add("paused");
      clearInterval(timer);
    });
    listen(slider, "mouseleave", function () {
      slider.classList.remove("paused");
      restart();
    });
    listen(slider, "focusin", function () {
      slider.classList.add("paused");
      clearInterval(timer);
    });
    listen(slider, "focusout", function () {
      slider.classList.remove("paused");
      restart();
    });
    show(0);
    restart();
  }

  return () => {
    events.abort();
    clearInterval(timer);
    dotsWrap?.replaceChildren();
    cancelAnimationFrame(scrollFrame);
    cancelAnimationFrame(canvasFrame);
    lenis?.destroy();
    cleanups.forEach(cleanup => cleanup());
    document.documentElement.classList.remove("motion-ready");
  };
}
