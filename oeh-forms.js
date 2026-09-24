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
    var page = document.createElement("div")
    page.id = "oeh-match-page"
    page.innerHTML = ''
      + '<div class="oeh-m">'
      + '<p class="oeh-m-done"><span></span>Match complete</p>'
      + '<h2>We found your best match.</h2>'
      + '<p class="oeh-m-sub">Your match is ready. A licensed agent can help confirm the details before you decide.</p>'
      + '<div class="oeh-m-card">'
      + '<div class="oeh-m-top"><div><p class="oeh-m-label">Your match</p>'
      + '<p class="oeh-m-word"><b>Open</b><b class="en">Enrollment</b><b class="he">Health</b></p></div>'
      + '<p class="oeh-m-support">Licensed agent support</p></div>'
      + '<div class="oeh-m-split"><div><p class="oeh-m-label">Match score</p><p class="oeh-m-score">100%</p>'
      + '<p class="oeh-m-hint">Based on your answers &amp; availability</p></div>'
      + '<div><p class="oeh-m-label">Agent availability</p><p class="oeh-m-agents"><i></i>18 agents available</p>'
      + '<p class="oeh-m-hint">Available to talk by phone</p></div></div></div>'
      + '<div class="oeh-m-next"><div><p class="oeh-m-next-t">What happens next?</p>'
      + '<p class="oeh-m-hint">Call to review available plans, pricing, and enrollment details with a licensed agent. There is no obligation to enroll.</p></div>'
      + '<a href="tel:+12394232552">Call (239) 423-2552</a></div>'
      + '<p class="oeh-m-fine">By calling, you may be connected with a licensed insurance agent. Plan availability and pricing vary by location and eligibility.</p>'
      + '</div>'
    var css = document.createElement("style")
    css.textContent = ''
      + '#oeh-match-page{position:fixed;left:0;right:0;bottom:0;top:104px;z-index:2147483646;background:#f4f6f8;overflow:auto;font-family:Arial,Helvetica,sans-serif;color:#1a2332}'
      + '.oeh-m{max-width:720px;margin:28px auto 40px;padding:0 16px}'
      + '.oeh-m-done{display:flex;align-items:center;gap:8px;margin:0 0 14px;color:#1f8a4c;font-size:14px;font-weight:600}'
      + '.oeh-m-done span{width:18px;height:18px;border-radius:99px;background:#1f8a4c;position:relative;display:inline-block}'
      + '.oeh-m-done span:after{content:"";position:absolute;left:5px;top:3px;width:5px;height:8px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}'
      + '.oeh-m h2{margin:0;font-size:40px;line-height:1.1;letter-spacing:-0.03em}'
      + '.oeh-m-sub{margin:10px 0 0;color:#667085;font-size:15px}'
      + '.oeh-m-card{margin-top:22px;background:#fff;border:1px solid #e6e8ee;border-radius:10px}'
      + '.oeh-m-top{display:flex;justify-content:space-between;gap:16px;padding:18px 20px 16px}'
      + '.oeh-m-label{margin:0;color:#8b93a1;font-size:13px}'
      + '.oeh-m-word{margin:8px 0 0;font-size:28px;line-height:1;letter-spacing:-0.03em}'
      + '.oeh-m-word b{font-weight:800;color:#1a1a1a}'
      + '.oeh-m-word .en{color:#ED5D09}.oeh-m-word .he{color:#8d8d8d}'
      + '.oeh-m-support{margin:0;color:#667085;font-size:13px;white-space:nowrap}'
      + '.oeh-m-split{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #e6e8ee}'
      + '.oeh-m-split>div{padding:18px 20px 20px}'
      + '.oeh-m-split>div+div{border-left:1px solid #e6e8ee}'
      + '.oeh-m-score{margin:8px 0 0;font-size:40px;font-weight:750;line-height:1}'
      + '.oeh-m-score:after{content:"";display:block;width:72px;height:3px;margin-top:8px;background:#ED5D09}'
      + '.oeh-m-agents{display:flex;align-items:center;gap:8px;margin:10px 0 0;font-size:22px;font-weight:700}'
      + '.oeh-m-agents i{width:8px;height:8px;border-radius:99px;background:#1f8a4c;display:inline-block}'
      + '.oeh-m-hint{margin:8px 0 0;color:#8b93a1;font-size:13px;line-height:1.4}'
      + '.oeh-m-next{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:14px;padding:16px 18px;background:#eef2f5;border-radius:10px}'
      + '.oeh-m-next-t{margin:0;font-size:16px;font-weight:700}'
      + '.oeh-m-next a{flex:0 0 auto;display:inline-flex;align-items:center;height:42px;padding:0 16px;border-radius:8px;background:#ED5D09;color:#fff;font-weight:700;font-size:14px;text-decoration:none;white-space:nowrap}'
      + '.oeh-m-fine{margin:14px 0 0;color:#98a2b3;font-size:12px;line-height:1.4}'
      + '@media(max-width:700px){.oeh-m h2{font-size:30px}.oeh-m-split,.oeh-m-next{display:block}.oeh-m-split>div+div{border-left:0;border-top:1px solid #e6e8ee}.oeh-m-next a{margin-top:12px}}'
    document.head.appendChild(css)
    document.body.appendChild(page)
  }, 8200)
}
