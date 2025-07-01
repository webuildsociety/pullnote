# Pullnote
Cloud-based headless content API to create and retrieve markdown programatically (with simple human text editor at pullnote.com to save building one in each project)

## Premise
Always creating sites and not wanting to install Wordpress etc, I principally wanted somewhere outside of my application database to store/retrieve content from.
This is for you if:
- Don't want to create (or configure) a CMS
- Don't want to handle auth just for content writers
- Don't want to deal with javascript editors

- DO want programmable / API access to your content - to create / retrieve
- DO want an MCP server so that you can instruct your favourite LLM from e.g. Cursor or Claude Code to smash content in for you
- DO want prompt options for content and images

## Getting started with NPM
Sign up for a free API key from [https://pullnote.com](pullnote.com)
`npm install @pullnote/client`
```js
import { PullnoteClient } from '@pullnote/client';

const pn = new PullnoteClient(env.PULLNOTE_KEY);

// get, add, update, remove, getMd, getHtml, getTitle, getImage, getHead, generate
await pn.add({
    title: 'My Content Page',
    content: 'This is my content page',
    slug: 'my-content-page',
    prompt: 'Write a short piece about the importance of the color blue'
});

var htmlContent = await pn.getHtml('/my-content-page');
console.log(htmlContent);
```

## Getting started with REST API

### Retrieving content
Switch your domain on any URL for api.pullnote.com e.g.
https://youdomain.com/my-favourite-page => https://api.pullnote.com/my-favourite-page?token=[PULLNOTE_KEY]

### Creating content
POST JSON to the same URL with fields:
```json
{
  title: "My lovely content page",
  md: "# Fabulous page this"
}
```

## Getting started with the AI MCP server
