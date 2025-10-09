import { App, FuzzySuggestModal, Modal } from 'obsidian';
import { NoteType } from '@/settings';

export interface TextPromptModalOptions {
	title?: string;
	description?: string;
	placeholder?: string;
	defaultValue?: string;
}

export class TextPromptModal extends Modal {
	private resolve!: (value: string | null) => void;
	private inputEl!: HTMLInputElement;
	private options: TextPromptModalOptions;

	constructor(app: App, options: TextPromptModalOptions) {
		super(app);
		this.options = options;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		if (this.options.title) {
			contentEl.createEl('h3', { text: this.options.title });
		}

		if (this.options.description) {
			contentEl.createEl('p', { text: this.options.description, cls: 'setting-item-description' });
		}

		this.inputEl = contentEl.createEl('input', {
			type: 'text',
			placeholder: this.options.placeholder ?? '',
			cls: 'prompt-input'
		});

		if (this.options.defaultValue) {
			this.inputEl.value = this.options.defaultValue;
		}

		this.inputEl.focus();

		this.inputEl.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				this.close();
				this.resolve(this.inputEl.value.trim() || null);
			} else if (e.key === 'Escape') {
				e.preventDefault();
				this.close();
				this.resolve(null);
			}
		});

		const buttons = contentEl.createDiv({ cls: 'modal-buttons' });
		const ok = buttons.createEl('button', { text: 'OK' });
		const cancel = buttons.createEl('button', { text: 'Cancel' });

		ok.addEventListener('click', () => {
			this.close();
			this.resolve(this.inputEl.value.trim() || null);
		});

		cancel.addEventListener('click', () => {
			this.close();
			this.resolve(null);
		});
	}
	onClose() {
		this.contentEl.empty();
	}

	static prompt(app: App, options: string | TextPromptModalOptions): Promise<string | null> {
		const modal = typeof options === 'string' ? new TextPromptModal(app, { placeholder: options }) : new TextPromptModal(app, options);

		return new Promise((resolve) => {
			modal.resolve = resolve;
			modal.open();
		});
	}
}

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
