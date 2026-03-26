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

Choose the method that fits your context. Try them in this order.

### 1. API Key (simplest — use if the user or project provides one)

```bash
curl -H "pn_authorization: Bearer $PULLNOTE_API_KEY" https://api.pullnote.com/about
```

Or with the npm client:
```typescript
const pn = new PullnoteClient(process.env.PULLNOTE_API_KEY);
```

If the user hasn't mentioned an API key, ask: "Do you have a Pullnote API key for this project?"

### 2. MLAuth (agent identity — use if no API key is available)

MLAuth lets you authenticate with a persistent cryptographic identity instead of an API key. Check if you already have one:

```bash
if [ -f ~/.mlauth/private.pem ] && [ -f ~/.mlauth/dumbname.txt ]; then
  echo "MLAuth identity exists: $(cat ~/.mlauth/dumbname.txt)"
else
  echo "No MLAuth identity — need to set one up"
fi
```

#### Setting up MLAuth (one-time, if no identity exists)

```bash
# 1. Create store and generate ECDSA keypair
mkdir -p ~/.mlauth && chmod 700 ~/.mlauth
openssl ecparam -name secp256k1 -genkey -noout -out ~/.mlauth/private.pem
openssl ec -in ~/.mlauth/private.pem -pubout -out ~/.mlauth/public.pem 2>/dev/null
chmod 600 ~/.mlauth/private.pem

# 2. Register with mlauth.ai
PUBLIC_KEY=$(awk '{printf "%s\\n", $0}' ~/.mlauth/public.pem)
RESPONSE=$(curl -s -X POST https://mlauth.ai/api/register \
  -H "Content-Type: application/json" \
  -d "{\"public_key\": \"$PUBLIC_KEY\", \"bio\": \"AI agent using Pullnote for content management\"}")
echo "$RESPONSE"

# 3. Save the assigned dumbname
DUMBNAME=$(echo "$RESPONSE" | grep -o '"dumbname":"[^"]*"' | cut -d'"' -f4)
echo "$DUMBNAME" > ~/.mlauth/dumbname.txt
echo "Registered as: $DUMBNAME"
```

#### Registering with Pullnote (one-time, after MLAuth identity exists)

```bash
DUMBNAME=$(cat ~/.mlauth/dumbname.txt)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PAYLOAD='{"title":"Project Name"}'

SIGNATURE=$(echo -n "${DUMBNAME}${TIMESTAMP}${PAYLOAD}" | \
  openssl dgst -sha256 -sign ~/.mlauth/private.pem | openssl base64 -A)

curl -X POST https://api.pullnote.com/agent/register \
  -H "Content-Type: application/json" \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
# Response includes project._id and project.api_key
```

To join an existing project with a key instead of creating one:
```bash
PAYLOAD='{"code":"pullnote_xxxxxxxxxxxxxxxx"}'
# Sign and POST as above
```

#### Signing subsequent requests (MLAuth)

```bash
DUMBNAME=$(cat ~/.mlauth/dumbname.txt)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# For GET: PAYLOAD = the URL path (e.g. "/about")
# For POST/PATCH/DELETE: PAYLOAD = the JSON body string
SIGNATURE=$(echo -n "${DUMBNAME}${TIMESTAMP}${PAYLOAD}" | \
  openssl dgst -sha256 -sign ~/.mlauth/private.pem | openssl base64 -A)
# Add headers: X-Mlauth-Dumbname, X-Mlauth-Timestamp, X-Mlauth-Signature
```

> Always use `openssl base64 -A` (not system `base64`) — system base64 wraps at 76 chars, breaking the signature.

---

## Key Operations

All examples below use API key auth for brevity. For MLAuth, replace the `pn_authorization` header with the three `X-Mlauth-*` headers shown above.

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

### Upload an image
```bash
# JSON body (works with MLAuth or API key):
curl -X POST https://api.pullnote.com/upload/image \
  -H "pn_authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/png;base64,...","filename":"photo.png"}'
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

1. **GET the current content** at the path to see what's there
2. **Read the content** and understand the current text and any blocks
3. **Rewrite** the content (or specific block) to match what the user wants
4. **PATCH** the full content, or a specific block if only one section needs changing
5. **Confirm** to the user what changed

---

## Invite a human editor

Once you have a project, you can invite a human collaborator by email:

```bash
PAYLOAD='{"email":"human@example.com","role":"editor"}'
# Sign and POST to https://api.pullnote.com/agent/invite
```

They'll be added to the project and can edit content via the pullnote.com web editor.

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
await pn.inviteUser('human@example.com'); // invite a human editor
```
