# UUID generator

Static site that creates UUID version 4 and version 7 values in the browser with `crypto.getRandomValues`.

English pages start at `/`. Chinese pages start at `/zh/`. Tool pages cover generation, a v7 timestamp decoder, validation, a bulk download of up to 10000 values, short notes for PostgreSQL 18 and Java, and a Minecraft Java locator-bar color lookup.

## Preview locally

```bash
npx --yes serve public
```

Open the URL printed by the command.

Check the generator and the page metadata with:

```bash
node scripts/uuid.test.js
```

## Sitemap host

`public/sitemap.xml` and `public/robots.txt` use `https://uuid-generator-umber.vercel.app`.

---

# UUID 生成器

用浏览器的 `crypto.getRandomValues` 生成 UUID 第四版和第七版的静态站点。

英文页面从 `/` 开始，中文页面从 `/zh/` 开始。工具页包括生成、v7 时间解码、校验、最多 10000 条的批量下载、PostgreSQL 18 和 Java 的简短说明，以及 Minecraft Java 定位栏颜色查询。

## 本地预览

```bash
npx --yes serve public
```

打开命令打印出的地址即可。

用下面的命令检查生成器和页面元数据：

```bash
node scripts/uuid.test.js
```

## 站点地图域名

`public/sitemap.xml` 和 `public/robots.txt` 使用 `https://uuid-generator-umber.vercel.app`。
