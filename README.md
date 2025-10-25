# RPG Player Notes Plugin for Obsidian.md

This is an [Obsidian.md](https://obsidian.md/) plugin made primarily for taking notes during RPG sessions, but I'm sure it can be used for other purposes as well.
There may be way more advanced plugins around that can replicate this functionality. However, I decided to write my own, both because I couldn't find another one to do what I want and because I wanted to figure out how to write Obsidian plugins. As I've found it very helpful for my own use, I decided to share in case someone else might find it useful as well.

# Features

This plugin adds the following commands to the Obsidian command palette:
* `RPG Player Notes: Create New Note`
* `RPG Player Notes: Link Selected Text`
* `RPG Player Notes: Sort Section`
* `RPG Player Notes: Update Session Note Navigation (current file)`
* `RPG Player Notes: Update Session Notes Navigation (current folder)`

Each is described below.

## Command: Create New Note
This command will create a new note with the text you've selected as the title (if no text is selected, you will be prompted for a title instead).

The new note will be created in a path that you can configure in the settings. There you can define note types, and for each note type, you can define the path where the new note will be created.
The path can be either relative to the top-level folder of the active note, or it can be absolute (relative to the vault root).
To make a folder absolute, make sure it begins with a forward slash (`/`).
You can use tokens in the path to have them dynamically replaced when the new note is created. Some tokens are defined by default (see below), but you can also define your own.

### Note Type Paths
A path can point to either a folder, a note or a section within a note. This determines where and how the new note is created.
* If the path points to a folder, the new note will be created in that folder.
* If the path points to a note, the new note will be created as an H1 section in that note.
* If the path points to a section within a note, the new note will be created as a subsection in that section (i.e. if the target is an H2 section, the new note will be created as an H3 section).

Any folder, note, or header that doesn't exist in the path when a new note is created will be created automatically.

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

### Section Sorting
By default, the plugin will keep the sections that you add new notes in to be kept sorted. This will reorder all the sections on the same level every time you add a new section using this command.

This can be disabled in the plugin settings.

Note: Sorting can also be performed manually using the `Sort Section` command. See below.

### Note Type Sorting
When you run the command, the first thing you get is a modal that lets you choose the type of note you want to create. (Well, OK, it's the second thing you get if you didn't have any text selected.) This list is sorted alphabetically at first, but as you create more notes, the types you select the most will go to the top of the list. It's a basic mechanism that simply adds 1 to the counter for each note type as you select them and then uses this counter to sort the list. I know the concept of "tracking" can conjure up some mistrust in this digital age, and perhaps rightfully so, but it's all stored in your vault, and you can reset all the counters in the plugin settings.

This can be disabled in the plugin settings, and disabling this sorting will also disable the usage tracking. In the settings you can also see the number each type has been selected. You can also reset the counters there if you wish.

#### Examples
* `Compendium/People` will create a new note in the `Compendium` folder located in the top level folder of the current note.
* `Compendium/People/NPCs#` will create an H1 header in the `Compendium/People/NPCs` note.
* `Compendium/People/NPCs#Nobles#` will create an H2 header in the `Compendium/People/NPCs` note under the `Nobles` H1 header.

### But... why?
I like making notes when I play, primarily to make it easier to remember what happened in previous sessions and to help with the infamous recap that most sessions begin with. As campaigns go on, there are a lot of things that appear and reappear in these notes, be it people, events, places, etc. and making separate notes for these and linking to them makes it so much easier to keep track. Personally, I like to have a dedicated vault for these kinds of notes rather than separate vaults for each campaign. My vault structure looks something like this:
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
├── Call of Ctulhltuhtlhu (whatever)
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
With this plugin, I've set notes of type "Person" to be created in `Compendium/People`, "Event" in `Compendium/Events` and so on. This way, when I'm writing on a note in the `Dark Sun 2E/Sessions` folder, my new notes with people are put into `Dark Sun 2E/Compendium/People/`, while if I'm taking notes for the Call of Chtuhlhuhlol campaign, they'll go into `Call of Chlhutlhuth/Compendium/People/`.

## Command: Link Selected Text
This command lets you create links to other notes and sections. It will only be available when you have some text selected (Obsidian already has a good way to add new links).
Select the word(s) you want to turn into a link and run the command. You will then get to choose which note to link to, and if that note has sections, you can choose one of them (or hit escape to link to the note ignoring the sections). This will create the link, and the word(s) you had selected will remain as the displayed link text.

### But... why?
I find it useful to be able to quickly create links to other notes and sections, and Obsidian has no way to do this. The alternative is to remove the word you want as a link and then re-add it as a link. If you're editing an already written document to add links, this is a very impractical way of doing it.

## Command: Sort Section
This command lets you sort the current sections of the current note. The section being sorted is the section level that the cursor is at. This means it will find the closest header above the cursor, and sort all headers on that level, but not headers above or below that level.
The sorting will be done using the sorting method selected in the plugin settings.

## Command: Update Session Note Navigation (current file) / Update Session Notes Navigation (current folder)
This command will create or update navigation links at the bottom of your session notes. One will do this for all notes in the same folder as the current file, the other just the current file.

The way this works is that it will look for the previous and next note in the folder based on the note title. The notes have to begin with a date (or time) in a format that you can configure in the plugin settings, defaulting to ISO-8601 (YYYY-MM-DD). The command will then add links to the previous and next note at the bottom of the note(s). If no previous or next note exists, it will show this instead of a link as "*(No previous note)*" or "*(No next note)*".

If there are already such links in the note, they will be updated in case new notes have been added. It will only find the existing links if there is nothing after them in the note except whitespace. If you add more text below existing links, the command will add new links at the bottom of the note instead.

You can set the link text in the plugin settings. The default is "← Previous Session" and "Next Session →". If you set them to blank, the target note title will be used.

# Plugin Settings
The plugin settings can be found in the Obsidian settings under Community Plugins, RPG Player Notes. They should be fairly self-explanatory, but here is a breakdown:

| Setting                        | Description                                                                                                                                                                                                                                                                                                                            |
|--------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Open new note after creation` | If off, the new note will be created in stealth mode. That is, it won't open for you to edit it. I personally can't think why anyone would want this, but I always choose more options over less even I myself don't see the need.                                                                                                     |
| `Split direction`              | Only available if `Open new note after creation` is on. This selects where the new note should open - split tab below current tab, split tab to the right of current tab, or as a new tab alongside the current tab.                                                                                                                   |
| `Keep sections sorted`         | This turns on or off the automatic sorting of sections that is done for notes added as sections to existing notes.                                                                                                                                                                                                                     |
| `Sorting mode`                 | Only available if `Keep sections sorted` is on. Chooses how the sections are sorted.                                                                                                                                                                                                                                                   |
| `Custom sorting regex`         | Only available if `Sorting mode` is set to `Sort by custom RegExp`. Here you can write your own regular expression that will be used as the sorting method of the sections.                                                                                                                                                            |
| `Sort note types by usage`     | This will sort the list of note types in the modal by the number of times each note type has been selected, so that the ones you use more often are higher on the list. If off they will be sorted alphabetically. There is also a button here you can click to see the current usage tracking, and reset the counters if you want to. |
| `Note types`                   | Here you can define your own note types with name and path. The modal for setting up each type should contain all the relevant help concerning paths and tokens.                                                                                                                                                                       |
| `Custom tokens`                | Here you can add or delete your own tokens.                                                                                                                                                                                                                                                                                            |
| `Session note date format`     | A moment.js date format to use for recognising session notes when generating navigation links                                                                                                                                                                                                                                          |
| `Previous session link label`  | The text to display on links to the previous session. Leave blank to use target note title.                                                                                                                                                                                                                                            |
| `Next session link label`      | The text to display on links to the next session. Leave blank to use target note title.                                                                                                                                                                                                                                                |

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
* `pnpm run lint`: Check for linting and formatting errors with Biome
* `pnpm run lint:fix`: Fix linting and formatting errors with Biome

## Tips and tricks
#### Desktop/Mobile mode toggle
There is a `devtools.ts` file in the `src/devel/` folder, which is only activated when running in dev mode. All this does is add a button to the left toolbar which lets you toggle Obsidian between desktop and mobile mode, because I'm too lazy to run `plugin.app.emulateMobile(true)` (or `false`) in the console every time I want to switch.
#### Developing on WSL
I run Obsidian on Windows, but I do all my development in either [Debian/GNU Linux](https://debian.org) or in WSL (specifically WSL2, also Debian). This might cause issues if the files are on a Windows drive, like performance hubbub with git and node, and also some IDE's (like [WebStorm](https://jetbrains.com/webstorm) which I use) has issues understanding the symlinks pnpm creates in `node_modules`. I therefore develop on a WSL drive, but for some unknown and mysterious reason, Obsidian can't open vaults in `\\wsl$\` folders, so I need to have my Obsidian vaults on Windows drives.

**My solution**: Set up the plugin development in WSL, and create a symlink from `dist/` to `<Vault Location>/.obsidian/plugins/my-new-plugin`. That way, when you build the plugin in WSL, it will be available in the Obsidian vault in Windows.

