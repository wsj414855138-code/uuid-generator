const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { generateUuidV4, generateUuidV7, generateBatch, parseUuid, patternV4, patternV7, patternUuid, patternVersioned } = require("../public/assets/uuid.js");
const { javaUuidHashCode, locatorBarColor } = require("../public/assets/locator-color.js");

const root = path.join(__dirname, "..", "public");
const origin = "https://uuid-generator-umber.vercel.app";

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return full.endsWith(".html") ? [full] : [];
  });
}

const fixed = 0x018f4e2c3d4e;
const id = generateUuidV7(fixed);
assert.equal(id.slice(0, 15), "018f4e2c-3d4e-7");
assert.match(id, patternV7);
assert.equal(id[14], "7");
assert.match(id[19], /[89ab]/);

const parsed = parseUuid(id);
assert.equal(parsed.ok, true);
assert.equal(parsed.version, 7);
assert.equal(parsed.variantName, "rfc9562");
assert.match(parsed.variant, /^[89ab]$/);
assert.equal(parsed.timestampMs, fixed);
assert.equal(parsed.iso, new Date(fixed).toISOString());
assert.equal(parseUuid(id.toUpperCase()).timestampMs, fixed);
assert.equal(parseUuid(id.replace(/-/g, "")).uuid, id);
assert.equal(parseUuid("urn:uuid:" + id).uuid, id);

const live = parseUuid(generateUuidV7());
assert.equal(live.version, 7);
assert.ok(Math.abs(live.timestampMs - Date.now()) < 1000);

const v4 = generateUuidV4();
assert.match(v4, patternV4);
assert.doesNotMatch(v4, patternV7);
assert.equal(parseUuid(v4).timestampMs, null);
assert.equal(parseUuid(v4).version, 4);

const batch = generateBatch(100, { version: 7, max: 100 });
assert.equal(new Set(batch).size, 100);
assert.ok(batch.every((value) => patternV7.test(value)));
assert.throws(() => generateBatch(10001, { version: 4, max: 10000 }));

const nil = "00000000-0000-0000-0000-000000000000";
assert.match(nil, patternUuid);
assert.doesNotMatch(nil, patternVersioned);
assert.match(v4, patternVersioned);
assert.match(id, patternVersioned);
assert.equal(parseUuid("not a uuid").ok, false);

const notch = "069a79f4-44e9-4726-a5be-fca90e38aaf5";
assert.equal(javaUuidHashCode(notch) >>> 0, 0xe9f5688e);
assert.equal(javaUuidHashCode(notch.toUpperCase()) >>> 0, 0xe9f5688e);
assert.equal(javaUuidHashCode(notch.replace(/-/g, "")) >>> 0, 0xe9f5688e);
assert.equal(javaUuidHashCode("00000000-0000-0000-0000-000000000001"), 1);
assert.equal(javaUuidHashCode("00000000-0000-0000-0000-000000000000"), 0);
assert.equal(javaUuidHashCode("not-a-uuid"), null);
const notchColor = locatorBarColor(notch);
assert.equal(notchColor.rawHex, "#F5688E");
assert.equal(notchColor.hex, "#E66185");
assert.deepEqual([notchColor.r, notchColor.g, notchColor.b], [230, 97, 133]);
assert.equal(locatorBarColor("00000000-0000-0000-0000-000000000000").hex, "#E6E6E6");

const htmlFiles = walk(root);
assert.equal(htmlFiles.length, 20);

const pages = [
  ["/", "/zh/"],
  ["/uuid-v7-generator/", "/zh/uuid-v7-generator/"],
  ["/uuid-v7-to-timestamp/", "/zh/uuid-v7-to-timestamp/"],
  ["/uuid-validator/", "/zh/uuid-validator/"],
  ["/bulk-uuid-generator/", "/zh/bulk-uuid-generator/"],
  ["/uuid-v7-vs-ulid/", "/zh/uuid-v7-vs-ulid/"],
  ["/uuid-v7-vs-v4/", "/zh/uuid-v7-vs-v4/"],
  ["/uuid-v7-postgres/", "/zh/uuid-v7-postgres/"],
  ["/uuid-v7-java/", "/zh/uuid-v7-java/"],
  ["/minecraft-uuid-locator-bar-color/", "/zh/minecraft-uuid-locator-bar-color/"],
];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.ok(blocks.length >= 1, file);
  for (const block of blocks) JSON.parse(block[1]);
  assert.match(html, /<link rel="alternate" hreflang="en" href="https:\/\/uuid-generator-umber\.vercel\.app\/[^"]*">/);
  assert.match(html, /<link rel="alternate" hreflang="zh-Hans" href="https:\/\/uuid-generator-umber\.vercel\.app\/[^"]*">/);
  assert.match(html, /<link rel="alternate" hreflang="x-default" href="https:\/\/uuid-generator-umber\.vercel\.app\/[^"]*">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/uuid-generator-umber\.vercel\.app\/[^"]*">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/uuid-generator-umber\.vercel\.app\/[^"]*">/);
  assert.match(html, /window\.vaq = window\.vaq \|\| \[\]/);
  assert.match(html, /<script defer src="\/_vercel\/insights\/script\.js"><\/script>/);
  const isHome = file === path.join(root, "index.html") || file === path.join(root, "zh", "index.html");
  if (isHome) {
    assert.ok(html.includes('<meta name="google-site-verification" content="WUiUqFMRdkf6zMy0DAHwLQXTdtf39n8QKbi3EutCM1w" />'), file);
  } else {
    assert.match(html, /<!-- google-site-verification -->/);
  }
  assert.doesNotMatch(html, /googletagmanager|google-analytics|gtag\(/);
  const data = JSON.parse(blocks[0][1]);
  const faq = data["@graph"].find((item) => item["@type"] === "FAQPage");
  const questions = [...html.matchAll(/<summary>([^<]*)<\/summary>\s*<p>([^<]*)<\/p>/g)];
  assert.equal(faq.mainEntity.length, questions.length, file);
  faq.mainEntity.forEach((item, index) => {
    assert.equal(item.name, questions[index][1]);
    assert.equal(item.acceptedAnswer.text, questions[index][2]);
  });
}

const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const homeZh = fs.readFileSync(path.join(root, "zh", "index.html"), "utf8");
for (const html of [home, homeZh]) {
  assert.match(html, /<title>[^<]*UUID v4 \/ v7 Generator[^<]*<\/title>/);
  assert.match(html, /content="[^"]*UUID v4 \/ v7 Generator[^"]*"/);
  assert.match(html, /<h1>UUID v4 \/ v7 Generator<\/h1>/);
}
assert.match(home, /value="4" checked/);
assert.match(fs.readFileSync(path.join(root, "uuid-v7-generator", "index.html"), "utf8"), /value="7" checked/);

const validator = fs.readFileSync(path.join(root, "uuid-validator", "index.html"), "utf8");
assert.ok(validator.includes(patternUuid.source));
assert.ok(validator.includes(patternVersioned.source));
assert.ok(validator.includes(patternV7.source));

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
for (const [en, zh] of pages) {
  assert.ok(sitemap.includes(`<loc>${origin}${en}</loc>`), en);
  assert.ok(sitemap.includes(`<loc>${origin}${zh}</loc>`), zh);
}
assert.equal(sitemap.split("<loc>").length - 1, 20);
for (const file of htmlFiles) {
  assert.ok(fs.readFileSync(file, "utf8").includes("minecraft-uuid-locator-bar-color"), file);
}

const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
assert.match(robots, /Sitemap: https:\/\/uuid-generator-umber\.vercel\.app\/sitemap\.xml/);

console.log("uuid tests passed");
