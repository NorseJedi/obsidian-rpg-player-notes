import { nanoid } from '../lib/helpers';
import { RpnSettings } from '../types/rpg-player-notes';

export const DEFAULT_SETTINGS: RpnSettings = {
	openNoteAfterCreation: true,
	keepNoteSectionsSorted: true,
	sortingMode: 'caseInsensitive',
	customSortingRegex: '',
	splitDirection: 'none',
	userTokens: [],
	sortNoteTypeListByUsage: true,
	noteTypeUsage: {},
	sessionNoteDateFormat: 'YYYY-MM-DD',
	nextSessionLabel: 'Next Session →',
	prevSessionLabel: '← Previous Session',
	noteTypes: [
		{ id: nanoid(), name: 'Person', path: 'Compendium/People' },
		{ id: nanoid(), name: 'Location', path: 'Compendium/Locations' },
		{ id: nanoid(), name: 'Item', path: 'Compendium/Items' },
		{ id: nanoid(), name: 'Creature', path: 'Compendium/Creatures' },
		{ id: nanoid(), name: 'Event', path: 'Compendium/Events' },
		{ id: nanoid(), name: 'Group', path: 'Compendium/Groups' }
	]
};
