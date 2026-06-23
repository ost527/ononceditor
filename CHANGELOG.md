# Changelog

All notable changes to **ononceditor** are documented here. This project adheres
to [Semantic Versioning](https://semver.org/).

## 0.2.0

### Added
- **Auto-embed in the editor.** A paragraph whose only content is a **YouTube
  URL** (typed, pasted, or loaded) is replaced live by a responsive, non-editable
  player. It serializes to `<figure class="oe-embed"><iframe …/embed/ID></figure>`.
- **Link preview cards (opt-in).** New `linkPreviewUrl` prop: when set, a bare
  **non-YouTube URL** on its own line fetches OpenGraph metadata from that
  endpoint and shows a live link-preview card in the editor. On save it
  serializes **back to a bare `<p>URL</p>`**, so your published page can render
  it with a single renderer. A failed lookup is not retried.
- `.oe-embed` (responsive 16:9) and `.oe-card` styles in the editor content CSS.

### Changed
- Editor body `letter-spacing` is now `normal` (was `-0.011em`); content
  typography tuned (line-height 1.7, 8px heading-margin grid) to match a typical
  published article.

### Notes
- YouTube auto-embed is always on. Link cards require `linkPreviewUrl`; omit it
  to disable them. The endpoint must return JSON
  `{ title, description, image, siteName }`.

## 0.1.0

- Initial release, extracted from the `ononc` project: props-driven React
  wrapper over a trimmed, self-hosted KEDITOR (TinyMCE 4.x) runtime; inline image
  upload to your endpoint; HTML-source toggle; drag-to-resize; 215-char
  special-character picker; code blocks.
