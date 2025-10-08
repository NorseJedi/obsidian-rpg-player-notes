# Obsidian TS/SCSS/Vite/Biome Plugin Boilerplate

This is a plugin boilerplate for developing Obsidian plugins (https://obsidian.md). It is based on the official [obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin) from the official docs [Build a plugin](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin) guide, but whereas that uses `eslint` and `esbuild`, I prefer [Biome](https://biomejs.dev/) and [Vite](https://vite.dev/), and I pretty much always use [pnpm](https://pnpm.io/) for package management and [scss](https://sass-lang.com/) for styling.

## Getting Started
Clone this repo and run `pnpm install` to install dependencies (or, you know, `npm install` or `yarn install` or whatever)
If you don't use pnpm, you may want to tweak the scripts in `package.json` slightly, and you can get rid of the `pnpm-lock.yaml` and `pnpm-workspace.yaml` files.

## Commands
* `pnpm dev`: Start the dev server
* `pnpm build`: Build the plugin.
  * These files will be output to `dist/`:
    * `main.js`
    * `dist/main.css`
    * `manifest.json`
* `pnpm version`: Bump the version of the plugin
* `pnpm lint`: Check for linting and formatting errors with Biome
* `pnpm lint:fix`: Fix linting and formatting errors with Biome

## Tips and tricks
I run Obsidian on Windows, but I do all my development in either [Debian/GNU Linux](https://debian.org) or in WSL (specifically WSL2, also Debian). This might cause issues if the files are on a Windows drive, like performance hubbub with git and node, and also some IDE's (like [WebStorm](https://jetbrains.com/webstorm) which I use) has issues understanding the symlinks pnpm creates in `node_modules`. I therefore develop on a WSL drive, but for some unknown and mysterious reason, Obsidian can't open vaults in `\\wsl$\` folders, so I need to have my Obsidian vaults on Windows drives.

**My solution**: Set up the plugin development in WSL, and create a symlink from `dist/` to `<Vault Location>/.obsidian/plugins/my-new-plugin`. That way, when you build the plugin in WSL, it will be available in the Obsidian vault in Windows.

## API Documentation

See https://github.com/obsidianmd/obsidian-api
