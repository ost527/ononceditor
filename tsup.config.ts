import { defineConfig } from "tsup";

// Build config for publishing ononceditor to npm.
// Requires dev tooling: `npm i -D tsup typescript` (kept out of the workspace
// install footprint). In-repo, the app consumes ./src directly via
// Next transpilePackages, so this build is only needed for `npm publish`.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: true,
  external: ["react", "react-dom"],
  // Preserve the React Server Components "use client" boundary on the bundle.
  banner: { js: '"use client";' },
});
