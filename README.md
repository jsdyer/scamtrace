# ScamTrace

[Open the explorer](https://coolcode.ca/scamtrace/) to search a reviewed Canadian case register by organization, domain, sector and recorded outcome. Each entry distinguishes a venue warning, a report of a particular suspension, or a program's aggregate statistics. The user can follow the evidence back to the original public source.

<!-- coolcode:guide -->
Compare Capilano’s warning with Manitoba’s Rotor Investments alert to see which source actually confirms a domain suspension. Add dated observations to a case in the current tab and export its timeline before leaving.
<!-- /coolcode:guide -->

## Coverage and dates

The initial edition covers attraction ticket impersonation, parking payment redirects, brand hijacking, CRA impersonation, investment website disruption and a CRTC enforcement case. The primary-source URLs, summaries, event date labels and the date this edition was reviewed are in [cases.json](web/data/cases.json). A date labelled “Notice reviewed” dates our observation of an undated public page. A publication date dates the statement, even where the actual action occurred earlier. Public outcomes reflect the cited sources at the time. This register is manually reviewed and does not test websites, attribute common operators or estimate national incidence.

## Use a case file

Search for a place, a domain (plain or defanged), or a subject. Narrow results by outcome. Open a case to see sources and missing records. Use “Link to case” for its public permalink. Local observations take a date, stage, subject and short note. They remain in this tab’s memory as you switch cases, and disappear on reload. Exporting downloads a JSON file with separate public evidence and researcher observations. Only information you choose to enter appears in that file. Case links include only the public case ID. A blank chronology cannot establish response times. An existing-access listing describes a release; its pages must be obtained separately.

The web app makes no external case-data requests. The common CoolCode counter counts visits and the links to source material open the publisher’s site. Reported domains appear as inert text.

## Build and verify

Run `node --test tests/*.test.mjs`, `python3 -m unittest discover -s tests -v`, then `python3 scripts/build.py`. To check the interface, install the test dependency in `tests/browser-requirements.txt` and Playwright Chromium, then run `python3 tests/browser_smoke.py`. GitHub Actions publishes the built site from main. To extend the register, add a sourced case to the JSON file, review the date labels, update the edition date and run the same checks.

## Ready-to-use examples

- [Capilano Suspension Bridge Ticket Warnings](https://coolcode.ca/scamtrace/capilano-ticket-warnings.html). Read the park’s published ticket warning and follow the cited source before buying tickets. The timeline distinguishes the date a notice was reviewed from the date of any reported event.
- [Toronto Green P Parking Payment Warnings](https://coolcode.ca/scamtrace/green-p-payment-warnings.html). Follow the reviewed public records about imitation parking payment pages. Each entry identifies its publisher and the reported action. The register preserves the limits of the evidence about individual sites.
