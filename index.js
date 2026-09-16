/**
 * Entry point that self-registers every yk-elements component on import.
 *
 * Import it once from a `<script type="module">` and all components become
 * available to the page. Components can also be imported individually from
 * their own modules for tree-shaken or selective usage.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * ```
 */
import './src/layout/yk-vstack.js';
import './src/layout/yk-hstack.js';
import './src/layout/yk-cluster.js';
import './src/layout/yk-grid.js';
import './src/layout/yk-pad.js';
import './src/components/yk-button.js';
import './src/components/yk-link.js';
import './src/components/yk-badge.js';
import './src/components/yk-soft-nav.js';
import './src/components/yk-input-email.js';
import './src/components/yk-input-text.js';
import './src/components/yk-input-tel.js';
import './src/components/yk-input-url.js';
import './src/components/yk-input-password.js';
import './src/components/yk-input-search.js';
import './src/components/yk-input-file.js';
