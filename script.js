const navItems = [
  ["home", "Home", "index.html"],
  ["onboarding", "Sign Up", "onboarding.html"],
  ["atlas", "Atlas", "atlas.html"],
  ["governance", "Governance", "governance.html"],
  ["films", "Films", "films.html"],
  ["connections", "Connections", "connections.html"],
  ["sources", "Sources", "sources.html"]
];

const page = document.body.dataset.page || "home";

function renderHeader() {
  const header = document.querySelector("[data-site-header]");
  if (!header) return;

  const links = navItems.map(([key, label, href]) => {
    const current = key === page ? ' aria-current="page"' : "";
    return `<a href="${href}"${current}>${label}</a>`;
  }).join("");

  header.innerHTML = `
    <nav class="nav" aria-label="Main navigation">
      <a class="brand" href="index.html" aria-label="Cosmic Nexus home">
        <span class="brand-mark">CN</span>
        <span class="brand-text"><strong>Cosmic Nexus</strong><span>Strange But True family</span></span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <div class="nav-links" id="site-nav">${links}</div>
    </nav>
  `;

  const toggle = header.querySelector(".nav-toggle");
  const nav = header.querySelector(".nav-links");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function renderFooter() {
  const footer = document.querySelector("[data-site-footer]");
  if (!footer) return;
  footer.innerHTML = `
    <div class="footer-inner">
      <p>Cosmic Nexus. An in-development Strange But True adventure atlas for careful wonder, travel planning and friendship systems.</p>
      <nav class="footer-links" aria-label="Footer links">
        <a href="sources.html">Sources</a>
        <a href="licence.html">Licence</a>
        <a href="https://github.com/auraofintelligence/strange-but-true-cosmic-nexus" target="_blank" rel="noopener noreferrer">Source repo</a>
      </nav>
    </div>
  `;
}

function setupToTop() {
  const button = document.querySelector("[data-to-top]");
  if (!button) return;

  const sync = () => button.classList.toggle("visible", window.scrollY > 520);
  window.addEventListener("scroll", sync, { passive: true });
  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  sync();
}

function getCheckedValues(form, name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`))
    .map((input) => input.value);
}

function buildSignupSummary(form) {
  const data = new FormData(form);
  const interests = getCheckedValues(form, "interests");
  const contributions = getCheckedValues(form, "contributions");

  return [
    "Cosmic Nexus sign-up",
    "",
    `Name or team: ${data.get("name") || "Not supplied"}`,
    `Contact: ${data.get("reply_to") || "Not supplied"}`,
    `Organisation or project: ${data.get("organisation") || "Not supplied"}`,
    `Location/timezone: ${data.get("location") || "Not supplied"}`,
    `Primary role: ${data.get("role") || "Not supplied"}`,
    `Sign-up intent: ${data.get("intent") || "Not supplied"}`,
    `Public attribution preference: ${data.get("attribution") || "Not supplied"}`,
    "",
    "Interest lanes:",
    interests.length ? interests.map((item) => `- ${item}`).join("\n") : "- Not supplied",
    "",
    "Possible contribution:",
    contributions.length ? contributions.map((item) => `- ${item}`).join("\n") : "- Not supplied",
    "",
    "Boundary or protocol note:",
    data.get("boundary") || "Not supplied",
    "",
    "Message:",
    data.get("notes") || "Not supplied",
    "",
    "Consent:",
    data.get("consent") ? "Visitor confirmed the sign-up privacy warning." : "Consent checkbox was not ticked."
  ].join("\n");
}

function setupSignupForm() {
  const form = document.querySelector("[data-signup-form]");
  if (!form) return;

  const messageField = form.querySelector("[data-signup-message]");
  const copyButton = form.querySelector("[data-copy-signup]");
  const status = form.querySelector("[data-signup-status]");

  const syncMessage = () => {
    messageField.value = buildSignupSummary(form).slice(0, 3800);
  };

  form.addEventListener("input", syncMessage);
  form.addEventListener("change", syncMessage);
  form.addEventListener("submit", () => {
    syncMessage();
    if (status) {
      status.textContent = "Sending sign-up...";
    }
  });

  copyButton?.addEventListener("click", async (event) => {
    event.preventDefault();
    syncMessage();
    try {
      await navigator.clipboard.writeText(messageField.value);
      if (status) {
        status.textContent = "Sign-up summary copied.";
      }
    } catch (error) {
      if (status) {
        status.textContent = "Copy failed. Select the form text and copy it manually.";
      }
    }
  });

  syncMessage();
}

renderHeader();
renderFooter();
setupToTop();
setupSignupForm();
