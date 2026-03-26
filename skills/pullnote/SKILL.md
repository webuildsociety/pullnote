---
name: pullnote
description: Read and edit content stored in Pullnote CMS. Use this skill whenever the user wants to update a website page, edit copy, write or update a blog post, manage any content via Pullnote, or mentions paths like /about, /contact, /blog. Also use when the user says things like "make the homepage more professional", "update the about page", or "add a new post". If a Pullnote API key or project is mentioned, always use this skill.
---

# Pullnote CMS Skill

Pullnote is a headless CMS where content is stored at hierarchical paths (like `/about`, `/blog/my-post`). You interact with it via REST API or the `@pullnote/client` npm package.

Full API reference: https://www.pullnote.com/skill.md
Recipes and workflows: https://www.pullnote.com/recipes.md

---

## Authentication

There are two ways to authenticate. Use whichever applies to the current context.

### Option A — API Key (simplest, for most users)

If the user has provided a `PULLNOTE_API_KEY` or similar, use it as a Bearer token:

```bash
curl -H "pn_authorization: Bearer $PULLNOTE_API_KEY" https://api.pullnote.com/about
```

Or with the npm client:
```typescript
const pn = new PullnoteClient(process.env.PULLNOTE_API_KEY);
```

### Option B — MLAuth (for agents with cryptographic identity)

If you have MLAuth keys set up (`~/.mlauth/private.pem`, `~/.mlauth/dumbname.txt`), sign requests:

```bash
DUMBNAME=$(cat ~/.mlauth/dumbname.txt)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# For GET: PAYLOAD = the URL path (e.g. "/about")
# For POST/PATCH/DELETE: PAYLOAD = the JSON body string
SIGNATURE=$(echo -n "${DUMBNAME}${TIMESTAMP}${PAYLOAD}" | \
  openssl dgst -sha256 -sign ~/.mlauth/private.pem | openssl base64 -A)
# Then add headers: X-Mlauth-Dumbname, X-Mlauth-Timestamp, X-Mlauth-Signature
```

> Use `openssl base64 -A` (not system `base64`) — system base64 wraps at 76 chars, breaking the signature.

If no MLAuth keys exist, follow the setup in https://www.pullnote.com/skill.md §1.

---

## Key Operations

### Get content
```bash
curl -H "pn_authorization: Bearer $KEY" https://api.pullnote.com/about
# Returns: { title, content (markdown), description, imgUrl, blocks, ... }
# Add ?format=html for rendered HTML
```

### Update content (PATCH = partial update)
```bash
curl -X PATCH https://api.pullnote.com/about \
  -H "pn_authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"content":"Updated markdown here","title":"Optional new title"}'
```

### Create content (POST)
```bash
curl -X POST https://api.pullnote.com/blog/my-new-post \
  -H "pn_authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Post","content":"# My Post\n\nContent here.","description":"SEO description"}'
```

### Delete content
```bash
curl -X DELETE https://api.pullnote.com/blog/old-post \
  -H "pn_authorization: Bearer $KEY"
```

### List children of a path
```bash
curl -H "pn_authorization: Bearer $KEY" "https://api.pullnote.com/blog?list=1"
# Returns: { children[], siblings[], parent, self }
```

---

## Blocks (partial page sections)

Pages can contain named sections (blocks) separated by HTML comment markers:

```markdown
# About Us

<!-- hero -->
We are a passionate team...

<!-- values -->
Our values are...
```

### Get a single block
```bash
# URL-encode # as %23
curl -H "pn_authorization: Bearer $KEY" "https://api.pullnote.com/about%23hero"
```

### Update just one block (leave the rest of the page untouched)
```bash
curl -X PATCH "https://api.pullnote.com/about%23hero" \
  -H "pn_authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"content":"We are a passionate team dedicated to..."}'
```

---

## Typical content editing workflow

When a user asks to edit a page (e.g. "make the about page more professional"):

1. **GET the current content** — fetch the path to see what's there
2. **Read the content** — understand the current text and any blocks
3. **Rewrite** — produce improved markdown
4. **PATCH** — update the full content, or a specific block if only one section needs changing
5. **Confirm** — tell the user what changed

If the user hasn't provided an API key, ask: "Do you have a Pullnote API key for this project?"

---

## Note fields

| Field | Purpose |
|---|---|
| `title` | Page/post title |
| `content` | Markdown body |
| `description` | SEO meta description |
| `imgUrl` | Featured image URL |
| `data` | Custom JSON metadata |
| `status` | 0=live, 1=awaiting, 2=draft, 3=archived |

---

## npm client (if available in the project)

```typescript
import { PullnoteClient } from '@pullnote/client';
const pn = new PullnoteClient(process.env.PULLNOTE_API_KEY);

const note = await pn.get('/about');
await pn.update('/about', { content: '# About Us\n\nNew content...' });
const posts = await pn.list('/blog'); // { children[], ... }
```
