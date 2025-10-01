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
  path: 'my-content-page',
  prompt: 'Write a short piece about the importance of the color blue'
});

const htmlContent = await pn.getHtml('/my-content-page');
console.log(htmlContent);
```

See main README for how to utilise this in a project [https://github.com/webuildsociety/pullnote](https://github.com/webuildsociety/pullnote)


# Code Contributors
From the `packages/client/` directory...

## Testing
Use `npm run test` to test code changes to this repository in isolation.

Pre-publishing, hook up a local project to your changes:
```sh
# In THIS project directory
npm link
# In the consuming project directory
npm uninstall @pullnote/client
npm link @pullnote/client
# Once you are finished testing in the consuming project
npm unlink @pullnote/client
npm install @pullnote/client
```

## Publishing
- Update the package.json version number
```sh
npm login
npm run build
npm pack
npm publish --access public
```
