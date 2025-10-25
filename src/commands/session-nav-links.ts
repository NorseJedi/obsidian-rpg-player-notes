import { moment, Notice, normalizePath, TFile } from 'obsidian';
import { getStringAsMoment } from '../lib/helpers';
import RpgPlayerNotesPlugin from '../main';
import { AdjacentNotes } from '../types/rpg-player-notes';

export class SessionNavLinks {
	private readonly dateFormat: string;

	constructor(
		private plugin: RpgPlayerNotesPlugin
	) {
		this.dateFormat = plugin.settings.sessionNoteDateFormat;
		if (this.dateFormat == '') {
			this.dateFormat = 'YYYY-MM-DD';
		}
	}

	public async createAll(folderPath?: string) {
		if (!folderPath) {
			folderPath = this.plugin.app.workspace.getActiveFile()?.parent?.path;
		}
		if (!folderPath) {
			new Notice('No active file or folder, operation aborted.');
			return;
		}

		folderPath = normalizePath(folderPath);
		const adjacentMap = this.getAdjacentDateNotes(folderPath);
		if (!adjacentMap) {
			new Notice('No adjacent notes found.');
			return;
		}
		const files = this.plugin.app.vault.getFiles().filter((f) => f.parent?.path == folderPath && f.extension === 'md');

		let i = 0;
		for (const file of files) {
			if (adjacentMap.get(file) !== undefined) {
				await this.create(file);
				i++;
			}
		}
		if (i > 0) {
			new Notice(`Note links updated for ${i} notes in ${folderPath}`);
		} else {
			new Notice(`No links updated in ${folderPath}`);
		}
	}

	public async create(file?: TFile | null, adjacentNotes?: AdjacentNotes) {
		if (!file) {
			file = this.plugin.app.workspace.getActiveFile();
		}
		if (file) {
			if (!adjacentNotes) {
				adjacentNotes = this.getAdjacentDateNotes(file).get(file)!;
			}

			if (adjacentNotes == undefined) {
				new Notice('No adjacent notes found.');
				return;
			}
			await this.updateLinks(file, adjacentNotes);
		}
	}

	private getAdjacentDateNotes(target: TFile|string): Map<TFile, AdjacentNotes> {
		let folderPath: string;
		if (target instanceof TFile) {
			folderPath = target.parent?.path ?? '';
		} else {
			folderPath = target;
		}

		const files = this.plugin.app.vault.getFiles().filter((f) => f.parent?.path == folderPath && f.extension === 'md');

		const datedFiles: { file: TFile; date: moment.Moment }[] = [];

		for (const file of files) {
			const parsed = getStringAsMoment(file.basename, this.dateFormat);
			if (parsed) {
				datedFiles.push({ file, date: parsed });
			}
		}

		datedFiles.sort((a, b) => a.date.valueOf() - b.date.valueOf());

		const result = new Map<TFile, AdjacentNotes>();

		for (let i = 0; i < datedFiles.length; i++) {
			const current = datedFiles[i];
			const prev = datedFiles[i - 1]?.file;
			const next = datedFiles[i + 1]?.file;
			result.set(current.file, { prev, next });
		}

		return result;
	}

	private async updateLinks(file: TFile, navlinks: AdjacentNotes) {
		await this.plugin.app.vault.process(file, (data) => {

			let prevLink = '*(No previous note)*';
			let nextLink = '*(No next note)*';

			if (navlinks.next) {
				const label = this.plugin.settings.nextSessionLabel.trim() != '' ? this.plugin.settings.nextSessionLabel : navlinks.next.basename;
				nextLink = `[[${navlinks.next.basename}|${label}]]`;
			}

			if (navlinks.prev) {
				const label = this.plugin.settings.prevSessionLabel.trim() != '' ? this.plugin.settings.prevSessionLabel : navlinks.prev.basename;
				prevLink = `[[${navlinks.prev.basename}|${label}]]`;
			}

			const navBlockRegex = /\n*---\n(?:\*\(No previous note\)\*|\[\[.*?]])(?: *\| *(?:\*\(No next note\)\*|\[\[.*?]]))?\n*\s*$/s;

			const newBlock = `\n\n---\n${prevLink} | ${nextLink}\n`;

			if (navBlockRegex.test(data)) {
				data = data.replace(navBlockRegex, newBlock);
			} else {
				data = data.trimEnd() + newBlock;
			}

			return data;
		});
	}
}
