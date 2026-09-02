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
