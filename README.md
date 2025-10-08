# RPG Player Notes Utilities for Obsidian.md

This is a plugin for [Obsidian.md](https://obsidian.md/) with some simple utilities for RPG players for taking notes during game sessions.

Currently it has a single command - Create New RPG Player Note - which works like this:
* If you select a text and run the command, it will set the selected text as the title/filename of the new note.
  * If you run it without selecting text, you will be prompted for a title.
* Next you will be able to select from a list of note types (person, location, item, event, etc.), and this will determine the folder for the new note.
  * The folder locations are set in the plugin settings.

The idea is that you have a vault where you take all your notes from gaming sessions, where each campaign is a folder on the top level. You can then set these notes to be created in subdirectories under this folder. Personally I like to have my structure like this:
```
Root
├── DnD Dark Sun
│   ├── Compendium
│   │   ├── Events
│   │   │   └── (notes)
│   │   ├── Items
│   │   │   └── (notes)
│   │   ├── Locations
│   │   │   └── (notes)
│   │   ├── People
│   │   │   └── (notes)
│   │   └── Groups
│   │       └── (notes)
│   │
│   └── Sessions
│       ├── 2025-10-01
│       ├── 2025-10-07
│       ...etc, one note for each session
│
├── Call of Chthuhlhuhhh (yes, I know...)
│   ├── Compendium
│   │   ├── Events
│   │   │   └── (notes)
│   │   ├── Items
│   │   │   └── (notes)
│   │   ├── Locations
│   │   │   └── (notes)
│   │   ├── People
│   │   │   └── (notes)
│   │   └── Groups
│   │       └── (notes)
│   │
│   └── Sessions
│       ├── 2025-09-19
│       ├── 2025-10-03
│       ...etc, one note for each session
│
...etc
```
With this plugin, I've set all new notes of type "Person" to be created in `Compendium/People`, "Event" in `Compendium/Events`, etc. so when I'm writing the note for the current session, my new notes are always put in the right compendium for the campaign. All the folders can be customized, it's only the basic structure in that the folders you specify are relative to the top level folder of the note you are on when creating a new note.

In time I'll probably add more features and options as I find the need, but for now this is all I need to get started. Feel free to suggest features or contribute code, and of course, report bugs.

# Contributing
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
#### Desktop/Mobile mode toggle
There is a `devtools.ts` file in the `src/` folder, which is only activated when running in dev mode. All this does is add a button to the left toolbar which lets you toggle Obsidian between desktop and mobile mode.
#### Developing on WSL
I run Obsidian on Windows, but I do all my development in either [Debian/GNU Linux](https://debian.org) or in WSL (specifically WSL2, also Debian). This might cause issues if the files are on a Windows drive, like performance hubbub with git and node, and also some IDE's (like [WebStorm](https://jetbrains.com/webstorm) which I use) has issues understanding the symlinks pnpm creates in `node_modules`. I therefore develop on a WSL drive, but for some unknown and mysterious reason, Obsidian can't open vaults in `\\wsl$\` folders, so I need to have my Obsidian vaults on Windows drives.

**My solution**: Set up the plugin development in WSL, and create a symlink from `dist/` to `<Vault Location>/.obsidian/plugins/my-new-plugin`. That way, when you build the plugin in WSL, it will be available in the Obsidian vault in Windows.

