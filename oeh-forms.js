document.addEventListener("submit", function (e) {
  var form = e.target
  if (!(form instanceof HTMLFormElement)) return
  var action = form.getAttribute("action") || ""
  var button = form.querySelector("button, [type=submit]")
  var label = ((button && button.textContent) || "").toUpperCase()
  if (action.indexOf("/api/quote-zip") !== -1 || label.indexOf("START MY QUOTE") !== -1) {
    e.preventDefault()
    e.stopPropagation()
    var zipInput = form.querySelector('input[placeholder="ZIP CODE"]') || form.querySelector("input")
    var zip = zipInput ? zipInput.value.trim() : ""
    location.href = "/get-a-quote" + (zip ? "?zip=" + encodeURIComponent(zip) : "")
    return
  }
  if (form.querySelector("textarea") && form.querySelector('input[type="email"]')) {
    e.preventDefault()
    e.stopPropagation()
    var data = {}
    new FormData(form).forEach(function (value, key) {
      if (String(value).trim()) data[key] = value
    })
    try { sessionStorage.setItem("oeh-contact", JSON.stringify(data)) } catch (err) {}
    form.innerHTML = '<p style="font:600 18px/1.4 sans-serif;padding:12px 0">Thanks. Call 239-423-2552 and a licensed agent can walk through your options.</p>'
  }
}, true)

if (location.pathname.replace(/\/$/, "") === "/results") {
  setTimeout(function () {
    if (document.getElementById("oeh-match-page")) return
    var shield = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v6c0 4.2-2.8 7-7 9-4.2-2-7-4.8-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>'
    var phone = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h3.2l1.2 3.2-2 1.4a11 11 0 0 0 5.5 5.5l1.4-2 3.2 1.2V16a1.8 1.8 0 0 1-1.8 1.8A14.2 14.2 0 0 1 4.2 6.3 1.8 1.8 0 0 1 6 4.5z"/></svg>'
    var page = document.createElement("div")
    page.id = "oeh-match-page"
    page.innerHTML = ''
      + '<div class="oeh-bar">' + shield + 'Licensed assistance available for health plan enrollment</div>'
      + '<header class="oeh-hd">'
      + '<a class="oeh-logo" href="/"><b>Open</b><b class="en">Enrollment</b><b class="he">Health</b></a>'
      + '<div class="oeh-hd-r"><span class="oeh-live"><i></i>Licensed agents available</span>'
      + '<a class="oeh-hd-tel" href="tel:+12394232552">' + phone + '<b>(239) 423-2552</b></a></div>'
      + '</header>'
      + '<main class="oeh-m">'
      + '<p class="oeh-m-done"><span></span>Match complete</p>'
      + '<h1>We found your best match.</h1>'
      + '<p class="oeh-m-sub">Your match is ready. A licensed agent can help confirm the details before you decide.</p>'
      + '<section class="oeh-m-criteria" aria-label="Criteria used for this match">'
      + '<p class="oeh-m-label">Criteria used</p>'
      + '<ul>'
      + '<li><span>Coverage</span><b data-oeh="coverage">—</b></li>'
      + '<li><span>Age</span><b data-oeh="age">—</b></li>'
      + '<li><span>Household income</span><b data-oeh="income">—</b></li>'
      + '<li><span>Doctor visits</span><b data-oeh="doctor">—</b></li>'
      + '<li><span>State</span><b data-oeh="state">—</b></li>'
      + '</ul></section>'
      + '<section class="oeh-m-card">'
      + '<div class="oeh-m-top"><div><p class="oeh-m-label">Your match</p>'
      + '<p class="oeh-m-word"><b>Open</b><b class="en">Enrollment</b><b class="he">Health</b></p></div>'
      + '<p class="oeh-m-support">' + shield + 'Licensed agent support</p></div>'
      + '<div class="oeh-m-split"><div><p class="oeh-m-label">Match score</p><p class="oeh-m-score">100%</p>'
      + '<p class="oeh-m-hint">Based on your answers &amp; availability</p></div>'
      + '<div><p class="oeh-m-label">Agent availability</p><p class="oeh-m-agents"><i></i><b>18</b><span>agents available</span></p>'
      + '<p class="oeh-m-hint">Available to talk by phone</p></div></div>'
      + '</section>'
      + '<section class="oeh-m-next"><div><h2>What happens next?</h2>'
      + '<p>Call to review available plans, pricing, and enrollment details with a licensed agent. There is no obligation to enroll.</p></div>'
      + '<a href="tel:+12394232552">' + phone + 'Call (239) 423-2552</a></section>'
      + '<p class="oeh-m-fine">By calling, you may be connected with a licensed insurance agent. Plan availability and pricing vary by location and eligibility.</p>'
      + '</main>'
    var css = document.createElement("style")
    css.textContent = ''
      + '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");'
      + '#oeh-match-page{position:fixed;inset:0;z-index:2147483646;background:#f7f8fa;overflow:auto;font-family:Inter,Arial,Helvetica,sans-serif;color:#213244}'
      + '.oeh-bar{height:32px;display:flex;align-items:center;justify-content:center;gap:8px;background:#1e3447;color:#e7eef3;font-size:12px}'
      + '.oeh-bar svg{width:14px;height:14px;fill:none;stroke:#e7eef3;stroke-width:1.8;stroke-linejoin:round;stroke-linecap:round}'
      + '.oeh-hd{height:68px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;background:#fff}'
      + '.oeh-logo{font-size:22px;font-weight:800;letter-spacing:-0.03em;text-decoration:none;line-height:1}'
      + '.oeh-logo b,.oeh-m-word b{font-weight:800}'
      + '.oeh-logo b{color:#1a1a1a}.oeh-logo .en,.oeh-m-word .en{color:#E05E2F}.oeh-logo .he,.oeh-m-word .he{color:#8d8d8d}'
      + '.oeh-hd-r{display:flex;align-items:center;gap:28px}'
      + '.oeh-live{display:flex;align-items:center;gap:8px;font-size:14px;color:#3d4a57}'
      + '.oeh-live i{width:8px;height:8px;border-radius:99px;background:#1f9d55;display:inline-block}'
      + '.oeh-hd-tel{display:inline-flex;align-items:center;gap:8px;color:#213244;font-size:15px;font-weight:700;text-decoration:none}'
      + '.oeh-hd-tel svg{width:16px;height:16px;fill:none;stroke:#E05E2F;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}'
      + '.oeh-m{max-width:720px;margin:0 auto;padding:52px 24px 64px}'
      + '.oeh-m-done{display:flex;align-items:center;gap:8px;margin:0 0 14px;color:#1b7a45;font-size:14px;font-weight:600}'
      + '.oeh-m-done span{width:18px;height:18px;border-radius:99px;background:#e7f6ee;position:relative;display:inline-block;flex:0 0 auto}'
      + '.oeh-m-done span:after{content:"";position:absolute;left:6px;top:3px;width:4px;height:8px;border:solid #1b7a45;border-width:0 2px 2px 0;transform:rotate(45deg)}'
      + '.oeh-m h1{margin:0;font-size:40px;line-height:1.15;font-weight:700;letter-spacing:-0.03em;color:#213244}'
      + '.oeh-m-sub{margin:10px 0 0;max-width:40rem;color:#667085;font-size:15px;line-height:1.45}'
      + '.oeh-m-criteria{margin-top:22px;background:#fff;border:1px solid #e4e5e7;border-radius:12px;padding:16px 24px 8px}'
      + '.oeh-m-criteria ul{list-style:none;margin:8px 0 0;padding:0}'
      + '.oeh-m-criteria li{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-top:1px solid #e4e5e7;font-size:14px}'
      + '.oeh-m-criteria span{color:#667085}'
      + '.oeh-m-criteria b{font-weight:600;color:#213244;text-align:right}'
      + '.oeh-m-card{margin-top:14px;background:#fff;border:1px solid #e4e5e7;border-radius:12px;box-shadow:none}'
      + '.oeh-m-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:20px 24px 16px}'
      + '.oeh-m-label{margin:0;color:#98a2b3;font-size:13px;font-weight:400}'
      + '.oeh-m-word{margin:8px 0 0;font-size:30px;line-height:1;letter-spacing:-0.03em}'
      + '.oeh-m-word b{color:#1a1a1a}'
      + '.oeh-m-support{display:flex;align-items:center;gap:6px;margin:4px 0 0;color:#667085;font-size:13px;white-space:nowrap}'
      + '.oeh-m-support svg{width:16px;height:16px;fill:none;stroke:#1f9d55;stroke-width:1.8;stroke-linejoin:round;stroke-linecap:round}'
      + '.oeh-m-split{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #e4e5e7}'
      + '.oeh-m-split>div{padding:18px 24px 20px}'
      + '.oeh-m-split>div+div{border-left:1px solid #e4e5e7}'
      + '.oeh-m-score{margin:6px 0 0;font-size:40px;font-weight:700;line-height:1;letter-spacing:-0.03em;color:#213244}'
      + '.oeh-m-score:after{content:"";display:block;width:88px;height:3px;margin-top:8px;background:#E05E2F;border-radius:2px}'
      + '.oeh-m-agents{display:flex;align-items:baseline;gap:8px;margin:10px 0 0;color:#213244}'
      + '.oeh-m-agents i{width:8px;height:8px;border-radius:99px;background:#1f9d55;display:inline-block;align-self:center}'
      + '.oeh-m-agents b{font-size:28px;font-weight:700;line-height:1}'
      + '.oeh-m-agents span{font-size:18px;font-weight:600}'
      + '.oeh-m-hint{margin:8px 0 0;color:#98a2b3;font-size:13px;line-height:1.45}'
      + '.oeh-m-next{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:14px;padding:18px 20px;background:#eef3f6;border:1px solid #e3e8ec;border-radius:12px}'
      + '.oeh-m-next h2{margin:0 0 4px;font-size:16px;font-weight:700;color:#213244}'
      + '.oeh-m-next p{margin:0;color:#667085;font-size:14px;line-height:1.45;max-width:34rem}'
      + '.oeh-m-next a{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px;border-radius:8px;background:#E05E2F;color:#fff;font-weight:700;font-size:14px;text-decoration:none;white-space:nowrap}'
      + '.oeh-m-next a svg{width:16px;height:16px;fill:none;stroke:#fff;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}'
      + '.oeh-m-fine{margin:14px 0 0;color:#98a2b3;font-size:12px;line-height:1.45}'
      + '@media(max-width:900px){.oeh-hd{padding:0 24px}}'
      + '@media(max-width:640px){.oeh-hd{height:auto;display:block;padding:14px 16px}.oeh-hd-r{margin-top:10px;gap:12px;flex-wrap:wrap}.oeh-m{padding:32px 16px 48px}.oeh-m h1{font-size:32px}.oeh-m-word{font-size:22px}.oeh-m-split{grid-template-columns:1fr}.oeh-m-split>div+div{border-left:0;border-top:1px solid #e4e5e7}.oeh-m-next{display:block}.oeh-m-next a{width:100%;margin-top:14px;justify-content:center;box-sizing:border-box}}'
    document.head.appendChild(css)
    document.body.appendChild(page)
    var quote = {}
    try { quote = JSON.parse(sessionStorage.getItem("oeh-quote") || "{}") } catch (err) {}
    var params = new URLSearchParams(location.search)
    if (!quote.state && params.get("state")) quote.state = params.get("state")
    ;["coverage", "age", "income", "doctor", "state"].forEach(function (key) {
      var el = page.querySelector('[data-oeh="' + key + '"]')
      if (el && quote[key]) el.textContent = quote[key]
    })
  }, 8200)
}
