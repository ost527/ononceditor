# ononceditor

A Tistory-style rich-text editor for **React**, built on a self-hosted
[KEDITOR](https://t1.daumcdn.net/keditor/opensource/KEDITOR-0.7.21.zip)
(TinyMCE 4.x fork) runtime. It is a **props-driven, controlled-ish component**:
you give it initial HTML and receive HTML on change — persistence, forms and
page layout are entirely up to you.

- Toolbar: 문단모양 · 글꼴 · B/I/U/S · 글자색/배경색 · 정렬 · 이미지(grid) · 인용 · 표 · 링크 · 리스트 · 구분선 · 더보기(특수문자/코드블럭/HTML블럭) · 기본모드(HTML source)
- Inline image upload to **your** endpoint, drag-to-grid layouts, code blocks, 215-char special-character picker.
- Outputs plain HTML — sanitize it on your side before publishing (e.g. DOMPurify).

> Status: `0.1.0`, extracted from the `ononc` project. The bundled editor
> runtime is LGPL-2.1 (see [License](#license)).

## Install

```bash
npm install ononceditor
```

Peer deps: `react >=18`, `react-dom >=18`.

## 1) Serve the runtime assets

This package bundles the trimmed KEDITOR runtime under `ononceditor/editor-runtime`.
Copy it into a directory your app serves statically, so it is reachable at
`baseUrl` (default `/editor-runtime`). For a Next.js app:

```bash
cp -R node_modules/ononceditor/editor-runtime public/editor-runtime
```

(Automate it in a `postinstall`/`prebuild` script so it survives clean installs.)
If you serve it elsewhere, pass `baseUrl` to the component.

## 2) Import the styles once

```ts
import "ononceditor/styles.css";
```

The editor chrome uses a few CSS custom properties (e.g. `--color-foreground`,
`--color-border`, `--radius-md`, `--font-sans`). Define them in your theme or
override `styles.css` to match your design system.

## 3) Use it

```tsx
"use client";
import { useState } from "react";
import { RichTextEditor } from "ononceditor";
import "ononceditor/styles.css";

export function MyEditor() {
  const [html, setHtml] = useState("<p>Hello</p>");
  return (
    <RichTextEditor
      defaultValue={html}
      onChange={setHtml}
      uploadUrl="/api/upload"
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `defaultValue` | `string` | `""` | Initial HTML. The editor owns its content after mount (uncontrolled). |
| `onChange` | `(html: string) => void` | – | Fires with the latest HTML on every change. |
| `uploadUrl` | `string` | `/api/upload` | Endpoint that receives image uploads. |
| `baseUrl` | `string` | `/editor-runtime` | Where the runtime assets are served. |
| `initialHeight` | `number` | `620` | Initial editor body height (px). |

### Upload endpoint contract

`uploadUrl` receives a `multipart/form-data` POST with the image file and must
respond with JSON `{ "url": "https://…", "filename": "…", "location": "…" }`.

## License

The **ononceditor wrapper code** is [MIT](./LICENSE).

The bundled editor runtime under `editor-runtime/` is **KEDITOR** (a TinyMCE 4.x fork),
**GNU LGPL v2.1** — license text ships at `editor-runtime/LICENSE`; corresponding
source: the official KEDITOR release and <https://github.com/tinymce/tinymce>.
The code-block feature bundles **CodeMirror** (MIT) and **highlight.js**
(BSD-3-Clause). Fonts referenced by the editor (Pretendard, Noto, Nanum) are
under the SIL Open Font License 1.1.

This project is **not affiliated with or endorsed by Kakao/Tistory**.
