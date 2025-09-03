// ======= Data: 7 days content (from the main PDF, distilled) =======
const GOOGLE_FORM_URL = "https://forms.gle/IL_TUO_LINK"; // ← incolla qui il link al tuo Google Form
const ENDPOINT_URL = ""; // lascialo vuoto per disattivare la fetch a Apps Script
// ---- Helper: apri form o mailto ----
function openFormForEmail(email) {
  if (GOOGLE_FORM_URL && GOOGLE_FORM_URL.startsWith("http")) {
    window.open(GOOGLE_FORM_URL, "_blank", "noopener");
    return true;
  } else {
    const subject = encodeURIComponent("MicroHabits – 7-Day Productivity: notify me");
    const body = encodeURIComponent(
      "Please add me to the MicroHabits updates list.\n\nEmail: " + (email || "") +
      "\nDay: " + (typeof currentDay !== "undefined" ? currentDay : "") + "\n"
    );
    window.location.href = "mailto:micro.habits17@gmail.com?subject=" + subject + "&body=" + body;
    return true;
  }
}

const DAYS = [
  {
    title: "Day 1 • Declutter & Eliminate Distractions",
    subtitle: "“Clear space, clear mind.”",
    tips: [
      {title:"One-touch rule", body:"Close tabs, file downloads, clean the desktop. Keep only what you need."},
      {title:"Remove visual clutter", body:"Keep, Move or Discard immediately."},
      {title:"Quick digital sweep", body:"Silence notifications. Keep only daily essentials visible."},
      {title:"Prepare one clean zone", body:"Set up a small, dedicated focus space."}
    ],
    benefits: [
      {title:"Less visual noise", body:"Lower stress and clearer thinking."},
      {title:"Minimized distractions", body:"Deeper, more continuous focus."},
      {title:"Small daily declutter", body:"Build long‑term momentum."}
    ]
  },
  {
    title: "Day 2 • Plan & Prioritize",
    subtitle: "“Clarity creates focus.”",
    tips: [
      {title:"Ivy Lee 3", body:"Write down the 3 most important tasks for tomorrow and rank them."},
      {title:"Peak hours", body:"Plan during your energy peaks; do the #1 before noon."},
      {title:"Break big tasks", body:"Split into 10–15 min micro‑steps to start fast."},
      {title:"Keep the list visible", body:"Sticky note, widget, or pinned note."}
    ],
    benefits: [
      {title:"Lower cognitive load", body:"Fewer choices → more execution."},
      {title:"Reduced stress", body:"Planning ahead cuts decision fatigue."},
      {title:"Strategic thinking", body:"Train focus on what moves the needle."}
    ]
  },
  {
    title: "Day 3 • Time‑block & Single‑tasking",
    subtitle: "“One task, one focus, one win.”",
    tips: [
      {title:"Protect one deep‑work block", body:"No unrelated apps/tabs; keep only what’s needed."},
      {title:"25+25 option", body:"Use 25+25 with a 5‑min break while staying in the block."},
      {title:"Jot thoughts", body:"Write thoughts on paper instead of switching tasks."}
    ],
    benefits: [
      {title:"Complex tasks finish", body:"Protected time increases completion."},
      {title:"Higher output quality", body:"Avoiding context‑switching improves results."},
      {title:"Predictable rhythm", body:"Repeated blocks create a productive cadence."}
    ]
  },
  {
    title: "Day 4 • Morning Kickstart & Strategic Breaks",
    subtitle: "“Win the morning, own the day.”",
    tips: [
      {title:"No phone first thing", body:"Protect attention at wake‑up."},
      {title:"15‑min routine", body:"Try 5 min movement + 5 min journaling + 5 min breathing."},
      {title:"Lay tools out", body:"Prepare pen, mat, and book the night before."},
      {title:"Micro‑breaks", body:"Use 2‑min walks, stretching, mindful breaths."}
    ],
    benefits: [
      {title:"Confident tone", body:"Early wins set the tone."},
      {title:"Energy restored", body:"Breaks reduce afternoon slumps."},
      {title:"Alertness & creativity", body:"Routine + breaks sharpen the mind."}
    ]
  },
  {
    title: "Day 5 • Digital Detox 15",
    subtitle: "“Unplug to recharge your mind.”",
    tips: [
      {title:"Leave phone away", body:"Another room if possible."},
      {title:"Change environment", body:"Balcony, outside, or different chair."},
      {title:"When to do it", body:"After lunch or between deep‑work blocks."},
      {title:"Analog default", body:"Keep a book/notebook handy."}
    ],
    benefits: [
      {title:"Attention & calm", body:"Offline windows restore both."},
      {title:"Fewer checking loops", body:"Reduce compulsive screen cycles."},
      {title:"More intentional work", body:"Return sharper and calmer."}
    ]
  },
  {
    title: "Day 6 • Micro‑review",
    subtitle: "“Small reflections lead to big progress.”",
    tips: [
      {title:"3–5 lines only", body:"Quick, honest, not a diary."},
      {title:"Focus on behaviors", body:"What you can control today."},
      {title:"Store reviews together", body:"Spot weekly patterns."},
      {title:"End with a win", body:"Reinforce momentum."}
    ],
    benefits: [
      {title:"Learning improves", body:"Daily reflection enables course‑correction."},
      {title:"Motivation & resilience", body:"Wins increase both."},
      {title:"Fix bottlenecks", body:"Recurring blockers become visible."}
    ]
  },
  {
    title: "Day 7 • Plan the Week Ahead",
    subtitle: "“A week well planned is a week half won.”",
    tips: [
      {title:"Plan 60% of time", body:"Keep 40% flexible."},
      {title:"Place priorities", body:"Start with fixed events, then your goals."},
      {title:"Attach a first step", body:"Each goal → first 10‑min action."},
      {title:"Review every morning", body:"Keep the plan visible."}
    ],
    benefits: [
      {title:"Follow‑through rises", body:"Written goals get done."},
      {title:"Lower decision friction", body:"Pre‑scheduling makes starts easy."},
      {title:"Less anxiety", body:"Clarity reduces firefighting."}
    ]
  }
];


// ======= Email collection to a webhook (Google Apps Script / Formspree / Make, etc.) =======
// Set this to your endpoint URL (leave "" to disable network send and save only locally)
const ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbxSIwJiQlPc2n4N-wsRpXBXr6X2O-XlTnXmTi5DGYaIUi77XszA0wG8S6SQH0L6pivttA/exec"; // e.g. "https://script.google.com/macros/s/AKfycbx.../exec" or "https://formspree.io/f/xxxx"

async function sendEmailToEndpoint(email) {
  if (!ENDPOINT_URL) return { ok: false, skipped: true };
  try {
    const payload = new URLSearchParams({
      source: "microhabits-productivity",
      email,
      day: String(currentDay),
      timestamp: new Date().toISOString()
    });
    // no-cors: invio “silenzioso” per evitare CORS/preflight con Apps Script
    await fetch(ENDPOINT_URL, {
      method: "POST",
      mode: "no-cors",
      body: payload
    });
    // Non possiamo leggere la risposta in no-cors, ma la richiesta parte e Apps Script la registra
    return { ok: true, opaque: true };
  } catch (e) {
    console.warn("Email send failed:", e);
    return { ok: false, error: String(e) };
  }
}


// ======= App State & Persistence =======
const LS_KEY = "microhabits_prod_progress";
/*
Schema:
{
  unlockedDay: 1..7,
  days: { "1": {completedAt: ISOstring|null, startedDate: "YYYY-MM-DD"|null }, ... },
  email: "..."|null
}
*/

function loadState() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }
  const days = {};
  for (let i=1;i<=7;i++) days[String(i)] = {completedAt:null, startedDate:null, emailPrompted:false};
  return {unlockedDay: 1, days, email: null};
}
function saveState(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

let state = loadState();
const els = {
  daysNav: document.getElementById("daysNav"),
  dayTitle: document.getElementById("dayTitle"),
  daySubtitle: document.getElementById("daySubtitle"),
  tips: document.getElementById("tips"),
  benefits: document.getElementById("benefits"),
  time: document.getElementById("timeDisplay"),
  circle: document.getElementById("progressCircle"),
  start: document.getElementById("startBtn"),
  pause: document.getElementById("pauseBtn"),
  reset: document.getElementById("resetBtn"),
  congrats: document.getElementById("congrats"),
  emailForm: document.getElementById("emailForm"),
  emailInput: document.getElementById("emailInput"),
  emailSaved: document.getElementById("emailSaved"),
  earlyEmail: document.getElementById("earlyEmail"),
  earlyEmailForm: document.getElementById("earlyEmailForm"),
  earlyEmailInput: document.getElementById("earlyEmailInput"),
  earlyEmailSaved: document.getElementById("earlyEmailSaved"),
  earlyEmailClose: document.getElementById("earlyEmailClose"),
};

// ======= Onboarding =======
const onboarding = document.getElementById("onboarding");
const closeOnb = document.getElementById("closeOnboarding");
if (!localStorage.getItem("microhabits_seen_onboarding")) {
  onboarding.classList.remove("hidden");
}
closeOnb.addEventListener("click", ()=>{
  onboarding.classList.add("hidden");
  localStorage.setItem("microhabits_seen_onboarding","1");
});

// ======= Day Navigation =======
let currentDay = 1;
function updateUnlocksByTime() {
  // Unlock next day if previous completed and after 23:59 of that startedDate
  for (let d=1; d<7; d++) {
    const day = state.days[String(d)];
    if (!day.completedAt || !day.startedDate) break;
    const start = new Date(day.startedDate + "T00:00:00");
    const unlockAt = new Date(start.getTime() + 24*3600*1000); // midnight next day
    if (new Date() >= unlockAt) {
      state.unlockedDay = Math.max(state.unlockedDay, d+1);
    }
  }
  saveState(state);
}

function renderNav() {
  els.daysNav.innerHTML = "";
  for (let i=1; i<=7; i++) {
    const btn = document.createElement("button");
    btn.className = "day-btn" + (i===currentDay? " active":"");
    btn.textContent = "Day " + i + (state.days[String(i)].completedAt ? " ✓" : "");
    if (i <= state.unlockedDay) {
      btn.addEventListener("click", ()=>{ switchDay(i); });
    } else {
      btn.classList.add("locked");
      btn.title = "Locked until you complete previous day and it’s past 11:59 PM.";
    }
    els.daysNav.appendChild(btn);
  }
}

function switchDay(i) {
  currentDay = i;
  const d = DAYS[i-1];
  els.dayTitle.textContent = d.title;
  els.daySubtitle.textContent = d.subtitle;
  // cards
  els.tips.innerHTML = "";
  d.tips.forEach(t=>{
    const c = document.createElement("article");
    c.className = "card";
    c.innerHTML = `<h3>${t.title}</h3><p class="muted">${t.body}</p>`;
    els.tips.appendChild(c);
  });
  els.benefits.innerHTML = "";
  d.benefits.forEach(b=>{
    const c = document.createElement("article");
    c.className = "card";
    c.innerHTML = `<h3>${b.title}</h3><p class="muted">${b.body}</p>`;
    els.benefits.appendChild(c);
  });
  // timer UI reset to saved progress (per day)
  loadTimerFromState();
  renderNav();
}

// ======= Timer Logic (count up to 900 seconds) =======
const TOTAL = 15*60;
let elapsed = 0;
let ticker = null;

function formatTime(s) {
  const m = Math.floor(s/60).toString().padStart(2,"0");
  const sec = (s%60).toString().padStart(2,"0");
  return `${m}:${sec}`;
}
function drawCircle() {
  const circumference = 2*Math.PI*54; // r=54
  const remain = Math.max(TOTAL - elapsed, 0);
  const filled = (elapsed / TOTAL) * circumference;
  els.circle.style.strokeDashoffset = (circumference - filled).toFixed(2);
}
function updateTimeText() {
  els.time.textContent = formatTime(Math.min(elapsed, TOTAL));
}

function startTimer() {
  // if first start for the day, set startedDate (today)
  const day = state.days[String(currentDay)];
  if (!day.startedDate) {
    const today = new Date();
    const ymd = today.toISOString().slice(0,10);
    day.startedDate = ymd;
    saveState(state);
  }
  if (ticker) return;
  ticker = setInterval(()=>{
    elapsed += 1;
    maybePromptEarlyEmail();
    if (elapsed >= TOTAL) {
      elapsed = TOTAL;
      stopTimer();
      markCompleted();
    }
    updateTimeText();
    drawCircle();
  }, 1000);
}
function stopTimer() { if (ticker) { clearInterval(ticker); ticker = null; } }
function resetTimer() {
  stopTimer();
  elapsed = 0; updateTimeText(); drawCircle();
}

function markCompleted() {
  const day = state.days[String(currentDay)];
  if (!day.completedAt) {
    day.completedAt = new Date().toISOString();
    saveState(state);
  }
  els.congrats.classList.remove("hidden");
  updateUnlocksByTime();
  renderNav();
}

function loadTimerFromState() {
  // For simplicity, we don't persist partial elapsed seconds, only completion
  const day = state.days[String(currentDay)];
  els.congrats.classList.toggle("hidden", !day.completedAt);
  elapsed = day.completedAt ? TOTAL : 0;
  updateTimeText(); drawCircle();
}

// controls
els.start.addEventListener("click", startTimer);
els.pause.addEventListener("click", stopTimer);
els.reset.addEventListener("click", resetTimer);

// email form
els.emailForm.addEventListener("submit", (e)=>{
 els.emailForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  const email = els.emailInput.value.trim();
  if (email) {
    state.email = email;
    saveState(state);
    openFormForEmail(email); // ← apre il Google Form in nuova scheda
    els.emailSaved.textContent = "Saved. Form opened in a new tab.";
    els.emailSaved.classList.remove("hidden");
  }
});


});


function openEarlyEmail(){ els.earlyEmail.classList.remove("hidden"); els.earlyEmail.setAttribute("aria-hidden","false"); }
function closeEarlyEmail(){ els.earlyEmail.classList.add("hidden"); els.earlyEmail.setAttribute("aria-hidden","true"); }
els.earlyEmailClose.addEventListener("click", closeEarlyEmail);

els.earlyEmailForm.addEventListener("submit", (e)=>{
  els.earlyEmailForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  const email = els.earlyEmailInput.value.trim();
  if (email) {
    state.email = email;
    const d = state.days[String(currentDay)];
    d.emailPrompted = true;
    saveState(state);
    openFormForEmail(email); // ← apre il Google Form in nuova scheda
    els.earlyEmailSaved.textContent = "Saved. Form opened in a new tab.";
    els.earlyEmailSaved.classList.remove("hidden");
    setTimeout(closeEarlyEmail, 1000);
  }
});


});

function maybePromptEarlyEmail(){
  const d = state.days[String(currentDay)];
  if (!d.emailPrompted && elapsed >= 600 && elapsed < 900) { // show once at 10 minutes
    d.emailPrompted = true; // mark to avoid multiple popups
    saveState(state);
    openEarlyEmail();
  }
}

// ─────────────────────────────────────────────
// [PATCH: Tips & Benefits safe render] 
// Aggiunge dati minimi + renderer idempotente
// ─────────────────────────────────────────────

// 0) Hook agli elementi (se mancano)
window.els = window.els || {};
els.tips = els.tips || document.getElementById('tips');
els.benefits = els.benefits || document.getElementById('benefits');
els.dayTitle = els.dayTitle || document.getElementById('dayTitle');
els.daySubtitle = els.daySubtitle || document.getElementById('daySubtitle');

// 1) Meta dei giorni (puoi cambiare testi)
const DAY_META = {
  1: { title: "Declutter & Eliminate Distractions", subtitle: "“Clear space, clear mind.”" },
  2: { title: "Single-Task Sprint", subtitle: "One thing at a time." },
  3: { title: "Plan Tomorrow in 5", subtitle: "Tiny plan, big clarity." },
  4: { title: "Deep-Work Warmup", subtitle: "Ease in, go deep." },
  5: { title: "Batching & Boundaries", subtitle: "Group tasks, guard time." },
  6: { title: "Energy & Break Hygiene", subtitle: "Refuel to focus." },
  7: { title: "Review, Keep, or Improve", subtitle: "Lock gains in." }
};

// 2) Dati cards minimi (puoi espandere dopo)
const CARDS = {
  1: {
    tips: [
      { title: "One-touch rule", body: "Handle each item once. Keep only what you need." },
      { title: "Digital sweep", body: "Silence notifications, close extra tabs." },
      { title: "Clean zone", body: "Prepare a small, distraction-free space." }
    ],
    benefits: [
      { title: "Less visual noise", body: "Lower stress & clearer thinking." },
      { title: "Minimized distractions", body: "Deeper, continuous focus." },
      { title: "Daily momentum", body: "Win the day in 15 minutes." }
    ]
  },
  2: {
    tips: [
      { title: "Pick one task", body: "Define success for just 15 minutes." },
      { title: "Timer visible", body: "Keep the countdown in sight." },
      { title: "No context switch", body: "Resist checking messages." }
    ],
    benefits: [
      { title: "Higher throughput", body: "Less setup time, more output." },
      { title: "Flow easier", body: "Fewer interruptions, deeper work." },
      { title: "Confidence", body: "Reliable daily progress." }
    ]
  },
  3: {
    tips: [
      { title: "3 bullets", body: "Write 3 outcome bullets for tomorrow." },
      { title: "Block 15", body: "Reserve your first 15 minutes." },
      { title: "Lay tools out", body: "Files/notes ready in one place." }
    ],
    benefits: [
      { title: "Clarity", body: "Know exactly how to start." },
      { title: "Less friction", body: "Begin without dithering." },
      { title: "Compounding", body: "Days chain together smoothly." }
    ]
  },
  4: {
    tips: [
      { title: "Warmup 3’", body: "Quick recap → first tiny action." },
      { title: "Noise floor", body: "Headphones / quiet mode." },
      { title: "Micro-milestone", body: "Aim to finish a small chunk." }
    ],
    benefits: [
      { title: "Easier entry", body: "Start without the mental fight." },
      { title: "Depth ↑", body: "Hit deep-work sooner." },
      { title: "Quality ↑", body: "Cleaner thinking, better output." }
    ]
  },
  5: {
    tips: [
      { title: "Batch twins", body: "Group similar tasks together." },
      { title: "Boundary line", body: "Protect start/stop with calendar." },
      { title: "Queue next", body: "Line up the next 2 similar tasks." }
    ],
    benefits: [
      { title: "Setup time ↓", body: "Switching costs less often." },
      { title: "Pace ↑", body: "Rhythm builds speed." },
      { title: "Overwhelm ↓", body: "Clear lanes for your brain." }
    ]
  },
  6: {
    tips: [
      { title: "Stand-up break", body: "30–60s posture reset + breath." },
      { title: "Water check", body: "Sip before you start." },
      { title: "Light snack", body: "If hungry: fruit or nuts." }
    ],
    benefits: [
      { title: "Energy steadier", body: "Fewer dips, better focus." },
      { title: "Mood ↑", body: "Feel better, work better." },
      { title: "Sustainability", body: "You can repeat daily." }
    ]
  },
  7: {
    tips: [
      { title: "Keep / Cut / Improve", body: "Mark habits to keep, stop, or tweak." },
      { title: "Note 1 win", body: "Write one improvement you noticed." },
      { title: "Schedule next", body: "Put the next 7-day block on calendar." }
    ],
    benefits: [
      { title: "Learning loop", body: "Turn results into upgrades." },
      { title: "Retention", body: "Make progress stick." },
      { title: "Direction", body: "Know your next target." }
    ]
  }
};

// 3) Renderer
function renderCards(container, items, variant) {
  if (!container) return;
  container.innerHTML = "";
  items.forEach(({ title, body }) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${title}</h3>
      <p class="muted">${body.replace(/\n/g, "<br>")}</p>
    `;
    container.appendChild(card);
  });
}

function renderTips(day) {
  const d = CARDS[day] || CARDS[1];
  renderCards(els.tips, d.tips, "tips");
}
function renderBenefits(day) {
  const d = CARDS[day] || CARDS[1];
  renderCards(els.benefits, d.benefits, "benefits");
}

// 4) Applica il contenuto del giorno (se vuoi aggiornare il titolo)
function applyDayContent(day) {
  const meta = DAY_META[day] || DAY_META[1];
  if (els.dayTitle) els.dayTitle.textContent = `Day ${day} • ${meta.title}`;
  if (els.daySubtitle) els.daySubtitle.textContent = meta.subtitle;
  renderTips(day);
  renderBenefits(day);
}

// 5) Avvio sicuro: prova a usare currentDay, altrimenti Day 1
(function () {
  const day = (typeof currentDay === "number" && currentDay >=1 && currentDay <=7) ? currentDay : 1;
  try { applyDayContent(day); } catch (e) { console.error("Render cards failed:", e); }
})();


// ======= Init =======
updateUnlocksByTime();
renderNav();
switchDay(currentDay);
