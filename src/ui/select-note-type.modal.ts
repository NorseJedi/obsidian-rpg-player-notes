import { FuzzySuggestModal } from 'obsidian';
import RpgPlayerNotesPlugin from '../main';
import { NoteType } from '../types/rpg-player-notes';

export class SelectNoteTypeModal extends FuzzySuggestModal<NoteType> {
	constructor(
		private plugin: RpgPlayerNotesPlugin,
		private noteTypes: NoteType[],
		private onSelect: (type: NoteType) => void
	) {
		super(plugin.app);
	}

	getItems(): NoteType[] {
		const usage = this.plugin.settings.noteTypeUsage;

		return this.noteTypes.sort((a, b) => {
			if (!this.plugin.settings.sortNoteTypeListByUsage) {
				return a.name.localeCompare(b.name);
			} else {
				const aCount = usage[a.id] ?? 0;
				const bCount = usage[b.id] ?? 0;
				if (aCount === bCount) {
					return a.name.localeCompare(b.name);
				}
				return bCount - aCount;
			}
		});
	}

	getItemText(item: NoteType): string {
		return item.name;
	}

	onChooseItem(item: NoteType): void {
		if (this.plugin.settings.sortNoteTypeListByUsage) {
			const usage = this.plugin.settings.noteTypeUsage;
			usage[item.id] = (usage[item.id] ?? 0) + 1;
		}
		this.onSelect(item);
	}
}
