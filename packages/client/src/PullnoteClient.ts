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
};

// API should not render HTML
// Should cache notes here and sort ourselves
export class PullnoteClient {
  private apiKey: string;
  private baseUrl: string;
  private _cacheDoc?: any;
  private _cacheList?: any;

  constructor(apiKey: string, baseUrl = 'https://api.pullnote.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async exists(path: string) {
    var res = await this._request('GET', path, { ping: 1});
    return res.found;
  }

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

  // Note: path will overwrite any note.path passed
  async add(path: string, note: Note) {
    this._clearCache();
    this._cacheDoc = await this._request('POST', path, note);
    return this._cacheDoc;
  }

  // Note: move a note by passing a different path in changes.path
  async update(path: string, changes: Partial<Note>) {
    this._clearCache();
    this._cacheDoc = await this._request('PATCH', path, changes);
    return this._cacheDoc;
  }

  async remove(path: string) {
    path = path || this._cacheDoc?._path;
    if (!path) throw new Error("No current document. Pass url path as second parameter");
    await this._request('DELETE', path);
    this._clearCache();
  }

  async delete(path: string) {
    return this.remove(path);
  }

  async clear() {
    this._clearCache();
  }

  async getMd(path: string) {
    const doc = await this.get(path, 'md');
    return doc.content;
  }

  async getHtml(path: string) {
    const doc = await this.get(path, 'html');
    return doc.content;
  }

  async getTitle(path: string) {
    const doc = await this.get(path);
    return doc?.title ?? "";
  }

  async getData(path: string) {
    const doc = await this.get(path);
    return doc?.data ?? {};
  }

  async getImage(path: string) {
    const doc = await this.get(path);
    return doc.imgUrl;
  }

  async getHead(path: string) {
    const doc = await this.get(path);
    return {
      title: doc?.title ?? "",
      description: doc?.description ?? "",
      imgUrl: doc?.imgUrl ?? ""
    }
  }

  async generate(path: string, prompt: string, imgPrompt?: string) {
    this._clearCache();
    return this._request('POST', path, { prompt, imgPrompt });
  }

    // Note: "" gets ALL notes, "/" just root level ones
  async list(path: string, sort: string = 'created', sortDirection: number = 0) {
    if (!this._cacheList) {
      // Fetch all note summaries from server in created order and cache
      this._cacheList = await this._request('GET', `/?list=1&sort=created&sortDirection=-1`);
    }
    if (!this._cacheList?.length) return [];
    // Whittle the cache list down to the path requested
    if (path) {
      // Only include notes directly under the given path (not deeper subfolders)
      const base = path.endsWith("/") ? path : path + "/";
      var noteList = this._cacheList.filter((item: any) => {
        if (!item?.path || !item.path.startsWith(base)) {
          return false;
        }
        // Get the rest of the path after the base
        const rest = item.path.slice(base.length);
        // Only include if there are no further slashes in the rest (i.e., not a subfolder)
        return rest.length > 0 && !rest.includes("/");
      });
    } else {
      var noteList = this._cacheList;
    }
    // Always sort the cached list in JS
    let sorted = [...(noteList || [])];
    if (sort) {
      sorted.sort((a, b) => {
        if (a[sort] === undefined && b[sort] === undefined) return 0;
        if (a[sort] === undefined) return 1;
        if (b[sort] === undefined) return -1;
        if (a[sort] < b[sort]) return sortDirection === -1 ? 1 : -1;
        if (a[sort] > b[sort]) return sortDirection === -1 ? -1 : 1;
        return 0;
      });
    }
    return sorted;
  }

  async getSitemap(
    siteUrl: string,
    staticPages: (string | { path: string; modified?: string })[] = []
  ) {
    // Get all notes
    var notes: { path: string, modified: string }[] = [];
    // Start with static pages
    staticPages.forEach((path: string | { path: string; modified?: string }) => {
      if (typeof path !== "string") {
        if (typeof path === "object" && path?.path) {
          notes.push({
            path: path.path,
            modified: path?.modified ?? new Date().toISOString().split('T')[0]
          });
        } else {
          console.warn("Sitemap static path passed is not a string or object with path, modified properties:", path);
        }
      } else {
        notes.push({
          path: path.trim(),
          modified: new Date().toISOString().split('T')[0]
        });
      }
    });
    // Add in dynamic pages
    const dynamicPages = await this.list("");
    // Convert UNIX timestamps to ISO string of just date e.g. 2025-08-08
    dynamicPages.forEach((note: any) => {
      notes.push({
        path: note.path,
        modified: new Date(note.modified * 1000).toISOString().split('T')[0]
      });
    });
    // Build the XML
    var xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    notes.forEach((note: any) => {
      var path = (!note?.path) ? "/" : note.path;
      if (!path.startsWith("/")) path = "/" + path;
      xml += `  <url>\n    <loc>${siteUrl}${path}</loc>\n    <lastmod>${note.modified}</lastmod>\n  </url>\n`;
    });
    xml += `</urlset>\n`;
    // Return the XML
    return xml;
  }

  // Internal functions
  // ----------------------------

  private async _request(method: string, path: string, body?: any) {
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
