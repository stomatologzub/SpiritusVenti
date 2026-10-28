"""Local browser checks. All form responses are mocked; no email is sent.
Requires development-only playwright; uses the installed Microsoft Edge.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.hosting' / 'design-review'
OUT.mkdir(parents=True, exist_ok=True)
URL = 'http://127.0.0.1:8765/'

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel='msedge', headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    report = []
    for width in [320, 375, 768, 1024, 1440]:
        page.set_viewport_size({'width': width, 'height': 960})
        page.goto(URL, wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        page.wait_for_timeout(750)
        visible_flows = page.locator('.air-scene__current:visible').count()
        assert visible_flows == (2 if width <= 600 else 5), (width, visible_flows)
        assert page.locator('.air-scene__current').first.evaluate('(el) => getComputedStyle(el).animationDuration') == '8s'
        copy = page.locator('.hero__copy').bounding_box()
        visual = page.locator('.hero__visual').bounding_box()
        assert copy['x'] + copy['width'] <= visual['x'] + 1 or copy['y'] + copy['height'] <= visual['y'] + 1
        page.screenshot(path=str(OUT / f'hero-{width}.png'))
        for element in page.locator('.reveal').all():
            element.scroll_into_view_if_needed()
        page.wait_for_timeout(600)
        overflow = page.evaluate('''() => ({page:document.documentElement.scrollWidth > innerWidth,
          elements:[...document.querySelectorAll('main *,header *,footer *')].filter(el => {
          const r=el.getBoundingClientRect(); return r.width && (r.right>innerWidth+1 || r.left < -1) && getComputedStyle(el).position !== 'absolute' && el.tagName !== 'path' && el.tagName !== 'g';
          }).map(el => el.tagName+'.'+el.className).slice(0,12)})''')
        assert not overflow['page'], (width, overflow)
        assert page.locator('h1').count() == 1
        assert page.locator('.gallery__open img').evaluate_all('(images) => images.every(i => i.complete && i.naturalWidth > 0)')
        assert page.locator('label[for]').count() == 4
        page.locator('a.footer__back').click()
        page.wait_for_timeout(700)
        page.screenshot(path=str(OUT / f'page-{width}.png'), full_page=True)
        if width <= 900:
            page.locator('#burger').click()
            assert page.locator('#burger').get_attribute('aria-expanded') == 'true'
            page.keyboard.press('Shift+Tab')
            assert page.evaluate("document.activeElement === document.querySelector('#mobileMenu nav a:last-child')")
            page.keyboard.press('Escape')
            assert page.locator('#burger').get_attribute('aria-expanded') == 'false'
            assert page.evaluate("document.activeElement.id === 'burger'")
            page.locator('#burger').click()
            page.locator('#mobileMenu a[href="#services"]').click()
        else:
            page.locator('.nav__links a[href="#services"]').click()
        page.wait_for_timeout(800)
        top = page.locator('#servicesTitle').bounding_box()['y']
        header_bottom = page.locator('#nav').bounding_box()['height']
        assert top >= header_bottom, (width, top, header_bottom)
        button = page.locator('.gallery__open').first
        button.click()
        assert page.locator('#lightbox').evaluate('(el) => el.open')
        page.keyboard.press('Escape')
        assert not page.locator('#lightbox').evaluate('(el) => el.open')
        assert button.evaluate('(el) => el === document.activeElement')
        report.append({'width': width, 'horizontal_overflow': False, 'anchors_menu_gallery': 'passed'})

    page.goto(URL, wait_until='networkidle')
    page.wait_for_timeout(800)
    hero_button = page.locator('.hero__actions > .btn')
    get_rate = "document.querySelector('.air-scene__current').getAnimations().find(a => a.animationName === 'air-current').playbackRate"
    heading_before = page.locator('#heroTitle').bounding_box()
    hero_button.hover()
    page.wait_for_timeout(650)
    assert page.evaluate(get_rate) > 1.2
    page.wait_for_timeout(2000)
    assert abs(page.evaluate(get_rate) - 1) < .01
    page.mouse.move(0, 0)
    page.locator('.hero__actions .text-link').focus()
    page.keyboard.press('Shift+Tab')
    assert hero_button.evaluate('(el) => el === document.activeElement && el.matches(":focus-visible")')
    page.wait_for_timeout(650)
    assert page.evaluate(get_rate) > 1.2
    assert page.locator('#heroTitle').bounding_box() == heading_before

    page.emulate_media(reduced_motion='reduce')
    page.goto(URL, wait_until='networkidle')
    assert page.locator('.air-scene__current').first.evaluate('(el) => getComputedStyle(el).animationName') == 'none'
    assert page.locator('.air-scene__current:visible').count() == 0
    assert page.locator('.air-scene__stream').evaluate('(el) => getComputedStyle(el).strokeOpacity') == '0.48'
    assert page.locator('.hero__title').evaluate('(el) => getComputedStyle(el).animationName') == 'none'
    page.emulate_media(reduced_motion='no-preference')

    # Enable controls only in this test DOM, and intercept every form POST.
    page.evaluate("document.querySelector('#contactForm').dataset.ready='true'; document.querySelector('fieldset').disabled=false")
    page.locator('#fName').fill('Browser Test')
    page.locator('#fPhone').fill('+421900000000')
    page.route('**/api/contact/', lambda route: route.fulfill(status=503, json={'ok':False,'message':'Odosielanie momentálne nie je dostupné.'}))
    page.locator('.field__submit').click()
    page.wait_for_function("document.querySelector('#formStatus').dataset.state === 'error'")
    assert page.locator('#formStatus').get_attribute('data-state') == 'error'
    assert page.locator('#fName').input_value() == 'Browser Test'
    page.unroute('**/api/contact/')
    page.route('**/api/contact/', lambda route: route.fulfill(status=200, json={'ok':True,'message':'Test: správa prijatá.'}))
    page.locator('.field__submit').click()
    page.wait_for_function("document.querySelector('#formStatus').dataset.state === 'success'")
    assert page.locator('#fName').input_value() == ''
    assert not errors, errors

    nojs = browser.new_page(java_script_enabled=False, viewport={'width':375,'height':900})
    nojs.goto(URL, wait_until='networkidle')
    assert nojs.locator('#heroTitle').is_visible()
    assert nojs.locator('#servicesTitle').is_visible()
    assert nojs.locator('.field__submit').is_hidden()
    assert nojs.evaluate('document.documentElement.scrollWidth <= innerWidth')
    browser.close()
    result = {'layouts': report, 'hero_hover_keyboard_and_eight_second_flow': 'passed', 'reduced_motion': 'passed', 'form_mocked_error_and_success': 'passed', 'no_javascript': 'passed', 'browser_errors': errors}
    (OUT / 'checks.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps(result, indent=2))
