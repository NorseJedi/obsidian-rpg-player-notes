import { App, FuzzySuggestModal } from 'obsidian';
import { NoteType } from '../types/rpg-player-notes';

export class NoteTypeSelectModal extends FuzzySuggestModal<NoteType> {
	constructor(
		app: App,
		private noteTypes: NoteType[],
		private onSelect: (type: NoteType) => void
	) {
		super(app);
	}

	getItems(): NoteType[] {
		return this.noteTypes;
	}

	getItemText(item: NoteType): string {
		return item.name;
	}

	onChooseItem(item: NoteType): void {
		this.onSelect(item);
	}
}
