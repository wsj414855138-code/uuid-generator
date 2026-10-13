(function () {
  var root = document.querySelector("[data-uuid-app]");
  var stringsNode = document.getElementById("ui-strings");
  if (!root || !stringsNode || !globalThis.UuidTool) return;

  var strings = JSON.parse(stringsNode.textContent);
  var form = root.querySelector("[data-form]");
  var countInput = root.querySelector("[data-count]");
  var list = root.querySelector("[data-list]");
  var empty = root.querySelector("[data-empty]");
  var copyAllBtn = root.querySelector("[data-copy-all]");
  var resultCount = root.querySelector("[data-result-count]");
  var error = root.querySelector("[data-error]");
  var status = root.querySelector("[data-status]");
  var items = [];
  var timers = new WeakMap();

  function announce(message) {
    status.textContent = "";
    window.requestAnimationFrame(function () {
      status.textContent = message;
    });
  }

  function flash(button, nextLabel, restoreLabel) {
    var previous = timers.get(button);
    if (previous) window.clearTimeout(previous);
    button.textContent = nextLabel;
    timers.set(
      button,
      window.setTimeout(function () {
        button.textContent = restoreLabel;
      }, 1400)
    );
  }

  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    area.remove();
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () {
          return true;
        },
        function () {
          return fallbackCopy(text);
        }
      );
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function readInteger(raw) {
    var value = String(raw).trim();
    if (!/^\d+$/.test(value)) return null;
    return Number(value);
  }

  function parseCount(raw) {
    var count = readInteger(raw);
    if (count == null || count < 1 || count > 100) return null;
    return count;
  }

  function showError(message) {
    error.hidden = false;
    error.textContent = message;
    countInput.setAttribute("aria-invalid", "true");
  }

  function clearError() {
    error.hidden = true;
    error.textContent = "";
    countInput.removeAttribute("aria-invalid");
  }

  function render() {
    var copyAllTimer = timers.get(copyAllBtn);
    if (copyAllTimer) window.clearTimeout(copyAllTimer);
    copyAllBtn.textContent = strings.copyAll;
    list.replaceChildren();
    resultCount.textContent = String(items.length);
    empty.hidden = items.length > 0;
    copyAllBtn.disabled = items.length === 0;

    items.forEach(function (id, index) {
      var row = document.createElement("li");
      row.className = "result-row";

      var indexLabel = document.createElement("span");
      indexLabel.className = "result-index";
      indexLabel.textContent = String(index + 1);

      var code = document.createElement("code");
      code.textContent = id;

      var button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-ghost btn-small";
      button.textContent = strings.copyOne;
      button.setAttribute(
        "aria-label",
        strings.copyOneLabel.replace("{id}", id)
      );

      button.addEventListener("click", function () {
        copyText(id).then(function (ok) {
          if (!ok) {
            announce(strings.copyFailed);
            return;
          }
          flash(button, strings.copiedOne, strings.copyOne);
          announce(strings.copiedOne);
        });
      });

      row.append(indexLabel, code, button);
      list.append(row);
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var count = parseCount(countInput.value);
    if (count == null) {
      showError(strings.invalidCount);
      countInput.focus();
      return;
    }

    clearError();
    countInput.value = String(count);

    try {
      items = UuidTool.generateBatch(count);
    } catch (err) {
      items = [];
      render();
      showError(strings.cryptoMissing);
      return;
    }

    render();
    announce(strings.generated.replace("{n}", String(count)));
  });

  copyAllBtn.addEventListener("click", function () {
    if (!items.length) return;
    copyText(items.join("\n")).then(function (ok) {
      if (!ok) {
        announce(strings.copyFailed);
        return;
      }
      flash(copyAllBtn, strings.copiedAll, strings.copyAll);
      announce(strings.copiedAll);
    });
  });

  root.querySelectorAll("[data-step]").forEach(function (button) {
    button.addEventListener("click", function () {
      var current = readInteger(countInput.value);
      var delta = Number(button.getAttribute("data-step"));
      var next = current == null ? 1 : current + delta;
      if (next < 1) next = 1;
      if (next > 100) next = 100;
      countInput.value = String(next);
      clearError();
      countInput.focus();
    });
  });

  countInput.addEventListener("input", clearError);
  render();
})();
