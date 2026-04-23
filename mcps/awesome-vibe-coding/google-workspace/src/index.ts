// Entry point that applies the SlowBuffer polyfill before loading the server.
// ESM evaluates static imports in dependency order, so polyfill.js runs
// before server.js (and its transitive deps like buffer-equal-constant-time).
import './polyfill.js';
import './server.js';
