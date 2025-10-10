import { NoteType } from './note-type';
import { SplitDirection } from './split-direction';
import { UserDefinedToken } from './tokens';

export interface RpgPlayerNotesSettings {
	openNoteAfterCreation: boolean;
	splitDirection: SplitDirection;
	noteTypes: NoteType[];
	userTokens: UserDefinedToken[];
}

export const DEFAULT_SETTINGS: RpgPlayerNotesSettings = {
	openNoteAfterCreation: true,
	splitDirection: 'same',
	userTokens: [],
	noteTypes: [
		{ id: 'person', label: 'Person', path: 'Compendium/People' },
		{ id: 'location', label: 'Location', path: 'Compendium/Locations' },
		{ id: 'item', label: 'Item', path: 'Compendium/Items' },
		{ id: 'creature', label: 'Creature', path: 'Compendium/Creatures' },
		{ id: 'event', label: 'Event', path: 'Compendium/Events' },
		{ id: 'group', label: 'Group', path: 'Compendium/Groups' }
	]
};
