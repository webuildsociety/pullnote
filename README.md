# Pullnote
Simple cloud-based headless API to save building a content backend for each project.

Pullnote principally provides an outside database to store/retrieve content using NPM, REST or an MCP Server; plus a simple human editor at pullnote.com.


## Getting started

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

Or use a prompt

```js
await pn.add('/all-about-being-blue', {
    title: 'A Kinda Blue',
    prompt: 'Write a short piece about the importance of the color blue'
});
```


## Retrieve a note

```js
var note = await pn.get('/all-about-being-blue');
```
Or just the components
```js
var title = await pn.getTitle('/all-about-being-blue');
var htmlContent = await pn.getHtml('/all-about-being-blue');
```


## List notes
Get surrounding parents, children and sibling notes - useful for building menus.

```js
var notes = await pn.list("/blog");
```

## Remove a note

```js
await pn.remove("all-about-being-blue");
```


## Add a user

Users can edit content by logging in at [https://pullnote.com](https://pullnote.com)
```js
await pn.addUser("support@pullnote.com");
```

# API documentation

## PullnoteClient API

The `PullnoteClient` class provides a set of methods to interact with the Pullnote API. Below is a summary of all available methods:

| Method                | Description                                                      |
|-----------------------|------------------------------------------------------------------|
| get                   | Retrieve a note by path (optionally in a specific format)         |
| add                   | Add a new note at a given path                                   |
| update                | Update an existing note at a given path                          |
| remove/delete         | Delete a note at a given path                                    |
| **COMPONENTS** |                 |
| getMd                 | Retrieve a note's content as Markdown                            |
| getHtml               | Retrieve a note's content as HTML                                |
| getTitle              | Retrieve a note's title                                           |
| getImage              | Retrieve a note's image URL                                       |
| getHeadHtml               | Retrieve a note's SEO friendly head tags (title, description, imgUrl)      |
| **FOLDERS** |                 |
| getSurrounding | List related surrounding notes (parent, siblings, children - useful for menus)                 |
| list                  | Synonym for getSurrounding                 |
| getAll                | Retrieve summary of all notes in the database                                |
| getParent             | Retrieve a note's parent folder note (if it exists)                                  |
| getChildren           | Retrieve the children of a note                                   |
| getSiblings           | Retrieve the siblings of a note                                   |
| getBreadcrumbs        | Retrieve all parents in the breadcrumb trail for a note                          |
| **UTILITIES**           |                              |
| exists                | Check if a note exists at a given path                            |
| getIndex / setIndex              | Set a bespoke ordering                                      |
| getData / setData              | Save JSON data against a note e.g. a related product key                                    |
| getSitemap            | Returns a dynamic XML sitemap                             |
| addUser               | Add a human editor to your project                    |
| removeUser            | Remove a human editor from your project                                   |
| clear                 | Clear the internal cache                                          |

---

## Note structure
```ts
interface Note {
  _id: string;
  project_id: string;
  path: string; // e.g. blog/cats
  title: string;
  description?: string;
  imgUrl?: string; // either your own or pullnote hosted if added via backend
  prompt?: string; // LLM prompt for AI title, description, content
  imgPrompt?: string; // LLM prompt for AI images
  content?: string; // The raw content, as markdown
  created: string; // date time
  modified: string; // date time
  author?: string; // nom-de-plume (any string)
  data?: Record<string, any>; // JSON metadata
  index?: number;
}
```

Example JSON
```json
{
  "_id": "abc123",
  "project_id": "pr123",
  "path": "blog/all-about-being-blue",
  "title": "A Kinda Blue",
  "description": "A note about the color blue.",
  "imgUrl": "https://example.com/image.png",
  "prompt": "Write about blue.",
  "imgPrompt": "Generate a blue image.",
  "content": "# Blue",
  "created": "2024-06-01T12:00:00Z",
  "modified": "2024-06-01T12:00:00Z",
  "author": "james",
  "data": { "locale": "en-GB" },
  "index": 0
}
```

### constructor(apiKey: string)
Create a new PullnoteClient instance.

**Parameters:**
- `apiKey` (string): Your Pullnote API key.
api.pullnote.com').

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
const note = await pn.get('blog/cats');
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
await pn.add('blog/cats', { title: 'Cats', content: '# Meow' });
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
await pn.update('blog/cats', { title: 'Interesting Cats' });
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
await pn.remove('blog/cats');
```

---

### delete(path: string): Promise<void>
Alias for `remove`.

---

### getMd(path: string): Promise<string>
Retrieve a note's content as Markdown.

**Parameters:**
- `path` (string): The note path.

**Returns:**
- `Promise<string>`: The Markdown content.

**Example:**
```js
const md = await pn.getMd('blog/cats');
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
const html = await pn.getHtml('blog/cats');
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
const title = await pn.getTitle('blog/cats');
```

---

### getData(path: string): Promise<Record<string, any>>
Retrieve a note's data object. Data can be any JSON record set always to be returned with the note.
(this is useful for formatting pages that are about something specific)

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

### setData(path: string, data: Record<string, any>): Promise<void>
Set a note's data object.

**Parameters:**
- `path` (string): The note path.
- `data` (Record<string, any>): The data object to set.

**Returns:**
- `Promise<void>`

**Example:**
```js
await pn.setData('blog/cats', { product_id: 'KITTY123' });
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
const imgUrl = await pn.getImage('blog/cats');
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

### getSurrounding() / list(path: string, sort?: string, sortDirection?: number): Promise<{ self: Note, parent: Note | null, parents: Note[], children: Note[], siblings: Note[], index: number }>
List notes and related sub-lists for a given path. Returns an object containing the current note (self), its parent, an array of parent notes (breadcrumbs), children, siblings, and the index. Useful for building menus and navigation structures.

**Parameters:**
- `path` (string): The base path ("" for all notes, "/" for root level).
- `sort` (string, optional): Field to sort by (default: 'auto').
- `sortDirection` (number, optional): 1 for ascending, -1 for descending (default: 0 = auto).

**Returns:**
- `Promise<{ self: Note, parent: Note | null, parents: Note[], children: Note[], siblings: Note[], index: number }>`: An object containing the current note and related sub-lists.

**Example:**
```js
const list = await pn.list('/blog');
// list.self, list.parent, list.parents, list.children, list.siblings, list.index
```

---

### getAll(): Promise<Note[]>
Retrieve all notes in the database.

**Returns:**
- `Promise<Note[]>`: Array of all notes.

**Example:**
```js
const allNotes = await pn.getAll();
```

---

### getParent(path: string): Promise<Note | null>
Retrieve the parent note object.

**Parameters:**
- `path` (string): The note path.

**Returns:**
- `Promise<Note | null>`: The parent note object, or null if it's a root note.

**Example:**
```js
const parent = await pn.getParent('my-note-path');
```

---

### getBreadcrumbs(path: string): Promise<Note[]>
Retrieve the breadcrumb trail for a note.

**Parameters:**
- `path` (string): The note path.

**Returns:**
- `Promise<Note[]>`: Array of parent notes leading up to the current note.

**Example:**
```js
const breadcrumbs = await pn.getBreadcrumbs('my-note-path');
```

---

### getChildren(path: string): Promise<Note[]>
Retrieve the children of a note.

**Parameters:**
- `path` (string): The note path.

**Returns:**
- `Promise<Note[]>`: Array of child notes.

**Example:**
```js
const children = await pn.getChildren('my-note-path');
```

---

### getSiblings(path: string): Promise<Note[]>
Retrieve the siblings of a note.

**Parameters:**
- `path` (string): The note path.

**Returns:**
- `Promise<Note[]>`: Array of sibling notes.

**Example:**
```js
const siblings = await pn.getSiblings('my-note-path');
```

---

### getIndex(path: string): Promise<number>
Retrieve the index of a note.

**Parameters:**
- `path` (string): The note path.

**Returns:**
- `Promise<number>`: The index of the note.

**Example:**
```js
const index = await pn.getIndex('my-note-path');
```

---

### setIndex(path: string, index: number): Promise<void>
Set the index of a note.

**Parameters:**
- `path` (string): The note path.
- `index` (number): The new index.

**Returns:**
- `Promise<void>`

**Example:**
```js
await pn.setIndex('my-note-path', 0);
```

---

### getSitemap(siteUrl: string, staticPages?: (string | { path: string })[]): Promise<string>
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
- Accounts are subject to usage limits due to storage and inference costs - see https://pullnote.com/pricing
