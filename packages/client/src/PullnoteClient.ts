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
  private _cacheList?: any;
  private _cachedWhat?: {path: string, sort: string, sortDirection: number, all: number};

  constructor(apiKey: string, baseUrl = 'https://api.pullnote.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
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

  // List surrounding notes related to the given path. Returns parents, children and siblings. Useful for building menus.
  async list(path: string, sort: string = 'modified', sortDirection: number = -1) {
    if (!this._cacheList || this._cachedWhat?.path !== path || this._cachedWhat?.sort !== sort || this._cachedWhat?.sortDirection !== sortDirection) {
      // Fetch note summaries from server and cache
      this._cacheList = await this._request('GET', path, {list: 1, sort, sortDirection});
      this._cachedWhat = {path, sort, sortDirection, all: 0};
    }
    return this._cacheList;
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

  // Get the title, description, imgUrl associated with a note. Useful for <head> sections / SEO.
  async getHead(path: string) {
    const doc = await this.get(path);
    return {
      title: doc?.title ?? "",
      description: doc?.description ?? "",
      imgUrl: doc?.imgUrl ?? ""
    }
  }

  // Returns all notes in the database. Useful for building custom sitemaps.
  async getAll() {
    if (this._cachedWhat?.all != 1) {
      this._cacheList = await this._request('GET', '/', {all: 1});
      this._cachedWhat = {path: '/', sort: 'modified', sortDirection: -1, all: 1};
      console.log('cached all', this._cachedWhat);
    }
    return this._cacheList;
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
    siteUrl: string,
    staticPages: (string | { loc: string; lastmod?: string })[] = []
  ) {

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
      if (body) {
        url += `&${Object.entries(body).map(([key, value]) => `${key}=${value}`).join('&')}`;
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
    this._cacheList = undefined;
  }

}
