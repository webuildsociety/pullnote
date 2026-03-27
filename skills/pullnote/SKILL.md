---
name: pullnote
description: Read and edit content stored in Pullnote CMS. Use this skill whenever the user wants to update a website page, edit copy, write or update a blog post, manage any content via Pullnote, or mentions paths like /about, /contact, /blog. Also use when the user says things like "make the homepage more professional", "update the about page", or "add a new post". If a Pullnote invite token, project, or API key is mentioned, always use this skill.
---

# Pullnote CMS Skill

Pullnote is a headless CMS where content is stored at hierarchical paths (like `/about`, `/blog/my-post`). You interact with it via a REST API using your own MLAuth cryptographic identity.

Full API reference: https://www.pullnote.com/skill.md
Recipes and workflows: https://www.pullnote.com/recipes.md

---

## Getting Started

### Step 1: Establish your MLAuth identity

Check if you already have an identity:

```bash
if [ -f ~/.mlauth/private.pem ] && [ -f ~/.mlauth/dumbname.txt ]; then
  echo "Identity exists: $(cat ~/.mlauth/dumbname.txt)"
else
  echo "No identity — setting one up now"

  # Generate ECDSA keypair
  mkdir -p ~/.mlauth && chmod 700 ~/.mlauth
  openssl ecparam -name secp256k1 -genkey -noout -out ~/.mlauth/private.pem
  openssl ec -in ~/.mlauth/private.pem -pubout -out ~/.mlauth/public.pem 2>/dev/null
  chmod 600 ~/.mlauth/private.pem

  # Register with mlauth.ai
  PUBLIC_KEY=$(awk '{printf "%s\\n", $0}' ~/.mlauth/public.pem)
  RESPONSE=$(curl -s -X POST https://mlauth.ai/api/register \
    -H "Content-Type: application/json" \
    -d "{\"public_key\": \"$PUBLIC_KEY\", \"bio\": \"AI agent using Pullnote for content management\"}")
  echo "$RESPONSE"

  # Save the dumbname
  DUMBNAME=$(echo "$RESPONSE" | grep -o '"dumbname":"[^"]*"' | cut -d'"' -f4)
  echo "$DUMBNAME" > ~/.mlauth/dumbname.txt
  echo "Registered as: $DUMBNAME"
fi
```

> Always use `openssl base64 -A` (not system `base64`) for signatures — system base64 wraps at 76 chars, breaking the signature.

### Step 2: Join a Pullnote project

There are two ways to connect to a project:

**With an invite token** (most common — the user received a link like `pullnote.com/invite/{token}`):

Ask the user for their invite token, then join:

```bash
DUMBNAME=$(cat ~/.mlauth/dumbname.txt)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PAYLOAD='{"code":"THE_INVITE_TOKEN_HERE"}'

SIGNATURE=$(echo -n "${DUMBNAME}${TIMESTAMP}${PAYLOAD}" | \
  openssl dgst -sha256 -sign ~/.mlauth/private.pem | openssl base64 -A)

curl -X POST https://api.pullnote.com/agent/register \
  -H "Content-Type: application/json" \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Create a new project** (if the user wants to start fresh):

```bash
PAYLOAD='{"title":"My Website"}'
# Sign and POST to /agent/register as above
```

The response includes `project._id` — save it for targeting requests to the right project.

### Step 3: Sign requests

All requests use MLAuth signing. The pattern is always the same:

```bash
DUMBNAME=$(cat ~/.mlauth/dumbname.txt)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# For GET/DELETE: PAYLOAD = the URL path (e.g. "/about")
# For POST/PATCH: PAYLOAD = the JSON body string

SIGNATURE=$(echo -n "${DUMBNAME}${TIMESTAMP}${PAYLOAD}" | \
  openssl dgst -sha256 -sign ~/.mlauth/private.pem | openssl base64 -A)

# Include these three headers on every request:
# X-Mlauth-Dumbname: $DUMBNAME
# X-Mlauth-Timestamp: $TIMESTAMP
# X-Mlauth-Signature: $SIGNATURE
```

---

## Content Operations

### Get content
```bash
PAYLOAD="/about"
# Sign the path, then:
curl -X GET "https://api.pullnote.com/about" \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE"
# Returns: { title, content (markdown), description, imgUrl, blocks, ... }
# Add ?format=html for rendered HTML
```

### Update content (PATCH)
```bash
PAYLOAD='{"content":"Updated markdown here","title":"Optional new title"}'
# Sign the JSON body, then:
curl -X PATCH https://api.pullnote.com/about \
  -H "Content-Type: application/json" \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

### Create content (POST)
```bash
PAYLOAD='{"title":"My Post","content":"# My Post\n\nContent here.","description":"SEO description"}'
# Sign, then POST to the desired path:
curl -X POST https://api.pullnote.com/blog/my-new-post \
  -H "Content-Type: application/json" \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

### Delete content
```bash
PAYLOAD="/blog/old-post"
# Sign the path, then:
curl -X DELETE https://api.pullnote.com/blog/old-post \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE"
```

### List children of a path
```bash
PAYLOAD="/blog"
# Sign the path, then:
curl "https://api.pullnote.com/blog?list=1" \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE"
# Returns: { children[], siblings[], parent, self }
```

### Upload an image
```bash
# Build the JSON payload with base64-encoded image data
PAYLOAD='{"image":"data:image/png;base64,...","filename":"photo.png"}'
# Sign the JSON body, then POST to /upload/image
# Returns: { imgUrl, s3Url, pnUrl }
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
# URL-encode # as %23 — sign the encoded path
PAYLOAD="/about%23hero"
curl "https://api.pullnote.com/about%23hero" \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE"
```

### Update just one block
```bash
PAYLOAD='{"content":"We are a passionate team dedicated to..."}'
curl -X PATCH "https://api.pullnote.com/about%23hero" \
  -H "Content-Type: application/json" \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

---

## Typical content editing workflow

When a user asks to edit a page (e.g. "make the about page more professional"):

1. **Check MLAuth identity** — set one up if it doesn't exist (see Step 1)
2. **Check project access** — if not yet joined, ask the user for their invite token (see Step 2)
3. **GET the current content** at the path to see what's there
4. **Read and understand** the current text and any blocks
5. **Rewrite** the content to match the user's request
6. **PATCH** the full content, or a specific block if only one section changed
7. **Confirm** to the user what changed

---

## Invite a human editor

You can invite a human collaborator by email so they can edit via the pullnote.com web editor:

```bash
PAYLOAD='{"email":"human@example.com","role":"editor"}'
# Sign and POST to https://api.pullnote.com/agent/invite
```

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

## npm client (alternative, if available in the project)

```typescript
import { PullnoteClient } from '@pullnote/client';
const pn = new PullnoteClient({
  dumbname: 'your-agent-name',
  privateKeyPath: '~/.mlauth/private.pem'
});

const note = await pn.get('/about');
await pn.update('/about', { content: '# About Us\n\nNew content...' });
const posts = await pn.list('/blog');
await pn.inviteUser('human@example.com');
```
