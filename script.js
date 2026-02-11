const state = {
  deepfakeAnswers: [],
  encounterLevel: 0,
  concernLevel: 5,
  damageLevel: 5,
  wouldUseTool: null,
  willingnessToPay: null,
  role: null,
  b2b: {
    verify: null,
    damage: null,
    api: null,
    size: null,
    demo: null
  },
  productScan: {
    score: null,
    label: null,
    explain: null
  },
  user: {
    name: "",
    email: "",
    role: ""
  }
};

const items = [
  {
    truth: "Fake",
    explain: "Subtle skin smoothing and edge blending indicate face-swap artifacts.",
    stat: "67% of users misclassified this."
  },
  {
    truth: "Fake",
    explain: "Detected blending anomalies and temporal inconsistencies.",
    stat: "71% spotted the anomaly."
  },
  {
    truth: "Real",
    explain: "Natural lighting and consistent edges without blending artifacts.",
    stat: "62% identified this correctly."
  }
];

function updateProgress() {
  let c = 0;
  if (state.deepfakeAnswers.length >= items.length) c++;
  if (state.encounterLevel !== null && state.concernLevel !== null) c++;
  if (state.damageLevel !== null && state.wouldUseTool !== null && state.willingnessToPay !== null) c++;
  if (state.productScan.score !== null) c++;
  if (state.role !== null) c++;
  if (state.user.email) c++;
  if (state.role) c++;
  const pct = Math.min(100, Math.round((c / 6) * 100));
  const bar = document.getElementById("progressBar");
  if (bar) bar.style.width = pct + "%";
}

function updateAnalytics() {
  const correct = state.deepfakeAnswers.filter(a => a.correct).length;
  const total = state.deepfakeAnswers.length;
  const acc = total ? Math.round((correct / total) * 100) : 0;
  const accuracyMetric = document.getElementById("accuracyMetric");
  const concernMetric = document.getElementById("concernMetric");
  const payMetric = document.getElementById("payMetric");
  const roleMetric = document.getElementById("roleMetric");
  if (accuracyMetric) accuracyMetric.textContent = total ? acc + "% (" + correct + "/" + total + ")" : "—";
  if (concernMetric) concernMetric.textContent = state.concernLevel ? state.concernLevel + "/10" : "—";
  if (payMetric) payMetric.textContent = state.willingnessToPay ? state.willingnessToPay : "—";
  if (roleMetric) roleMetric.textContent = state.role ? state.role : "—";
}

function updateRiskProfile() {
  const box = document.getElementById("riskProfile");
  if (!box) return;
  const acc = state.deepfakeAnswers.length ? state.deepfakeAnswers.filter(a => a.correct).length / state.deepfakeAnswers.length : 0.5;
  const concern = state.concernLevel || 5;
  const damage = state.damageLevel || 5;
  const useTool = state.wouldUseTool === "Yes";
  const pay = state.willingnessToPay === "Yes";
  const score = (1 - acc) * 0.4 + (concern / 10) * 0.2 + (damage / 10) * 0.3 + (useTool ? 0.05 : 0.15) + (pay ? 0.05 : 0.1);
  let level = "Medium";
  if (score >= 0.7) level = "High";
  else if (score <= 0.4) level = "Low";
  const lines = [];
  lines.push("Risk: " + level);
  lines.push("Accuracy: " + Math.round(acc * 100) + "%");
  lines.push("Concern: " + concern + "/10");
  lines.push("Damage: " + damage + "/10");
  lines.push("Intent: " + (useTool ? "Will use verification" : "No verification intent"));
  box.textContent = lines.join(" • ");
}

function handleVote(card, choice) {
  const idx = parseInt(card.dataset.item, 10);
  const item = items[idx];
  const correct = (choice === item.truth);
  const reveal = card.querySelector(".reveal");
  const result = card.querySelector(".result");
  const explain = card.querySelector(".explain");
  const stat = card.querySelector(".stat");
  if (reveal && result && explain && stat) {
    reveal.style.display = "block";
    result.textContent = "Truth: " + item.truth + " • You chose: " + choice + (correct ? " ✓" : " ✕");
    result.style.color = correct ? "var(--success)" : "var(--danger)";
    explain.textContent = item.explain;
    stat.textContent = item.stat;
  }
  const existing = state.deepfakeAnswers.find(a => a.index === idx);
  if (existing) {
    existing.choice = choice;
    existing.correct = correct;
  } else {
    state.deepfakeAnswers.push({ index: idx, choice, correct });
  }
  updateProgress();
  updateAnalytics();
  updateRiskProfile();
}

function setChipActive(group, value) {
  group.forEach(el => {
    if (el.dataset.choice === value || el.dataset.b2b === value || el.dataset.role === value) el.classList.add("active");
    else el.classList.remove("active");
  });
}

function simulateScan() {
  const bar = document.getElementById("scanProgress");
  const scoreEl = document.getElementById("scanScore");
  const explainEl = document.getElementById("scanExplain");
  if (!bar || !scoreEl || !explainEl) return;
  let p = 0;
  bar.style.width = "0%";
  scoreEl.textContent = "";
  explainEl.textContent = "";
  const timer = setInterval(() => {
    p += Math.round(5 + Math.random() * 12);
    if (p > 100) p = 100;
    bar.style.width = p + "%";
    if (p >= 100) {
      clearInterval(timer);
      const score = Math.round(50 + Math.random() * 50);
      const label = Math.random() > 0.5 ? "Real" : "Fake";
      const explain = label === "Real" ? "No manipulation detected across frames; stable lighting and motion." : "Detected blending anomalies and temporal inconsistencies.";
      state.productScan.score = score;
      state.productScan.label = label;
      state.productScan.explain = explain;
      scoreEl.textContent = "Confidence: " + score + "% • " + label;
      explainEl.textContent = explain;
      updateProgress();
      updateAnalytics();
      updateRiskProfile();
    }
  }, 120);
}

function downloadJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const a = document.createElement("a");
  a.setAttribute("href", dataStr);
  a.setAttribute("download", "truth-ai-answers.json");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function init() {
  const cta = document.getElementById("ctaStart");
  if (cta) cta.addEventListener("click", () => document.getElementById("test").scrollIntoView({ behavior: "smooth" }));
  document.querySelectorAll(".card").forEach(card => {
    const r = card.querySelector(".vote-real");
    const f = card.querySelector(".vote-fake");
    if (r) r.addEventListener("click", () => handleVote(card, "Real"));
    if (f) f.addEventListener("click", () => handleVote(card, "Fake"));
  });
  const encounterSlider = document.getElementById("encounterSlider");
  const concernSlider = document.getElementById("concernSlider");
  const damageSlider = document.getElementById("damageSlider");
  if (encounterSlider) encounterSlider.addEventListener("input", e => { state.encounterLevel = parseInt(e.target.value, 10); updateProgress(); updateAnalytics(); updateRiskProfile(); });
  if (concernSlider) concernSlider.addEventListener("input", e => { state.concernLevel = parseInt(e.target.value, 10); updateProgress(); updateAnalytics(); updateRiskProfile(); });
  if (damageSlider) damageSlider.addEventListener("input", e => { state.damageLevel = parseInt(e.target.value, 10); updateProgress(); updateAnalytics(); updateRiskProfile(); });
  const useGroup = Array.from(document.querySelectorAll('[data-choice^="use-"]'));
  useGroup.forEach(el => el.addEventListener("click", () => { state.wouldUseTool = el.dataset.choice === "use-yes" ? "Yes" : "No"; setChipActive(useGroup, el.dataset.choice); updateProgress(); updateAnalytics(); updateRiskProfile(); }));
  const payGroup = Array.from(document.querySelectorAll('[data-choice^="pay-"]'));
  payGroup.forEach(el => el.addEventListener("click", () => { const map = { "pay-yes": "Yes", "pay-no": "No", "pay-maybe": "Maybe" }; state.willingnessToPay = map[el.dataset.choice]; setChipActive(payGroup, el.dataset.choice); updateProgress(); updateAnalytics(); updateRiskProfile(); }));
  const scanBtn = document.getElementById("scanBtn");
  if (scanBtn) scanBtn.addEventListener("click", simulateScan);
  const roleChips = Array.from(document.querySelectorAll(".chip.role"));
  const b2b = document.getElementById("b2b");
  roleChips.forEach(chip => chip.addEventListener("click", () => {
    state.role = chip.dataset.role;
    setChipActive(roleChips, chip.dataset.role);
    if (b2b) b2b.classList.toggle("hidden", state.role !== "Business Owner");
    updateProgress();
    updateAnalytics();
    updateRiskProfile();
  }));
  const b2bChips = Array.from(document.querySelectorAll('#b2b .chip'));
  b2bChips.forEach(chip => chip.addEventListener("click", () => {
    const k = chip.dataset.b2b;
    if (k.startsWith("verify-")) state.b2b.verify = k.endsWith("yes") ? "Yes" : "No";
    else if (k.startsWith("damage-")) state.b2b.damage = k.endsWith("yes") ? "Yes" : "No";
    else if (k.startsWith("api-")) state.b2b.api = k.endsWith("yes") ? "Yes" : "No";
    else if (k.startsWith("size-")) state.b2b.size = k.replace("size-", "");
    else if (k.startsWith("demo-")) state.b2b.demo = k.endsWith("yes") ? "Yes" : "No";
    setChipActive(b2bChips, k);
    updateAnalytics();
  }));
  const form = document.getElementById("signupForm");
  if (form) form.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("nameInput").value.trim();
    const email = document.getElementById("emailInput").value.trim();
    const role = document.getElementById("roleSelect").value;
    if (!name || !email || !role) return;
    state.user.name = name;
    state.user.email = email;
    state.user.role = role;
    updateProgress();
    updateAnalytics();
    updateRiskProfile();
    form.reset();
    const btn = form.querySelector("button[type=submit]");
    if (btn) {
      const prev = btn.textContent;
      btn.textContent = "Added";
      btn.disabled = true;
      setTimeout(() => { btn.textContent = prev; btn.disabled = false; }, 1400);
    }
    document.getElementById("profile").scrollIntoView({ behavior: "smooth" });
  });
  const dn = document.getElementById("downloadJson");
  if (dn) dn.addEventListener("click", downloadJSON);
  updateProgress();
  updateAnalytics();
  updateRiskProfile();
}

document.addEventListener("DOMContentLoaded", init);

async function sendAnalytics() {
  try {
    const res = await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    });
    if (!res.ok) throw new Error("Failed to send analytics");
    await fetchMetrics();
  } catch (e) {
    console.warn("Analytics send failed", e);
  }
}

async function fetchMetrics() {
  try {
    const res = await fetch("/api/metrics");
    if (!res.ok) return;
    const data = await res.json();
    const accuracyMetric = document.getElementById("accuracyMetric");
    const concernMetric = document.getElementById("concernMetric");
    const payMetric = document.getElementById("payMetric");
    const roleMetric = document.getElementById("roleMetric");
    if (accuracyMetric) accuracyMetric.textContent = data.accuracy + "%";
    if (concernMetric) concernMetric.textContent = Math.round((data.concernAvg || 0) * 10) / 10 + "/10";
    if (payMetric) payMetric.textContent = `Yes:${data.pay?.Yes||0} No:${data.pay?.No||0} Maybe:${data.pay?.Maybe||0}`;
    if (roleMetric) roleMetric.textContent = Object.entries(data.roles || {}).map(([k,v]) => `${k}:${v}`).join(" ");
  } catch (e) {
    // ignore
  }
}

// Send analytics after email capture (most complete snapshot)
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  if (form) {
    form.addEventListener("submit", () => {
      setTimeout(sendAnalytics, 200);
    });
  }
  fetchMetrics();
});
