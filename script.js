document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");

  if (!form) return;

  form.addEventListener("submit", () => {
    const btn = form.querySelector("button[type=submit]");
    if (!btn) return;

    const originalText = btn.textContent;
    btn.textContent = "Submitting...";
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = "Added ✓";
      btn.disabled = true;
    }, 800);
  });
});
