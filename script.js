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
  box.textContent =
    `Risk: ${level} • Accuracy: ${Math.round(acc * 100)}% • Concern: ${concern}/10 • Damage: ${damage}/10`;
}

function init() {
  const form = document.getElementById("signupForm");

  if (form) {
    form.addEventListener("submit", () => {
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

      const btn = form.querySelector("button[type=submit]");
      if (btn) {
        const prev = btn.textContent;
        btn.textContent = "Added";
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = prev;
          btn.disabled = false;
        }, 1400);
      }
    });
  }

  updateProgress();
  updateAnalytics();
  updateRiskProfile();
}

document.addEventListener("DOMContentLoaded", init);
