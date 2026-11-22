import { buildExport, defang, filterCases, formatDate } from "./model.mjs";

const byId = id => document.getElementById(id);
const register = byId("case-list");
const dossier = byId("dossier");
const search = byId("search");
const outcome = byId("outcome");
const observations = new Map();
let edition;
let selected;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function link(label, href) {
  const node = element("a", label);
  node.href = href;
  return node;
}

function caseUrl(id) {
  const url = new URL(location.href);
  url.hash = new URLSearchParams({ case: id }).toString();
  return url.href;
}

function readCase() {
  return new URLSearchParams(location.hash.slice(1)).get("case");
}

function caseSelection(item) {
  selected = item.id;
  render();
  const heading = byId("case-title");
  heading?.focus({ preventScroll: true });
  if (matchMedia("(max-width: 760px)").matches) heading?.scrollIntoView({ block: "start" });
}

function renderList(visible) {
  const nodes = visible.map(item => {
    const button = element("button");
    button.type = "button";
    button.setAttribute("aria-current", item.id === selected ? "true" : "false");
    button.append(element("span", item.title, "name"), element("span", item.place, "place"));
    button.addEventListener("click", () => {
      if (readCase() !== item.id) history.pushState(null, "", caseUrl(item.id));
      caseSelection(item);
    });
    return button;
  });
  register.replaceChildren(...nodes);
}

function recordEvent(event) {
  const item = element("li");
  const time = element("time", formatDate(event.date));
  time.dateTime = event.date;
  const meta = element("div", undefined, "event-meta");
  meta.append(time, element("span", event.dateKind));
  item.append(meta, element("h4", event.title), element("p", event.detail),
    link(event.publisher + " ↗", event.source));
  return item;
}

function exportCase(item) {
  const data = buildExport(item, edition.reviewed, observations.get(item.id) || []);
  const file = new Blob([JSON.stringify(data, null, 2) + "\n"], { type: "application/json" });
  const target = URL.createObjectURL(file);
  const download = link("", target);
  download.download = "scamtrace-" + item.id + ".json";
  document.body.append(download);
  download.click();
  download.remove();
  setTimeout(() => URL.revokeObjectURL(target), 1000);
}

function field(form, labelText, control) {
  const label = element("label", labelText);
  label.append(control);
  form.append(label);
  control.required = true;
  return control;
}

function notebook(item) {
  const details = element("details", undefined, "notebook");
  const notes = observations.get(item.id) || [];
  details.append(element("summary", "Research notes" + (notes.length ? " (" + notes.length + ")" : "")),
    element("p", "Add a dated observation to this case. Notes stay in this tab until reload. Export the case to keep a copy."));
  const list = element("ol", undefined, "notes");
  const form = element("form");
  const date = field(form, "Observation date", element("input"));
  date.type = "date";
  const subject = field(form, "Domain or subject", element("input"));
  subject.maxLength = 160;
  const note = field(form, "Observation and source", element("textarea"));
  note.rows = 3;
  note.maxLength = 1200;
  const submit = element("button", "Add observation");
  submit.type = "submit";
  const status = element("p");
  status.setAttribute("role", "status");
  form.append(submit, status);
  function drawNotes() {
    list.replaceChildren();
    for (const observation of [...notes].sort((a, b) => a.date.localeCompare(b.date))) {
      const row = element("li");
      const remove = element("button", "Remove");
      remove.type = "button";
      remove.addEventListener("click", () => {
        notes.splice(notes.indexOf(observation), 1);
        drawNotes();
        status.textContent = "Observation removed.";
      });
      row.append(element("strong", formatDate(observation.date) + " · " + observation.subject),
        element("p", observation.note), remove);
      list.append(row);
    }
    details.querySelector("summary").textContent = "Research notes" + (notes.length ? " (" + notes.length + ")" : "");
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!subject.value.trim() || !note.value.trim()) {
      status.textContent = "Enter a subject and an observation.";
      return;
    }
    notes.push({ date: date.value, subject: subject.value.trim(), note: note.value.trim() });
    observations.set(item.id, notes);
    form.reset();
    drawNotes();
    status.textContent = "Observation added to this tab.";
  });
  details.append(list, form);
  drawNotes();
  return details;
}

function renderCase(item) {
  const title = element("h2", item.title);
  title.id = "case-title";
  title.tabIndex = -1;
  const topic = element("p", item.sector + "  /  " + item.place, "topic");
  const label = element("span", item.outcome, "status-label");
  const intro = element("p", item.summary, "summary");
  const domains = element("div", undefined, "domains");
  if (item.domains.length) {
    domains.append(element("span", "Named in the source"));
    item.domains.forEach(domain => domains.append(element("code", defang(domain))));
  }
  const timeline = element("ol", undefined, "timeline");
  timeline.append(...item.events.map(recordEvent));
  const gap = element("section", undefined, "gap");
  gap.append(element("h3", "What the record leaves open"), element("p", item.gap));
  if (item.record) gap.append(link("Open the completed ATIP record ↗", item.record));
  const download = element("button", "Export case JSON");
  download.type = "button";
  download.addEventListener("click", () => exportCase(item));
  const actions = element("div", undefined, "actions");
  actions.append(download, link("Link to case", caseUrl(item.id)));
  dossier.removeAttribute("aria-label");
  dossier.setAttribute("aria-labelledby", "case-title");
  dossier.replaceChildren(topic, title, label, intro, domains, element("h3", "Evidence timeline"),
    timeline, gap, notebook(item), actions);
}

function render() {
  const visible = filterCases(edition.cases, search.value, outcome.value);
  if (!visible.some(item => item.id === selected)) selected = visible[0]?.id;
  const current = visible.find(item => item.id === selected);
  byId("count").textContent = visible.length + " of " + edition.cases.length;
  byId("reset").hidden = !(search.value || outcome.value);
  renderList(visible);
  if (current) renderCase(current);
  else {
    dossier.removeAttribute("aria-labelledby");
    dossier.setAttribute("aria-label", "Search result");
    dossier.replaceChildren(element("h2", "No matching case files"), element("p", "Clear the filters or try another organization, sector or domain."));
  }
}

function restoreCase() {
  search.value = "";
  outcome.value = "";
  selected = readCase();
  render();
}

async function start() {
  const response = await fetch("./data/cases.json");
  if (!response.ok) throw new Error("Register unavailable");
  edition = await response.json();
  for (const value of [...new Set(edition.cases.map(item => item.outcome))].sort()) outcome.add(new Option(value, value));
  byId("reviewed").textContent = formatDate(edition.reviewed);
  restoreCase();
  for (const [control, type] of [[search, "input"], [outcome, "change"]]) {
    control.addEventListener(type, () => {
      render();
      // Search terms stay out of the shared URL. A selected case link must match the view.
      history.replaceState(null, "", selected ? caseUrl(selected) : location.pathname + location.search);
    });
  }
  byId("reset").addEventListener("click", () => { restoreCase(); search.focus(); });
  window.addEventListener("hashchange", restoreCase);
  window.addEventListener("popstate", restoreCase);
}

start().catch(() => {
  dossier.replaceChildren(element("h2", "Case register unavailable"), element("p", "Reload to retry, or read the case files in the source repository."));
}).finally(() => dossier.setAttribute("aria-busy", "false"));
