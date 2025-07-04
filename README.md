# Pullnote
Cloud-based headless content API to create and retrieve markdown programatically (with simple human text editor at pullnote.com to save building one in each project)

## Premise
Always creating sites and not wanting to install Wordpress etc, this principally provides an outside database to store/retrieve content from.
This is for you if you:
- **don't** want to create (or configure) a CMS every time
- **don't** want to handle extra admin logins just for content writers
- **don't** want to deal with javascript editors

- **DO** want programmable / API access to your content
- **DO** want an MCP server so that you can instruct your favourite LLM from e.g. Cursor or Claude Code to smash content in / update for you
- **DO** want prompt options for AI generated placeholder content and images

## Getting started with NPM
Sign up for a free API key from [https://pullnote.com](pullnote.com)

`npm install @pullnote/client`

```js
import { PullnoteClient } from '@pullnote/client';

const pn = new PullnoteClient(env.PULLNOTE_KEY);

// get, add, update, remove, getMd, getHtml, getTitle, getImage, getHead, generate
await pn.add({
    title: 'My Content Page',
    content: 'This is my content page',
    slug: 'my-content-page',
    prompt: 'Write a short piece about the importance of the color blue'
});

var htmlContent = await pn.getHtml('/my-content-page');
```

## Getting started with REST API

### Retrieving content
Switch your domain on any URL for api.pullnote.com e.g.
https://youdomain.com/my-favourite-page => https://api.pullnote.com/my-favourite-page?token=[PULLNOTE_KEY]

### Creating content
POST JSON to the same URL with fields:
```json
{
  title: "My lovely content page",
  md: "# Fabulous page this"
}
```

## MCP server for LLM Integration
Pullnote exposes an MCP-compatible API endpoint for LLM tools such as Cursor, Claude Code etc to allow AI to create, retrieve, update, delete, and list notes programmatically.

### Endpoint

```
POST https://api.pullnote.com/mcp
```

### Adding Pullnote MCP Server to Cursor
- Navigate to Settings... > Cursor Settings > Tools & Integrations > New MCP Server
- Paste the following (or add to your remoteServers list if already there)
```json
{
	"mcpServers": {
	},
  "remoteServers": {
    "pullnote-api": {
      "url": "https://api.pullnote.com/mcp?key=[YOUR_PULLNOTE_API_KEY]"
    }
  }
}
```

### Authentication
- All requests require a valid `pullnote_key` in the request body.
- You can get a free one from [https://pullnote.com](https://pullnote.com)

### Request Format
Send a JSON body with the following fields:

- `action`: One of `create`, `retrieve`, `update`, `delete`, `list`
- `tool`: Must be `note` (future tools may be supported)
- `params`: Object with parameters for the action (see below)
- `pullnote_key`: Your project API key

#### Example: Create a Note
```json
{
  "action": "create",
  "tool": "note",
  "params": {
    "title": "Interesting ducks",
    "content": "Pre-written content e.g. An article about interesting ducks.",
    "img": "https://your-domain.com/pre-existing-article-image.png",
    "prompt": "Optional AI prompt to auto-generate content e.g. Write an interesting article about ducks",
    "imgPrompt": "Optional AI prompt to auto-generate an article image"
  },
  "pullnote_key": "YOUR_KEY_HERE"
}
```

#### Example: Retrieve a Note
```json
{
  "action": "retrieve",
  "tool": "note",
  "params": {
    "slug": "interesting-ducks"
  },
  "pullnote_key": "YOUR_KEY_HERE"
}
```

#### Example: Update a Note
```json
{
  "action": "update",
  "tool": "note",
  "params": {
    "slug": "interesting-ducks",
    "content": "Updated content.",
    "img": "https://your-domain.com/a-new-image.png",
    "prompt": "Optional AI prompt to re-generate content"
  },
  "pullnote_key": "YOUR_KEY_HERE"
}
```

#### Example: Delete a Note
```json
{
  "action": "delete",
  "tool": "note",
  "params": {
    "slug": "interesting-ducks"
  },
  "pullnote_key": "YOUR_KEY_HERE"
}
```

#### Example: List Notes
```json
{
  "action": "list",
  "tool": "note",
  "params": {},
  "pullnote_key": "YOUR_KEY_HERE"
}
```

### Response Format
All successful responses return:
```json
{
  "ok": true,
  "result": { ... }
}
```
- The `result` field contains the note object, a list of notes, or `{ ok: true }` for deletions.

### Error Handling
- Missing or invalid `pullnote_key` returns 401/403.
- Unknown actions or tools return 400.
- Not found errors return 404.
- All errors are returned as JSON with an appropriate HTTP status code.

### Notes
- The MCP endpoint is designed for programmatic access by LLM tools and external services.
- Free accounts are limited to 50 generation requests / mth and 1k notes
