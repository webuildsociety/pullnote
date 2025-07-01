export type PullnoteContent = {
  title?: string;
  content?: string;
  slug?: string;
  prompt?: string;
  md?: string;
};

export class PullnoteClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.pullnote.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async get(slug: string) {
    return this._request('GET', `/${slug}`);
  }

  async add(content: PullnoteContent) {
    return this._request('POST', `/add`, content);
  }

  async update(slug: string, content: Partial<PullnoteContent>) {
    return this._request('PUT', `/${slug}`, content);
  }

  async remove(slug: string) {
    return this._request('DELETE', `/${slug}`);
  }

  async getMd(slug: string) {
    return this._request('GET', `/${slug}/md`);
  }

  async getHtml(slug: string) {
    return this._request('GET', `/${slug}/html`);
  }

  async getTitle(slug: string) {
    return this._request('GET', `/${slug}/title`);
  }

  async getImage(slug: string) {
    return this._request('GET', `/${slug}/image`);
  }

  async getHead(slug: string) {
    return this._request('GET', `/${slug}/head`);
  }

  async generate(prompt: string) {
    return this._request('POST', `/generate`, { prompt });
  }

  private async _request(method: string, path: string, body?: any) {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
    const options: RequestInit = {
      method,
      headers,
    };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
} 