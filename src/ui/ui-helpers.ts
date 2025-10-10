import { getAllTokens } from '../helpers';
import RpgPlayerNotesPlugin from '../main';

export function buildPathDescriptionFragment(plugin: RpgPlayerNotesPlugin): DocumentFragment {
	const tokens = getAllTokens(plugin.settings);

	// biome-ignore lint/correctness/noUndeclaredVariables: Just biome being difficult...
	return createFragment((frag) => {
		frag.createEl('p', { text: 'Folder where new notes of this type will be saved.' });
		frag.createEl('p', {
			text: 'If the path starts with a forward slash (/), it will be interpreted as an absolute path starting from the vault root. If not, it will be relative to the top folder of the currently active note.'
		});
		frag.createEl('p', { text: 'Some tokens are available for auto substitution:' });

		const table = frag.createEl('table', {
			cls: 'rpg-note-token-table'
		});
		const thead = table.createEl('thead');
		const headerRow = thead.createEl('tr');
		headerRow.createEl('th', { text: 'Token' });
		headerRow.createEl('th', { text: 'Replaced by' });

		const tbody = table.createEl('tbody');

		for (const [i, token] of tokens.entries()) {
			const row = tbody.createEl('tr', {
				cls: i % 2 === 0 ? 'rpg-row-even' : 'rpg-row-odd'
			});
			row.createEl('td', { text: token.token });
			row.createEl('td', { text: token.description });
		}
	});
}
