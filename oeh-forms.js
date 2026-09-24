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
