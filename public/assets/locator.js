(function () {
  var root = document.querySelector("[data-locator-app]");
  var stringsNode = document.getElementById("ui-strings");
  if (!root || !stringsNode || !globalThis.LocatorColor) return;

  var strings = JSON.parse(stringsNode.textContent);
  var form = root.querySelector("[data-form]");
  var field = root.querySelector("[data-input]");
  var error = root.querySelector("[data-error]");
  var empty = root.querySelector("[data-empty]");
  var result = root.querySelector("[data-result]");
  var swatch = root.querySelector("[data-swatch]");
  var nameRow = root.querySelector("[data-name-row]");
  var nameValue = root.querySelector("[data-name]");
  var uuidValue = root.querySelector("[data-uuid]");
  var hexValue = root.querySelector("[data-hex]");
  var rgbValue = root.querySelector("[data-rgb]");
  var source = root.querySelector("[data-source]");
  var status = root.querySelector("[data-status]");
  var submit = root.querySelector("[data-submit]");

  function announce(message) {
    status.textContent = "";
    window.requestAnimationFrame(function () {
      status.textContent = message;
    });
  }

  function showError(message) {
    error.hidden = false;
    error.textContent = message;
    field.setAttribute("aria-invalid", "true");
  }

  function clearError() {
    error.hidden = true;
    error.textContent = "";
    field.removeAttribute("aria-invalid");
  }

  function showColor(color, playerName, sourceText) {
    empty.hidden = true;
    result.hidden = false;
    swatch.style.background = color.hex;
    swatch.style.color = color.r * 0.299 + color.g * 0.587 + color.b * 0.114 > 150 ? "#1c1915" : "#f7f3ea";
    swatch.textContent = color.hex;
    if (playerName) {
      nameRow.hidden = false;
      nameValue.textContent = playerName;
    } else {
      nameRow.hidden = true;
      nameValue.textContent = "";
    }
    uuidValue.textContent = color.uuid;
    hexValue.textContent = color.hex;
    rgbValue.textContent = color.r + ", " + color.g + ", " + color.b;
    source.textContent = sourceText;
    announce(strings.ready.replace("{hex}", color.hex));
  }

  function lookup(name) {
    submit.disabled = true;
    return fetch("https://playerdb.co/api/player/minecraft/" + encodeURIComponent(name))
      .then(function (response) {
        return response.json().then(function (body) {
          return { ok: response.ok, body: body };
        });
      })
      .then(function (payload) {
        var player = payload.body && payload.body.data && payload.body.data.player;
        if (!payload.ok || !player || !player.id) {
          showError(strings.notFound);
          return;
        }
        var color = LocatorColor.locatorBarColor(player.id);
        if (!color) {
          showError(strings.invalid);
          return;
        }
        showColor(color, player.username || name, strings.fromPlayerDb);
      })
      .catch(function () {
        showError(strings.network);
      })
      .then(function () {
        submit.disabled = false;
      });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearError();
    var text = field.value.trim();
    if (!text) {
      showError(strings.invalid);
      return;
    }
    var direct = LocatorColor.locatorBarColor(text);
    if (direct) {
      showColor(direct, "", strings.fromUuid);
      return;
    }
    if (!/^[A-Za-z0-9_]{3,16}$/.test(text)) {
      showError(strings.invalid);
      return;
    }
    lookup(text);
  });

  field.addEventListener("input", clearError);
})();
