# @pullnote/client

JavaScript/TypeScript client for the Pullnote headless content API.

## Installation

```sh
npm install @pullnote/client
```

## Usage

```js
import { PullnoteClient } from '@pullnote/client';

const pn = new PullnoteClient(process.env.PULLNOTE_KEY);

await pn.add({
  title: 'My Content Page',
  content: 'This is my content page',
  slug: 'my-content-page',
  prompt: 'Write a short piece about the importance of the color blue'
});

const htmlContent = await pn.getHtml('/my-content-page');
console.log(htmlContent);
``` 