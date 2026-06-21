"use client";

import { CHARMAP_ITEMS } from "./charmap-data";

/**
 * Loads the self-hosted KEDITOR (TinyMCE 4.9.6 fork) distribution from a
 * consumer-served base path (default "/editor-runtime"). The core is loaded once;
 * TinyMCE then auto-loads the theme, language and plugins from `base_url`
 * (set in tinymce.init) because the dist uses unhashed filenames
 * (themes/classic/theme.min.js, plugins/<name>/plugin.min.js, langs/ko_KR.min.js).
 *
 * The two KEDITOR helper stylesheets (custom toolbar icons) are injected here;
 * the classic skin CSS is auto-loaded by TinyMCE via `skin: "classic"`.
 */

const DEFAULT_BASE = "/editor-runtime";

let corePromise: Promise<void> | null = null;

export function loadKeditor(baseUrl: string = DEFAULT_BASE): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  ensureKeditorCss(baseUrl);
  if ((window as unknown as { tinymce?: unknown }).tinymce) return Promise.resolve();
  if (corePromise) return corePromise;
  corePromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `${baseUrl}/tinymce.min.js`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("KEDITOR core load failed"));
    document.head.appendChild(s);
  });
  return corePromise;
}

/** Inject KEDITOR's editor + plugin stylesheets (custom button icons) once. */
export function ensureKeditorCss(baseUrl: string = DEFAULT_BASE) {
  if (typeof document === "undefined") return;
  const files: [string, string][] = [
    ["keditor-editor-css", `${baseUrl}/style/editor.css`],
    ["keditor-plugins-css", `${baseUrl}/style/editor-plugins.css`],
  ];
  for (const [id, href] of files) {
    if (document.getElementById(id)) continue;
    const l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  }
}

/** Content stylesheets loaded INSIDE the editor iframe (mirror these in your
 *  published-article styles so the editor matches the published page). */
export function getContentCss(baseUrl: string = DEFAULT_BASE): string[] {
  return [
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css",
    `${baseUrl}/style/editor-content.css`,
    `${baseUrl}/style/content-overrides.css`,
  ];
}

/* ---- KEDITOR init settings (version-independent; verified against KEDITOR) ---- */
/* Font dropdown kept (selector UI), but limited to one font (Pretendard) so
   authors can't pick off-brand fonts that would override the published page. */
export const FONT_FORMATS =
  "프리텐다드='Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,system-ui,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;";

export const STYLE_FORMATS = [
  { title: "제목1", icon: "none", block: "h2", attributes: { "data-ke-style": "", "data-ke-size": "size26" }, styles: { fontSize: "" } },
  { title: "제목2", icon: "none", block: "h3", attributes: { "data-ke-style": "", "data-ke-size": "size23" }, styles: { fontSize: "" } },
  { title: "제목3", icon: "none", block: "h4", attributes: { "data-ke-style": "", "data-ke-size": "size20" }, styles: { fontSize: "" } },
  { title: "본문1", icon: "none", block: "p", attributes: { "data-ke-style": "", "data-ke-size": "size18" }, styles: { fontSize: "" } },
  { title: "본문2", icon: "none", block: "p", attributes: { "data-ke-style": "", "data-ke-size": "size16" }, styles: { fontSize: "" }, default: true },
  { title: "본문3", icon: "none", block: "p", attributes: { "data-ke-style": "", "data-ke-size": "size14" }, styles: { fontSize: "" } },
];

export const COLOR_PALETTE = {
  hilite: true,
  module: ["preset", "code"],
  color_map_preset: [
    "", "#000000", "#333333", "#666666", "#9d9d9d", "#dddddd", "#ffffff",
    "#ee2323", "#f89009", "#f3c000", "#009a87", "#006dd7", "#8a3db6", "#7e98b1",
    "#ffc1c8", "#ffc9af", "#f6e199", "#9feec3", "#99cefa", "#c1bef9", "#c0d1e7",
    "#ef5369", "#ef6f53", "#a6bc00", "#409d00", "#0593d3", "#6164c6", "#8cb3be",
    "#781b33", "#953b34", "#5f6d2b", "#1b711d", "#1a5490", "#5733b1", "#456771",
  ],
  preset_rows: 5,
  preset_cols: 7,
  default_color: "#333333",
  default_background_color: "#fff",
  black_text_color_background: ["#dddddd", "#ffffff", "#ffc1c8", "#ffc9af", "#f6e199", "#9feec3", "#99cefa", "#c1bef9", "#c0d1e7"],
  align: "center",
};

// 구분선: 일직선 6종 — 길이(전체/중간/짧음) × 굵기(가늘게 1px/굵게 3px). 탈 Tistory.
export const HR_LIST = [
  { icon: "hr-style1", attributes: { "data-ke-style": "style1" } },
  { icon: "hr-style2", attributes: { "data-ke-style": "style2" } },
  { icon: "hr-style3", attributes: { "data-ke-style": "style3" } },
  { icon: "hr-style4", attributes: { "data-ke-style": "style4" } },
  { icon: "hr-style5", attributes: { "data-ke-style": "style5" } },
  { icon: "hr-style6", attributes: { "data-ke-style": "style6" } },
];

export const BLOCKQUOTE_LIST = [
  { title: "인용1", block: "blockquote", icon: "blockquote-style1", attributes: { "data-ke-style": "style1" }, styles: { fontSize: "" } },
  { title: "인용2", block: "blockquote", icon: "blockquote-style2", attributes: { "data-ke-style": "style2" }, styles: { fontSize: "" } },
  { title: "인용3", block: "blockquote", icon: "blockquote-style3", attributes: { "data-ke-style": "style3" }, styles: { fontSize: "" } },
  { title: "리셋", block: "p", icon: "list-remove", attributes: { "data-ke-style": "" } },
];

export const K_LIST = {
  list: [
    { type: "UL", style: "disc", icon: "list-disc" },
    { type: "UL", style: "circle", icon: "list-circle" },
    { type: "OL", style: "decimal", icon: "list-decimal" },
    { type: "REMOVE", style: "remove", icon: "list-remove" },
  ],
  align: "center",
};

/** Toolbar plugins from the official 0.7.21 dist + stock LGPL textcolor/colorpicker
 *  (colorPalette delegates color application to textcolor's mceApplyTextcolor). */
export const PLUGINS =
  "colorpicker textcolor styleFormat fontSelect colorPalette kAlign blockquoteList kTable simpleTable klink kList hrList kCharmap html codeblock kImage imageSlide kPaste";

export const TOOLBAR =
  "styleFormat fontSelect | bold italic underline strikethrough colorPalette backColorPalette | " +
  "kalignleft kaligncenter kalignright kalignjustify | kImage blockquoteList simpleTable klink kList hrList oe-more | oe-mode";

/** kImage settings — multi-image grid + click context menu + LOCAL upload.
 *  `upload_url` is overridden per-instance by the RichTextEditor `uploadUrl` prop. */
export const KIMAGE = {
  upload_url: "/api/upload",
  is_caption: true,
  is_grid_layout: true,
  max_width: 860,
  max_size: 20971520,
  // NOTE: 'link' (image hyperlink) is intentionally omitted — KEDITOR's kImage
  // link panel requires a `.keditor-image-link-panel` DOM that only the Tistory
  // app supplied; without it the panel throws on open. Re-add once that panel is
  // provided.
  toolbar:
    "resize | widthContent alignLeft alignCenter alignRight floatLeft floatRight alt",
};

/** kPaste — paste sanitization (STRONG→b, STRIKE/DEL→s, etc.). */
export const KPASTE = {
  valid_elements: [
    "P", "IMG", "H1", "H2", "H3", "H4", "TABLE", "TBODY", "TR", "TD", "B", "S",
    "U", "A", "I", "SPAN", "UL", "OL", "LI", "HR", "BLOCKQUOTE", "PRE", "DIV",
  ],
  extended_valid_elements: { STRONG: "b", STRIKE: "s", DEL: "s" },
  invalid_table_children: ["TABLE", "IMG", "FIGURE", "PRE", "HR", "BLOCKQUOTE"],
  valid_attributes: [
    "href", "src", "rowspan", "colspan", "data-ke-type", "data-mce-style",
    "width", "height", "id", "contenteditable", "data-+", "data-video-vid",
    "data-video-thumbnail", "data-video-url", "data-video-host",
    "data-video-uploader-host", "data-maps-data", "data-ke-align", "data-ke-style",
  ],
};

/** kCharmap — the exact 215-character set, rendered as a 17-column grid. */
export const KCHARMAP = { preview: false, items: CHARMAP_ITEMS };

export const CODEBLOCK = {
  highlightStyle:
    "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/atom-one-light.min.css",
  codeTheme: "default",
  languages: [
    { text: "Bash", value: "bash" },
    { text: "C#", value: "csharp" },
    { text: "C++", value: "cpp" },
    { text: "CSS", value: "css" },
    { text: "Delphi", value: "delphi" },
    { text: "Go", value: "go" },
    { text: "HTML", value: "html" },
    { text: "Java", value: "java" },
    { text: "Javascript", value: "javascript" },
    { text: "Kotlin", value: "kotlin" },
    { text: "PHP", value: "php" },
    { text: "Python", value: "python" },
    { text: "R", value: "r" },
    { text: "Ruby", value: "ruby" },
    { text: "SQL", value: "sql" },
    { text: "Scala", value: "scala" },
    { text: "Shell", value: "shell" },
    { text: "Swift", value: "swift" },
    { text: "TypeScript", value: "typescript" },
    { text: "VB.Net", value: "vbnet" },
  ],
};

const sel = "p,h1,h2,h3,h4,h5,h6,td";
export const FORMATS = {
  alignleft: { selector: sel, styles: { textAlign: "left" } },
  aligncenter: { selector: sel, styles: { textAlign: "center" } },
  alignright: { selector: sel, styles: { textAlign: "right" } },
  alignjustify: { selector: sel, styles: { textAlign: "justify" } },
  bold: { inline: "b" },
  italic: { inline: "i" },
  underline: { inline: "u" },
  strikethrough: { inline: "s" },
  font: { inline: "span" },
};
