const navItems = [
  ["home", "Home", "index.html"],
  ["onboarding", "Onboarding", "onboarding.html"],
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
      <p>Cosmic Nexus. A Strange But True public atlas for careful wonder.</p>
      <nav class="footer-links" aria-label="Footer links">
        <a href="connections.html">Connections</a>
        <a href="sources.html">Sources</a>
        <a href="https://auraofintelligence.github.io/strange-but-true/" target="_blank" rel="noopener noreferrer">Strange But True</a>
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

function setupOnboardingForm() {
  const form = document.querySelector("[data-onboarding-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const today = new Date().toISOString().slice(0, 10);
    const md = [
      "# Cosmic Nexus onboarding note",
      "",
      `- Date: ${today}`,
      `- Name or team: ${data.get("name") || "Not supplied"}`,
      `- Role: ${data.get("role") || "Not supplied"}`,
      "",
      "## Interest",
      "",
      data.get("interest") || "Not supplied",
      "",
      "## Boundary note",
      "",
      data.get("boundary") || "Not supplied",
      "",
      "## Suggested next step",
      "",
      "Route this note to the right Cosmic Nexus lane: atlas, film, governance, travel, legal memory or source review."
    ].join("\n");

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cosmic-nexus-onboarding-note.md";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
}

renderHeader();
renderFooter();
setupToTop();
setupOnboardingForm();
