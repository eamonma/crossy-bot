# Installation

- `git clone https://github.com/oceanroleplay/discord.ts-example`
- `cd discord.ts-example`
- `npm install`
- `npm run build`
- `set BOT_TOKEN=<your bot token>`

  if you don't have token yet than create one at [discord developer portal](https://discord.com/developers/)

- `npm run start`

you are done, you will see your bot up and running. For detailed installation guide, please [see this](https://oceanroleplay.github.io/discord.ts/docs/installation)

# Use CommonJS

This repo is targed to use ECMAScript modules by default. Follow these steps to use CommonJS.

## Update package.json

```json
{
  // ...
  "type": "commonjs",
  // ...
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/client.ts",
    "start": "nodemon --exec ts-node src/client.ts",
    "serve": "node build/client.js"
  }
  // ...
}
```

## Update tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "CommonJS"
    // ...
  }
}
```

## Update client.ts

```ts
async function run() {
  // with cjs
  await importx(__dirname + "/{events,commands}/**/*.{ts,js}");
  // with ems
  // await importx(dirname(import.meta.url) + "/{events,commands}/**/*.{ts,js}");
  client.login(process.env.BOT_TOKEN ?? ""); // provide your bot token
}
```

# Thank you
