(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LocatorColor = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var UUID_SHAPE =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  function canonicalUuid(input) {
    if (typeof input !== "string") return null;
    var text = input.trim();
    if (/^urn:uuid:/i.test(text)) text = text.slice("urn:uuid:".length).trim();
    var hex = "";
    if (/^[0-9a-fA-F]{32}$/.test(text)) hex = text.toLowerCase();
    else if (UUID_SHAPE.test(text)) hex = text.replace(/-/g, "").toLowerCase();
    else return null;
    return (
      hex.slice(0, 8) +
      "-" +
      hex.slice(8, 12) +
      "-" +
      hex.slice(12, 16) +
      "-" +
      hex.slice(16, 20) +
      "-" +
      hex.slice(20)
    );
  }

  function javaUuidHashCode(input) {
    var uuid = canonicalUuid(input);
    if (!uuid) return null;
    var hex = uuid.replace(/-/g, "");
    var most = BigInt("0x" + hex.slice(0, 16));
    var least = BigInt("0x" + hex.slice(16));
    var hilo = most ^ least;
    return Number(BigInt.asIntN(32, (hilo >> 32n) ^ (hilo & 0xffffffffn)));
  }

  function channel(value) {
    var scaled = value * 255;
    var rounded = Math.round(scaled);
    if (rounded < 0) return 0;
    if (rounded > 255) return 255;
    return rounded;
  }

  function hexByte(value) {
    return value.toString(16).padStart(2, "0").toUpperCase();
  }

  function setHsvValue(r, g, b, value) {
    var rf = r / 255;
    var gf = g / 255;
    var bf = b / 255;
    var max = Math.max(rf, gf, bf);
    var min = Math.min(rf, gf, bf);
    var delta = max - min;
    var hue = 0;
    if (delta !== 0) {
      if (max === rf) hue = ((gf - bf) / delta) % 6;
      else if (max === gf) hue = (bf - rf) / delta + 2;
      else hue = (rf - gf) / delta + 4;
      if (hue < 0) hue += 6;
    }
    var saturation = max === 0 ? 0 : delta / max;
    var chroma = value * saturation;
    var x = chroma * (1 - Math.abs((hue % 2) - 1));
    var match = value - chroma;
    var red = 0;
    var green = 0;
    var blue = 0;
    if (hue < 1) {
      red = chroma;
      green = x;
    } else if (hue < 2) {
      red = x;
      green = chroma;
    } else if (hue < 3) {
      green = chroma;
      blue = x;
    } else if (hue < 4) {
      green = x;
      blue = chroma;
    } else if (hue < 5) {
      red = x;
      blue = chroma;
    } else {
      red = chroma;
      blue = x;
    }
    return {
      r: channel(red + match),
      g: channel(green + match),
      b: channel(blue + match),
    };
  }

  function locatorBarColor(input) {
    var uuid = canonicalUuid(input);
    var hash = javaUuidHashCode(uuid);
    if (uuid == null || hash == null) return null;
    var bits = (hash >>> 0) & 0xffffff;
    var raw = {
      r: (bits >>> 16) & 255,
      g: (bits >>> 8) & 255,
      b: bits & 255,
    };
    var color = setHsvValue(raw.r, raw.g, raw.b, 0.9);
    return {
      uuid: uuid,
      hash: hash,
      raw: raw,
      r: color.r,
      g: color.g,
      b: color.b,
      hex: "#" + hexByte(color.r) + hexByte(color.g) + hexByte(color.b),
      rawHex: "#" + hexByte(raw.r) + hexByte(raw.g) + hexByte(raw.b),
    };
  }

  return {
    canonicalUuid: canonicalUuid,
    javaUuidHashCode: javaUuidHashCode,
    setHsvValue: setHsvValue,
    locatorBarColor: locatorBarColor,
  };
});
