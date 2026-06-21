# Modifications to the bundled KEDITOR / TinyMCE runtime

The editor runtime under `editor-runtime/` is a **modified redistribution** of
**KEDITOR 0.7.21** (a fork of **TinyMCE 4.x**), which is licensed under the
**GNU LGPL v2.1**. This document records how it differs from upstream, to
accompany the LGPL notice in `editor-runtime/LICENSE` and the modification
statement in the root `LICENSE`.

- **Upstream baseline:** KEDITOR 0.7.21 —
  <https://t1.daumcdn.net/keditor/opensource/KEDITOR-0.7.21.zip>
- **Underlying engine:** TinyMCE 4.x — <https://github.com/tinymce/tinymce>
- **Complete change history:** every code change listed in section 2 is a
  discrete commit in this repository's public Git history. Run
  `git log -p -- <file>` to see the exact diff for any file.

The unmodified "preferred form for making modifications" of the underlying
library is the official upstream release linked above; the changes applied on
top of it are described below and are recoverable from the Git history.

---

## 1. Removed / trimmed from the upstream distribution

These are deletions only (no code change). The bundle keeps only the plugins
actually loaded by the wrapper (those present under `editor-runtime/plugins/`)
plus the classic theme/skin; the rest of the upstream KEDITOR distribution was
dropped:

- **Unused / service-tied plugins** from the upstream KEDITOR set — e.g. polls,
  data, grammar-check, maps & location, stock-photo / external-photo pickers,
  open-graph, video, file-upload, emoticons, content-search, shortcuts.
- **Non-classic themes & skins** (mobileClassic, balloon) and the mobile
  stylesheets.
- **Kakao/Daum proprietary artwork** — emoticon sprites
  (`sprites-emoticon*.png`), Daum Cafe styles, and Tistory toolbar/branding
  sprites (`toolbar-icon.svg`, `content-icon.svg`, `keditor.png`, …).

## 2. Modified library files (code changes)

The following bundled plugin files were edited relative to upstream. They ship
in minified form; the corresponding diffs are the referenced commits.

| File | Change | Commit(s) |
| --- | --- | --- |
| `plugins/kImage/plugin.min.js` | Removed hardcoded Daum/Kakao service endpoints (image upload / open-graph relays) so the plugin uses only the host app's configured `uploadUrl`. Renamed internal `keditor`→`editor-runtime` path/id strings. | `b8e417c`, `ebfe549` |
| `plugins/imageSlide/plugin.min.js` | Same Daum/Kakao endpoint removal + path/id rename. | `b8e417c`, `ebfe549` |
| `plugins/kPaste/plugin.min.js` | Removed Daum/Kakao paste-image relay endpoints + path/id rename. | `b8e417c`, `ebfe549` |
| `plugins/klink/plugin.min.js` | Link panel "새창으로 열기" (open in new window) behavior patched: default unchecked for new links, and the checkbox stays enabled when the URL is empty. Path/id rename. | `ccbb53b`, `ec73f5a`, `ebfe549` |

## 3. Stylesheet / icon changes (already in source form)

These are hand-maintained, **un-minified** CSS under `editor-runtime/style/`
(already the preferred form for modification):

- `editor.css`, `editor-plugins.css` — toolbar, menu and image-context icons
  re-skinned: the Tistory icon sprite was replaced with inline (Lucide-style)
  SVG CSS masks, and dead references to removed sprites were neutralized.
- `editor-content.css` — adjusted; dead brand rules removed.
- `style/tistory/content.css` was renamed to `style/content-overrides.css`.
