# RPG Player Notes Plugin for Obsidian.md

This is a plugin for [Obsidian.md](https://obsidian.md/) meant for RPG players for taking notes during game sessions, but I'm sure it can be used for other purposes as well.
There may be way more advanced plugins around that can replicate this functionality. However, I decided to write my own, both because I couldn't find another one to do what I want and because I wanted to figure out how to write Obsidian plugins. As I've found it very helpful for my own use, I decided to share in case someone else might find it useful as well.

What this plugin does, is add a single command – `RPG Player Notes: Create New Note` – which works like this:
* If you select a text and run the command, it will create a new note with the selected text as the title.
  * If you run it without selecting text, you will be prompted for a title.
* You will be able to select the type of note from a list, and this type determines which folder the new note is saved in.
  * Both the note types and their associated folders are configurable in the plugin settings.
  * Paths can be either relative to the top-level folder of the active note or absolute.
    * Any missing paths will be created.
    * To specify an absolute folder, make sure it begins with a forward slash (`/`)
    * All other paths are relative to the top-level folder of the active note.
  * Instead of a new note, you can specify that you want the note type added as a section in an existing note.
    * Say you have a note in `Creatures/Dragons` where you want all dragons to go. You can then define a note type `Chromatic Dragon` with the path `Creatures/Dragons#Chromatic Dragons`. Now if you select the text "Red Dragon" and select your "Chromatic Dragon" note type, "Red Dragon" will be added as a second level header (`## Red Dragon`) under the first level Chromatic Dragons header (`# Chromatic Dragons`).
    * Any note and header level (as well as folder) in the configured path that doesn't exist will be created.
    * There is also an option to automatically sort the sections under the header where the new "note" is added. If enabled, this sorting will happen immediately after the new header is added.
  * You can use tokens in the path to have it dynamically replaced when the new note is created.
    * Some tokens are defined by default, see below.
    * Additional tokens can be defined in the plugin settings.

The idea is that you have a vault where you take all your notes from gaming sessions, where each campaign is a folder on the top level. You can then set these notes to be created in subdirectories under this folder. I personally like to have my structure something like this:
```
Vault Root
├── Dark Sun 2E
│   ├── Compendium
│   │   ├── Events
│   │   │   └── (notes)
│   │   ├── Creatures
│   │   │   └── (notes)
│   │   ├── Groups
│   │   │   └── (notes)
│   │   ├── Items
│   │   │   └── (notes)
│   │   ├── Locations
│   │   │   └── (notes)
│   │   └── People
│   │       └── (notes)
│   │
│   └── Sessions
│       ├── 2025-10-01
│       ├── 2025-10-07
│       └── ...etc, one note for each session
│
├── Call of Chthuhlhuhhh (yes, I know...)
│   ├── Compendium
│   │   ├── Events
│   │   │   └── (notes)
│   │   ├── Creatures
│   │   │   └── (notes)
│   │   ├── Groups
│   │   │   └── (notes)
│   │   ├── Items
│   │   │   └── (notes)
│   │   ├── Locations
│   │   │   └── (notes)
│   │   └── People
│   │       └── (notes)
│   │
│   └── Sessions
│       ├── 2025-09-19
│       ├── 2025-10-03
│       └── ...etc, one note for each session
│
...etc
```
With this plugin, I've set all new notes of type "Person" to be created in `Compendium/People`, "Event" in `Compendium/Events` and so on. This way, when I'm writing the note for the current session, my new notes are always put in the right Compendium folder for the current campaign.

### Tokens
There are some tokens defined by default, which are replaced with various date information.

|     Token      | Replacement                                      |
|:--------------:|:-------------------------------------------------|
|    `{DATE}`    | The current date in ISO-8601 format (YYYY-MM-DD) |
|    `{YEAR}`    | The current year (YYYY)                          |
|   `{MONTH}`    | The current numeric month (no leading zero)      |
|    `{DAY}`     | The current day of the month (no leading zero)   |
|  `{DAYFULL}`   | Name of the current day, in english              |
|  `{DAYSHORT}`  | Short name of the current day, in english        |
| `{MONTHFULL}`  | Name of the current month, in english            |
| `{MONTHSHORT}` | Short name of the current month, in english      |
|    `{WEEK}`    | The current week number according to ISO-8601    |

In addition, you can define your own tokens in the plugin settings. You set the token word (without the `{` and `}`) and a JavaScript expression that returns a string, that will be evaluated to get the replacement.

In time, I'll probably add more features and options as I find the need. Feel free to suggest features or contribute code, and of course, report bugs and issues.

# Contributing
## Getting Started
Clone this repo and run `pnpm install` to install dependencies (or, you know, `npm install` or `yarn install` or whatever)
If you don't use pnpm, you may want to tweak the scripts in `package.json` slightly, and you can get rid of the `pnpm-lock.yaml` and `pnpm-workspace.yaml` files.

## Commands
* `pnpm run dev`: Start the dev server.
  * Files will be output to `devbuild/`
  * The file `src/devel/.hotreload` is one of the files that are copied over. This is for use with the [Hot Reload](https://github.com/pjeby/hot-reload) plugin, which automatically reloads the plugin when the dev server rebuilds the plugin as you make changes.
* `pnpm run build`: Build the plugin.
  * Files will be output to `dist/`
  * *NOTE*: This command will purge the `dist/` directory before building. If you want to avoid that, change `emptyOutDir: mode !== 'development',` to `emptyOuDir: false` in `vite.config.ts`.
* `pnpm run version`: Bump the version of the plugin
  * Set the correct version in `package.json` first, and this will update both `manifest.json` and `versions.json` if necessary.
* `pnpm run lint`: Check for linting and formatting errors with Biome
* `pnpm run lint:fix`: Fix linting and formatting errors with Biome

## Tips and tricks
#### Desktop/Mobile mode toggle
There is a `devtools.ts` file in the `src/` folder, which is only activated when running in dev mode. All this does is add a button to the left toolbar which lets you toggle Obsidian between desktop and mobile mode.
#### Developing on WSL
I run Obsidian on Windows, but I do all my development in either [Debian/GNU Linux](https://debian.org) or in WSL (specifically WSL2, also Debian). This might cause issues if the files are on a Windows drive, like performance hubbub with git and node, and also some IDE's (like [WebStorm](https://jetbrains.com/webstorm) which I use) has issues understanding the symlinks pnpm creates in `node_modules`. I therefore develop on a WSL drive, but for some unknown and mysterious reason, Obsidian can't open vaults in `\\wsl$\` folders, so I need to have my Obsidian vaults on Windows drives.

**My solution**: Set up the plugin development in WSL, and create a symlink from `dist/` to `<Vault Location>/.obsidian/plugins/my-new-plugin`. That way, when you build the plugin in WSL, it will be available in the Obsidian vault in Windows.

