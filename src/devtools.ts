import { Notice, Plugin } from 'obsidian';

/**
 * Initialize developer tools like ribbon buttons, debug commands, etc.
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
