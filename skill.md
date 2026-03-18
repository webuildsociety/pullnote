# Pullnote Agent Skill

A simple headless CMS with agent-first MLAuth authentication.

**Skill Version:** 1.2 (2026-03-17)
**Status:** Active
**API:** [https://dev.pullnote.com](https://dev.pullnote.com)

---

## What is Pullnote?

Pullnote is a headless content management system that lets you store and retrieve content without building a backend. It's designed to work seamlessly with both human users and AI agents.

**Key features:**
- REST API for CRUD operations on content
- Hierarchical content organization (like file paths)
- Markdown support (uses Remarkable)
- MLAuth cryptographic authentication for agents
- NPM package for easy integration
- Web-based editor for humans at pullnote.com

---

## 1. Get Your MLAuth Identity

Before using Pullnote, you need an MLAuth identity from MLAuth.
Read https://mlauth.ai/skill.md and register as an agent, or follow the instructions below:

```bash
# 1. Create the mlauth directory
mkdir -p ~/.mlauth

# 2. Generate ECDSA keypair
openssl ecparam -genkey -name secp256k1 -noout -out ~/.mlauth/private.pem
openssl ec -in ~/.mlauth/private.pem -pubout -out ~/.mlauth/public.pem 2>/dev/null

# 3. Register with MLAuth (without a custom dumbname to avoid clashes)
PUBLIC_KEY=$(awk '{printf "%s\\n", $0}' ~/.mlauth/public.pem)
curl -s -X POST https://mlauth.ai/api/register \
  -H "Content-Type: application/json" \
  -d "{
    \"public_key\": \"$PUBLIC_KEY\",
    \"bio\": \"AI agent using Pullnote for content management\"
  }"
# Response: {"success":true,"dumbname":"assigned-name-here","agent_id":"..."}

# 4. Save your assigned dumbname
echo "assigned-name-here" > ~/.mlauth/dumbname.txt
```

**Directory structure:**
```
~/.mlauth/
  private.pem    # Your private key (keep secure!)
  public.pem     # Your public key
  dumbname.txt   # Your assigned agent name
```

---

## 2. Signing Protocol

All authenticated requests require signing with your private key. The signature format is:

**Message to sign:** `{DUMBNAME}{TIMESTAMP}{PAYLOAD}`

Where:
- `DUMBNAME`: Your agent's dumbname
- `TIMESTAMP`: ISO 8601 format (e.g., `2026-02-11T12:00:00Z`)
- `PAYLOAD`: 
  - For GET requests: the URL path (e.g., `/blog/my-post`)
  - For POST/PATCH/DELETE: the JSON request body as a string

**Example signing:**
```bash
DUMBNAME=$(cat ~/.mlauth/dumbname.txt)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PAYLOAD='{"title":"My First Post","content":"Hello world"}'

SIGNATURE=$(echo -n "${DUMBNAME}${TIMESTAMP}${PAYLOAD}" | \
  openssl dgst -sha256 -sign ~/.mlauth/private.pem | openssl base64 -A)
```

> **Important:** Use `openssl base64 -A`, not the system `base64` command. The system `base64` wraps output at 76 characters by default — a secp256k1 signature encodes to ~96 chars, so it always wraps. A newline inside an HTTP header value truncates the signature and the server will reject it. `openssl base64 -A` always produces a single line and works identically on macOS and Linux.

---

## 3. Register with Pullnote

Call `POST /agent/register` to create your account and first project. Each subsequent call that includes a `title` adds another project to the same account. Calling without a `title` is idempotent — it returns your existing state.

```bash
DUMBNAME=$(cat ~/.mlauth/dumbname.txt)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PAYLOAD='{"title":"My Blog"}'

SIGNATURE=$(echo -n "${DUMBNAME}${TIMESTAMP}${PAYLOAD}" | \
  openssl dgst -sha256 -sign ~/.mlauth/private.pem | openssl base64 -A)

curl -X POST https://dev.pullnote.com/agent/register \
  -H "Content-Type: application/json" \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE" \
  -d "$PAYLOAD"

# Response: { agent, account, project, projects[], note }
# project.api_key — store in .env to use in web/app deployments without your private key
# project._id    — use as project_id to target this project in future requests
```

**Create a second project:**
```bash
PAYLOAD='{"title":"My Documentation Site","domain":"https://docs.mysite.com"}'
# Sign and POST again — a new project is added to your account
```

**Get current state without changes:**
```bash
PAYLOAD='{}'
# POST with empty body — returns existing agent, account, and all projects
```

---

## 4. Create Content

Create notes at hierarchical paths, just like files in a directory:

```bash
DUMBNAME=$(cat ~/.mlauth/dumbname.txt)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PAYLOAD='{"title":"Hello World","content":"My first note with Pullnote!"}'

SIGNATURE=$(echo -n "${DUMBNAME}${TIMESTAMP}${PAYLOAD}" | \
  openssl dgst -sha256 -sign ~/.mlauth/private.pem | openssl base64 -A)

curl -X POST https://dev.pullnote.com/blog/hello-world \
  -H "Content-Type: application/json" \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Available fields:**
- `title`: Note title
- `content` or `content_md`: Markdown content
- `description`: SEO description
- `imgUrl`: Featured image URL
- `data`: Custom JSON metadata
- `status`: 0=live (default), 1=awaiting approval, 2=draft, 3=archived

---

## 5. Retrieve Content

Get notes by their path. For GET requests, sign the path:

```bash
DUMBNAME=$(cat ~/.mlauth/dumbname.txt)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PAYLOAD="/blog/hello-world"

SIGNATURE=$(echo -n "${DUMBNAME}${TIMESTAMP}${PAYLOAD}" | \
  openssl dgst -sha256 -sign ~/.mlauth/private.pem | openssl base64 -A)

curl -X GET "https://dev.pullnote.com/blog/hello-world" \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE"
```

**Format options:**
- Default returns markdown content
- Add `?format=html` for rendered HTML
- Append `.md` to any URL for raw markdown (e.g., `/blog/hello-world.md`)

---

## 6. Update Content

Update existing notes using PATCH:

```bash
DUMBNAME=$(cat ~/.mlauth/dumbname.txt)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PAYLOAD='{"content":"Updated content here"}'

SIGNATURE=$(echo -n "${DUMBNAME}${TIMESTAMP}${PAYLOAD}" | \
  openssl dgst -sha256 -sign ~/.mlauth/private.pem | openssl base64 -A)

curl -X PATCH https://dev.pullnote.com/blog/hello-world \
  -H "Content-Type: application/json" \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Move a note** by including a new `path` in the update:
```bash
PAYLOAD='{"path":"/blog/renamed-post"}'
```

---

## 7. Delete Content

Remove notes with DELETE:

```bash
DUMBNAME=$(cat ~/.mlauth/dumbname.txt)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PAYLOAD="/blog/hello-world"

SIGNATURE=$(echo -n "${DUMBNAME}${TIMESTAMP}${PAYLOAD}" | \
  openssl dgst -sha256 -sign ~/.mlauth/private.pem | openssl base64 -A)

curl -X DELETE https://dev.pullnote.com/blog/hello-world \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE"
```

---

## 8. List and Search

**List surrounding notes** (parents, children, siblings):

```bash
PAYLOAD="/blog"
# ... sign as above ...
curl "https://dev.pullnote.com/blog?list=1" \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE"
```

**Find notes with filters:**

```bash
PAYLOAD="/blog"
curl "https://dev.pullnote.com/blog?find={}&sort=modified&sortDirection=-1" \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE"
```

**Quick existence check:**
```bash
curl "https://dev.pullnote.com/blog/hello-world?ping=1" \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE"
```

---

## 9. Using the NPM Package

```bash
npm install @pullnote/client
```

There are two ways to authenticate depending on your context:

**For agents (CLI / server-side scripts):** sign requests with your MLAuth private key.

```typescript
import { PullnoteClient } from '@pullnote/client';

const pn = new PullnoteClient({
  dumbname: 'your-agent-name',
  privateKeyPath: '~/.mlauth/private.pem'
});

// Create content
await pn.add('/blog/my-post', {
  title: 'My Blog Post',
  content: 'This is the content of my post.'
});

// Read content
const note = await pn.get('/blog/my-post');
console.log(note.title);

// Update content
await pn.update('/blog/my-post', {
  content: 'Updated content here'
});

// List surrounding notes
const list = await pn.list('/blog');
console.log(list.children); // All posts under /blog

// Find notes
const posts = await pn.find('/blog', {}, 'created', -1);

// Delete
await pn.remove('/blog/my-post');

// Get agent info — returns all your projects
const info = await pn.getAgentInfo();
console.log(info.projects); // Array of all your projects

// Register a second project
const reg = await pn.registerAgent('My Documentation Site');
const docsProjectId = reg.project._id;

// Switch to a specific project for subsequent requests
pn.useProject(docsProjectId);
await pn.add('/getting-started', { title: 'Getting Started', content: '...' });

// Switch back to your primary project
pn.useProject(null);

// Invite a human collaborator to your project
await pn.inviteUser('human@example.com');                          // primary project, editor role
await pn.inviteUser('admin@example.com', 'admin');                 // specific role
await pn.inviteUser('user@example.com', 'editor', docsProjectId); // specific project
```

**Alternatively, pin a project at construction time:**
```typescript
const pn = new PullnoteClient({
  dumbname: 'your-agent-name',
  privateKeyPath: '~/.mlauth/private.pem',
  project_id: 'your-project-id'  // all requests target this project
});
```

**For web / app deployments:** use the `api_key` returned when you registered with Pullnote. This way your private key never leaves your local environment.

```typescript
import { PullnoteClient } from '@pullnote/client';

// api_key is obtained from /agent/register — safe to use in deployed apps
const pn = new PullnoteClient(process.env.PULLNOTE_API_KEY);
```

Store the key in an environment variable (e.g. `.env`). Never commit your private key to a repository.

**For browser / custom environments:** use a custom signer that delegates signing to a secure back-end.

```typescript
const pn = new PullnoteClient({
  dumbname: 'your-agent-name',
  signer: async (message) => {
    // Call your own server endpoint to sign, keeping the private key off the client
    const res = await fetch('/api/sign', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    const { signature } = await res.json();
    return signature;
  }
});
```

---

## 10. Use Cases

**Documentation sites:**
```typescript
// Store your project docs
await pn.add('/docs/getting-started', {
  title: 'Getting Started',
  content: '# Getting Started\n\nWelcome to...'
});

// Build navigation
const docs = await pn.list('/docs');
```

**Blog posts:**
```typescript
// Create posts with metadata
await pn.add('/blog/2026/my-post', {
  title: 'My Post',
  content: '...',
  data: {
    author: 'agent-name',
    tags: ['tech', 'ai'],
    publishDate: '2026-02-11'
  }
});

// Find posts by tag
const techPosts = await pn.find('/blog', {
  'data.tags': 'tech'
});
```

**Configuration storage:**
```typescript
// Store JSON config
await pn.add('/config/settings', {
  title: 'App Settings',
  data: {
    apiUrl: 'https://api.example.com',
    features: { darkMode: true }
  }
});

// Retrieve and use
const config = await pn.getData('/config/settings');
```

---

## 11. Advanced Features

**Generate content with AI:**
```typescript
await pn.generate('/blog/auto-post', 
  'Write a blog post about the future of AI',
  'Generate a futuristic image'
);
```

**Custom metadata:**
```typescript
await pn.setData('/blog/my-post', {
  views: 1234,
  featured: true,
  category: 'technology'
});

const metadata = await pn.getData('/blog/my-post');
```

**Sitemap generation:**
```typescript
const xml = await pn.getSitemap('https://mysite.com');
// Returns XML sitemap of all your content
```

**Breadcrumbs:**
```typescript
const breadcrumbs = await pn.getBreadcrumbs('/blog/2026/my-post');
// Returns: [{path: '/blog', title: 'Blog'}, {path: '/blog/2026', title: '2026'}]
```

---

## 12. Best Practices

**Path structure:**
- Use hierarchical paths like `/blog/category/post-name`
- Paths are case-sensitive
- Use hyphens, not spaces

**Content organization:**
- Group related content under common paths
- Use `index` field for custom ordering
- Store metadata in the `data` field

**Security:**
- Keep your `~/.mlauth/private.pem` secure
- Never commit private keys to repositories
- Signatures expire after 5 minutes (replay protection)

**Performance:**
- Use `ping` for existence checks instead of full GET
- Request only needed fields with `fields` parameter
- Cache content client-side when appropriate

---

## 13. Invite a Human User

Once you have an agent project, you can invite a human user (by email) to collaborate. This adds their email to the project's `users` list.

```bash
DUMBNAME=$(cat ~/.mlauth/dumbname.txt)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PAYLOAD='{"email":"human@example.com","role":"editor"}'

SIGNATURE=$(echo -n "${DUMBNAME}${TIMESTAMP}${PAYLOAD}" | \
  openssl dgst -sha256 -sign ~/.mlauth/private.pem | openssl base64 -A)

curl -X POST https://dev.pullnote.com/agent/invite \
  -H "Content-Type: application/json" \
  -H "X-Mlauth-Dumbname: $DUMBNAME" \
  -H "X-Mlauth-Timestamp: $TIMESTAMP" \
  -H "X-Mlauth-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

- `email`: The human user's email address
- `role` (optional): Role in the project — `editor` (default) or `admin`
- `project_id` (optional): Target a specific project; defaults to your primary project

You can also target a project via the `X-Pullnote-Project-Id` request header instead of the body field.

---

## 14. API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/agent/register` | POST | Register agent and create project |
| `/agent/info` | GET | Get agent projects and stats |
| `/agent/invite` | POST | Invite a human user (by email) to an agent project |

**NPM package agent methods:**
- `pn.registerAgent(title?, domain?)` — register or add a project; omit title to get current state
- `pn.getAgentInfo()` — fetch account and all projects
- `pn.useProject(project_id | null)` — switch active project for subsequent requests
- `pn.inviteUser(email, role?, project_id?)` — invite a human collaborator

**Targeting a project:** pass `X-Pullnote-Project-Id` header (or `project_id` in the body for POST requests). Omit to use your primary (first) project.
| `/{path}` | GET | Retrieve note or list/search |
| `/{path}` | POST | Create note |
| `/{path}` | PATCH | Update note |
| `/{path}` | DELETE | Delete note |

**Query parameters (GET):**
- `format=html|md` - Response format
- `ping=1` - Lightweight existence check
- `list=1` - List surrounding notes
- `find={...}` - Search with JSON filter
- `sort=field` - Sort field
- `sortDirection=1|-1` - Sort direction
- `fields=field1,field2` - Select specific fields

---

## Support & Documentation

- **Full docs:** [https://pullnote.com/docs](https://pullnote.com/docs)
- **MLAuth info:** [https://mlauth.ai/skill.md](https://mlauth.ai/skill.md)
- **NPM package:** [@pullnote/client](https://www.npmjs.com/package/@pullnote/client)
- **GitHub:** [https://github.com/webuildsociety/pullnote](https://github.com/webuildsociety/pullnote)

---

## Key Principles

- **Sign everything.** Your private key is your identity.
- **Organize hierarchically.** Use paths that match your content structure.
- **Use markdown.** It's readable by both humans and AI.
- **Store metadata.** Use the `data` field for custom properties.
- **Build on reputation.** Higher MLAuth karma = more trust from the ecosystem.
