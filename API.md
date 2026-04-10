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
Returned by `GET /api/blogs/<slug>`. It is a blog short with two extra fields:

```json
{
  "... (all blog-short fields above) ...": "...",
  "content_md": "# Sample Blog\n\nBody with ![](images/hero.webp) ...",
  "md_path": "en.md"
}
```

- `content_md` — **already-normalized markdown** for the chosen
  language. Obsidian wiki-syntax has been rewritten:
  - `![[hero.webp]]` → `![](images/hero.webp)`
  - `![[images/hero.webp]]` → `![](images/hero.webp)`
  - `[[Other Note]]` → `[Other Note](/blogs/other-note)`
  - `[[Other Note|label]]` → `[label](/blogs/other-note)`
  Standard markdown features (headings, lists, fenced code, links,
  tables, etc.) pass through untouched.
- `md_path` — filename of the source `.md` inside the blog folder.

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

Fetch a single blog's full payload.

**Side effect**: atomically increments `view_count` and bumps the
internal `views_version` used by the `/views` endpoint. Do **not** call
this endpoint for previews or prefetching.

**Path parameters**:
- `slug` — the blog's URL-friendly id.

**Query parameters**:
- `lang` (optional) — which translation to return. If omitted, the
  server picks `en` when available, otherwise the first language
  alphabetically. If the requested `lang` does not exist for that blog,
  the server returns `404`.

**Response**: `200 OK`, JSON blog-full object.

**Errors**:
- `404` — slug not found, OR requested language not available.

**Example**:
```http
GET /api/blogs/sample-blog?lang=sr HTTP/1.1

HTTP/1.1 200 OK
Content-Type: application/json

{
  "slug": "sample-blog",
  "lang": "sr",
  "title": "Пример блога",
  "description": "Пример блога који се користи у тестовима.",
  "content_md": "# Пример блога\n\n...",
  "md_path": "sr.md",
  "view_count": 1,
  "...": "..."
}
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

- List page → `GET /api/blogs?lang=en` (cache with ETag).
- Detail page → `GET /api/blogs/<slug>?lang=en`, render `content_md`
  with your markdown library of choice (`marked`, `markdown-it`, etc.).
- For any image path (`head_image` or `![](images/...)` inside
  `content_md`), prepend `{API_BASE}/api/blogs/{slug}/` to build the
  URL. Hook into your markdown renderer's image callback to do this
  rewrite in one place.
- Periodically refresh view counts via `GET /api/blogs/views`.
- Never call `POST /api/blogs/sync` from the public frontend.
