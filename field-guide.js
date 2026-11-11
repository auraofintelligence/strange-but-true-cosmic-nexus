const notebookKey = "cosmic-nexus-field-notebook-v1";
const placeCards = Array.from(document.querySelectorAll("[data-place]"));
const validPlaces = new Set(placeCards.map((card) => card.dataset.place));
const notebookStatus = document.querySelector("[data-notebook-status]");
const notes = document.querySelector("[data-field-notes]");
let selectedPlaces = new Set();

try {
  const saved = JSON.parse(localStorage.getItem(notebookKey) || "null");
  if (saved && Array.isArray(saved.places)) {
    selectedPlaces = new Set(saved.places.filter((id) => validPlaces.has(id)));
    notes.value = typeof saved.notes === "string" ? saved.notes : "";
  }
} catch {
  notebookStatus.textContent = "Browser saving is unavailable. Download your field brief to keep a copy.";
}

function saveNotebook() {
  try {
    localStorage.setItem(notebookKey, JSON.stringify({
      places: Array.from(selectedPlaces),
      notes: notes.value
    }));
    notebookStatus.textContent = "Notebook saved in this browser.";
  } catch {
    notebookStatus.textContent = "Browser saving is unavailable. Download your field brief to keep a copy.";
  }
}

function renderShortlist() {
  const list = document.querySelector("[data-shortlist]");
  list.replaceChildren();
  for (const card of placeCards) {
    const selected = selectedPlaces.has(card.dataset.place);
    const button = card.querySelector("[data-save-place]");
    button.setAttribute("aria-pressed", String(selected));
    button.textContent = selected ? "Remove from shortlist" : "Add to shortlist";
    if (selected) {
      const item = document.createElement("li");
      item.textContent = card.querySelector("h3").textContent;
      list.append(item);
    }
  }
  if (!selectedPlaces.size) {
    const item = document.createElement("li");
    item.textContent = "Add a place from the field guide to begin.";
    list.append(item);
  }
}

for (const card of placeCards) {
  card.querySelector("[data-save-place]").addEventListener("click", () => {
    const id = card.dataset.place;
    if (selectedPlaces.has(id)) {
      selectedPlaces.delete(id);
    } else {
      selectedPlaces.add(id);
    }
    renderShortlist();
    saveNotebook();
  });
}

const search = document.querySelector("[data-place-search]");
const lane = document.querySelector("[data-place-lane]");
function filterPlaces() {
  const query = search.value.trim().toLocaleLowerCase();
  let count = 0;
  for (const card of placeCards) {
    const matches = card.textContent.toLocaleLowerCase().includes(query)
      && (!lane.value || card.dataset.lane === lane.value);
    card.hidden = !matches;
    if (matches) count += 1;
  }
  document.querySelector("[data-place-count]").textContent = `${count} ${count === 1 ? "place" : "places"}`;
  document.querySelector("[data-place-empty]").hidden = count > 0;
}
search.addEventListener("input", filterPlaces);
lane.addEventListener("change", filterPlaces);
document.querySelector("[data-field-controls]").hidden = false;
notes.addEventListener("input", saveNotebook);

document.querySelector("[data-clear-shortlist]").addEventListener("click", () => {
  selectedPlaces.clear();
  notes.value = "";
  renderShortlist();
  saveNotebook();
  notebookStatus.textContent = "Notebook cleared.";
});

document.querySelector("[data-download-shortlist]").addEventListener("click", () => {
  const lines = ["# Cosmic Nexus field brief", "", "## Places to research", ""];
  for (const card of placeCards.filter((item) => selectedPlaces.has(item.dataset.place))) {
    lines.push(`### ${card.querySelector("h3").textContent}`, "",
      card.querySelector(".field-question").textContent, "");
    for (const link of card.querySelectorAll(".card-links a")) {
      lines.push(`- ${link.textContent} — ${link.href}`);
    }
    lines.push("", card.querySelector("details p").textContent, "",
      card.querySelector(".field-date").textContent, "");
  }
  lines.push("## Questions and ideas", "", notes.value, "",
    "## Checks to complete", "",
    "- Read current place records, source dates and open questions in World Travel Patterns.",
    "- Check entry, activity permissions, local access, cultural protocols and current advisories.",
    "- Research route, transport, accommodation, costs, accessibility and seasonal conditions.",
    "- Identify suitable local interpretation and permissions for filming or interviews.",
    "- Keep observations, history, hypotheses and story ideas labelled.");
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "cosmic-nexus-field-brief.md";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notebookStatus.textContent = "Field brief downloaded.";
});

renderShortlist();
