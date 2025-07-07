export type Note = {
  _id?: string;
  project_id?: string;
  title?: string;
  description?: string;
  picture?: string;
  imgUrl?: string;
  prompt?: string;
  imgPrompt?: string;
  content_md?: string;
  created?: string;
  modified?: string;
  author?: string;
  params?: Record<string, any>;
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

  async add(content: Note) {
    this._clearCache();
    this._cacheDoc = await this._request('POST', `/add`, content);
    return this._cacheDoc;
  }

  async update(changes: Partial<Note>, path?: string) {
    path = path || this._cacheDoc?._path;
    if (!path) throw new Error("No current document. Pass url path as second parameter");
    this._cacheDoc = await this._request('PATCH', path, changes);
    return this._cacheDoc;
  }

  async remove(path: string) {
    path = path || this._cacheDoc?._path;
    if (!path) throw new Error("No current document. Pass url path as second parameter");
    await this._request('DELETE', path);
    this._clearCache();
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
    return doc.title;
  }

  async getImage(path: string) {
    const doc = await this.get(path);
    return doc.imgUrl;
  }

  async getHead(path: string) {
    const doc = await this.get(path);
    return doc.head;
  }

  async generate(prompt: string) {
    this._clearCache();
    return this._request('POST', `/generate`, { prompt });
  }

  async list(sort: string = 'created', sortDirection: number = 0) {
    if (!this._cacheList) {
      // Fetch from server in created order and cache
      this._cacheList = await this._request('GET', `/pullnote_list?sort=created&sortDirection=-1`);
    }
    if (!this._cacheList?.length) return [];
    // Always sort the cached list in JS
    let sorted = [...(this._cacheList || [])];
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

  private async _request(method: string, path: string, body?: any) {
    if (path && path.startsWith('/')) path = path.slice(1);
    let url = `${this.baseUrl}/${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // For GET requests, add token as query param
    if (method === 'GET') {
      url = url.includes('?') ? url + '&token=' + this.apiKey : url + '?token=' + this.apiKey;
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
      if (!res.ok) throw new Error(await res.text());
      var data = await res.json();
      return data;
    } catch (error) {
      console.error("Pullnote package error:", error);
      throw error;
    }
  }

  private _clearCache() {
    this._cacheDoc = undefined;
    this._cacheList = undefined;
  }

}
