<div>
  <p align="center">
    <a href="https://discord-ts.js.org" target="_blank" rel="nofollow">
      <img src="https://discord-ts.js.org/discord-ts.svg" width="546" />
    </a>
  </p>
  
  <p align="center">
    <a href="https://discord.gg/yHQY9fexH9"
      ><img
        src="https://img.shields.io/discord/874802018361950248?color=5865F2&logo=discord&logoColor=white"
        alt="Discord server"
    /></a>
    <a href="https://www.npmjs.com/package/@discordx/music"
      ><img
        src="https://img.shields.io/npm/v/@discordx/music.svg?maxAge=3600"
        alt="NPM version"
    /></a>
    <a href="https://www.npmjs.com/package/@discordx/music"
      ><img
        src="https://img.shields.io/npm/dt/@discordx/music.svg?maxAge=3600"
        alt="NPM downloads"
    /></a>
    <a href="https://github.com/oceanroleplay/discord.ts/actions"
      ><img
        src="https://github.com/oceanroleplay/discord.ts/workflows/Build/badge.svg"
        alt="Build status"
    /></a>
    <a href="https://www.paypal.me/vijayxmeena"
      ><img
        src="https://img.shields.io/badge/donate-paypal-F96854.svg"
        alt="paypal"
    /></a>
  </p>
  <p align="center">
    <b> Create a discord bot with TypeScript and Decorators! </b>
  </p>
</div>

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

# ☎️ Need help?

Ask in **[discord server](https://discord.gg/yHQY9fexH9)** or open a **[issue](https://github.com/oceanroleplay/discord.ts-example/issues)**

# Thank you

Show your support for [discordx](https://www.npmjs.com/package/discordx) by giving us a star on [github](https://github.com/oceanroleplay/discord.ts).
