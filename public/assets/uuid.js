(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.UuidTool = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var UUID_V4 =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  function generateUuidV4() {
    var cryptoObj = globalThis.crypto;
    if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
      throw new Error("crypto.getRandomValues is not available");
    }

    var bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

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

  function generateBatch(count) {
    if (!Number.isInteger(count) || count < 1 || count > 100) {
      throw new RangeError("count must be an integer from 1 to 100");
    }

    var seen = new Set();
    var list = [];
    var attempts = 0;
    var limit = count * 8;

    while (list.length < count && attempts < limit) {
      attempts += 1;
      var id = generateUuidV4();
      if (seen.has(id)) continue;
      seen.add(id);
      list.push(id);
    }

    if (list.length !== count) {
      throw new Error("could not build a unique batch");
    }

    return list;
  }

  return {
    pattern: UUID_V4,
    generateUuidV4: generateUuidV4,
    generateBatch: generateBatch,
  };
});
