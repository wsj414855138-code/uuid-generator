(function () {
  var root = document.querySelector("[data-uuid-app]");
  var stringsNode = document.getElementById("ui-strings");
  if (!root || !stringsNode || !globalThis.UuidTool) return;

  var strings = JSON.parse(stringsNode.textContent);
  var tool = root.getAttribute("data-tool") || "generate";
  var timers = new WeakMap();

  function announce(message) {
    var status = root.querySelector("[data-status]");
    if (!status) return;
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

  function readMax() {
    var max = Number(root.getAttribute("data-max") || "100");
    if (!Number.isInteger(max) || max < 1 || max > UuidTool.maxBatch) return 100;
    return max;
  }

  function selectedVersion() {
    var checked = root.querySelector('input[name="uuid-version"]:checked');
    return checked && checked.value === "7" ? 7 : 4;
  }

  function variantLabel(name) {
    var labels = strings.variants || {};
    return labels[name] || name;
  }

  function linesFrom(field) {
    return field.value.split(/\r?\n/).map(function (line) {
      return line.trim();
    }).filter(function (line) {
      return line.length > 0;
    });
  }

  if (tool === "decode" || tool === "validate") {
    initInspect(tool);
    return;
  }
  initGenerate(tool === "bulk");

  function initGenerate(isBulk) {
    var form = root.querySelector("[data-form]");
    var countInput = root.querySelector("[data-count]");
    var list = root.querySelector("[data-list]");
    var empty = root.querySelector("[data-empty]");
    var copyAllBtn = root.querySelector("[data-copy-all]");
    var resultCount = root.querySelector("[data-result-count]");
    var error = root.querySelector("[data-error]");
    var previewNote = root.querySelector("[data-preview-note]");
    var max = readMax();
    var previewCap = Number(root.getAttribute("data-preview") || "0");
    var items = [];

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

    function setExportsEnabled(enabled) {
      root.querySelectorAll("[data-export]").forEach(function (button) {
        button.disabled = !enabled;
      });
    }

    function render() {
      var copyAllTimer = timers.get(copyAllBtn);
      if (copyAllTimer) window.clearTimeout(copyAllTimer);
      copyAllBtn.textContent = strings.copyAll;
      list.replaceChildren();
      resultCount.textContent = String(items.length);
      empty.hidden = items.length > 0;
      copyAllBtn.disabled = items.length === 0;
      setExportsEnabled(items.length > 0);

      var shown = items;
      if (previewCap > 0 && items.length > previewCap) shown = items.slice(0, previewCap);
      if (previewNote) {
        previewNote.hidden = !(previewCap > 0 && items.length > shown.length);
        previewNote.textContent = strings.preview
          .replace("{shown}", String(shown.length))
          .replace("{n}", String(items.length));
      }

      shown.forEach(function (id, index) {
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
        button.setAttribute("aria-label", strings.copyOneLabel.replace("{id}", id));
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
      var count = readInteger(countInput.value);
      if (count == null || count < 1 || count > max) {
        showError(strings.invalidCount.replace("{max}", String(max)));
        countInput.focus();
        return;
      }
      clearError();
      countInput.value = String(count);
      try {
        items = UuidTool.generateBatch(count, {
          version: selectedVersion(),
          max: max,
        });
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
        if (next > max) next = max;
        countInput.value = String(next);
        clearError();
        countInput.focus();
      });
    });

    if (isBulk) {
      root.querySelectorAll("[data-export]").forEach(function (button) {
        button.addEventListener("click", function () {
          if (!items.length) return;
          var kind = button.getAttribute("data-export");
          var filename = "uuids.txt";
          var mime = "text/plain;charset=utf-8";
          var body = items.join("\n") + "\n";
          if (kind === "csv") {
            filename = "uuids.csv";
            mime = "text/csv;charset=utf-8";
            body = "uuid\n" + items.join("\n") + "\n";
          } else if (kind === "json") {
            filename = "uuids.json";
            mime = "application/json;charset=utf-8";
            body = JSON.stringify(items);
          }
          var blob = new Blob([body], { type: mime });
          var url = URL.createObjectURL(blob);
          var link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
          announce(strings.downloaded.replace("{file}", filename));
        });
      });
    }

    countInput.addEventListener("input", clearError);
    render();
  }

  function initInspect(kind) {
    var form = root.querySelector("[data-form]");
    var field = root.querySelector("[data-input]");
    var error = root.querySelector("[data-error]");
    var empty = root.querySelector("[data-empty]");
    var output = root.querySelector("[data-output]");
    var limit = 200;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var values = linesFrom(field);
      error.hidden = true;
      error.textContent = "";
      if (!values.length) {
        error.hidden = false;
        error.textContent = strings.emptyInput;
        output.replaceChildren();
        empty.hidden = false;
        return;
      }
      if (values.length > limit) {
        error.hidden = false;
        error.textContent = strings.tooMany.replace("{max}", String(limit));
        return;
      }
      empty.hidden = true;
      var tableWrap = root.querySelector("[data-table]");
      if (tableWrap) tableWrap.hidden = false;
      output.replaceChildren();
      var okCount = 0;
      values.forEach(function (value, index) {
        var parsed = UuidTool.parseUuid(value);
        if (parsed.ok) okCount += 1;
        output.append(kind === "validate" ? validationRow(index + 1, value, parsed) : decodeCard(value, parsed));
      });
      announce(
        strings.summary
          .replace("{ok}", String(okCount))
          .replace("{bad}", String(values.length - okCount))
      );
    });
  }

  function addPair(list, label, value) {
    var term = document.createElement("dt");
    term.textContent = label;
    var detail = document.createElement("dd");
    detail.textContent = value;
    list.append(term, detail);
  }

  function decodeCard(value, parsed) {
    var card = document.createElement("article");
    card.className = "decode-card";
    var title = document.createElement("code");
    title.textContent = parsed.ok ? parsed.uuid : value;
    card.append(title);
    var list = document.createElement("dl");
    if (!parsed.ok) {
      addPair(list, strings.fieldResult, strings.invalidLine);
    } else {
      addPair(list, strings.fieldVersion, String(parsed.version));
      addPair(list, strings.fieldVariant, variantLabel(parsed.variantName) + " · " + parsed.variant);
      addPair(list, strings.fieldMillis, parsed.timestampMs == null ? strings.noTime : String(parsed.timestampMs));
      addPair(list, strings.fieldIso, parsed.iso == null ? strings.noTime : parsed.iso);
    }
    card.append(list);
    return card;
  }

  function validationRow(lineNo, value, parsed) {
    var row = document.createElement("tr");
    [String(lineNo), value, parsed.ok ? strings.valid : strings.invalidLine, parsed.ok ? String(parsed.version) : "—", parsed.ok ? variantLabel(parsed.variantName) : "—"].forEach(function (text, index) {
      var cell = document.createElement("td");
      cell.textContent = text;
      if (index === 2) cell.className = parsed.ok ? "ok" : "bad";
      row.append(cell);
    });
    return row;
  }
})();
