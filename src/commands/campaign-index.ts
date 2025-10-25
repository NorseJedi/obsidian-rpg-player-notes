import { TFile, TFolder, Vault, normalizePath, Notice } from 'obsidian';
import { getStringAsMoment } from '../lib/helpers';
import RpgPlayerNotesPlugin from '../main';

export class CampaignIndex {
	private vault: Vault;

	constructor(plugin: RpgPlayerNotesPlugin) {
		this.vault = plugin.app.vault;
	}

	/** Entry point: generate indexes for the top-level campaign folder that contains `file`. */
	async create(file: TFile): Promise<void> {
		const top = this.getTopLevelFolder(file);
		if (!top) {
			new Notice(`No top-level folder found for ${file.path} - can't create index`);
			return;
		}

		await this.generateFolderIndexes(top);
		new Notice(`Campaign indexes generated for ${top.path}`);
	}

	/** Return the first folder under the vault root that contains `file`. */
	private getTopLevelFolder(file: TFile): TFolder | null {
		const parts = file.path.split('/');
		if (parts.length < 2) {
			return null;
		}
		const topName = parts[0];
		const abs = this.vault.getAbstractFileByPath(topName);
		return abs instanceof TFolder ? abs : null;
	}

	/**
	 * Walk the tree and create Index.md for each folder that contains notes.
	 */
	private async generateFolderIndexes(folder: TFolder): Promise<void> {
		for (const child of folder.children) {
			if (child instanceof TFolder) {
				await this.generateFolderIndexes(child);
			}
		}

		const content = this.buildIndexForFolder(folder);
		if (!content) {
			return;
		}

		const indexPath = normalizePath(`${folder.path}/Index.md`);
		await this.vault.adapter.write(indexPath, `# ${folder.name}\n\n${content}\n`);
	}

	/**
	 * Build index content for the folder: notes first, then immediate child folders, recursively.
	 */
	private buildIndexForFolder(folder: TFolder): string | null {
		const directNotes = folder.children
			.filter((f): f is TFile => f instanceof TFile && f.extension === 'md' && f.name !== 'Index.md')
			.map(f => f.basename)
			.sort(this.sortNames);

		const childFolders = folder.children
			.filter((f): f is TFolder => f instanceof TFolder)
			.filter(f => this.folderHasNotes(f))
			.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

		if (directNotes.length === 0 && childFolders.length === 0) {
			return null;
		}

		const lines: string[] = [];

		// Notes at this level
		for (const n of directNotes) {
			lines.push(`- [[${n}]]`);
		}

		// Child folders
		for (const child of childFolders) {
			lines.push(`- **${child.name}**`);
			const subtreeLines = this.buildChildSubtree(child, 1);
			if (subtreeLines.length > 0) {
				lines.push(...subtreeLines);
			}
		}

		return lines.join('\n');
	}

	/** Recursively build a child folder's subtree as indented bullets. */
	private buildChildSubtree(folder: TFolder, depth: number): string[] {
		const indent = '\t'.repeat(depth);
		const lines: string[] = [];

		const directNotes = folder.children
			.filter((f): f is TFile => f instanceof TFile && f.extension === 'md' && f.name !== 'Index.md')
			.map(f => f.basename)
			.sort(this.sortNames);

		for (const n of directNotes) {
			lines.push(`${indent}- [[${n}]]`);
		}

		const childFolders = folder.children
			.filter((f): f is TFolder => f instanceof TFolder)
			.filter(f => this.folderHasNotes(f))
			.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

		for (const child of childFolders) {
			lines.push(`${indent}- **${child.name}**`);
			const deeper = this.buildChildSubtree(child, depth + 1);
			if (deeper.length > 0) {
				lines.push(...deeper);
			}
		}

		return lines;
	}

	/** Returns true if the folder contains notes anywhere. */
	private folderHasNotes(folder: TFolder): boolean {
		for (const child of folder.children) {
			if (child instanceof TFile && child.extension === 'md' && child.name !== 'Index.md') {
				return true;
			}
			if (child instanceof TFolder && this.folderHasNotes(child)) {
				return true;
			}
		}
		return false;
	}

	/** Sorting function: sorts by date if both strings contain a moment parseable date, otherwise sort alphabetically. */
	private sortNames(a: string, b: string): number {
		const a_date = getStringAsMoment(a);
		const b_date = getStringAsMoment(b);
		if (a_date && b_date) {
			return a_date.valueOf() - b_date.valueOf();
		}
		return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
	}
}
