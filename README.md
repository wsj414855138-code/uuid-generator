# UUID generator

Static site that creates UUID version 4 values in the browser with `crypto.getRandomValues`.

English is at `/`. Chinese is at `/zh/`.

## Preview locally

```bash
npx --yes serve public
```

Open the URL printed by the command.

## Sitemap host

`public/sitemap.xml` and `public/robots.txt` use `https://example.com` until the real Vercel URL exists. Replace that host before submitting the sitemap.

---

# UUID 生成器

用浏览器的 `crypto.getRandomValues` 生成 UUID 第四版的静态站点。

英文页面在 `/`，中文页面在 `/zh/`。

## 本地预览

```bash
npx --yes serve public
```

打开命令打印出的地址即可。

## 站点地图域名

`public/sitemap.xml` 和 `public/robots.txt` 在真实 Vercel 地址确定前使用 `https://example.com` 占位。提交站点地图前请先替换这个域名。
