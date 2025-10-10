import { App, FuzzySuggestModal } from 'obsidian';
import { NoteType } from '../constants/note-type';

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
		return item.label;
	}

	onChooseItem(item: NoteType): void {
		this.onSelect(item);
	}
}
