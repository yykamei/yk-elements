/**
 * Restores the stored theme before the first paint.
 *
 * `<yk-theme-switcher>` can only apply the theme once it is upgraded, which is
 * after the document is parsed; a page whose visitor previously chose Light or
 * Dark would paint the system theme first and then flip. This module applies
 * the theme as soon as it runs, so load it in the head as a render-blocking
 * module:
 *
 * ```html
 * <script type="module" src="path/to/yk-theme-init.js" blocking="render"></script>
 * ```
 *
 * Browsers that honor `blocking="render"` (current Chromium and Safari) paint
 * the stored theme directly. Firefox ignores the attribute and may show a
 * brief flash for an explicit choice; the default System preference never
 * flashes because tokens.css follows `prefers-color-scheme` on its own. Sites
 * that render `data-theme` on the server from a cookie do not need this module.
 */
import { applyTheme } from './theme.js';

applyTheme();
