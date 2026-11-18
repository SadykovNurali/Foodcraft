/* ==========================================================
   Food Craft — main script
   Sections:
   1. Helpers & storage      6. Auth (sign up / log in / profile)
   2. Theme (light / dark)   7. Sport Food (search + filter)
   3. Header & UI effects    8. Recipes (public API: TheMealDB)
   4. Favorites & cart       9. Meal builder
   5. Form validation       10. Order  11. Contact  12. Boot
   ========================================================== */
(function () {
  "use strict";

  const DATA = window.FC_DATA;

  /* ---------- 1. Helpers & storage ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Safe localStorage wrapper (private mode / blocked storage must not break the site)
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
    }
  };

  const KEY = {
    theme: "fc_theme", users: "fc_users", session: "fc_session", favs: "fc_favs",
    cart: "fc_cart", bowls: "fc_bowls", orders: "fc_orders", messages: "fc_messages",
    sport: "fc_sport_filter", recipe: "fc_recipe_search", recent: "fc_recent_searches",
    orderSeq: "fc_order_seq"
  };

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => Number(n).toLocaleString("ru-RU").replace(/\u00a0/g, " ") + " ₸";
  const ic = (name, cls) => `<svg class="icon ${cls || ""}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  function toast(message) {
    let host = $(".toast-host");
    if (!host) {
      host = document.createElement("div");
      host.className = "toast-host";
      host.setAttribute("role", "status");
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; }, 2200);
    setTimeout(() => el.remove(), 2600);
  }

  /* ---------- 2. Theme (light / dark) ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const sw = $("#themeSwitch");
    if (sw) {
      sw.setAttribute("aria-checked", String(theme === "dark"));
      sw.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
  }

  function initTheme() {
    // The very first paint is handled by the inline snippet in <head>; this wires the switch.
    applyTheme(document.documentElement.getAttribute("data-theme") || "light");
    const sw = $("#themeSwitch");
    if (!sw) return;
    sw.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      store.set(KEY.theme, next);   // persisted, so every page opens in the same mode
    });
    // Keep several open tabs in sync
    window.addEventListener("storage", (e) => {
      if (e.key === KEY.theme && e.newValue) applyTheme(JSON.parse(e.newValue));
    });
  }

  /* ---------- 3. Header & UI effects ---------- */
  function initHeader() {
    const toggle = $("#navToggle");
    const nav = $("#mainNav");
    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      nav.addEventListener("click", (e) => { if (e.target.closest("a")) nav.classList.remove("is-open"); });
    }
    updateAuthLink();
    updateCartBadge();
  }

  // Scroll-reveal + animated counters
  let revealObserver = null;
  function revealAll(root = document) {
    const items = $$(".reveal:not(.is-visible)", root);
    if (!("IntersectionObserver" in window)) { items.forEach((i) => i.classList.add("is-visible")); return; }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add("is-visible"); revealObserver.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
    }
    items.forEach((i) => revealObserver.observe(i));
  }

  function initCounters() {
    const counters = $$("[data-count]");
    if (!counters.length) return;
    const run = (el) => {
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const start = performance.now();
      const dur = 1200;
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!("IntersectionObserver" in window)) { counters.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.5 });
    counters.forEach((c) => io.observe(c));
  }

  /* ---------- 4. Favorites & cart (localStorage) ---------- */
  const getFavs = () => store.get(KEY.favs, []);
  const isFav = (id) => getFavs().some((f) => f.id === id);
  function toggleFav(item) {
    let favs = getFavs();
    if (favs.some((f) => f.id === item.id)) {
      favs = favs.filter((f) => f.id !== item.id);
      toast("Removed from saved");
    } else {
      favs.push(item);
      toast("Saved to your profile");
    }
    store.set(KEY.favs, favs);
    return favs.some((f) => f.id === item.id);
  }

  const getCart = () => store.get(KEY.cart, []);
  function cartAdd(item) {
    const cart = getCart();
    const found = cart.find((c) => c.id === item.id);
    if (found) found.qty += 1; else cart.push({ ...item, qty: 1 });
    store.set(KEY.cart, cart);
    updateCartBadge();
    toast(`Added: ${item.name}`);
  }
  const cartSubtotal = (cart = getCart()) => cart.reduce((s, c) => s + c.price * c.qty, 0);
  function updateCartBadge() {
    const link = $('#mainNav a[data-page="order"]');
    if (!link) return;
    const count = getCart().reduce((s, c) => s + c.qty, 0);
    let badge = $(".cart-badge", link);
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "cart-badge";
      link.appendChild(badge);
    }
    badge.textContent = count ? ` (${count})` : "";
  }

  /* ---------- 5. Form validation (JavaScript only — no HTML attributes) ---------- */
  const V = {
    required: (label) => (v) => v.trim() !== "" || `${label} is required.`,
    minLen: (n, label) => (v) => v.trim().length >= n || `${label} must be at least ${n} characters.`,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Enter a valid email, e.g. name@example.com.",
    // Kazakhstan format: +7 701 123 45 67 / 8 (701) 123-45-67
    phone: (v) => /^(\+7|8)[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/.test(v.trim()) || "Use the format +7 701 123 45 67.",
    password: (v) => {
      if (v.length < 8) return "Password must be at least 8 characters.";
      if (!/[a-z]/.test(v)) return "Add at least one lowercase letter.";
      if (!/[A-Z]/.test(v)) return "Add at least one uppercase letter.";
      if (!/\d/.test(v)) return "Add at least one digit.";
      return true;
    },
    match: (otherName, label) => (v, form) => v === form.elements[otherName].value || `${label} do not match.`,
    // Run a rule only when the field is not empty (for optional fields)
    optional: (rule) => (v, form) => (v.trim() === "" ? true : rule(v, form)),
    custom: (fn) => fn
  };

  /**
   * Attach validation to a form. schema = { fieldName: [rule, rule, ...] }.
   * Errors are rendered inside the form (.error-msg), never in alert().
   */
  function setupForm(form, schema, onValid) {
    form.setAttribute("novalidate", "");

    function check(name) {
      const el = form.elements[name];
      if (!el) return true;
      const field = el.closest(".field");
      const msg = field && $(".error-msg", field);
      let error = "";
      for (const rule of schema[name]) {
        const res = rule(el.value, form);
        if (res !== true) { error = res; break; }
      }
      if (field) {
        field.classList.toggle("has-error", Boolean(error));
        field.classList.toggle("is-valid", !error && el.value.trim() !== "");
      }
      if (msg) msg.textContent = error;
      el.setAttribute("aria-invalid", error ? "true" : "false");
      return !error;
    }

    Object.keys(schema).forEach((name) => {
      const el = form.elements[name];
      if (!el) return;
      el.addEventListener("blur", () => check(name));
      el.addEventListener("input", () => {
        const f = el.closest(".field");
        if (f && (f.classList.contains("has-error") || f.classList.contains("is-valid"))) check(name);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const results = Object.keys(schema).map(check);
      if (results.every(Boolean)) {
        onValid(Object.fromEntries(new FormData(form)), form);
      } else {
        const bad = Object.keys(schema).find((n) => form.elements[n] && form.elements[n].getAttribute("aria-invalid") === "true");
        if (bad) form.elements[bad].focus();
      }
    });
    return { check };
  }

  function showAlert(form, type, text) {
    let box = $(".alert", form);
    if (!box) return;
    box.className = `alert alert--${type} is-shown`;
    box.textContent = text;
  }

  function initPasswordToggles() {
    $$(".pw-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = btn.parentElement.querySelector("input");
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
        btn.innerHTML = ic(show ? "eye-off" : "eye");
      });
    });
  }

  function initStrengthMeter() {
    const input = $("#password[data-strength]");
    const bar = $(".strength span");
    if (!input || !bar) return;
    input.addEventListener("input", () => {
      const v = input.value;
      let score = 0;
      if (v.length >= 8) score++;
      if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
      if (/\d/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
      bar.style.width = (score * 25) + "%";
      bar.style.background = score <= 1 ? "var(--danger)" : score === 2 ? "var(--accent)" : "var(--success)";
    });
  }

  /* ---------- 6. Auth simulation (localStorage) ---------- */
  // NOTE: there is no backend, so accounts live in the browser only.
  // The password is hashed (SHA-256) before being stored — never keep plain text.
  async function hashPassword(pw) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
      return "sha256:" + Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    return "b64:" + btoa(unescape(encodeURIComponent(pw))); // fallback for non-secure contexts
  }

  const getUsers = () => store.get(KEY.users, []);
  const currentUser = () => {
    const email = store.get(KEY.session, null);
    return email ? getUsers().find((u) => u.email === email) || null : null;
  };

  function updateAuthLink() {
    const slot = $("#authLink");
    if (!slot) return;
    const user = currentUser();
    if (user) {
      slot.href = "profile.html";
      slot.innerHTML = `${ic("user")} <span>${esc(user.name.split(" ")[0])}</span>`;
      slot.setAttribute("aria-label", "Open your profile");
    } else {
      slot.href = "login.html";
      slot.innerHTML = `${ic("user")} <span>Log in</span>`;
      slot.setAttribute("aria-label", "Log in");
    }
  }

  function initSignup() {
    const form = $("#signupForm");
    if (!form) return;
    setupForm(form, {
      name: [V.required("Name"), V.minLen(2, "Name")],
      email: [V.required("Email"), V.email],
      phone: [V.required("Phone number"), V.phone],
      password: [V.required("Password"), V.password],
      confirm: [V.required("Password confirmation"), V.match("password", "Passwords")]
    }, async (vals) => {
      const users = getUsers();
      const email = vals.email.trim().toLowerCase();
      if (users.some((u) => u.email === email)) {
        showAlert(form, "error", "An account with this email already exists. Try logging in.");
        return;
      }
      users.push({ name: vals.name.trim(), email, phone: vals.phone.trim(), password: await hashPassword(vals.password) });
      store.set(KEY.users, users);
      showAlert(form, "success", "Account created! Redirecting to log in…");
      setTimeout(() => { location.href = "login.html?registered=1"; }, 900);
    });
  }

  function initLogin() {
    const form = $("#loginForm");
    if (!form) return;
    if (new URLSearchParams(location.search).get("registered")) {
      showAlert(form, "success", "Account created. Log in with your email and password.");
    }
    if (new URLSearchParams(location.search).get("loggedout")) {
      showAlert(form, "success", "You have been logged out.");
    }
    setupForm(form, {
      email: [V.required("Email"), V.email],
      password: [V.required("Password")]
    }, async (vals) => {
      const email = vals.email.trim().toLowerCase();
      const user = getUsers().find((u) => u.email === email);
      const hash = await hashPassword(vals.password);
      if (!user || user.password !== hash) {
        showAlert(form, "error", "Incorrect email or password.");
        return;
      }
      store.set(KEY.session, user.email);
      location.href = "profile.html";
    });
  }

  function initProfile() {
    const root = $("#profileRoot");
    if (!root) return;
    const user = currentUser();
    if (!user) { location.replace("login.html"); return; }

    $("#pName").textContent = user.name;
    $("#pEmail").textContent = user.email;
    $("#pAvatar").textContent = user.name.trim().charAt(0).toUpperCase();
    $("#dName").textContent = user.name;
    $("#dEmail").textContent = user.email;
    $("#dPhone").textContent = user.phone;
    $("#dPass").textContent = "•".repeat(10) + " (stored as a hash)";

    $("#logoutBtn").addEventListener("click", () => {
      store.remove(KEY.session);
      location.href = "login.html?loggedout=1";
    });

    // Edit profile form
    const form = $("#editForm");
    form.elements.name.value = user.name;
    form.elements.phone.value = user.phone;
    setupForm(form, {
      name: [V.required("Name"), V.minLen(2, "Name")],
      phone: [V.required("Phone number"), V.phone]
    }, (vals) => {
      const users = getUsers();
      const me = users.find((u) => u.email === user.email);
      me.name = vals.name.trim();
      me.phone = vals.phone.trim();
      store.set(KEY.users, users);
      showAlert(form, "success", "Profile updated.");
      $("#pName").textContent = $("#dName").textContent = me.name;
      $("#dPhone").textContent = me.phone;
      $("#pAvatar").textContent = me.name.charAt(0).toUpperCase();
      updateAuthLink();
    });

    renderProfileLists(user);
  }

  function renderProfileLists(user) {
    // Saved meals
    const favs = getFavs();
    const favBox = $("#favList");
    favBox.innerHTML = favs.length
      ? favs.map((f) => `
        <article class="card"><div class="card-media"><img src="${esc(f.img)}" alt="${esc(f.name)}" loading="lazy" onerror="this.src='images/healthy-meal.jpg'"></div>
        <div class="card-body"><h3>${esc(f.name)}</h3><p>${esc(f.meta || "")}</p>
        <div class="card-actions"><button class="btn btn--danger btn--sm" data-unfav="${esc(f.id)}">${ic("trash")} Remove</button></div></div></article>`).join("")
      : `<p class="state">No saved meals yet. Tap the heart on any meal or recipe.</p>`;
    favBox.onclick = (e) => {
      const b = e.target.closest("[data-unfav]");
      if (!b) return;
      store.set(KEY.favs, getFavs().filter((f) => f.id !== b.dataset.unfav));
      renderProfileLists(user);
    };

    // Saved bowls
    const bowls = store.get(KEY.bowls, []);
    $("#bowlList").innerHTML = bowls.length
      ? bowls.map((b) => `<li><span><strong>${esc(b.name)}</strong><br><small class="hint">${b.kcal} kcal · ${b.protein} g protein</small></span><span>${money(b.price)}</span></li>`).join("")
      : `<li><span class="hint">No saved bowls yet — create one in the Meal Builder.</span></li>`;

    // Orders (this user only)
    const orders = store.get(KEY.orders, []).filter((o) => o.email === user.email);
    $("#orderList").innerHTML = orders.length
      ? orders.map((o) => `<li><span><strong>Order ${esc(o.number)}</strong><br><small class="hint">${o.items.reduce((s, i) => s + i.qty, 0)} item(s) · ${esc(o.zone)}</small></span><span>${money(o.total)}</span></li>`).join("")
      : `<li><span class="hint">No orders yet.</span></li>`;
  }

  /* ---------- Shared: local meal card ---------- */
  function mealCard(m) {
    const saved = isFav("l:" + m.id);
    return `
      <article class="card reveal" data-meal="${m.id}">
        <div class="card-media">
          <img src="images/${esc(m.img)}" alt="${esc(m.name)}" loading="lazy">
          <button type="button" class="fav-btn ${saved ? "is-saved" : ""}" data-fav="${m.id}" aria-pressed="${saved}" aria-label="Save ${esc(m.name)}">${ic("heart")}</button>
        </div>
        <div class="card-body">
          <div class="tags"><span class="tag tag--kcal">${ic("flame")} ${m.kcal} kcal</span><span class="tag tag--protein">${m.protein} g protein</span></div>
          <h3>${esc(m.name)}</h3>
          <p>${esc(m.desc)}</p>
          <div class="card-actions">
            <strong>${money(m.price)}</strong>
            <button type="button" class="btn btn--sm" data-add="${m.id}" style="margin-left:auto">${ic("plus")} Add to order</button>
          </div>
        </div>
      </article>`;
  }

  function bindMealCards(container) {
    container.addEventListener("click", (e) => {
      const favBtn = e.target.closest("[data-fav]");
      const addBtn = e.target.closest("[data-add]");
      if (favBtn) {
        const m = DATA.meals.find((x) => x.id === favBtn.dataset.fav);
        const saved = toggleFav({ id: "l:" + m.id, name: m.name, img: "images/" + m.img, meta: `${m.kcal} kcal · ${m.protein} g protein` });
        favBtn.classList.toggle("is-saved", saved);
        favBtn.setAttribute("aria-pressed", String(saved));
      }
      if (addBtn) {
        const m = DATA.meals.find((x) => x.id === addBtn.dataset.add);
        cartAdd({ id: "m:" + m.id, name: m.name, price: m.price, kcal: m.kcal });
      }
    });
  }

  /* ---------- Home: featured meals ---------- */
  function initHome() {
    const box = $("#featured");
    if (!box) return;
    const ids = ["pancakes", "salmon", "quinoa-bowl", "shake"];
    box.innerHTML = ids.map((id) => mealCard(DATA.meals.find((m) => m.id === id))).join("");
    bindMealCards(box);
    revealAll(box);
  }

  /* ---------- 7. Sport Food: search + filter (state saved in localStorage) ---------- */
  function initSport() {
    const grid = $("#mealGrid");
    if (!grid) return;
    const input = $("#mealSearch");
    const sortSel = $("#mealSort");
    const chips = $$("#mealChips .chip");
    const count = $("#mealCount");
    const saved = store.get(KEY.sport, { q: "", cat: "all", sort: "default" });
    const state = { q: saved.q || "", cat: saved.cat || "all", sort: saved.sort || "default" };

    input.value = state.q;
    sortSel.value = state.sort;
    chips.forEach((c) => c.classList.toggle("is-active", c.dataset.cat === state.cat));

    function render() {
      const q = state.q.trim().toLowerCase();
      let list = DATA.meals.filter((m) =>
        (state.cat === "all" || m.cat === state.cat) &&
        (!q || m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)));
      if (state.sort === "kcal-asc") list.sort((a, b) => a.kcal - b.kcal);
      if (state.sort === "kcal-desc") list.sort((a, b) => b.kcal - a.kcal);
      if (state.sort === "protein-desc") list.sort((a, b) => b.protein - a.protein);
      count.textContent = `Showing ${list.length} of ${DATA.meals.length} meals`;
      grid.innerHTML = list.length
        ? list.map(mealCard).join("")
        : `<div class="state">No meals match “${esc(state.q)}”. Try another word or reset the filters.</div>`;
      revealAll(grid);
      store.set(KEY.sport, state);   // remember the last search/filter
    }

    input.addEventListener("input", debounce(() => { state.q = input.value; render(); }, 200));
    sortSel.addEventListener("change", () => { state.sort = sortSel.value; render(); });
    chips.forEach((chip) => chip.addEventListener("click", () => {
      state.cat = chip.dataset.cat;
      chips.forEach((c) => c.classList.toggle("is-active", c === chip));
      render();
    }));
    $("#mealReset").addEventListener("click", () => {
      state.q = ""; state.cat = "all"; state.sort = "default";
      input.value = ""; sortSel.value = "default";
      chips.forEach((c) => c.classList.toggle("is-active", c.dataset.cat === "all"));
      render();
    });
    bindMealCards(grid);
    render();
  }

  /* ---------- 8. Recipes: public API (TheMealDB, no key needed) ---------- */
  const API = "https://www.themealdb.com/api/json/v1/1/";

  async function apiGet(path) {
    const res = await fetch(API + path);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  function initRecipes() {
    const grid = $("#apiGrid");
    if (!grid) return;
    const form = $("#recipeForm");
    const input = $("#recipeSearch");
    const meta = $("#recipeMeta");
    const recentBox = $("#recentSearches");
    let token = 0;       // ignore out-of-date responses
    let current = [];    // meals currently on screen

    function mealThumb(m) { return m.strMealThumb ? m.strMealThumb + "/medium" : "images/healthy-meal.jpg"; }

    function showLoading(text) {
      grid.innerHTML = `<div class="state" role="status"><div class="spinner"></div>${esc(text)}</div>`;
    }
    function showError(message, retry) {
      grid.innerHTML = `<div class="state error" role="alert"><p>${esc(message)}</p><button type="button" class="btn btn--ghost btn--sm" id="retryBtn">${ic("refresh", "icon-spin")} Try again</button></div>`;
      $("#retryBtn").addEventListener("click", retry);
    }

    function renderMeals(meals) {
      current = meals;
      grid.innerHTML = meals.map((m) => {
        const saved = isFav("a:" + m.idMeal);
        return `
        <article class="card reveal">
          <div class="card-media">
            <img src="${esc(mealThumb(m))}" alt="${esc(m.strMeal)}" loading="lazy" onerror="this.src='images/healthy-meal.jpg'">
            <button type="button" class="fav-btn ${saved ? "is-saved" : ""}" data-fav="${esc(m.idMeal)}" aria-pressed="${saved}" aria-label="Save ${esc(m.strMeal)}">${ic("heart")}</button>
          </div>
          <div class="card-body">
            <div class="tags"><span class="tag">${esc(m.strCategory || "Recipe")}</span><span class="tag">${esc(m.strArea || "World")}</span></div>
            <h3>${esc(m.strMeal)}</h3>
            <div class="card-actions"><button type="button" class="btn btn--sm" data-open="${esc(m.idMeal)}">View recipe ${ic("arrow-right", "icon-arrow")}</button></div>
          </div>
        </article>`;
      }).join("");
      revealAll(grid);
    }

    async function search(term) {
      term = term.trim();
      if (!term) return;
      const my = ++token;
      store.set(KEY.recipe, term);
      pushRecent(term);
      $$("#recipeChips .chip").forEach((c) => c.classList.toggle("is-active", c.dataset.term.toLowerCase() === term.toLowerCase()));
      showLoading(`Searching recipes for “${term}”…`);
      meta.textContent = "";
      try {
        const data = await apiGet("search.php?s=" + encodeURIComponent(term));
        if (my !== token) return;
        const meals = data.meals || [];
        if (!meals.length) {
          current = [];
          grid.innerHTML = `<div class="state">No recipes found for “${esc(term)}”. Try “chicken”, “salmon” or “egg”.</div>`;
          return;
        }
        meta.textContent = `${meals.length} recipe${meals.length === 1 ? "" : "s"} found for “${term}”`;
        renderMeals(meals);
      } catch (err) {
        if (my !== token) return;
        showError("We could not load recipes. Check your internet connection and try again.", () => search(term));
      }
    }

    async function randomRecipe() {
      const my = ++token;
      showLoading("Picking a random recipe…");
      meta.textContent = "";
      try {
        const data = await apiGet("random.php");
        if (my !== token) return;
        renderMeals(data.meals || []);
        meta.textContent = "Random pick";
        $$("#recipeChips .chip").forEach((c) => c.classList.remove("is-active"));
      } catch (err) {
        if (my !== token) return;
        showError("The random recipe could not be loaded. Please try again.", randomRecipe);
      }
    }

    function pushRecent(term) {
      const list = store.get(KEY.recent, []).filter((t) => t.toLowerCase() !== term.toLowerCase());
      list.unshift(term);
      store.set(KEY.recent, list.slice(0, 5));
      drawRecent();
    }
    function drawRecent() {
      const list = store.get(KEY.recent, []);
      recentBox.innerHTML = list.length
        ? `<span class="hint">Recent:</span>` + list.map((t) => `<button type="button" class="chip" data-recent="${esc(t)}">${esc(t)}</button>`).join("")
        : "";
    }

    function openModal(meal) {
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        const name = meal["strIngredient" + i];
        if (name && name.trim()) ingredients.push(`${(meal["strMeasure" + i] || "").trim()} ${name.trim()}`.trim());
      }
      const steps = (meal.strInstructions || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      const modal = $("#recipeModal");
      $("#modalContent").innerHTML = `
        <div class="modal-media"><img src="${esc(mealThumb(meal))}" alt="${esc(meal.strMeal)}" onerror="this.src='images/healthy-meal.jpg'"></div>
        <div class="modal-body">
          <div class="tags" style="margin-bottom:.6rem"><span class="tag">${esc(meal.strCategory || "Recipe")}</span><span class="tag">${esc(meal.strArea || "World")}</span></div>
          <h2 id="modalTitle">${esc(meal.strMeal)}</h2>
          <h3>Ingredients</h3>
          <ul>${ingredients.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
          <h3>Method</h3>
          ${steps.map((s) => `<p>${esc(s)}</p>`).join("")}
        </div>`;
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
      $(".modal-close", modal).focus();
    }
    function closeModal() {
      $("#recipeModal").classList.remove("is-open");
      document.body.style.overflow = "";
    }

    grid.addEventListener("click", (e) => {
      const open = e.target.closest("[data-open]");
      const fav = e.target.closest("[data-fav]");
      if (open) {
        const meal = current.find((m) => m.idMeal === open.dataset.open);
        if (meal) openModal(meal);
      }
      if (fav) {
        const m = current.find((x) => x.idMeal === fav.dataset.fav);
        if (!m) return;
        const saved = toggleFav({ id: "a:" + m.idMeal, name: m.strMeal, img: mealThumb(m), meta: `${m.strCategory || ""} · ${m.strArea || ""}` });
        fav.classList.toggle("is-saved", saved);
        fav.setAttribute("aria-pressed", String(saved));
      }
    });
    $("#recipeModal").addEventListener("click", (e) => {
      if (e.target.id === "recipeModal" || e.target.closest(".modal-close")) closeModal();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

    form.addEventListener("submit", (e) => { e.preventDefault(); search(input.value); });
    input.addEventListener("input", debounce(() => { if (input.value.trim().length >= 3) search(input.value); }, 500));
    $$("#recipeChips .chip").forEach((chip) => chip.addEventListener("click", () => { input.value = chip.dataset.term; search(chip.dataset.term); }));
    recentBox.addEventListener("click", (e) => {
      const b = e.target.closest("[data-recent]");
      if (b) { input.value = b.dataset.recent; search(b.dataset.recent); }
    });
    $("#randomBtn").addEventListener("click", randomRecipe);

    drawRecent();
    const last = store.get(KEY.recipe, "chicken");
    input.value = last;
    search(last);
  }

  /* ---------- 9. Meal builder ---------- */
  function initBuilder() {
    const root = $("#builderRoot");
    if (!root) return;
    const groups = { base: "Base", protein: "Protein", veg: "Vegetables (pick any)", dressing: "Dressing" };
    const sel = { base: "rice", protein: "chicken", veg: new Set(["avocado"]), dressing: "olive" };
    const TARGET_KCAL = 700;

    function draw(filter = "") {
      const f = filter.trim().toLowerCase();
      $("#optionGroups").innerHTML = Object.keys(groups).map((g) => {
        const opts = DATA.ingredients[g].filter((o) => !f || o.name.toLowerCase().includes(f));
        return `<div class="opt-group"><h3>${groups[g]}</h3><div class="opt-list">${
          opts.length ? opts.map((o) => {
            const active = g === "veg" ? sel.veg.has(o.id) : sel[g] === o.id;
            return `<button type="button" class="opt ${active ? "is-active" : ""}" data-group="${g}" data-id="${o.id}" aria-pressed="${active}">
              <span>${esc(o.name)}<small>${o.kcal} kcal · ${o.protein} g protein</small></span><strong>${money(o.price)}</strong></button>`;
          }).join("") : `<p class="hint">No match in this group.</p>`
        }</div></div>`;
      }).join("");
    }

    function parts() {
      const find = (g, id) => DATA.ingredients[g].find((o) => o.id === id);
      const list = [find("base", sel.base), find("protein", sel.protein), ...Array.from(sel.veg).map((id) => find("veg", id)), find("dressing", sel.dressing)];
      return list.filter(Boolean);
    }
    function totals() {
      const p = parts();
      return { kcal: p.reduce((s, x) => s + x.kcal, 0), protein: p.reduce((s, x) => s + x.protein, 0), price: p.reduce((s, x) => s + x.price, 0), names: p.map((x) => x.name) };
    }
    function drawSummary() {
      const t = totals();
      $("#sumList").innerHTML = parts().map((x) => `<div class="sum-row"><span>${esc(x.name)}</span><span>${x.kcal} kcal</span></div>`).join("");
      $("#sumKcal").textContent = t.kcal + " kcal";
      $("#sumProtein").textContent = t.protein + " g";
      $("#sumPrice").textContent = money(t.price);
      $("#meterBar").style.width = Math.min(100, Math.round(t.kcal / TARGET_KCAL * 100)) + "%";
      $("#meterText").textContent = `${Math.round(t.kcal / TARGET_KCAL * 100)}% of a ${TARGET_KCAL} kcal meal target`;
    }

    $("#optionGroups").addEventListener("click", (e) => {
      const b = e.target.closest(".opt");
      if (!b) return;
      const { group, id } = b.dataset;
      if (group === "veg") { sel.veg.has(id) ? sel.veg.delete(id) : sel.veg.add(id); }
      else sel[group] = id;
      draw($("#ingSearch").value);
      drawSummary();
    });
    $("#ingSearch").addEventListener("input", debounce((e) => draw(e.target.value), 150));

    $("#addBowlBtn").addEventListener("click", () => {
      const t = totals();
      cartAdd({ id: "bowl:" + parts().map((p) => p.id).join("+"), name: "Custom bowl", price: t.price, kcal: t.kcal });
    });

    // Save bowl form (validated)
    const form = $("#bowlForm");
    setupForm(form, { bowlName: [V.required("Bowl name"), V.minLen(3, "Bowl name")] }, (vals) => {
      const t = totals();
      const bowls = store.get(KEY.bowls, []);
      bowls.push({ id: "b" + (bowls.length + 1) + "-" + Math.random().toString(36).slice(2, 6), name: vals.bowlName.trim(), kcal: t.kcal, protein: t.protein, price: t.price, parts: t.names });
      store.set(KEY.bowls, bowls);
      form.reset();
      $$(".field", form).forEach((f) => f.classList.remove("is-valid"));
      drawSaved();
      toast("Bowl saved");
    });

    function drawSaved() {
      const bowls = store.get(KEY.bowls, []);
      $("#savedBowls").innerHTML = bowls.length
        ? bowls.map((b) => `
          <li><span><strong>${esc(b.name)}</strong><br><small class="hint">${b.kcal} kcal · ${b.protein} g protein · ${money(b.price)}</small></span>
          <span class="card-actions" style="padding:0;margin:0"><button type="button" class="btn btn--sm" data-bowl-add="${b.id}" aria-label="Add ${esc(b.name)} to order">${ic("plus")}</button>
          <button type="button" class="btn btn--danger btn--sm" data-bowl-del="${b.id}" aria-label="Delete ${esc(b.name)}">${ic("trash")}</button></span></li>`).join("")
        : `<li><span class="hint">You have not saved any bowls yet.</span></li>`;
    }
    $("#savedBowls").addEventListener("click", (e) => {
      const add = e.target.closest("[data-bowl-add]");
      const del = e.target.closest("[data-bowl-del]");
      const bowls = store.get(KEY.bowls, []);
      if (add) {
        const b = bowls.find((x) => x.id === add.dataset.bowlAdd);
        if (b) cartAdd({ id: "saved:" + b.id, name: b.name, price: b.price, kcal: b.kcal });
      }
      if (del) {
        store.set(KEY.bowls, bowls.filter((x) => x.id !== del.dataset.bowlDel));
        drawSaved();
      }
    });

    draw(); drawSummary(); drawSaved();
  }

  /* ---------- 10. Order ---------- */
  function initOrder() {
    const root = $("#orderRoot");
    if (!root) return;
    const zoneSel = $("#zone");
    zoneSel.innerHTML = `<option value="">Select a zone</option>` + DATA.zones.map((z) => `<option value="${z.id}">${esc(z.name)}</option>`).join("");

    const user = currentUser();
    const form = $("#orderForm");
    if (user) { form.elements.name.value = user.name; form.elements.email.value = user.email; form.elements.phone.value = user.phone; }

    function zone() { return DATA.zones.find((z) => z.id === zoneSel.value); }

    function drawCart() {
      const cart = getCart();
      const list = $("#cartList");
      if (!cart.length) {
        list.innerHTML = `<li><span class="hint">Your order is empty. Add meals from <a href="sportfood.html">Sport Food</a> or the <a href="builder.html">Meal Builder</a>.</span></li>`;
      } else {
        list.innerHTML = cart.map((c) => `
          <li><span><strong>${esc(c.name)}</strong><br><small class="hint">${money(c.price)} each</small></span>
          <span class="qty"><button type="button" data-dec="${esc(c.id)}" aria-label="Decrease quantity">−</button><span aria-live="polite">${c.qty}</span><button type="button" data-inc="${esc(c.id)}" aria-label="Increase quantity">+</button></span></li>`).join("");
      }
      const sub = cartSubtotal(cart);
      const z = zone();
      const fee = z ? z.fee : 0;
      $("#subTotal").textContent = money(sub);
      $("#feeTotal").textContent = z ? (fee === 0 ? "Free" : money(fee)) : "—";
      $("#grandTotal").textContent = money(sub + fee);
      $("#minNote").textContent = z ? `Minimum order for this zone: ${money(z.min)} · delivery ${z.time}` : "Choose a zone to see the delivery time and fee.";
      updateCartBadge();
    }

    $("#cartList").addEventListener("click", (e) => {
      const inc = e.target.closest("[data-inc]");
      const dec = e.target.closest("[data-dec]");
      let cart = getCart();
      if (inc) cart.find((c) => c.id === inc.dataset.inc).qty++;
      if (dec) {
        const it = cart.find((c) => c.id === dec.dataset.dec);
        it.qty--;
        if (it.qty <= 0) cart = cart.filter((c) => c !== it);
      }
      store.set(KEY.cart, cart);
      drawCart();
    });
    zoneSel.addEventListener("change", drawCart);

    setupForm(form, {
      name: [V.required("Full name"), V.minLen(2, "Full name")],
      email: [V.required("Email"), V.email],
      phone: [V.required("Phone number"), V.phone],
      address: [V.required("Address"), V.minLen(6, "Address")],
      zone: [V.required("Delivery zone"), V.custom((v) => {
        const z = DATA.zones.find((x) => x.id === v);
        return !z || cartSubtotal() >= z.min || `The minimum order for this zone is ${money(z.min)}.`;
      })],
      payment: [V.required("Payment method")]
    }, (vals) => {
      const cart = getCart();
      if (!cart.length) { showAlert(form, "error", "Your order is empty. Add at least one meal first."); return; }
      const z = zone();
      const seq = store.get(KEY.orderSeq, 1000) + 1;
      store.set(KEY.orderSeq, seq);
      const order = { number: "FC-" + seq, email: vals.email.trim().toLowerCase(), name: vals.name.trim(), zone: z.name, items: cart, total: cartSubtotal(cart) + z.fee };
      const orders = store.get(KEY.orders, []);
      orders.push(order);
      store.set(KEY.orders, orders);
      store.set(KEY.cart, []);
      updateCartBadge();
      $("#checkoutArea").innerHTML = `
        <div class="form-card" style="text-align:center">
          <div class="ico" style="margin:0 auto 1rem;width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:var(--success-soft);color:var(--success)">${ic("check")}</div>
          <h2>Thank you, ${esc(order.name.split(" ")[0])}!</h2>
          <p class="lead">Order <strong>${esc(order.number)}</strong> is confirmed. Estimated delivery to ${esc(z.name)}: ${esc(z.time)}.</p>
          <p>Total to pay: <strong>${money(order.total)}</strong></p>
          <div class="hero-actions" style="justify-content:center"><a class="btn" href="sportfood.html">Order more</a><a class="btn btn--ghost" href="profile.html">View profile</a></div>
        </div>`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    drawCart();
  }

  /* ---------- 11. Contact ---------- */
  function initContact() {
    const form = $("#contactForm");
    if (!form) return;
    setupForm(form, {
      name: [V.required("Name"), V.minLen(2, "Name")],
      email: [V.required("Email"), V.email],
      phone: [V.optional(V.phone)],
      topic: [V.required("Topic")],
      message: [V.required("Message"), V.minLen(10, "Message")]
    }, (vals) => {
      const msgs = store.get(KEY.messages, []);
      msgs.push({ name: vals.name.trim(), email: vals.email.trim(), phone: vals.phone.trim(), topic: vals.topic, message: vals.message.trim() });
      store.set(KEY.messages, msgs);
      form.reset();
      $$(".field", form).forEach((f) => f.classList.remove("is-valid"));
      showAlert(form, "success", "Thank you! Your message has been sent. We will reply by email.");
    });
  }

  /* ---------- About: team filter ---------- */
  function initTeam() {
    const grid = $("#teamGrid");
    if (!grid) return;
    const chips = $$("#teamChips .chip");
    function render(role) {
      const list = DATA.team.filter((m) => role === "all" || m.role === role);
      grid.innerHTML = list.map((m) => `
        <article class="card member reveal">
          <div class="avatar" aria-hidden="true">${esc(m.name.charAt(0))}</div>
          <span class="tag">${esc(m.roleLabel)}</span>
          <h3 style="margin-top:.6rem">${esc(m.name)}</h3>
          <p class="hint" style="font-size:.95rem">${esc(m.text)}</p>
        </article>`).join("");
      revealAll(grid);
    }
    chips.forEach((c) => c.addEventListener("click", () => {
      chips.forEach((x) => x.classList.toggle("is-active", x === c));
      render(c.dataset.role);
    }));
    render("all");
  }

  /* ---------- 12. Boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initHeader();
    initPasswordToggles();
    initStrengthMeter();
    initHome();
    initSport();
    initRecipes();
    initBuilder();
    initOrder();
    initContact();
    initTeam();
    initSignup();
    initLogin();
    initProfile();
    initCounters();
    revealAll();
  });
})();
