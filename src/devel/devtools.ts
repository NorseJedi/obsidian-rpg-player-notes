import { Notice, Plugin } from 'obsidian';

/**
 * Initialize developer tools. Well... Tool. Singular. So far.
 */
export function registerDevTools(plugin: Plugin) {
	plugin.addRibbonIcon('smartphone', 'Toggle mobile mode', () => {
		// @ts-ignore - not part of public API
		const isMobile = plugin.app.isMobile;
		// @ts-ignore
		plugin.app.emulateMobile(!isMobile);

		new Notice(`Mobile emulation ${!isMobile ? 'enabled' : 'disabled'}`);
	});
}
