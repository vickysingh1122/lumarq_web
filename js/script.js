document.addEventListener("DOMContentLoaded", function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var $ = function (s, c) {
    return (c || document).querySelector(s);
  };
  var $$ = function (s, c) {
    return Array.prototype.slice.call((c || document).querySelectorAll(s));
  };
  document.getElementById("year").textContent = new Date().getFullYear();

  /* Smooth scroll (Lenis) */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    var raf = function (t) {
      lenis.raf(t);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
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
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  function setMenu(open) {
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("open", open);
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  burger.addEventListener("click", function () {
    setMenu(burger.getAttribute("aria-expanded") !== "true");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
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
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5,
        y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform =
        "rotateY(" + x * 14 + "deg) rotateX(" + -y * 12 + "deg)";
    });
    hero.addEventListener("pointerleave", function () {
      tilt.style.transform = "";
    });
  }

  /* Hero canvas: perspective wave of dots */
  var cv = $("#field"),
    ctx = cv.getContext("2d"),
    W,
    H,
    dpr = Math.min(window.devicePixelRatio || 1, 2),
    t0 = 0,
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
  window.addEventListener("resize", size);
  hero.addEventListener("pointermove", function (e) {
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
    requestAnimationFrame(draw);
  }
  if (reduce) {
    running = true;
    draw(0);
    running = false;
  } else {
    new IntersectionObserver(function (en) {
      var v = en[0].isIntersecting;
      if (v && !running) {
        running = true;
        requestAnimationFrame(draw);
      }
      running = v;
    }).observe(hero);
    requestAnimationFrame(draw);
  }

  /* Magnetic buttons */
  if (fine && !reduce)
    $$(".magnetic").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
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
      b.addEventListener("pointerleave", function () {
        b.style.setProperty("--bx", "0px");
        b.style.setProperty("--by", "0px");
      });
    });

  /* Spotlight follow */
  $$(".card, .work").forEach(function (c) {
    c.addEventListener("pointermove", function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", e.clientX - r.left + "px");
      c.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* Motion: scroll reveals, parallax, counters */
  var M = window.Motion;
  if (M && !reduce) {
    try {
      document.documentElement.classList.add("motion-ready");
      M.inView(
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
      );
      M.scroll(
        M.animate(
          ".parallax-img",
          { transform: ["translateY(-6%)", "translateY(8%)"] },
          { ease: "linear" },
        ),
        { target: hero, offset: ["start start", "end start"] },
      );
      var about = $("#about");
      M.scroll(
        M.animate(
          ".parallax-slow",
          { transform: ["translateY(-8%)", "translateY(0%)"] },
          { ease: "linear" },
        ),
        { target: about, offset: ["start end", "end start"] },
      );
      M.inView(
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
      );
    } catch (err) {
      document.documentElement.classList.remove("motion-ready");
    }
  }

  /* Portfolio filter */
  var fBtns = $$(".filters button"),
    works = $$(".work");
  fBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.dataset.filter;
      fBtns.forEach(function (x) {
        x.setAttribute("aria-pressed", x === b);
      });
      works.forEach(function (w) {
        var show = f === "all" || w.dataset.cat === f;
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
  var starSvg =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z"/></svg>';
  var halfSvg =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="hg"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="rgba(255,184,0,.25)"/></linearGradient></defs><path fill="url(#hg)" d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z"/></svg>';
  $$(".stars").forEach(function (s) {
    s.innerHTML = s.dataset.half
      ? starSvg.repeat(4) + halfSvg
      : starSvg.repeat(5);
  });
  var slider = $("#slider"),
    slides = $$(".slide"),
    dotsWrap = $("#s-dots"),
    cur = 0,
    timer = null,
    DUR = 6500;
  slider.style.setProperty("--dur", DUR + "ms");
  slides.forEach(function (_, i) {
    var d = document.createElement("button");
    d.type = "button";
    d.setAttribute("aria-label", "Show testimonial " + (i + 1));
    d.setAttribute("data-testid", "testimonial-dot-" + (i + 1));
    d.addEventListener("click", function () {
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
  slider.addEventListener("mouseenter", function () {
    slider.classList.add("paused");
    clearInterval(timer);
  });
  slider.addEventListener("mouseleave", function () {
    slider.classList.remove("paused");
    restart();
  });
  slider.addEventListener("focusin", function () {
    slider.classList.add("paused");
    clearInterval(timer);
  });
  slider.addEventListener("focusout", function () {
    slider.classList.remove("paused");
    restart();
  });
  show(0);
  restart();

  /* Consultation form */
  var form = $("#lead-form"),
    F = form.elements,
    success = $("#success"),
    alertEl = $("#form-alert"),
    submit = $("#f-submit");
  var apiMeta = document.querySelector('meta[name="api-base"]');
  var API =
    apiMeta && /^https?:\/\//.test(apiMeta.content)
      ? apiMeta.content.replace(/\/$/, "")
      : "";
  function setErr(id, inputs, msg) {
    $("#e-" + id).textContent = msg;
    inputs.forEach(function (el) {
      el.setAttribute("aria-invalid", msg ? "true" : "false");
    });
    return !msg;
  }
  function validate() {
    var name = F.name.value.trim(),
      email = F.email.value.trim(),
      msg = F.message.value.trim();
    var svc = form.querySelector('input[name="service"]:checked');
    var ok = [
      setErr(
        "name",
        [F.name],
        name.length < 2 ? "Please enter your name." : "",
      ),
      setErr(
        "email",
        [F.email],
        !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
          ? "Please enter a valid email address."
          : "",
      ),
      setErr("service", [], svc ? "" : "Please choose a service."),
      setErr(
        "msg",
        [F.message],
        msg.length < 10
          ? "Please add a few more details (10+ characters)."
          : "",
      ),
    ];
    var first =
      form.querySelector('[aria-invalid="true"]') ||
      (!svc && form.querySelector('input[name="service"]'));
    if (first && ok.indexOf(false) > -1) first.focus();
    return ok.indexOf(false) === -1;
  }
  ["name", "email", "message"].forEach(function (n) {
    F[n].addEventListener("blur", function () {
      if (F[n].value) validate();
    });
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    alertEl.textContent = "";
    if (!validate()) return;
    if (F.company_site.value) return;
    var payload = {
      name: F.name.value.trim(),
      email: F.email.value.trim(),
      service: form.querySelector('input[name="service"]:checked').value,
      budget: F.budget.value || null,
      message: F.message.value.trim(),
    };
    var done = function () {
      $("#s-name").textContent = payload.name.split(" ")[0];
      $("#s-email").textContent = payload.email;
      form.hidden = true;
      success.hidden = false;
      $("#success-title").focus({ preventScroll: true });
    };
    if (!API) {
      done();
      return;
    }
    submit.disabled = true;
    submit.classList.add("loading");
    fetch(API + "/api/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(done)
      .catch(function () {
        alertEl.textContent =
          "Something went wrong sending your request. Please try again or email hello@example.com.";
      })
      .finally(function () {
        submit.disabled = false;
        submit.classList.remove("loading");
      });
  });
  $("#again").addEventListener("click", function () {
    form.reset();
    form.hidden = false;
    success.hidden = true;
    F.name.focus();
  });
});
