(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.UuidTool = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var UUID_SHAPE =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  var UUID_VERSIONED =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  var UUID_V4 =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  var UUID_V7 =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-7[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  var HARD_MAX = 10000;
  var TS_MAX = 0xffffffffffff;

  function cryptoBytes(length) {
    var cryptoObj = globalThis.crypto;
    if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
      throw new Error("crypto.getRandomValues is not available");
    }
    var bytes = new Uint8Array(length);
    cryptoObj.getRandomValues(bytes);
    return bytes;
  }

  function formatBytes(bytes) {
    var hex = "";
    for (var i = 0; i < bytes.length; i += 1) {
      hex += bytes[i].toString(16).padStart(2, "0");
    }
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

  function applyVersionAndVariant(bytes, versionNibble) {
    bytes[6] = (bytes[6] & 0x0f) | (versionNibble << 4);
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
  }

  function generateUuidV4() {
    var bytes = cryptoBytes(16);
    applyVersionAndVariant(bytes, 0x4);
    return formatBytes(bytes);
  }

  function generateUuidV7(timestampMs) {
    var ts = timestampMs == null ? Date.now() : timestampMs;
    if (!Number.isInteger(ts) || ts < 0 || ts > TS_MAX) {
      throw new RangeError("timestamp must be a 48-bit Unix millisecond count");
    }
    var bytes = cryptoBytes(16);
    var value = ts;
    for (var i = 5; i >= 0; i -= 1) {
      bytes[i] = value % 256;
      value = Math.floor(value / 256);
    }
    applyVersionAndVariant(bytes, 0x7);
    return formatBytes(bytes);
  }

  function normalizeVersion(version) {
    if (version === 7 || version === "7") return 7;
    if (version === 4 || version === "4" || version == null) return 4;
    throw new RangeError("version must be 4 or 7");
  }

  function generateBatch(count, options) {
    var version = normalizeVersion(options && options.version);
    var max = options && options.max != null ? options.max : 100;
    if (!Number.isInteger(max) || max < 1 || max > HARD_MAX) {
      throw new RangeError("max must be an integer from 1 to 10000");
    }
    if (!Number.isInteger(count) || count < 1 || count > max) {
      throw new RangeError("count must be an integer from 1 to " + max);
    }

    var make = version === 7 ? generateUuidV7 : generateUuidV4;
    var seen = new Set();
    var list = [];
    var attempts = 0;
    var limit = count * 8;
    while (list.length < count && attempts < limit) {
      attempts += 1;
      var id = make();
      if (seen.has(id)) continue;
      seen.add(id);
      list.push(id);
    }
    if (list.length !== count) {
      throw new Error("could not build a unique batch");
    }
    return list;
  }

  function emptyParse() {
    return {
      ok: false,
      uuid: null,
      version: null,
      variant: null,
      variantName: null,
      timestampMs: null,
      iso: null,
    };
  }

  function variantName(byte) {
    if ((byte & 0x80) === 0) return "ncs";
    if ((byte & 0xc0) === 0x80) return "rfc9562";
    if ((byte & 0xe0) === 0xc0) return "microsoft";
    return "future";
  }

  function parseUuid(input) {
    if (typeof input !== "string") return emptyParse();
    var text = input.trim();
    if (/^urn:uuid:/i.test(text)) text = text.slice("urn:uuid:".length).trim();

    var hex = "";
    if (/^[0-9a-fA-F]{32}$/.test(text)) {
      hex = text.toLowerCase();
    } else if (UUID_SHAPE.test(text)) {
      hex = text.replace(/-/g, "").toLowerCase();
    } else {
      return emptyParse();
    }

    var bytes = new Array(16);
    for (var i = 0; i < 16; i += 1) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }

    var version = bytes[6] >> 4;
    var name = variantName(bytes[8]);
    var timestampMs = null;
    var iso = null;
    if (version === 7 && name === "rfc9562") {
      timestampMs = 0;
      for (var b = 0; b < 6; b += 1) timestampMs = timestampMs * 256 + bytes[b];
      iso = new Date(timestampMs).toISOString();
    }

    return {
      ok: true,
      uuid: formatBytes(bytes),
      version: version,
      variant: (bytes[8] >> 4).toString(16),
      variantName: name,
      timestampMs: timestampMs,
      iso: iso,
    };
  }

  return {
    pattern: UUID_V4,
    patternV4: UUID_V4,
    patternV7: UUID_V7,
    patternUuid: UUID_SHAPE,
    patternVersioned: UUID_VERSIONED,
    maxBatch: HARD_MAX,
    generateUuidV4: generateUuidV4,
    generateUuidV7: generateUuidV7,
    generateBatch: generateBatch,
    parseUuid: parseUuid,
  };
});
