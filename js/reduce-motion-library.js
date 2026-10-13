document.addEventListener("DOMContentLoaded", function () {
  var e = window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    t = window.matchMedia("(pointer: fine)").matches,
    n = function (e, t) {
      return (t || document).querySelector(e);
    },
    a = function (e, t) {
      return Array.prototype.slice.call((t || document).querySelectorAll(e));
    };
  document.getElementById("year").textContent = new Date().getFullYear();
  var r = null;
  if (window.Lenis && !e) {
    r = new Lenis({ lerp: 0.085, smoothWheel: !0 });
    var i = function (e) {
      (r.raf(e), requestAnimationFrame(i));
    };
    requestAnimationFrame(i);
  }
  function o(t) {
    var a = "#top" === t ? document.body : n(t);
    a &&
      (r
        ? r.scrollTo("#top" === t ? 0 : a, { offset: -72, duration: 1.4 })
        : a.scrollIntoView({ behavior: e ? "auto" : "smooth" }));
  }
  var s = n("#nav"),
    l = n("#burger"),
    c = n("#mmenu");
  function d() {
    s.classList.toggle("scrolled", window.scrollY > 30);
  }
  function u(e) {
    (l.setAttribute("aria-expanded", e),
      l.setAttribute("aria-label", e ? "Close menu" : "Open menu"),
      c.classList.toggle("open", e),
      r && (e ? r.stop() : r.start()));
  }
  (window.addEventListener("scroll", d, { passive: !0 }),
    d(),
    l.addEventListener("click", function () {
      u("true" !== l.getAttribute("aria-expanded"));
    }),
    document.addEventListener("keydown", function (e) {
      "Escape" === e.key && u(!1);
    }),
    a('a[href^="#"]').forEach(function (e) {
      e.addEventListener("click", function (t) {
        var n = e.getAttribute("href");
        n.length < 2 || (t.preventDefault(), u(!1), o(n));
      });
    }),
    n("#to-top").addEventListener("click", function () {
      o("#top");
    }));
  var f = n(".hero"),
    m = n("#tilt");
  t &&
    !e &&
    (f.addEventListener("pointermove", function (e) {
      var t = f.getBoundingClientRect(),
        n = (e.clientX - t.left) / t.width - 0.5,
        a = (e.clientY - t.top) / t.height - 0.5;
      m.style.transform =
        "rotateY(" + 14 * n + "deg) rotateX(" + 12 * -a + "deg)";
    }),
    f.addEventListener("pointerleave", function () {
      m.style.transform = "";
    }));
  var v,
    p,
    h = n("#field"),
    g = h.getContext("2d"),
    y = Math.min(window.devicePixelRatio || 1, 2),
    E = !0,
    L = { x: 0.5, y: 0.5 };
  function b() {
    ((v = h.clientWidth),
      (p = h.clientHeight),
      (h.width = v * y),
      (h.height = p * y),
      g.setTransform(y, 0, 0, y, 0, 0));
  }
  function w(e) {
    if (E) {
      g.clearRect(0, 0, v, p);
      for (var t = v < 700 ? 28 : 46, n = 45e-5 * e, a = 0; a < 22; a++)
        for (var r = a / 22, i = 0.35 + 0.9 * r, o = 0; o < t; o++) {
          var s = o / (t - 1) - 0.5,
            l =
              Math.sin(7 * s + 2 * n + 5 * r) * Math.cos(4 * r - n) * 26 +
              10 * Math.sin(3 * (s - (L.x - 0.5))),
            c = v / 2 + s * v * 1.5 * i,
            d = 0.48 * p + r * r * p * 0.62 + l * i,
            u = 0.12 + 0.55 * r;
          ((g.fillStyle =
            (o + a) % 9 == 0
              ? "rgba(45,212,191," + u + ")"
              : "rgba(0,229,255," + 0.7 * u + ")"),
            g.fillRect(c, d, 1.6 * i, 1.6 * i));
        }
      requestAnimationFrame(w);
    }
  }
  (b(),
    window.addEventListener("resize", b),
    f.addEventListener("pointermove", function (e) {
      ((L.x = e.clientX / v), (L.y = e.clientY / p));
    }),
    e
      ? ((E = !0), w(0), (E = !1))
      : (new IntersectionObserver(function (e) {
          var t = e[0].isIntersecting;
          (t && !E && ((E = !0), requestAnimationFrame(w)), (E = t));
        }).observe(f),
        requestAnimationFrame(w)),
    t &&
      !e &&
      a(".magnetic").forEach(function (e) {
        (e.addEventListener("pointermove", function (t) {
          var n = e.getBoundingClientRect();
          (e.style.setProperty(
            "--bx",
            0.25 * (t.clientX - n.left - n.width / 2) + "px",
          ),
            e.style.setProperty(
              "--by",
              0.35 * (t.clientY - n.top - n.height / 2) + "px",
            ));
        }),
          e.addEventListener("pointerleave", function () {
            (e.style.setProperty("--bx", "0px"),
              e.style.setProperty("--by", "0px"));
          }));
      }),
    a(".card, .work").forEach(function (e) {
      e.addEventListener("pointermove", function (t) {
        var n = e.getBoundingClientRect();
        (e.style.setProperty("--mx", t.clientX - n.left + "px"),
          e.style.setProperty("--my", t.clientY - n.top + "px"));
      });
    }));
  var x = window.Motion;
  if (x && !e)
    try {
      (document.documentElement.classList.add("motion-ready"),
        x.inView(
          "[data-reveal]",
          function (e) {
            var t = e.target || e;
            x.animate(
              t,
              {
                opacity: [0, 1],
                transform: ["translateY(36px)", "translateY(0px)"],
              },
              {
                duration: 1,
                delay: parseFloat(t.dataset.delay || 0),
                ease: [0.22, 1, 0.36, 1],
              },
            );
          },
          { amount: 0.12 },
        ),
        x.scroll(
          x.animate(
            ".parallax-img",
            { transform: ["translateY(-6%)", "translateY(8%)"] },
            { ease: "linear" },
          ),
          { target: f, offset: ["start start", "end start"] },
        ));
      var A = n("#about");
      (x.scroll(
        x.animate(
          ".parallax-slow",
          { transform: ["translateY(-8%)", "translateY(0%)"] },
          { ease: "linear" },
        ),
        { target: A, offset: ["start end", "end start"] },
      ),
        x.inView(
          "[data-count]",
          function (e) {
            var t = e.target || e,
              n = parseFloat(t.dataset.count),
              a = +(t.dataset.dec || 0),
              r = t.dataset.suffix || "";
            x.animate(0, n, {
              duration: 1.8,
              ease: [0.22, 1, 0.36, 1],
              onUpdate: function (e) {
                t.textContent = e.toFixed(a) + r;
              },
            });
          },
          { amount: 0.3 },
        ));
    } catch (e) {
      document.documentElement.classList.remove("motion-ready");
    }
  var C = a(".filters button"),
    k = a(".work");
  C.forEach(function (t) {
    t.addEventListener("click", function () {
      var n = t.dataset.filter;
      (C.forEach(function (e) {
        e.setAttribute("aria-pressed", e === t);
      }),
        k.forEach(function (t) {
          var a = "all" === n || t.dataset.cat === n;
          ((t.hidden = !a),
            a &&
              ((t.style.opacity = 1),
              x &&
                !e &&
                x.animate(
                  t,
                  { opacity: [0, 1], transform: ["scale(.96)", "scale(1)"] },
                  { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                )));
        }));
    });
  });
  var S =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z"/></svg>';
  a(".stars").forEach(function (e) {
    e.innerHTML = e.dataset.half
      ? S.repeat(4) +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="hg"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="rgba(255,184,0,.25)"/></linearGradient></defs><path fill="url(#hg)" d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z"/></svg>'
      : S.repeat(5);
  });
  var P = n("#slider"),
    q = a(".slide"),
    Y = n("#s-dots"),
    M = 0,
    F = null;
  (P.style.setProperty("--dur", "6500ms"),
    q.forEach(function (e, t) {
      var n = document.createElement("button");
      ((n.type = "button"),
        n.setAttribute("aria-label", "Show testimonial " + (t + 1)),
        n.setAttribute("data-testid", "testimonial-dot-" + (t + 1)),
        n.addEventListener("click", function () {
          (O(t), B());
        }),
        Y.appendChild(n));
    }));
  var I = a("button", Y);
  function O(e) {
    ((M = (e + q.length) % q.length),
      q.forEach(function (e, t) {
        (e.classList.toggle("is-active", t === M),
          e.setAttribute("aria-hidden", t !== M));
      }),
      I.forEach(function (e, t) {
        (e.removeAttribute("aria-current"),
          t === M && (e.offsetWidth, e.setAttribute("aria-current", "true")));
      }),
      (n("#s-cur").textContent = String(M + 1).padStart(2, "0")));
  }
  function B() {
    (clearInterval(F),
      e ||
        P.classList.contains("paused") ||
        (F = setInterval(function () {
          O(M + 1);
        }, 6500)));
  }
  (n("#s-prev").addEventListener("click", function () {
    (O(M - 1), B());
  }),
    n("#s-next").addEventListener("click", function () {
      (O(M + 1), B());
    }),
    P.addEventListener("mouseenter", function () {
      (P.classList.add("paused"), clearInterval(F));
    }),
    P.addEventListener("mouseleave", function () {
      (P.classList.remove("paused"), B());
    }),
    P.addEventListener("focusin", function () {
      (P.classList.add("paused"), clearInterval(F));
    }),
    P.addEventListener("focusout", function () {
      (P.classList.remove("paused"), B());
    }),
    O(0),
    B());
  var R = n("#lead-form"),
    T = R.elements,
    X = n("#success"),
    D = n("#form-alert"),
    z = n("#f-submit"),
    V = document.querySelector('meta[name="api-base"]'),
    W = V && /^https?:\/\//.test(V.content) ? V.content.replace(/\/$/, "") : "";
  function j(e, t, a) {
    return (
      (n("#e-" + e).textContent = a),
      t.forEach(function (e) {
        e.setAttribute("aria-invalid", a ? "true" : "false");
      }),
      !a
    );
  }
  function G() {
    var e = T.name.value.trim(),
      t = T.email.value.trim(),
      n = T.message.value.trim(),
      a = R.querySelector('input[name="service"]:checked'),
      r = [
        j("name", [T.name], e.length < 2 ? "Please enter your name." : ""),
        j(
          "email",
          [T.email],
          /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)
            ? ""
            : "Please enter a valid email address.",
        ),
        j("service", [], a ? "" : "Please choose a service."),
        j(
          "msg",
          [T.message],
          n.length < 10
            ? "Please add a few more details (10+ characters)."
            : "",
        ),
      ],
      i =
        R.querySelector('[aria-invalid="true"]') ||
        (!a && R.querySelector('input[name="service"]'));
    return (i && r.indexOf(!1) > -1 && i.focus(), -1 === r.indexOf(!1));
  }
  (["name", "email", "message"].forEach(function (e) {
    T[e].addEventListener("blur", function () {
      T[e].value && G();
    });
  }),
    R.addEventListener("submit", function (e) {
      if (
        (e.preventDefault(), (D.textContent = ""), G() && !T.company_site.value)
      ) {
        var t = {
            name: T.name.value.trim(),
            email: T.email.value.trim(),
            service: R.querySelector('input[name="service"]:checked').value,
            budget: T.budget.value || null,
            message: T.message.value.trim(),
          },
          a = function () {
            ((n("#s-name").textContent = t.name.split(" ")[0]),
              (n("#s-email").textContent = t.email),
              (R.hidden = !0),
              (X.hidden = !1),
              n("#success-title").focus({ preventScroll: !0 }));
          };
        W
          ? ((z.disabled = !0),
            z.classList.add("loading"),
            fetch(W + "/api/consultations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(t),
            })
              .then(function (e) {
                if (!e.ok) throw new Error(e.status);
                return e.json();
              })
              .then(a)
              .catch(function () {
                D.textContent =
                  "Something went wrong sending your request. Please try again or email hello@example.com.";
              })
              .finally(function () {
                ((z.disabled = !1), z.classList.remove("loading"));
              }))
          : a();
      }
    }),
    n("#again").addEventListener("click", function () {
      (R.reset(), (R.hidden = !1), (X.hidden = !0), T.name.focus());
    }));
});
