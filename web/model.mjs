export function defang(domain) {
  return domain.replaceAll(".", "[.]");
}

function normalize(text) {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replaceAll("[.]", ".");
}

export function filterCases(cases, query = "", outcome = "") {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return cases.filter(item => {
    if (outcome && item.outcome !== outcome) return false;
    const haystack = normalize([item.title, item.place, item.sector, item.outcome,
      item.summary, ...item.domains, ...item.events.map(event => event.publisher)].join(" "));
    return words.every(word => haystack.includes(word));
  });
}

export function formatDate(value) {
  const dayKnown = value.length === 10;
  const date = new Date((dayKnown ? value : value + "-01") + "T12:00:00Z");
  return date.toLocaleDateString("en-CA", {
    timeZone: "UTC", year: "numeric", month: "short", ...(dayKnown && { day: "numeric" })
  });
}

export function buildExport(item, reviewed, observations) {
  return { schema: 1, reviewed, publicRecord: item,
    researcherObservations: [...observations].sort((a, b) => a.date.localeCompare(b.date)) };
}
