import { nanoid } from '../helpers';
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
		{ id: nanoid(), label: 'Person', path: 'Compendium/People' },
		{ id: nanoid(), label: 'Location', path: 'Compendium/Locations' },
		{ id: nanoid(), label: 'Item', path: 'Compendium/Items' },
		{ id: nanoid(), label: 'Creature', path: 'Compendium/Creatures' },
		{ id: nanoid(), label: 'Event', path: 'Compendium/Events' },
		{ id: nanoid(), label: 'Group', path: 'Compendium/Groups' }
	]
};
