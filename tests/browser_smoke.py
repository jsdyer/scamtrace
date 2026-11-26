"""Exercise the case explorer at a project subpath in Chromium."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import json
import shutil
import tempfile
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    screenshots = ROOT / "browser-checks"
    screenshots.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as temporary:
        shutil.copytree(ROOT / "dist", Path(temporary) / "scamtrace")
        server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=temporary))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None)
                page = browser.new_page(viewport={"width": 1280, "height": 1000})
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"http://127.0.0.1:{server.server_port}/scamtrace/")
                page.get_by_role("heading", name="Capilano Suspension Bridge Park").wait_for()
                assert page.locator("#count").inner_text() == "7 of 7"
                assert "capilanobridge[.]com" in page.locator(".domains").inner_text()
                assert page.locator('a[href*="capilanobridge.com"]').count() == 0
                page.get_by_label("Search cases").fill("rotor")
                assert "Rotor" in page.locator("#case-title").inner_text()
                page.get_by_label("Recorded outcome").select_option("Warning issued")
                page.get_by_role("heading", name="No matching case files").wait_for()
                page.locator("#reset").click()
                page.locator("#case-list").get_by_role("button", name="Rotor Investments", exact=False).click()
                page.locator("summary").click()
                page.get_by_label("Observation date").fill("2026-11-20")
                page.get_by_label("Domain or subject").fill("My source")
                page.get_by_label("Observation and source").fill("<img src=x> case note")
                page.get_by_role("button", name="Add observation").click()
                assert "<img src=x>" in page.locator(".notes").inner_text()
                with page.expect_download() as download:
                    page.get_by_role("button", name="Export case JSON").click()
                archive = json.loads(Path(download.value.path()).read_text())
                assert archive["publicRecord"]["id"] == "rotor"
                assert archive["researcherObservations"][0]["subject"] == "My source"
                page.get_by_role("button", name="Remove", exact=True).click()
                assert page.locator(".notes li").count() == 0
                page.goto(f"http://127.0.0.1:{server.server_port}/scamtrace/#case=canadianhq")
                page.get_by_role("heading", name="CanadianHQ marketplace shutdown").wait_for()
                assert page.locator(".timeline li").count() == 3
                page.screenshot(path=str(screenshots / "desktop.png"), full_page=True)
                page.set_viewport_size({"width": 390, "height": 844})
                assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
                page.screenshot(path=str(screenshots / "mobile.png"), full_page=True)
                assert not errors, errors
                page.goto(f'http://127.0.0.1:{server.server_port}/scamtrace/green-p-payment-warnings.html')
                page.wait_for_function("document.querySelector('#case-title')?.textContent.includes('Green P')")
                assert page.locator('link[rel="canonical"]').get_attribute('href') == 'https://coolcode.ca/scamtrace/green-p-payment-warnings.html'
                browser.close()
            print("Browser checks passed: dossiers, filters, notes, export, permalinks and mobile layout")
        finally:
            server.shutdown()


if __name__ == "__main__":
    main()
