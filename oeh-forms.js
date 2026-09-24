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
    var phone = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h3l1.5 4-2 1.5a12 12 0 0 0 6 6L17 13l4 1.5V18a2 2 0 0 1-2 2A15 15 0 0 1 4 5a2 2 0 0 1 2-2z"/></svg>'
    var page = document.createElement("div")
    page.id = "oeh-match-page"
    page.innerHTML = ''
      + '<div class="oeh-bar"><span class="oeh-bar-ic"></span>Licensed assistance available for health plan enrollment</div>'
      + '<header class="oeh-hd">'
      + '<a class="oeh-logo" href="/"><b>Open</b><b class="en">Enrollment</b><b class="he">Health</b></a>'
      + '<div class="oeh-hd-r"><span class="oeh-live"><i></i>Licensed agents available</span>'
      + '<a class="oeh-hd-tel" href="tel:+12394232552">' + phone + '(239) 423-2552</a></div>'
      + '</header>'
      + '<main class="oeh-m">'
      + '<p class="oeh-m-done"><span></span>Match complete</p>'
      + '<h2>We found your best match.</h2>'
      + '<p class="oeh-m-sub">Your match is ready. A licensed agent can help confirm the details before you decide.</p>'
      + '<div class="oeh-m-card">'
      + '<div class="oeh-m-top"><div><p class="oeh-m-label">Your match</p>'
      + '<p class="oeh-m-word"><b>Open</b><b class="en">Enrollment</b><b class="he">Health</b></p></div>'
      + '<p class="oeh-m-support"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v6c0 4.5-3 7.2-7 9-4-1.8-7-4.5-7-9V6l7-3z"/></svg>Licensed agent support</p></div>'
      + '<div class="oeh-m-split"><div><p class="oeh-m-label">Match score</p><p class="oeh-m-score">100%</p>'
      + '<p class="oeh-m-hint">Based on your answers &amp; availability</p></div>'
      + '<div><p class="oeh-m-label">Agent availability</p><p class="oeh-m-agents"><i></i><b>18</b> agents available</p>'
      + '<p class="oeh-m-hint">Available to talk by phone</p></div></div></div>'
      + '<div class="oeh-m-next"><div><p class="oeh-m-next-t">What happens next?</p>'
      + '<p class="oeh-m-hint">Call to review available plans, pricing, and enrollment details with a licensed agent. There is no obligation to enroll.</p></div>'
      + '<a href="tel:+12394232552">' + phone + 'Call (239) 423-2552</a></div>'
      + '<p class="oeh-m-fine">By calling, you may be connected with a licensed insurance agent. Plan availability and pricing vary by location and eligibility.</p>'
      + '</main>'
    var css = document.createElement("style")
    css.textContent = ''
      + '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");'
      + '#oeh-match-page{position:fixed;inset:0;z-index:2147483646;background:#f7f8fa;overflow:auto;font-family:Inter,Arial,Helvetica,sans-serif;color:#213244}'
      + '.oeh-bar{height:32px;display:flex;align-items:center;justify-content:center;gap:8px;background:#1e3447;color:#d7dee4;font-size:12px;letter-spacing:.01em}'
      + '.oeh-bar-ic{width:14px;height:14px;border:1.5px solid #d5dde3;border-radius:99px;box-sizing:border-box}'
      + '.oeh-hd{height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 48px;background:#fff}'
      + '.oeh-logo{font-size:20px;font-weight:800;letter-spacing:-0.03em;text-decoration:none;line-height:1}'
      + '.oeh-logo b,.oeh-m-word b{font-weight:800}'
      + '.oeh-logo b{color:#1a1a1a}.oeh-logo .en,.oeh-m-word .en{color:#E05E2F}.oeh-logo .he,.oeh-m-word .he{color:#9aa3ad}'
      + '.oeh-hd-r{display:flex;align-items:center;gap:22px}'
      + '.oeh-live{display:flex;align-items:center;gap:8px;font-size:14px;color:#3d4654}'
      + '.oeh-live i,.oeh-m-agents i{width:8px;height:8px;border-radius:99px;background:#1f9d55;display:inline-block}'
      + '.oeh-hd-tel{display:inline-flex;align-items:center;gap:8px;color:#1c2430;font-size:15px;font-weight:600;text-decoration:none}'
      + '.oeh-hd-tel svg{width:16px;height:16px;fill:none;stroke:#1c2430;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}'
      + '.oeh-m{max-width:720px;margin:0 auto;padding:56px 24px 72px}'
      + '.oeh-m-done{display:flex;align-items:center;gap:8px;margin:0 0 16px;color:#1f9d55;font-size:14px;font-weight:600}'
      + '.oeh-m-done span{width:18px;height:18px;border-radius:99px;background:#e5f6ec;position:relative;display:inline-block}'
      + '.oeh-m-done span:after{content:"";position:absolute;left:6px;top:3px;width:4px;height:8px;border:solid #1f9d55;border-width:0 2px 2px 0;transform:rotate(45deg)}'
      + '.oeh-m h2{margin:0;font-size:42px;line-height:1.15;font-weight:700;letter-spacing:-0.035em;color:#213244}'
      + '.oeh-m-sub{margin:12px 0 0;color:#667085;font-size:16px;line-height:1.45}'
      + '.oeh-m-card{margin-top:28px;background:#fff;border:1px solid #e4e5e7;border-radius:12px}'
      + '.oeh-m-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:22px 24px 18px}'
      + '.oeh-m-label{margin:0;color:#98a2b3;font-size:13px}'
      + '.oeh-m-word{margin:10px 0 0;font-size:32px;line-height:1;letter-spacing:-0.03em}'
      + '.oeh-m-word b{color:#1a1a1a}'
      + '.oeh-m-support{display:flex;align-items:center;gap:6px;margin:0;color:#667085;font-size:13px;white-space:nowrap}'
      + '.oeh-m-support svg{width:16px;height:16px;fill:none;stroke:#98a2b3;stroke-width:1.8;stroke-linejoin:round}'
      + '.oeh-m-split{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #e7eaee}'
      + '.oeh-m-split>div{padding:20px 24px 22px}'
      + '.oeh-m-split>div+div{border-left:1px solid #e7eaee}'
      + '.oeh-m-score{margin:8px 0 0;font-size:42px;font-weight:700;line-height:1;letter-spacing:-0.03em;color:#1a2332}'
      + '.oeh-m-score:after{content:"";display:block;width:92px;height:3px;margin-top:8px;background:#E05E2F;border-radius:2px}'
      + '.oeh-m-agents{display:flex;align-items:center;gap:8px;margin:12px 0 0;font-size:20px;font-weight:600;color:#1a2332}'
      + '.oeh-m-agents b{font-weight:700}'
      + '.oeh-m-hint{margin:8px 0 0;color:#98a2b3;font-size:13px;line-height:1.45}'
      + '.oeh-m-next{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:16px;padding:18px 20px;background:#eef3f6;border-radius:12px}'
      + '.oeh-m-next-t{margin:0 0 4px;font-size:16px;font-weight:700;color:#1a2332}'
      + '.oeh-m-next a{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px;border-radius:8px;background:#E05E2F;color:#fff;font-weight:650;font-size:14px;text-decoration:none;white-space:nowrap}'
      + '.oeh-m-next a svg{width:16px;height:16px;fill:none;stroke:#fff;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}'
      + '.oeh-m-fine{margin:16px 0 0;color:#98a2b3;font-size:12px;line-height:1.45}'
      + '@media(max-width:800px){.oeh-hd{padding:0 16px}.oeh-m h2{font-size:32px}.oeh-m-split,.oeh-m-next,.oeh-hd{display:block}.oeh-hd{height:auto;padding:16px}.oeh-hd-r{margin-top:12px}.oeh-m-split>div+div{border-left:0;border-top:1px solid #e7eaee}.oeh-m-next a{margin-top:12px}}'
    document.head.appendChild(css)
    document.body.appendChild(page)
  }, 8200)
}
