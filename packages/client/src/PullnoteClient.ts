export type Note = {
  _id?: string;
  project_id?: string;
  title?: string;
  description?: string;
  picture?: string;
  img?: string;
  prompt?: string;
  imgPrompt?: string;
  content_md?: string;
  created?: string;
  modified?: string;
  author?: string;
  params?: Record<string, any>;
};

export class PullnoteClient {
  private apiKey: string;
  private baseUrl: string;
  private _cacheDoc?: any;

  constructor(apiKey: string, baseUrl = 'https://api.pullnote.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async get(slug: string, format: string = '') {
    if (this._cacheDoc && this._cacheDoc.slug === slug && (!format || this._cacheDoc.format === format)) {
      console.log("PP (b) using cached:", this._cacheDoc);
      return this._cacheDoc;
    }
    console.log("PP (c) clearing cache");
    this._cacheDoc = undefined;
    if (format && format != 'md') {
      slug = slug.includes('?') ? slug + '&format=' + format : slug + '?format=' + format;
    }
    console.log("PP (d):", slug);
    const doc = await this._request('GET', slug);
    this._cacheDoc = doc;
    return doc;
  }

  async add(content: Note) {
    this._clearCache();
    return this._request('POST', `/add`, content);
  }

  async update(slug: string, content: Partial<Note>) {
    this._clearCache();
    return this._request('PUT', `/${slug}`, content);
  }

  async remove(slug: string) {
    this._clearCache();
    return this._request('DELETE', `/${slug}`);
  }

  async getMd(slug: string) {
    const doc = await this.get(slug, 'md');
    return doc.content;
  }

  async getHtml(slug: string) {
    console.log("PP (a) getHtml with slug:", slug);
    const doc = await this.get(slug, 'html');
    return doc.content;
  }

  async getTitle(slug: string) {
    const doc = await this.get(slug);
    return doc.title;
  }

  async getImage(slug: string) {
    const doc = await this.get(slug);
    return doc.img;
  }

  async getHead(slug: string) {
    const doc = await this.get(slug);
    return doc.head;
  }

  async generate(prompt: string) {
    this._clearCache();
    return this._request('POST', `/generate`, { prompt });
  }

  private async _request(method: string, path: string, body?: any) {
    if (path.startsWith('/')) path = path.slice(1);
    let url = `${this.baseUrl}/${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // For GET requests, add token as query param
    console.log("PP (e)", method, url, "using", this.apiKey);
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
      console.log("Pullnote package retrieved from API:", res);
      if (!res.ok) throw new Error(await res.text());
      var data = await res.json();
      console.log("Package data:", data);
      return data;
    } catch (error) {
      console.error("Pullnote package error:", error);
      throw error;
    }
  }

  private _clearCache() {
    this._cacheDoc = undefined;
  }

}
