import { FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import RpgPlayerNotesPlugin from '../main';

export class SelectHeadingModal extends FuzzySuggestModal<string> {
	private readonly resolver: (value: string | null) => void;
	private readonly headings: string[];
	private previews: Map<string, string>;
	private _hasResolved = false;

	constructor(plugin: RpgPlayerNotesPlugin, headings: string[], previews: Map<string, string>, resolver: (value: string | null) => void) {
		super(plugin.app);
		this.headings = headings;
		this.previews = previews;
		this.resolver = resolver;
		this.setPlaceholder('Select a section (or press Esc to skip)...');
	}

	getItems(): string[] {
		return this.headings;
	}
	getItemText(item: string): string {
		return item;
	}

	renderSuggestion(item: FuzzyMatch<string>, el: HTMLElement) {
		const heading = item.item;
		const container = el.createDiv({ cls: 'heading-item' });
		container.createDiv({ text: heading, cls: 'heading-title' });

		const preview = this.previews.get(heading);
		if (preview) {
			container.createDiv({ text: preview, cls: 'heading-sub' });
		}
	}

	onChooseItem(item: string): void {
		if (!this._hasResolved) {
			this._hasResolved = true;
			this.resolver(item);
		}
	}

	onEscapeKey() {
		if (!this._hasResolved) {
			this._hasResolved = true;
			this.resolver(null);
			this.close();
		}
	}
}
