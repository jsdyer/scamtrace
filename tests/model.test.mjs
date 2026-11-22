import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { filterCases, formatDate, buildExport } from "../web/model.mjs";
const data = JSON.parse(readFileSync(new URL("../web/data/cases.json", import.meta.url), "utf8"));
test("searches terms, defanged domains and accents, with a scope filter", () => {
  assert.equal(filterCases(data.cases, "north capilanobridge[.]com")[0].id, "capilano");
  assert.equal(filterCases(data.cases, "quebec", "Site action confirmed")[0].id, "canadianhq");
  assert.equal(filterCases(data.cases, "rotor", "Warning issued").length, 0);
});
test("all case timelines have unique ids and chronological, attributed evidence", () => {
  assert.equal(new Set(data.cases.map(c => c.id)).size, data.cases.length);
  for (const c of data.cases) {
    assert.ok(c.events.length && c.gap && c.summary);
    const dates = c.events.map(e => e.date);
    assert.deepEqual(dates, [...dates].sort());
    for (const e of c.events) {
      assert.ok(e.dateKind && e.publisher && e.detail);
      assert.equal(new URL(e.source).protocol, "https:");
      assert.ok(!data.cases.some(item => item.domains.includes(new URL(e.source).hostname)));
    }
  }
});
test("date formatting preserves month precision and export keeps private notes separate", () => {
  assert.ok(!formatDate("2019-01").includes("01,"));
  assert.ok(formatDate("2019-01-17").includes("17"));
  const notes = [{ date:"2026-11-21", note:"b" }, { date:"2026-11-20", note:"a" }];
  const saved = buildExport(data.cases[0], data.reviewed, notes);
  assert.deepEqual(saved.researcherObservations.map(x=>x.note), ["a","b"]);
  assert.equal(notes[0].note, "b");
  assert.equal(saved.publicRecord, data.cases[0]);
});
