# Magic Link Email Plan

How a developer (or agent) invites a non-technical user to edit content via Claude Cowork — no API keys involved.

## The Flow

1. **Agent/developer invites user** → `POST /agent/invite { email, role? }`
2. **Server generates a single-use invite token**, stores it in `invite_tokens` collection, sends email with magic link
3. **User clicks link** → `pullnote.com/invite/{token}` — landing page with two options
4. **If they choose Claude:** install the Pullnote plugin, then tell Claude "join project with token {token}"
5. **Claude sets up MLAuth identity** (keygen → register at mlauth.ai) if it doesn't have one
6. **Claude joins the project** via `POST /agent/register` with `{"code":"{token}"}`
7. **From then on**, Claude signs all requests with its own MLAuth identity — no API key ever needed

The invite token replaces the API key entirely in the onboarding flow. The private key never leaves the user's machine.

## Current State (Implemented)

### API server (pullnote-api)

**`POST /agent/invite`** — generates token, stores in `invite_tokens`, sends magic link email
- Token: cryptographically random, URL-safe, 32 chars (base64url)
- Expiry: 7 days
- Single-use: marked `used: true` when redeemed
- Email includes link to `pullnote.com/invite/{token}` with two options (Claude or web editor)
- No API key in the email

**`POST /agent/register`** — accepts invite tokens via the `code` field
- First checks if `code` is an API key (existing behaviour)
- Falls back to checking `invite_tokens` collection
- Validates: not expired, not already used
- On success: marks token used, adds agent to project

### invite_tokens schema
```
{
  token:       String (base64url, 32 bytes)
  email:       String
  project_id:  String (ObjectId)
  role:        String ("editor" | "admin")
  invited_by:  String (dumbname of inviting agent)
  created_at:  Date
  expires_at:  Date (created_at + 7 days)
  used:        Boolean
  used_by:     String (dumbname of redeeming agent, set on use)
  used_at:     Date (set on use)
}
```

### Pullnote plugin SKILL.md
- MLAuth is the primary and default auth path
- Step 1: Set up MLAuth identity (check/create)
- Step 2: Join project with invite token
- Step 3: Sign requests with MLAuth
- API key auth removed from the default flow

## Still Needed

### Landing page: `pullnote.com/invite/{token}` (pullnotev2)

A SvelteKit route that:

1. Validates the token (GET request to pullnote-api or direct DB check)
2. Shows project title and a welcome message
3. Presents two options:

**Option A: "Set up Claude to edit for me"**
- Shows the plugin install commands:
  ```
  /plugin marketplace add https://www.pullnote.com/.claude-plugin/marketplace.json
  /plugin install pullnote@pullnote
  ```
- Shows the invite token prominently with a copy button
- Explains: "After installing, tell Claude: join the project with token {token}"

**Option B: "Edit in the browser"**
- Redirects to pullnote.com/console (existing web editor, Google OAuth login)

### Token validation endpoint (pullnote-api)

A lightweight endpoint for the landing page to validate tokens without consuming them:

```
GET /agent/invite/validate?token={token}
→ { valid: true, project_title: "...", role: "editor", expires_at: "..." }
→ { valid: false, reason: "expired" | "used" | "not_found" }
```

### Future: Cowork deep links

If Anthropic adds a `cowork://` protocol, the landing page could auto-open Cowork with the marketplace + token pre-configured — true one-click onboarding.

## Completed: Consolidated invite routes

The web console and API server now share a single invite path:

**`POST /project/invite`** (pullnote-api) — unified invite endpoint
- Accepts both API key auth (`?key=` or `pn_authorization` header) and MLAuth headers
- Body: `{ email, role?, invited_by? }`
- Generates invite token, adds user to project, sends magic link email
- Returns: `{ success, project_id, email, role, invite_url, message }`

**`POST /api/invite`** (pullnotev2) — thin proxy for the web console
- Authenticates via session cookie (existing Google OAuth)
- Forwards to pullnote-api `/project/invite` using the project's API key
- The web console's `InviteModal.svelte` calls this endpoint

**UI change**: The `+ user` button now opens an `InviteModal` that asks for email and role, and sends the invite immediately — no more detecting new users on save.

**Removed**: `sendProjectJoinEmails()` from pullnotev2's PATCH `/api/projects` handler.

The old `/agent/invite` endpoint (MLAuth-only, used by agents directly) still works for backward compatibility.

## Estimated Remaining Effort

- Landing page route: ~4 hours
- Token validation endpoint: ~1 hour
- Testing end-to-end: ~2 hours
- **Total remaining: ~7 hours / ~1 day**
