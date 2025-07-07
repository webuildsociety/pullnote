# Pullnote
Cloud-based headless API to save building a content backend for each project.

This principally provides an outside database to store/retrieve content using NPM, REST or an AI MCP Server tool; plus a simple human editor at pullnote.com (desktop app coming soon).

This is for you if you:
- want simple, fast, programmable / API access to content
- want to allow LLMs to create/save content for you (e.g. Cursor or Claude Code can smash content in / update for you via our MCP server)
- don't want to build your own content area / auth / wysiwyg backend

## Getting started with NPM
Sign up for a free API key from [https://pullnote.com](pullnote.com)

`npm install @pullnote/client`

```js
import { PullnoteClient } from '@pullnote/client';

const pn = new PullnoteClient(env.PULLNOTE_KEY);

// Available functions: get, add, update, remove, getMd, getHtml, getTitle, getImage, getHead, generate, list
await pn.add({
    title: 'A Kinda Blue',
    content: 'This is my content page about the colour blue.',
    path: 'all-about-being-blue',
    prompt: 'Write a short piece about the importance of the color blue'
});

var htmlContent = await pn.getHtml('all-about-being-blue');
```

## Pullnote LLM
Pullnote also offers the use of our own LLM to generate placeholder content and images - just hit the endpoints with `prompt` instead of `content`


## Getting started with REST API
Alternatively, you can hit the REST API directly.

### Retrieving content
Switch your domain (on any URL) for api.pullnote.com e.g.
https://youdomain.com/my-favourite-page => https://api.pullnote.com/my-favourite-page?token=[PULLNOTE_KEY]&format=html

### Creating content
POST JSON to the same URL with fields:
```json
{
  title: "My lovely content page",
  content: "# Fabulous page this"
}
```

### Deleting content
Send a HTTP `DELETE` request to your content URL, e.g.:
`DELETE https://api.pullnote.com/my-favourite-page?token=[PULLNOTE_KEY]`

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
    "imgUrl": "https://your-domain.com/pre-existing-article-image.png",
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
    "path": "interesting-ducks"
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
    "path": "interesting-ducks",
    "content": "Updated content.",
    "imgUrl": "https://your-domain.com/a-new-image.png",
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
    "path": "interesting-ducks"
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

## Testing
Use `npm run test` to test code changes to this repository in isolation.

Pre-publishing, hook up a local project to your changes:
```sh
# In THIS project directory
npm link
# In the consuming project directory
npm link @pullnote/client
# Once you are finished testing in the consuming project
npm unlink @pullnote/client
```
## Publishing
- Update the package.json version number
```sh
npm login
npm run build
npm pack
npm publish --access public
```