export type Note = {
  _id?: string;
  project_id?: string;
  title?: string;
  description?: string;
  content?: string;
  picture?: string;
  imgUrl?: string;
  prompt?: string;
  imgPrompt?: string;
  created?: string;
  modified?: string;
  author?: string;
  data?: Record<string, any>;
  index?: number;
};

// API should not render HTML
// Should cache notes here and sort ourselves
export class PullnoteClient {
  private apiKey: string;
  private baseUrl: string;
  private _cacheDoc?: any;

  constructor(apiKey: string, baseUrl = 'https://api.pullnote.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async ping() {
    return await this._request('GET', '/', {ping: 1});
  }

  // Return a note object for the given path, with all of it's properties
  async get(path: string, format: string = '') {
    if (!path) path = "/"; // Root path
    if (this._cacheDoc && this._cacheDoc.path === path && (!format || this._cacheDoc.format === format)) {
      return this._cacheDoc;
    }
    this._clearCache();
    if (format && format != 'md') {
      path = (path.includes('?')) ? path + '&format=' + format : path + '?format=' + format;
    }
    const doc = await this._request('GET', path);
    this._cacheDoc = doc;
    return doc;
  }

  // Find an array of notes starting at the given path.
  // Optional: find key pairs to filter the notes e.g. {title: "Hello", data.city: "London"}
  // Optional: fields toggles output e.g. "path,title,data,content_md"
  // Optional: sort toggles sort column(s) e.g. "title"
  // Optional: sortDirection toggles sorting direction e.g. 1 for ascending, -1 for descending
  // e.g. var londonNotes = await find('/', {data.city: "London"});
  async find(path: string, find: Record<string, any> = {}, sort: string = "", sortDirection: number = 0, fields: string = "") {
    return await this._request('GET', path, {find, fields, sort, sortDirection});
  }

  // Special case of "find" that returns all notes in the database
  async getAll(sort: string = "", sortDirection: number = 0, fields: string = "") {
    return await this._request('GET', '/', {find: {}, fields, sort, sortDirection});
  }
  
  // List surrounding notes related to the given path. Returns parents, children and siblings. Useful for building menus.
  async list(path: string, sort: string = "", sortDirection: number = 0) {
    return await this._request('GET', path, {list: 1, sort, sortDirection: sortDirection});
  }

  // Synonym for list()
  async getSurrounding(path: string, sort: string = "", sortDirection: number = 0) {
    return await this.list(path, sort, sortDirection);
  }
  
  // Create a new note. Note: path will overwrite any note.path passed
  async add(path: string, note: Note) {
    this._clearCache();
    this._cacheDoc = await this._request('POST', path, note);
    return this._cacheDoc;
  }

  // Update a note with changes. Note: move a note by passing a different path in changes.path
  async update(path: string, changes: Partial<Note>) {
    this._clearCache();
    this._cacheDoc = await this._request('PATCH', path, changes);
    return this._cacheDoc;
  }

  // Delete a note. Note: path will overwrite any note.path passed
  async remove(path: string) {
    path = path || this._cacheDoc?._path;
    const res = await this._request('DELETE', path);
    this._clearCache();
    return res?.success;
  }

  async delete(path: string) {
    return this.remove(path);
  }

  // Generate a new note using a prompt.
  async generate(path: string, prompt: string, imgPrompt?: string) {
    this._clearCache();
    return this._request('POST', path, { prompt, imgPrompt });
  }

  async clear() {
    this._clearCache();
  }

  async exists(path: string) {
    var res = await this._request('GET', path, { ping: 1});
    return res.found;
  }

  // Get the content of a note as markdown
  async getMd(path: string) {
    const doc = await this.get(path, 'md');
    return doc.content;
  }

  // Get the content of a note as HTML
  async getHtml(path: string) {
    const doc = await this.get(path, 'html');
    return doc.content;
  }

  async getTitle(path: string) {
    const doc = await this.get(path);
    return doc?.title ?? "";
  }

  // Return any data associated with a note. Useful for retrieving custom metadata.
  async getData(path: string) {
    const doc = await this.get(path);
    return doc?.data ?? {};
  }

  // Shorthand to update the data associated with a note.
  async setData(path: string, data: Record<string, any>) {
    return await this.update(path, {data});
  }

  // Get any image URL associated with a note.
  async getImage(path: string) {
    const doc = await this.get(path);
    return doc.imgUrl;
  }

  // Get a basic set of SEO friendly HTML head tags

  async getHead(path: string, host?: string) {
    const doc = await this.get(path);

    // Auto-detect host if not provided
    if (!host) {
      // Try to get from environment variable first (Node.js)
      if (typeof process !== 'undefined' && process.env?.PULLNOTE_HOST) {
        host = process.env.PULLNOTE_HOST;
      }
      // Fall back to browser location (client-side)
      else if (typeof window !== 'undefined' && window.location) {
        host = window.location.host;
      }
    }

    return {
      title: doc?.title ?? "",
      description: doc?.description ?? "",
      imgUrl: doc?.imgUrl ?? "",
      path: doc?.path ?? "",
      host: host ?? ""
    }
  }

  async getHeadHtml(path: string, host?: string) {    
    const head = await this.getHead(path);
    return `
      <title>${head.title}</title>
      <meta name="description" content="${head.description}">
      <link rel="canonical" href="https://${head.host}${head.path}">
      
      <!-- Open Graph / Facebook -->
      <meta property="og:type" content="article">
      <meta property="og:title" content="${head.title}">
      <meta property="og:description" content="${head.description}">
      <meta property="og:url" content="https://${head.host}${head.path}">
      <meta property="og:image" content="${head.imgUrl}">

      <!-- Twitter -->
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${head.title}">
      <meta name="twitter:description" content="${head.description}">
      <meta name="twitter:image" content="${head.imgUrl}">
      <meta name="twitter:imageAlt" content="${head.title}">
    `;
  }

  // Get the parent of a note e.g. /blog/cats/tabby -> /blog/cats/
  async getParent(path: string) {
    let list = await this.list(path);
    return list?.parent ?? null;
  }

  // Get the breadcrumbs of a note e.g. /blog/cats/tabby -> [ {path: "/blog", title: "Blog"}, {path: "/blog/cats", title: "Cats"} ]
  async getBreadcrumbs(path: string) {
    let list = await this.list(path);
    return list?.parents ?? [];
  }

  // Get the children of a note e.g. /blog/cats/ -> [ {path: "/blog/cats/tabby", title: "Tabby"}, {path: "/blog/cats/siamese", title: "Siamese"} ]
  async getChildren(path: string) {
    let list = await this.list(path);
    return list?.children ?? [];
  }

  // Get the siblings of a note e.g. /blog/cats/tabby -> [ {path: "/blog/cats/tabby", title: "Tabby"}, {path: "/blog/cats/siamese", title: "Siamese"} ]
  async getSiblings(path: string) {
    let list = await this.list(path);
    return list?.siblings ?? [];
  }

  // Get the index of a note. Useful for bespoke sorting.
  async getIndex(path: string) {
    let list = await this.list(path);
    return list?.index ?? 0;
  }

  async setIndex(path: string, index: number) {
    return await this.update(path, {index});
  }

  // Add a new user to pullnote.com e.g. for a content editor
  async addUser(email: string, nomdeplume?: string) {
    return this._request('POST', '/users', { user: { email, nomdeplume } });
  }

  // Remove a user's access to pullnote.com
  async removeUser(email: string) {
    return this._request('DELETE', '/users', { user: { email } });
  }

  // Get an XML sitemap for the whole site
  async getSitemap(
    siteUrl: string = "",
    staticPages: (string | { loc: string; lastmod?: string })[] = []
  ) {

    if (!siteUrl) {
      const ping = await this._request('GET', '/', {ping: 1});
      siteUrl = ping?.project?.domain ?? "";
      if (!siteUrl) {
        throw new Error("Please pass your siteUrl or add a project URL at pullnote.com");
      }
    }
    var links: { loc: string, lastmod: string }[] = [];

    // Get all dynamic notes
    const dynamicPages = await this.getAll();

    // Start with any additional static pages passed
    staticPages.forEach((link: string | { loc: string; lastmod?: string }) => {
      if (typeof link !== "string") {
        if (typeof link === "object" && link?.loc) {
          links.push({
            loc: link.loc,
            lastmod: link?.lastmod ?? new Date().toISOString().split('T')[0]
          });
        } else {
          console.warn("Sitemap static path passed is not a string or object with loc, lastmod properties:", link);
        }
      } else {
        links.push({
          loc: link.trim(),
          lastmod: new Date().toISOString().split('T')[0]
        });
      }
    });

    dynamicPages.forEach((note: any) => {
      var unixTime = note.modified;
      var date = new Date(unixTime);
      var lastmod = date.toISOString().split('T')[0];
      links.push({
        loc: note.path,
        lastmod: lastmod
      });
    });
    // Build the XML
    var xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    links.forEach((link: any) => {
      var loc = (!link?.loc) ? "/" : link.loc;
      if (!loc.startsWith("/")) loc = "/" + loc;
      xml += `  <url>\n    <loc>${siteUrl}${loc}</loc>\n    <lastmod>${link.lastmod}</lastmod>\n  </url>\n`;
    });
    xml += `</urlset>\n`;
    // Return the XML
    return xml;
  }

  // Internal functions
  // ----------------------------

  private async _request(method: string, path: string, body?: any) {
    // Remove leading slash from path if given
    if (path && path.startsWith('/')) path = path.slice(1);
    let url = `${this.baseUrl}/${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // For GET requests, add token and data as query param
    if (method === 'GET') {
      url = url.includes('?') ? url + '&token=' + this.apiKey : url + '?token=' + this.apiKey;
      if (body && Object.keys(body).length > 0) {
        const queryParams = new URLSearchParams();
        Object.entries(body).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'object') {
              // Handle objects by JSON stringifying them
              queryParams.append(key, JSON.stringify(value));
            } else {
              queryParams.append(key, String(value));
            }
          }
        });
        const queryString = queryParams.toString();
        if (queryString) {
          url += '&' + queryString;
        }
      }
    } else {
      // Needs to be pn_authorization as Vercel (where pullnote is deployed) uses Authorization for internal business
      headers['pn_authorization'] = `Bearer ${this.apiKey}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    try {
      const res = await fetch(url, options);
      var data = await res.json();
      if (!res.ok) {
        var msg = (typeof data === "string") ? data : data?.message ?? "Unknown pullnote error";
        if (res?.status === 404) {
          console.warn(msg);
          return null;
        } else {
          console.error({res, data});
        }
        throw new Error(msg);
      }
      return data;
    } catch (err) {
      throw err;
    }
  }

  private _clearCache() {
    this._cacheDoc = undefined;
  }

  private stripOut(obj: any, fields: string[]) {
    return Object.fromEntries(Object.entries(obj).filter(([key, value]) => !fields.includes(key)));
  }
  
}
