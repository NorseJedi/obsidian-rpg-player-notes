import { Modal, Setting } from 'obsidian';
import RpgPlayerNotesPlugin from '../main';

export class NoteTypeUsageStatsModal extends Modal {
	private sortKey: 'name' | 'count' = 'count';
	private sortDir: 'asc' | 'desc' = 'desc';
	private tableContainer: HTMLElement | undefined;

	constructor(private plugin: RpgPlayerNotesPlugin) {
		super(plugin.app);
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.empty();
		contentEl.addClass('rpg-note-usage-stats');
		new Setting(contentEl).setName('Note type usage statistics').setHeading();

		if (!this.plugin.settings.sortNoteTypeListByUsage) {
			contentEl.createEl('p', {
				text: 'Note: Usage tracking is currently disabled in the plugin settings.'
			});
		}

		this.tableContainer = contentEl.createDiv({ cls: 'rpg-note-usage-table-container' });
		//noinspection JSIgnoredPromiseFromCall
		this.renderTable();

		new Setting(contentEl).addButton((button) => {
			button
				.setButtonText('Reset statistics')
				.setWarning()
				.onClick(async () => {
					this.plugin.settings.noteTypeUsage = {};
					await this.plugin.saveSettings();
					await this.plugin.loadSettings();
					await this.renderTable(); // refresh table contents
				});
		});
	}

	private async renderTable(initial = false) {
		if (this.tableContainer === undefined) {
			return;
		}

		if (!initial) {
			// Fade out current content
			this.tableContainer.addClass('fade-out');
			await new Promise((r) => setTimeout(r, 120)); // matches CSS transition
			this.tableContainer.removeClass('fade-out');
		}

		this.tableContainer.empty();

		const table = this.tableContainer.createEl('table', { cls: 'rpg-note-usage-table fade-in' });

		const thead = table.createEl('thead');
		const headerRow = thead.createEl('tr');

		const addHeader = (key: 'name' | 'count', text: string) => {
			const th = headerRow.createEl('th', { text });
			th.addClass('sortable');
			th.onclick = () => {
				if (this.sortKey === key) {
					this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
				} else {
					this.sortKey = key;
					this.sortDir = 'asc';
				}
				this.renderTable();
			};
			if (this.sortKey === key) {
				th.addClass(`sorted-${this.sortDir}`);
			}
		};

		addHeader('name', 'Note Type');
		addHeader('count', 'Selections');

		const tbody = table.createEl('tbody');

		const noteTypes = this.plugin.settings.noteTypes;
		const usage = this.plugin.settings.noteTypeUsage ?? {};

		let rows = noteTypes.map((type) => ({
			label: type.name,
			count: usage[type.id] ?? 0
		}));

		rows.sort((a, b) => {
			let cmp: number;
			if (this.sortKey === 'name') {
				cmp = a.label.localeCompare(b.label);
			} else {
				cmp = a.count - b.count;
			}

			return this.sortDir === 'asc' ? cmp : -cmp;
		});

		for (const { label, count } of rows) {
			const row = tbody.createEl('tr');
			row.createEl('td', { text: label });
			row.createEl('td', { text: String(count), attr: { style: 'text-align:right;' } });
		}
	}

	onClose() {
		this.contentEl.empty();
	}
}
