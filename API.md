# ChuckyLAB Blog Server — API Reference

Base URL (local dev): `http://localhost:5000`
Base URL (Docker):    `http://localhost:8000`

All endpoints are under the `/api` prefix and return JSON with
`Content-Type: application/json`. CORS is enabled for origins listed in
the `ALLOWED_ORIGINS` env var (comma-separated).

Content is stored as markdown files on disk; the backend serves the
**raw, Obsidian-normalized markdown** — the frontend is responsible for
rendering it with its own theme.

---

## Authentication

- **Read endpoints** (`GET /api/blogs`, `GET /api/blogs/<slug>`,
  `GET /api/blogs/views`) are public.
- **`POST /api/blogs/sync`** requires an `X-Sync-Token` header matching
  the server's `SYNC_TOKEN` env var. This endpoint is meant to be called
  from the local network or a webhook, not from the public frontend.

---

## Common data shapes

### Blog short
Returned by `GET /api/blogs` and embedded in the full blog payload.

```json
{
  "slug": "sample-blog",
  "date_posted": "2026-04-10",
  "head_image": "images/hero.webp",
  "tags": ["ai", "python"],
  "app_hooks": ["main-blog", "portfolio"],
  "languages": ["en", "sr"],
  "translated_by_ai": { "en": false, "sr": true },
  "view_count": 42,
  "title": "Sample Blog",
  "description": "A sample blog used in tests.",
  "lang": "en"
}
```

Field notes:
- `slug` — URL-friendly id; use it in the detail endpoint.
- `date_posted` — ISO date (`YYYY-MM-DD`).
- `head_image` — path **relative to the blog's `images/` folder root**,
  e.g. `images/hero.webp`. To turn it into a browser-loadable URL,
  prepend `{API_BASE}/api/blogs/{slug}/` — see the image endpoint below.
- `tags`, `app_hooks`, `languages` — always sorted alphabetically.
- `translated_by_ai` — per-language boolean map. A language may be
  missing entirely if the post isn't available in that language.
- `title` and `description` — rendered **in a single language** chosen
  by the server: the requested `lang` query param if present, otherwise
  `en`, otherwise the first available language alphabetically.
- `lang` — the language actually chosen for `title`/`description`.
- `view_count` — integer; increments happen on the detail endpoint, not here.

### Blog full
Returned by `GET /api/blogs/<slug>`. **Every translation is returned
in one response** under the `translations` map — the frontend switches
languages client-side without re-hitting the endpoint.

```json
{
  "slug": "sample-blog",
  "date_posted": "2026-04-10",
  "head_image": "images/hero.webp",
  "tags": ["ai", "python"],
  "app_hooks": ["main-blog", "portfolio"],
  "languages": ["en", "sr"],
  "view_count": 42,
  "translations": {
    "en": {
      "title": "Sample Blog",
      "description": "A sample blog used in tests.",
      "content_md": "# Sample Blog\n\nBody with ![](images/hero.webp) ...",
      "md_path": "en.md",
      "translated_by_ai": false
    },
    "sr": {
      "title": "Пример блога",
      "description": "Пример блога који се користи у тестовима.",
      "content_md": "# Пример блога\n\n...",
      "md_path": "sr.md",
      "translated_by_ai": true
    }
  }
}
```

Field notes:
- Top-level fields (`slug`, `date_posted`, `head_image`, `tags`,
  `app_hooks`, `languages`, `view_count`) are **global** — shared
  across all translations.
- `translations` — a map keyed by 2-letter language code. Every
  key that appears in `languages` is guaranteed to exist here.
- `translations[lang].content_md` — **already-normalized markdown**.
  Obsidian wiki-syntax has been rewritten:
  - `![[hero.webp]]` → `![](images/hero.webp)`
  - `![[images/hero.webp]]` → `![](images/hero.webp)`
  - `[[Other Note]]` → `[Other Note](/blogs/other-note)`
  - `[[Other Note|label]]` → `[label](/blogs/other-note)`
  Standard markdown features (headings, lists, fenced code, links,
  tables, etc.) pass through untouched.
- `translations[lang].md_path` — filename of the source `.md` inside
  the blog folder (e.g. `en.md`).
- `translations[lang].translated_by_ai` — per-language flag. Note that
  this lives **inside each translation**, not at the top level.

**Note:** the blog-short `title`/`description`/`lang` fields described
above apply only to the listing endpoint. The full endpoint does not
pre-pick a language — the frontend reads `translations[activeLang]`
directly.

---

## Endpoints

### `GET /api/blogs`

List blog shorts, optionally filtered.

**Query parameters** (all optional):

| Name       | Type   | Description                                                                         |
| ---------- | ------ | ----------------------------------------------------------------------------------- |
| `app_hook` | string | Keep only blogs that include this hook (e.g. `portfolio`).                          |
| `tag`      | string | Keep only blogs tagged with this value (e.g. `ai`).                                 |
| `lang`     | string | Choose which language to render `title`/`description` in, AND filter out blogs missing that language. |

Results are sorted by `date_posted` **descending**, then by internal id.

**Response**: `200 OK`, JSON array of blog-short objects.

**Caching**: response includes an `ETag` header. Clients should store
it and send it back as `If-None-Match`; the server returns `304 Not
Modified` with an empty body when nothing has changed. The ETag
depends on the collection's `last_modified` timestamp **and** the query
string, so different filters have different tags.

**Example**:
```http
GET /api/blogs?app_hook=main-blog&tag=ai&lang=en HTTP/1.1

HTTP/1.1 200 OK
ETag: "9f7c..."
Cache-Control: no-cache
Content-Type: application/json

[ { "slug": "sample-blog", ... } ]
```

```http
GET /api/blogs?app_hook=main-blog&tag=ai&lang=en HTTP/1.1
If-None-Match: "9f7c..."

HTTP/1.1 304 Not Modified
ETag: "9f7c..."
```

---

### `GET /api/blogs/<slug>`

Fetch a single blog's full payload, with **every available language**
under a `translations` map. Use this once per post visit and switch
languages client-side.

**Side effect**: atomically increments `view_count` and bumps the
internal `views_version` used by the `/views` endpoint. Do **not** call
this endpoint for previews, prefetching, or per-language re-fetches —
doing so inflates view counts.

**Path parameters**:
- `slug` — the blog's URL-friendly id.

**Query parameters**: none. A legacy `?lang=` is silently ignored for
forward-compat but has no effect — the response always contains every
language.

**Response**: `200 OK`, JSON blog-full object (see the shape above).

**Errors**:
- `404` — slug not found, or the blog has no translations on disk.

**Example**:
```http
GET /api/blogs/sample-blog HTTP/1.1

HTTP/1.1 200 OK
Content-Type: application/json

{
  "slug": "sample-blog",
  "languages": ["en", "sr"],
  "view_count": 1,
  "translations": {
    "en": { "title": "Sample Blog", "content_md": "...", "...": "..." },
    "sr": { "title": "Пример блога", "content_md": "...", "...": "..." }
  },
  "...": "..."
}
```

**Frontend pattern (language switcher)**:
```ts
// Fetch once on page load.
const blog = await fetch(`${API_BASE}/api/blogs/${slug}`).then(r => r.json());

let activeLang = 'en';
function render() {
  const tr = blog.translations[activeLang];
  if (!tr) return; // not available in this language
  document.title = tr.title;
  renderMarkdown(tr.content_md); // your markdown renderer
}

// Language switch — zero network round trips.
document.querySelector('#lang-sr').onclick = () => {
  activeLang = 'sr';
  render();
};
```

---

### `GET /api/blogs/views`

Lightweight endpoint returning just `{slug: view_count}` for every
blog. Use this to refresh counters without re-downloading full blog
shorts.

**Response**: `200 OK`
```json
{
  "sample-blog": 42,
  "second-post": 7
}
```

**Caching**: sends `ETag`, supports `If-None-Match` → `304`. The ETag
changes whenever a blog is viewed or the collection is re-synced.

**Suggested frontend pattern**:
1. On load, call `GET /api/blogs` and cache the result locally with its
   `ETag`.
2. Revalidate with `If-None-Match` on each visit — usually returns `304`.
3. Meanwhile poll `GET /api/blogs/views` (also ETag-guarded) to keep
   view counts fresh without refetching the whole listing.

This mirrors the **conditional-fetching pattern** called out in
`Architecture_plan.md`.

---

### `GET /api/blogs/<slug>/images/<path:filename>`

Serve a static image file out of the blog's `images/` folder on disk.

**Path parameters**:
- `slug` — the blog's URL-friendly id.
- `filename` — path relative to the blog's `images/` directory (e.g. `hero.webp` or `nested/diagram.png`).

**Response**: `200 OK` with the raw image bytes. `Content-Type` is
inferred from the file extension (`webp`, `avif`, `svg`, `png`, `jpg`,
`gif`, ... all resolve correctly). `Cache-Control: public, max-age=3600`
is set so browsers cache images for an hour.

**Errors**:
- `404` — blog not found, no `images/` folder, file missing, or any
  attempt to escape the images folder via `..`. The endpoint uses
  `send_from_directory` under the hood, which sanitizes paths via
  `werkzeug.security.safe_join`.

**Frontend usage pattern**:

The API returns paths like `"images/hero.webp"` in both `head_image`
and in the normalized markdown (`![](images/hero.webp)`). To turn them
into browser-loadable URLs, prepend the base + the blog slug:

```ts
function imageUrl(slug: string, relativePath: string): string {
  return `${API_BASE}/api/blogs/${encodeURIComponent(slug)}/${relativePath}`;
}
```

So `images/hero.webp` for the blog `my-first-blog` becomes:
`http://localhost:5000/api/blogs/my-first-blog/images/hero.webp`

For the markdown body, walk the rendered HTML (or AST) and rewrite
every `<img src="images/...">` with the same transform. Most markdown
libraries let you hook into image rendering — e.g. with `marked`:

```ts
const renderer = new marked.Renderer();
renderer.image = (href, title, text) => {
  const rewritten = href.startsWith('images/')
    ? imageUrl(currentSlug, href)
    : href;
  return `<img src="${rewritten}" alt="${text}" title="${title ?? ''}">`;
};
```

**Example**:
```http
GET /api/blogs/sample-blog/images/hero.webp HTTP/1.1

HTTP/1.1 200 OK
Content-Type: image/webp
Cache-Control: public, max-age=3600
Content-Length: 189282

<binary image data>
```

---

### `POST /api/blogs/sync`

Rescan the content directory on disk and reconcile the database.

**Required header**:
- `X-Sync-Token: <SYNC_TOKEN>`

**Request body**: none.

**Response**: `200 OK`
```json
{
  "added":   1,
  "updated": 0,
  "removed": 0,
  "skipped": 3,
  "errors":  []
}
```

- `added` — brand-new blogs discovered.
- `updated` — existing blogs whose content hash changed.
- `removed` — blogs whose folders disappeared from disk.
- `skipped` — existing blogs where the content hash matched (no-op).
- `errors` — array of per-folder error strings (e.g. malformed frontmatter).

**Errors**:
- `401` — missing or incorrect `X-Sync-Token`.

---

## Error format

Error responses are JSON:

```json
{ "error": "blog not found: nope" }
```

The `error` field is a human-readable message. The HTTP status code is
the primary signal — don't pattern-match on the message text.

---

## Content layout on disk (reference only)

The frontend does **not** need to know this, but it's useful context
when debugging missing fields. Each blog is one folder:

```
<CONTENT_DIR>/
  my-first-blog/
    meta.yml          # optional; frontmatter in a .md file also works
    en.md
    sr.md
    images/
      hero.webp
```

`meta.yml`:

```yaml
slug: my-first-blog
date_posted: 2026-04-10
head_image: images/hero.webp
tags: [ai, python]
app_hooks: [main-blog, portfolio]
title:
  en: "My First Blog"
  sr: "Мој први блог"
description:
  en: "Short description"
  sr: "Кратак опис"
translated_by_ai:
  en: false
  sr: true
```

---

## What's NOT in the API yet

Deferred to a later iteration (do not code against these):

- **GitHub webhook** on `/api/blogs/sync` — the endpoint exists, but it
  expects a token, not a GitHub signature. Webhook wiring comes later.
- **RSS feed** (`/api/feed.rss`).
- **Rate limiting** on view increments.
- **Pagination / full-text search** on `GET /api/blogs` — the listing
  returns every blog. Fine for the current scale; revisit when it isn't.

---

## TL;DR for the frontend

- List page → `GET /api/blogs?lang=en` (cache with ETag). Returns cards
  in the requested language.
- Detail page → `GET /api/blogs/<slug>` (**no** `?lang=`). Returns every
  language under `translations`. Render
  `translations[activeLang].content_md` with your markdown library of
  choice (`marked`, `markdown-it`, etc.) and flip `activeLang` locally
  when the user clicks a language switcher — no re-fetch.
- For any image path (`head_image` at the top level, or `![](images/...)`
  inside a translation's `content_md`), prepend
  `{API_BASE}/api/blogs/{slug}/` to build the URL. Hook into your
  markdown renderer's image callback to do this rewrite in one place.
- Periodically refresh view counts via `GET /api/blogs/views`.
- Never call `POST /api/blogs/sync` from the public frontend.
