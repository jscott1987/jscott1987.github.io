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
    var quote = {}
    try { quote = JSON.parse(sessionStorage.getItem("oeh-quote") || "{}") } catch (err) {}
    var params = new URLSearchParams(location.search)
    function pick(keys) {
      for (var i = 0; i < keys.length; i++) {
        if (quote[keys[i]]) return quote[keys[i]]
        if (params.get(keys[i])) return params.get(keys[i])
      }
      return ""
    }
    var rows = [
      ["Coverage type", pick(["coverage"])],
      ["Age", pick(["age"])],
      ["Household income", pick(["income"])],
      ["Doctor visits per year", pick(["doctor", "visits"])],
      ["State", pick(["state"])]
    ]
    var met = rows.filter(function (row) { return row[1] }).length
    var refId = ""
    try { refId = sessionStorage.getItem("oeh-ref") || "" } catch (err) {}
    if (!refId) {
      var now = new Date()
      refId = "OEH-" + String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(Math.floor(100000 + Math.random() * 900000))
      try { sessionStorage.setItem("oeh-ref", refId) } catch (err) {}
    }
    var dateText = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    var phone = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 16.3v3a2 2 0 0 1-2.2 2A18.9 18.9 0 0 1 2.7 5.2 2 2 0 0 1 4.7 3h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8l-1.4 1.4a15 15 0 0 0 4.9 4.9l1.4-1.4a2 2 0 0 1 1.8-.6l3 .5a2 2 0 0 1 1.7 1.9Z"/></svg>'
    var mark = '<span class="wm"><span class="wm-open">Open</span><span class="wm-enroll">Enrollment</span><span class="wm-health">Health</span></span>'
    var body = rows.map(function (row) {
      return "<tr><th scope=\"row\">" + row[0] + "</th><td>" + (row[1] || "<span class=\"muted\">Not provided</span>") + "</td><td class=\"col-status\">Reviewed</td></tr>"
    }).join("")
    var page = document.createElement("div")
    page.id = "oeh-match-page"
    page.innerHTML = ''
      + '<header class="site-header"><div class="utility-bar"><div class="container utility-inner"><span>Licensed assistance for health plan enrollment</span><span class="utility-right">Licensed insurance agency</span></div></div>'
      + '<div class="container header-inner"><a href="/">' + mark + '</a><div class="header-contact"><span class="header-contact-label">Speak with a licensed agent</span><a class="header-phone" href="tel:+12394232552">' + phone + '(239) 423-2552</a></div></div></header>'
      + '<main class="page"><div class="container">'
      + '<nav class="steps" aria-label="Progress"><span class="step done">1. Your information</span><span class="step-sep">/</span><span class="step done">2. Review</span><span class="step-sep">/</span><span class="step current" aria-current="step">3. Results</span></nav>'
      + '<div class="page-head"><h1>Your plan match results</h1><p>We reviewed your answers and matched you with a licensed enrollment provider. An agent can confirm plan options, costs, and eligibility with you by phone.</p></div>'
      + '<div class="layout"><section class="panel results"><div class="panel-head"><h2>Match summary</h2><dl class="meta"><div><dt>Reference no.</dt><dd>' + refId + '</dd></div><div><dt>Date</dt><dd>' + dateText + '</dd></div></dl></div>'
      + '<div class="match-row"><div class="match-provider"><span class="field-label">Matched provider</span>' + mark.replace('class="wm"', 'class="wm wm-lg"') + '</div>'
      + '<dl class="match-stats"><div><dt>Match status</dt><dd><span class="status-tag">Matched</span></dd></div><div><dt>Criteria met</dt><dd>' + met + ' of 5</dd></div><div><dt>Licensed agents available</dt><dd>18</dd></div></dl></div>'
      + '<table class="criteria-table"><caption>Information you provided</caption><thead><tr><th scope="col">Criteria</th><th scope="col">Your answer</th><th scope="col" class="col-status">Status</th></tr></thead><tbody>' + body + '</tbody></table></section>'
      + '<aside class="panel next"><h2>Next step: speak with a licensed agent</h2><p>Call to review available plans, pricing, and enrollment details. There is no cost for the call and no obligation to enroll.</p>'
      + '<a class="call-btn" href="tel:+12394232552">' + phone + 'Call (239) 423-2552</a><p class="tty">TTY users dial 711</p>'
      + '<div class="prepare"><h3>Have this ready when you call</h3><ul><li>Your reference number: <strong>' + refId + '</strong></li><li>Your current insurance or Medicare card, if you have one</li><li>A list of your doctors and prescription medications</li></ul></div></aside></div>'
      + '<div class="disclosures"><p>By calling, you will be connected with a licensed insurance agent. Plan availability, benefits, and pricing vary by location and eligibility.</p>'
      + '<p>We do not offer every plan available in your area. Any information we provide is limited to those plans we do offer in your area. Please contact Medicare.gov, 1-800-MEDICARE, or your local State Health Insurance Program (SHIP) to get information on all of your options.</p>'
      + '<p>Open Enrollment Health is not connected with or endorsed by the U.S. government or the federal Medicare program.</p></div></div></main>'
      + '<footer class="site-footer"><div class="container footer-inner"><span>© ' + new Date().getFullYear() + ' Open Enrollment Health</span><span>Licensed insurance agency</span></div></footer>'
    var css = document.createElement("style")
    css.textContent = '@import url("https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap");'
      + '#oeh-match-page{position:fixed;inset:0;z-index:2147483646;overflow:auto;background:#f4f6f8;color:#1f2933;font-family:"Public Sans","Helvetica Neue",Arial,sans-serif}'
      + '#oeh-match-page *{box-sizing:border-box}#oeh-match-page a{color:inherit;text-decoration:none}'
      + '.container{width:100%;max-width:1120px;margin:0 auto;padding:0 24px}'
      + '.site-header{background:#fff;border-bottom:1px solid #d6dce3}'
      + '.utility-bar{background:#1b2b40;color:#dfe5ec;font-size:12.5px}'
      + '.utility-inner{height:30px;display:flex;align-items:center;justify-content:space-between}'
      + '.header-inner{height:68px;display:flex;align-items:center;justify-content:space-between;gap:16px}'
      + '.wm{font-size:23px;font-weight:700;letter-spacing:-0.03em;white-space:nowrap;line-height:1}'
      + '.wm-open{color:#1b2b40}.wm-enroll{color:#c4552c}.wm-health{color:#5f6b77;font-weight:400}'
      + '.wm-lg{font-size:26px}'
      + '.header-contact{display:flex;flex-direction:column;align-items:flex-end;gap:2px}'
      + '.header-contact-label{color:#6b7785;font-size:12px}'
      + '.header-phone{display:inline-flex;align-items:center;gap:7px;color:#1b2b40;font-size:18px;font-weight:700}'
      + '.header-phone svg,.call-btn svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
      + '.header-phone svg{width:16px;height:16px;color:#c4552c}'
      + '.page{padding:22px 0 32px}'
      + '.steps{display:flex;flex-wrap:wrap;gap:8px;font-size:13px;color:#6b7785}'
      + '.step.current{color:#1f2933;font-weight:600}.step-sep{color:#b3bcc6}'
      + '.page-head{margin:14px 0 20px;max-width:760px}'
      + '.page-head h1{margin:0 0 6px;font-size:30px;line-height:1.2;font-weight:700;letter-spacing:-0.015em;color:#1b2b40}'
      + '.page-head p{margin:0;font-size:15.5px;line-height:1.5;color:#3d4a57}'
      + '.layout{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:20px;align-items:start}'
      + '.panel{background:#fff;border:1px solid #d6dce3;border-radius:4px}'
      + '.panel-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 20px;border-bottom:1px solid #d6dce3;background:#fafbfc}'
      + '.panel-head h2{margin:0;font-size:16px;font-weight:700;color:#1b2b40}'
      + '.meta{display:flex;gap:24px;margin:0}.meta div{display:flex;gap:6px;font-size:13px}.meta dt{color:#6b7785}.meta dd{margin:0;color:#1f2933;font-weight:600}'
      + '.match-row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 20px;border-bottom:1px solid #d6dce3}'
      + '.match-provider{display:flex;flex-direction:column;gap:8px}.field-label{font-size:12.5px;color:#6b7785}'
      + '.match-stats{display:flex;gap:28px;margin:0}.match-stats div{display:flex;flex-direction:column;gap:4px}'
      + '.match-stats dt{font-size:12.5px;color:#6b7785}.match-stats dd{margin:0;font-size:17px;font-weight:700;color:#1f2933}'
      + '.status-tag{display:inline-block;padding:1px 8px;border:1px solid #b7d4c3;border-radius:3px;background:#eef6f1;color:#1d6b45;font-size:13px;font-weight:600;line-height:20px}'
      + '.criteria-table{width:100%;border-collapse:collapse;font-size:14px}'
      + '.criteria-table caption{padding:14px 20px 8px;text-align:left;font-size:13px;font-weight:600;color:#3d4a57}'
      + '.criteria-table thead th{padding:8px 20px;border-top:1px solid #e6eaee;border-bottom:1px solid #d6dce3;background:#fafbfc;text-align:left;font-size:12px;font-weight:600;color:#6b7785;text-transform:uppercase;letter-spacing:.04em}'
      + '.criteria-table tbody th,.criteria-table td{padding:10px 20px;border-bottom:1px solid #e6eaee;text-align:left}'
      + '.criteria-table tbody tr:last-child th,.criteria-table tbody tr:last-child td{border-bottom:0}'
      + '.criteria-table tbody th{width:38%;font-weight:500;color:#3d4a57}.criteria-table td{color:#1f2933;font-weight:600}'
      + '.criteria-table .col-status{width:110px;text-align:right}.criteria-table td.col-status{color:#1d6b45;font-weight:500;font-size:13px}'
      + '.muted{color:#6b7785;font-weight:400}'
      + '.next{padding:20px;border-top:3px solid #1b2b40}.next h2{margin:0 0 8px;font-size:17px;line-height:1.3;font-weight:700;color:#1b2b40}'
      + '.next>p{margin:0 0 16px;font-size:14px;line-height:1.5;color:#3d4a57}'
      + '.call-btn{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;height:48px;border-radius:4px;background:#c4552c;color:#fff;font-size:16px;font-weight:700}'
      + '.call-btn svg{width:18px;height:18px}.tty{margin:8px 0 0;text-align:center;font-size:12.5px;color:#6b7785}'
      + '.prepare{margin-top:18px;padding-top:16px;border-top:1px solid #e6eaee}.prepare h3{margin:0 0 8px;font-size:13.5px;font-weight:700}'
      + '.prepare ul{margin:0;padding-left:18px;font-size:13.5px;line-height:1.5;color:#3d4a57}.prepare li+li{margin-top:4px}'
      + '.disclosures{margin-top:20px;padding-top:14px;border-top:1px solid #d6dce3;max-width:900px}'
      + '.disclosures p{margin:0 0 6px;font-size:12px;line-height:1.5;color:#6b7785}'
      + '.site-footer{border-top:1px solid #d6dce3;background:#fff}'
      + '.footer-inner{height:48px;display:flex;align-items:center;justify-content:space-between;font-size:12.5px;color:#6b7785}'
      + '@media(max-width:960px){.layout{grid-template-columns:1fr}.next{order:-1}.prepare{display:none}}'
      + '@media(max-width:680px){.container{padding:0 16px}.utility-right{display:none}.utility-inner{justify-content:center}.header-inner{height:60px}.wm{font-size:19px}.header-contact-label{display:none}.header-phone{font-size:15px}.page-head h1{font-size:25px}.panel-head{flex-direction:column;align-items:flex-start}.match-row{flex-direction:column;align-items:flex-start}.match-stats{width:100%;justify-content:space-between}.criteria-table .col-status{display:none}.footer-inner{flex-direction:column;justify-content:center;height:60px}}'
    document.head.appendChild(css)
    document.body.appendChild(page)
  }, 8200)
}
