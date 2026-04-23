#!/usr/bin/env node

// Entry point for the Google Workspace MCP Server
// Polyfill must load first to patch SlowBuffer for Node.js 23+
// (required by buffer-equal-constant-time, a transitive dep of google-auth-library)

import './dist/polyfill.js';
import './dist/server.js';
