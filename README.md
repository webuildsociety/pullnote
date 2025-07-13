# Pullnote
Simple cloud-based headless API to save building a content backend for each project.

Pullnote principally provides an outside database to store/retrieve content using NPM, REST or an MCP Server; plus a simple human editor at pullnote.com.


## Sites using Pullnote

- [Rummij.com](https://rummij.com)
- [Repatch.co.uk](https://repatch.co.uk)
- [SvelteHeadless.com](https://svelteheadless.com)
- [Echowalk.com](https://echowalk.com)


## Getting started with NPM

Sign up for a free API key from [https://pullnote.com](pullnote.com)

`npm install @pullnote/client`

```js
import { PullnoteClient } from '@pullnote/client';

const pn = new PullnoteClient(PULLNOTE_KEY);
```

## Add a note

```js
await pn.add('/all-about-being-blue', {
    title: 'A Kinda Blue',
    content: 'This is my content page about the colour blue.'
});
```


## Add a note using a prompt

```js
// Note: the leading "/" is optional (except when adding a root page)
await pn.add('/all-about-being-blue', {
    title: 'A Kinda Blue',
    prompt: 'Write a short piece about the importance of the color blue'
});
```


## Get a note

```js
var htmlContent = await pn.getHtml('/all-about-being-blue');

// List all the notes in the "/blog" subdirectory
var notes = await pn.list("/blog");
```

## Delete a note

```js
await pn.remove("all-about-being-blue");
```


## Add a user

Added users edit content at [https://pullnote.com](https://pullnote.com)
```js
await pn.addUser("support@pullnote.com");
```

# API documentation

## PullnoteClient API

The `PullnoteClient` class provides a set of methods to interact with the Pullnote API. Below is a summary of all available methods:

| Method                | Description                                                      |
|-----------------------|------------------------------------------------------------------|
| exists                | Check if a note exists at a given path                            |
| get                   | Retrieve a note by path (optionally in a specific format)         |
| add                   | Add a new note at a given path                                   |
| update                | Update an existing note at a given path                          |
| remove/delete         | Delete a note at a given path                                    |
| getMd                 | Retrieve a note's content as Markdown                            |
| getHtml               | Retrieve a note's content as HTML                                |
| getTitle              | Retrieve a note's title                                           |
| getData               | Retrieve a note's data object                                     |
| getImage              | Retrieve a note's image URL                                       |
| getHead               | Retrieve a note's head metadata (title, description, imgUrl)      |
| generate              | Generate content for a note using an AI prompt                    |
| list                  | List notes under a given path                                     |
| getSitemap            | Generate an XML sitemap for your site                             |
| addUser               | Add a user to your project (for editor access)                    |

---

### constructor(apiKey: string, baseUrl = 'https://api.pullnote.com')
Create a new PullnoteClient instance.

**Parameters:**
- `apiKey` (string): Your Pullnote API key.
- `baseUrl` (string, optional): API base URL (default: 'https://api.pullnote.com').

**Example:**
```js
const pn = new PullnoteClient('YOUR_API_KEY');
```

---

### exists(path: string): Promise<boolean>
Check if a note exists at the given path.

**Parameters:**
- `path` (string): The path to check.

**Returns:**
- `Promise<boolean>`: `true` if the note exists, otherwise `false`.

**Example:**
```js
const found = await pn.exists('my-note-path');
```

---

### get(path: string, format?: string): Promise<Note>
Retrieve a note by path. Optionally specify a format ('md' or 'html').

**Parameters:**
- `path` (string): The note path.
- `format` (string, optional): Format ('md', 'html', or '').

**Returns:**
- `Promise<Note>`: The note object.

**Example:**
```js
const note = await pn.get('my-note-path');
```

---

### add(path: string, note: Note): Promise<Note>
Add a new note at the given path.

**Parameters:**
- `path` (string): The note path.
- `note` (Note): The note object to add.

**Returns:**
- `Promise<Note>`: The created note object.

**Example:**
```js
await pn.add('my-note-path', { title: 'Title', content: 'Content' });
```

---

### update(path: string, changes: Partial<Note>): Promise<Note>
Update an existing note at the given path.

**Parameters:**
- `path` (string): The note path.
- `changes` (Partial<Note>): The changes to apply.

**Returns:**
- `Promise<Note>`: The updated note object.

**Example:**
```js
await pn.update('my-note-path', { title: 'New Title' });
```

---

### remove(path: string): Promise<void>
Delete a note at the given path.

**Parameters:**
- `path` (string): The note path.

**Returns:**
- `Promise<void>`

**Example:**
```js
await pn.remove('my-note-path');
```

---

### delete(path: string): Promise<void>
Alias for `remove`.

---

### clear(): Promise<void>
Clear the internal cache.

**Returns:**
- `Promise<void>`

**Example:**
```js
await pn.clear();
```

---

### getMd(path: string): Promise<string>
Retrieve a note's content as Markdown.

**Parameters:**
- `path` (string): The note path.

**Returns:**
- `Promise<string>`: The Markdown content.

**Example:**
```js
const md = await pn.getMd('my-note-path');
```

---

### getHtml(path: string): Promise<string>
Retrieve a note's content as HTML.

**Parameters:**
- `path` (string): The note path.

**Returns:**
- `Promise<string>`: The HTML content.

**Example:**
```js
const html = await pn.getHtml('my-note-path');
```

---

### getTitle(path: string): Promise<string>
Retrieve a note's title.

**Parameters:**
- `path` (string): The note path.

**Returns:**
- `Promise<string>`: The note title.

**Example:**
```js
const title = await pn.getTitle('my-note-path');
```

---

### getData(path: string): Promise<Record<string, any>>
Retrieve a note's data object. Data can be any JSON record set with add() or update() and returned with the note.
(this is useful for formatting pages that are about specific things, so you don't need to keep track of that on your client)

**Parameters:**
- `path` (string): The note path.

**Returns:**
- `Promise<Record<string, any>>`: The data object.

**Example:**
```js
await pn.add('my-site-in-france', {title: 'France', content: '...', data: { locale: 'en-FR', currency: 'EUR'}});
const data = await pn.getData('my-site-in-france'); // Returns { locale: 'en-FR', currency: 'EUR'}
```

---

### getImage(path: string): Promise<string>
Retrieve a note's image URL.

**Parameters:**
- `path` (string): The note path.

**Returns:**
- `Promise<string>`: The image URL.

**Example:**
```js
const imgUrl = await pn.getImage('my-note-path');
```

---

### getHead(path: string): Promise<{ title: string, description: string, imgUrl: string }>
Retrieve a note's head metadata.

**Parameters:**
- `path` (string): The note path.

**Returns:**
- `Promise<{ title: string, description: string, imgUrl: string }>`

**Example:**
```js
const head = await pn.getHead('my-note-path');
```

---

### generate(path: string, prompt: string, imgPrompt?: string): Promise<any>
Generate content for a note using an AI prompt.

**Parameters:**
- `path` (string): The note path.
- `prompt` (string): The AI prompt for content generation.
- `imgPrompt` (string, optional): The AI prompt for image generation.

**Returns:**
- `Promise<any>`: The generated content.

**Example:**
```js
await pn.generate('my-note-path', 'Write about blue.');
```

---

### list(path: string, sort?: string, sortDirection?: number): Promise<Note[]>
List notes under a given path.

**Parameters:**
- `path` (string): The base path ("" for all notes, "/" for root level).
- `sort` (string, optional): Field to sort by (default: 'created').
- `sortDirection` (number, optional): 1 for ascending, -1 for descending (default: 0).

**Returns:**
- `Promise<Note[]>`: Array of note summaries.

**Example:**
```js
const notes = await pn.list('/blog');
```

---

### getSitemap(siteUrl: string, staticPages?: (string | { path: string; modified?: string })[]): Promise<string>
Generate an XML sitemap for your site.

**Parameters:**
- `siteUrl` (string): The base URL of your site (e.g., 'https://mysite.com').
- `staticPages` (array, optional): List of static page paths or objects with path and modified date.

**Returns:**
- `Promise<string>`: The XML sitemap as a string.

**Example:**
```js
const sitemap = await pn.getSitemap('https://mysite.com', ['/about', '/contact']);
```

---

### addUser(email: string, nomdeplume?: string): Promise<any>
Add a user to your project (for editor access). This allows the specified email to log in and edit content for your project at pullnote.com.

**Parameters:**
- `email` (string): The user's email address.
- `nomdeplume` (string, optional): The user's display name (optional).

**Returns:**
- `Promise<any>`: The API response.

**Example:**
```js
await pn.addUser("support@pullnote.com");
```

---

### removeUser(email: string): Promise<any>
Remove a user from your project (revokes their editor access).

**Parameters:**
- `email` (string): The user's email address to remove.

**Returns:**
- `Promise<any>`: The API response.

**Example:**
```js
await pn.removeUser("support@pullnote.com");
```

---

## Pullnote LLM
Pullnote also offers the use of our own LLM to generate placeholder content and images - just hit the endpoints with `prompt` instead of `content`

## MCP server for LLM Integration
Pullnote exposes an MCP-compatible API endpoint for LLM tools such as Cursor, Claude Code etc to allow AI to create, retrieve, update, delete, and list notes programmatically.

### Endpoint

```
POST https://api.pullnote.com/mcp
```

### Discovery
OpenAI specification for LLMs to discover which tools / actions are available (note: your LLM should automatically attempt to pick this up)
[https://api.pullnote.com/openapi.json](https://api.pullnote.com/openapi.json)

### Adding Pullnote MCP Server to Cursor
- Navigate to Settings... > Cursor Settings > Tools & Integrations > New MCP Server
- Paste the following (or add to your remoteServers list if already there)
```json
{
  "mcpServers": { },
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
