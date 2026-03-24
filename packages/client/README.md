# @pullnote/client

JavaScript/TypeScript client for the Pullnote headless content API.
Note: for web clients, because of the requirement to use a key to access your content, this is intended to be to run server-side as part of your SSR (server-side rendering)

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

## MLAuth agent registration

```ts
import { PullnoteClient } from '@pullnote/client';

const pn = new PullnoteClient({
  dumbname: 'your-agent-name',
  privateKeyPath: '~/.mlauth/private.pem'
});

// Create (or add) a project
await pn.registerAgent('My Project');

// Join an existing project using an invite key/code
await pn.registerAgent({ code: 'pullnote_xxxxxxxxxxxxxxxx' });
```

See main README for how to utilise this in a project [https://github.com/webuildsociety/pullnote](https://github.com/webuildsociety/pullnote)


# Code Contributors
From the `packages/client/` directory...

## Testing
Use `npm run test` to test code changes to this repository in isolation.

Pre-publishing, hook up a local project to your changes:
```sh
# In THIS project directory, e.g. cd packages/client
npm link
# In the consuming project directory
npm uninstall @pullnote/client
npm link @pullnote/client
# Once you are finished testing in the consuming project
npm unlink @pullnote/client
npm install @pullnote/client
```

## Publishing from packages/client
- Update the package.json version number
```sh
npm login
npm run build
npm pack
npm publish --access public
```

# License

MIT — see [LICENSE](LICENSE)
