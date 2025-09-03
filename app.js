/* ================================
 * MicroHabits – App Core (Plain JS)
 * Version: 2025-09-03
 * ================================ */

/** ====== CONFIG ====== */

// (1) Google Form (se usi un modulo con precompilazione email)
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/XXXXXXXXXXXX/viewform"; // <-- opzionale

// (2) Endpoint Apps Script per logging email (opzionale). Se non lo usi, lascia stringa vuota.
const ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbxSIwJiQlPc2n4N-wsRpXBXr6X2O-XlTnXmTi5DGYaIUi77XszA0wG8S6SQH0L6pivttA/exec";

/** Durata timer per ciascun giorno (sec) */
const DAY_DURATION_SEC = 15 * 60;

/** Soglie di sblocco Benefit (sec dall’avvio) */
const BENEFIT_THRESHOLDS = [5 * 60, 10 * 60, 15 * 60];

/** Giorni totali */
const TOTAL_DAYS = 7;

/** LocalStorage key */
const LS_KEY = "microhabits_prod_progress";

/** Dati Tips/Benefits. Puoi aggiungere `img` se vuoi visualizzare un’immagine nella card. */
const DAY_CONTENT = {
  1: {
    tips: [
      { title: "One-touch rule", body: "Handle each small task once: decide, do, or delete.", img: "/images/tips/day1-1.png" },
      { title: "2-min start", body: "Start with just two minutes; momentum does the rest." },
      { title: "Hide friction", body: "Remove one blocker from your most common task." }
    ],
    benefits: [
      { title: "Clarity ↑", body: "You’ll feel less overwhelmed after a focused sprint.", img: "/images/benefits/day1-1.png" },
      { title: "Momentum ↑", body: "A short win makes the next task easier." },
      { title: "Control ↑", body: "You regain agency over your time." }
    ]
  },
  2: {
    tips: [
      { title: "Batch-notifications", body: "Mute apps; check messages after the 15’ block." },
      { title: "Single target", body: "Define one and only one output for the session." },
      { title: "Visible plan", body: "Keep the micro-plan in front of you." }
    ],
    benefits: [
      { title: "Focus ↑", body: "Less context switching, deeper work." },
      { title: "Stress ↓", body: "Fewer interruptions = calmer brain." },
      { title: "Quality ↑", body: "Attention grows with repetition." }
    ]
  },
  3: { tips: [], benefits: [] },
  4: { tips: [], benefits: [] },
  5: { tips: [], benefits: [] },
  6: { tips: [], benefits: [] },
  7: { tips: [], benefits: [] }
};

/** ====== UTILS ====== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const pad2 = (n) => String(n).padStart(2, "0");

const toDateKey = (d = new Date()) => {
  // YYYY-MM-DD in timezone locale
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${y}-${m}-${dd}`;
};

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return createInitialState();
    const obj = JSON.parse(raw);
    // Hardening per nuove versioni
    if (!obj.days) obj.days = {};
    for (let i = 1; i <= TOTAL_DAYS; i++) {
      if (!obj.days[String(i)]) {
        obj.days[String(i)] = createDayState();
      }
    }
    if (typeof obj.currentDay !== "number") obj.currentDay = 1;
    return obj;
  } catch {
    return createInitialState();
  }
}

function saveState(s) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

function createDayState() {
  return {
    startedAt: 0,          // timestamp ms
    startedDate: "",       // "YYYY-MM-DD"
    finishedAt: 0,         // timestamp ms
    done: false,
    unlockedBenefits: [false, false, false], // tre soglie
    emailPrompted: false
  };
}

function createInitialState() {
  const days = {};
  for (let i = 1; i <= TOTAL_DAYS; i++) days[String(i)] = createDayState();
  return {
    currentDay: 1,
    email: "",
    days
  };
}

/** ====== STATE (in memoria) ====== */
let state = loadState();

/** ====== DOM ====== */
const els = {
  dayChips: $("#dayChips"),                 // container nav giorni
  prevBtn: $("#prevDay"),
  nextBtn: $("#nextDay"),
  tipsWrap: $("#tipsWrap"),
  benefitsWrap: $("#benefitsWrap"),

  // Timer
  startBtn: $("#startTimer"),
  resetBtn: $("#resetTimer"),
  timeText: $("#timeText"),
  progressBar: $("#timeProgress"),

  // Email bar
  emailForm: $("#emailForm"),
  emailInput: $("#emailInput"),
  emailSaved: $("#emailSaved"),

  // Early email modal (opzionale)
  earlyEmailModal: $("#earlyEmailModal"),
  earlyEmailForm: $("#earlyEmailForm"),
  earlyEmailInput: $("#earlyEmailInput"),
  earlyEmailSaved: $("#earlyEmailSaved"),
  earlyEmailClose: $("#earlyEmailClose")
};

let tickHandle = null;

/** ====== RENDER ====== */

function renderAll() {
  renderDaysBar();
  renderDayContent();
  updateTimerUI();
  updateNavButtons();
}

function renderDaysBar() {
  if (!els.dayChips) return;
  els.dayChips.innerHTML = "";

  for (let i = 1; i <= TOTAL_DAYS; i++) {
    const chip = document.createElement("button");
    chip.className = "day-chip";
    chip.textContent = `Day ${i}`;

    const status = dayStatus(i);
    // locked style
    if (!status.unlocked) {
      chip.classList.add("locked");
      chip.title = status.lockReason || "Locked";
    }
    if (i === state.currentDay) {
      chip.classList.add("active");
    }
    chip.addEventListener("click", () => {
      if (!dayStatus(i).unlocked) return; // non selezionabile se bloccato
      state.currentDay = i;
      saveState(state);
      renderAll();
    });
    els.dayChips.appendChild(chip);
  }
}

function dayStatus(dayNum) {
  // Giorno 1 è sempre sbloccato
  if (dayNum === 1) return { unlocked: true };

  // Sblocco giorno N richiede che giorno N-1 sia "done" e sia passata la mezzanotte locale rispetto alla data di avvio
  const prev = state.days[String(dayNum - 1)];
  if (!prev.done) {
    return { unlocked: false, lockReason: "Complete the previous day first." };
  }

  // Mezzanotte locale
  if (!prev.startedDate) return { unlocked: false, lockReason: "Wait until next day." };
  const nowKey = toDateKey();
  if (nowKey <= prev.startedDate) {
    return { unlocked: false, lockReason: "Unlocked after midnight." };
  }

  return { unlocked: true };
}

function renderDayContent() {
  const d = DAY_CONTENT[state.currentDay] || { tips: [], benefits: [] };
  mountCards(els.tipsWrap, d.tips, "tip");
  mountCards(els.benefitsWrap, d.benefits, "benefit");

  // Nascondi benefit non sbloccati con overlay
  applyBenefitLocks();
}

function mountCards(container, items, kind) {
  if (!container) return;
  container.innerHTML = "";
  if (!items || !items.length) {
    container.innerHTML = `<div class="muted">No ${kind}s today.</div>`;
    return;
  }
  items.forEach((t) => {
    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `
      ${t.img ? `<img class="card-img" src="${t.img}" alt="${t.title}">` : ""}
      <h3>${t.title}</h3>
      <p class="muted">${t.body || ""}</p>
    `;
    container.appendChild(c);
  });
}

function applyBenefitLocks() {
  if (!els.benefitsWrap) return;
  const day = state.days[String(state.currentDay)];
  const cards = $$(".card", els.benefitsWrap);

  cards.forEach((card, idx) => {
    const unlocked = !!day.unlockedBenefits[idx];
    card.classList.toggle("locked", !unlocked);

    let overlay = $(".lock-overlay", card);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "lock-overlay";
      card.appendChild(overlay);
    }
    overlay.textContent = unlocked ? "" : `Locked • Unlock at ${idx === 0 ? "5" : idx === 1 ? "10" : "15"} min`;
    overlay.style.display = unlocked ? "none" : "flex";
  });
}

function updateNavButtons() {
  if (els.prevBtn) els.prevBtn.disabled = state.currentDay <= 1;
  if (els.nextBtn) els.nextBtn.disabled = !dayStatus(state.currentDay + 1).unlocked;
}

/** ====== TIMER ====== */

function startTimer() {
  const d = state.days[String(state.currentDay)];
  if (!d.startedAt) {
    d.startedAt = Date.now();
    d.startedDate = toDateKey();
    d.finishedAt = 0;
    d.done = false;
    d.unlockedBenefits = [false, false, false];
    saveState(state);
  }
  startTick();
  maybePromptEmailEarly();
  updateTimerUI();
}

function resetTimer() {
  const d = state.days[String(state.currentDay)];
  d.startedAt = 0;
  d.startedDate = "";
  d.finishedAt = 0;
  d.done = false;
  d.unlockedBenefits = [false, false, false];
  stopTick();
  saveState(state);
  updateTimerUI();
  applyBenefitLocks();
}

function startTick() {
  if (tickHandle) return;
  tickHandle = setInterval(tick, 1000);
}

function stopTick() {
  if (!tickHandle) return;
  clearInterval(tickHandle);
  tickHandle = null;
}

function tick() {
  const d = state.days[String(state.currentDay)];
  if (!d.startedAt) {
    stopTick();
    return;
  }
  // elapsed e remaining
  const elapsed = Math.max(0, Math.floor((Date.now() - d.startedAt) / 1000));
  const remaining = Math.max(0, DAY_DURATION_SEC - elapsed);

  // Sblocca benefits al superamento delle soglie
  BENEFIT_THRESHOLDS.forEach((th, i) => {
    if (!d.unlockedBenefits[i] && elapsed >= th) {
      d.unlockedBenefits[i] = true;
    }
  });

  // Completamento del giorno
  if (!d.done && remaining === 0) {
    d.done = true;
    d.finishedAt = Date.now();
    // NON sblocchiamo il giorno successivo subito: lo sblocco avverrà solo dopo mezzanotte in renderDaysBar/dayStatus
  }

  saveState(state);
  updateTimerUI();
  applyBenefitLocks();
}

function updateTimerUI() {
  const d = state.days[String(state.currentDay)];
  let remaining = DAY_DURATION_SEC;
  if (d.startedAt) {
    const elapsed = Math.max(0, Math.floor((Date.now() - d.startedAt) / 1000));
    remaining = Math.max(0, DAY_DURATION_SEC - elapsed);
  }

  const mm = pad2(Math.floor(remaining / 60));
  const ss = pad2(remaining % 60);
  if (els.timeText) els.timeText.textContent = `${mm}:${ss}`;

  if (els.progressBar) {
    const pct = 100 * (1 - remaining / DAY_DURATION_SEC);
    els.progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }

  if (els.startBtn) els.startBtn.disabled = !!d.startedAt && !d.done;
  if (els.resetBtn) els.resetBtn.disabled = !d.startedAt;
}

/** ====== EMAIL ====== */

function openFormForEmail(email) {
  if (!GOOGLE_FORM_URL || GOOGLE_FORM_URL.includes("XXXXXXXX")) return;
  const url = new URL(GOOGLE_FORM_URL);
  // Se il Form ha un campo email precompilabile, aggiungi query qui (dipende dal tuo form)
  // url.searchParams.set("email", email);
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

async function sendEmailToEndpoint(email) {
  if (!ENDPOINT_URL) return;
  try {
    await fetch(ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ts: Date.now(), source: "microhabits" })
    });
  } catch (_) {
    // fail-silent
  }
}

function maybePromptEmailEarly() {
  // Mostra modale email se non l’abbiamo ancora
  if (!els.earlyEmailModal) return;
  if (!state.email) {
    els.earlyEmailModal.classList.remove("hidden");
  }
}

function closeEarlyEmail() {
  if (!els.earlyEmailModal) return;
  els.earlyEmailModal.classList.add("hidden");
}

/** ====== LISTENERS ====== */

if (els.startBtn) {
  els.startBtn.addEventListener("click", startTimer);
}
if (els.resetBtn) {
  els.resetBtn.addEventListener("click", resetTimer);
}
if (els.prevBtn) {
  els.prevBtn.addEventListener("click", () => {
    if (state.currentDay > 1) {
      state.currentDay -= 1;
      saveState(state);
      renderAll();
    }
  });
}
if (els.nextBtn) {
  els.nextBtn.addEventListener("click", () => {
    if (dayStatus(state.currentDay + 1).unlocked) {
      state.currentDay += 1;
      saveState(state);
      renderAll();
    }
  });
}

// Email form (barra)
if (els.emailForm) {
  els.emailForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (els.emailInput?.value || "").trim();
    if (!email) return;

    state.email = email;
    saveState(state);

    openFormForEmail(email);
    if (els.emailSaved) {
      els.emailSaved.textContent = "Saved. Form opened in a new tab.";
      els.emailSaved.classList.remove("hidden");
    }
    await sendEmailToEndpoint(email);
  });
}

// Early email modal
if (els.earlyEmailForm) {
  els.earlyEmailForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (els.earlyEmailInput?.value || "").trim();
    if (!email) return;

    state.email = email;
    const d = state.days[String(state.currentDay)];
    d.emailPrompted = true;
    saveState(state);

    openFormForEmail(email);
    if (els.earlyEmailSaved) {
      els.earlyEmailSaved.textContent = "Saved. Form opened in a new tab.";
      els.earlyEmailSaved.classList.remove("hidden");
    }
    setTimeout(closeEarlyEmail, 800);
    await sendEmailToEndpoint(email);
  });
}
if (els.earlyEmailClose) {
  els.earlyEmailClose.addEventListener("click", closeEarlyEmail);
}

/** ====== BOOT ====== */

document.addEventListener("visibilitychange", () => {
  // Forza un refresh del timer quando si torna al tab
  if (document.visibilityState === "visible") {
    updateTimerUI();
    applyBenefitLocks();
  }
});

window.addEventListener("load", () => {
  // Piccolo hardening: se giorno completato e mezzanotte passata, abilita nav
  renderAll();
});
