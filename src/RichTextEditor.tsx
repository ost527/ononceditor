"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  loadKeditor,
  getContentCss,
  FONT_FORMATS,
  STYLE_FORMATS,
  COLOR_PALETTE,
  HR_LIST,
  BLOCKQUOTE_LIST,
  K_LIST,
  CODEBLOCK,
  FORMATS,
  PLUGINS,
  TOOLBAR,
  KIMAGE,
  KPASTE,
  KCHARMAP,
} from "./keditor-runtime";

/** Editor body height (px) — shared by WYSIWYG and HTML-source modes so the two
 *  stay the same size, and adjustable via the drag handle below the editor. */
const DEFAULT_BODY_HEIGHT = 620;
const MIN_BODY_HEIGHT = 240;
const MAX_BODY_HEIGHT = 2400;

export type RichTextEditorProps = {
  /** Initial HTML content. The editor owns its content after mount (uncontrolled). */
  defaultValue?: string;
  /** Fires with the latest editor HTML whenever the content changes. */
  onChange?: (html: string) => void;
  /** Upload endpoint for inline images (defaults to the runtime KIMAGE.upload_url). */
  uploadUrl?: string;
  /** Base path where the KEDITOR runtime assets are served (default "/keditor"). */
  baseUrl?: string;
  /** Initial editor body height in px. */
  initialHeight?: number;
};

/**
 * Self-contained, props-driven rich-text editor built on the self-hosted
 * KEDITOR (TinyMCE 4.9.6 fork) runtime. Owns the KEDITOR mount/init, the
 * HTML-source toggle, the drag-to-resize body height, and the custom toolbar
 * buttons (기본모드/더보기). It has NO knowledge of any host app (no server
 * actions, no domain types, no form) — wire persistence via `onChange`.
 *
 * Requires the KEDITOR runtime assets to be served at `baseUrl` (default
 * "/keditor") and the editor chrome stylesheet imported once by the host
 * (`import "ononceditor/styles.css"`).
 */
export function RichTextEditor({
  defaultValue = "",
  onChange,
  uploadUrl,
  baseUrl = "/keditor",
  initialHeight = DEFAULT_BODY_HEIGHT,
}: RichTextEditorProps) {
  // Per-instance DOM id so multiple editors can coexist on one page.
  const editorId = "rte-" + useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const editorRef = useRef<any>(null);
  const onChangeRef = useRef<(html: string) => void>(() => {});
  const setModeRef = useRef<(toSource: boolean) => void>(() => {});
  const modeBtnRef = useRef<any>(null);

  const [source, setSource] = useState(false);
  const [sourceHtml, setSourceHtml] = useState(defaultValue);
  const [bodyHeight, setBodyHeight] = useState(initialHeight);

  // Keep latest handlers in refs (assigned in an effect, not during render).
  useEffect(() => {
    onChangeRef.current = (html: string) => onChange?.(html);
    setModeRef.current = (toSource: boolean) => {
      const ed = editorRef.current;
      if (!ed) return;
      setSource((prev) => {
        if (prev === toSource) return prev;
        let next: boolean;
        if (toSource) {
          let html: string;
          try {
            html = ed.getContent();
          } catch {
            window.alert("이미지 업로드가 완료된 후 시도해 주세요.");
            return prev;
          }
          setSourceHtml(html);
          next = true;
        } else {
          ed.setContent(sourceHtml || "");
          onChangeRef.current(sourceHtml);
          next = false;
        }
        // reflect the active mode in the toolbar button label.
        const ctrl = modeBtnRef.current;
        if (ctrl) {
          try {
            ctrl.text(next ? "HTML" : "기본모드");
          } catch {
            /* noop */
          }
        }
        // DOM fallback so the button label updates even if the control API doesn't.
        try {
          const lbl = document.querySelector<HTMLElement>(
            '.pe-body [aria-label="모드 전환"] .mce-txt',
          );
          if (lbl) lbl.textContent = next ? "HTML" : "기본모드";
        } catch {
          /* noop */
        }
        return next;
      });
    };
  });

  // ---- mount the self-hosted KEDITOR (0.7.21 dist) runtime ----
  useEffect(() => {
    let cancelled = false;

    loadKeditor(baseUrl)
      .then(() => {
        if (cancelled) return;
        const tinymce = (window as any).tinymce;
        if (!tinymce) return;
        tinymce.get(editorId)?.remove();
        tinymce.init({
          selector: "#" + editorId,
          // TinyMCE auto-loads theme/plugins/skin from here (unhashed dist).
          base_url: baseUrl,
          suffix: ".min",
          skin: "classic",
          theme: "classic",
          language: "ko_KR",
          language_url: `${baseUrl}/langs/ko_KR.min.js`,
          menubar: false,
          statusbar: false,
          branding: false,
          height: initialHeight,
          placeholder: "내용을 입력해주세요",
          convert_urls: false,
          relative_urls: false,
          content_css: getContentCss(baseUrl),
          // The editor runs in an iframe and cannot read host CSS variables, so
          // these literals are self-contained. The 1136px body width matches a
          // typical published-article column; adjust in your published styles.
          content_style:
            "html{overflow-y:auto !important;text-rendering:optimizeLegibility;font-feature-settings:'ss01','cv01';}" +
            "body.content{max-width:1136px;margin:0 auto;padding:16px 0;box-sizing:border-box;position:relative;color:#0f172a;letter-spacing:-0.011em;-webkit-font-smoothing:antialiased;font-family:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,system-ui,Roboto,'Helvetica Neue','Segoe UI','Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif;}" +
            "body.content a{color:#4f46e5;text-decoration:underline;text-underline-offset:0.15em;}" +
            "body.content>*:first-child{margin-top:0;}" +
            "body.content.is-empty::before{content:'내용을 입력해주세요';color:#94a3b8;position:absolute;top:16px;left:0;pointer-events:none;}",
          body_class: "content",
          font_formats: FONT_FORMATS,
          default_fontsize: "size16",
          style_formats: STYLE_FORMATS,
          style_formats_align: "center",
          colorPalette: COLOR_PALETTE,
          hrList: HR_LIST,
          hrList_align: "center",
          blockquoteList: BLOCKQUOTE_LIST,
          kList: K_LIST,
          codeblock: CODEBLOCK,
          formats: FORMATS,
          simpleTable: { is_grid: true, align: "center" },
          klink: { is_panel: true, auto_link: true, align: "center" },
          kImage: uploadUrl ? { ...KIMAGE, upload_url: uploadUrl } : KIMAGE,
          kPaste: KPASTE,
          kCharmap: KCHARMAP,
          extended_valid_elements:
            "b/strong,i/em,span/font,font[color],span[style|class]," +
            "figure[id|class|data-ke-type|data-ke-style|contenteditable|data-*],figcaption," +
            "div[class|data-ke-type|style],img[id|src|alt|class|style|width|height|data-*|contenteditable]," +
            "iframe[mapdata|src|id|width|height|frameborder|scrolling|data-*|allowfullscreen]",
          plugins: PLUGINS,
          toolbar: TOOLBAR,
          setup(ed: any) {
            editorRef.current = ed;
            const togglePlaceholder = () => {
              const b = ed.getBody && ed.getBody();
              if (b) b.classList.toggle("is-empty", ed.dom.isEmpty(b));
            };
            ed.on("init SetContent input keyup NodeChange", togglePlaceholder);
            ed.addButton("tistory-mode", {
              type: "menubutton",
              text: "기본모드",
              tooltip: "모드 전환",
              onPostRender() {
                modeBtnRef.current = this;
              },
              menu: [
                { text: "기본모드", onclick: () => setModeRef.current(false) },
                { text: "HTML", onclick: () => setModeRef.current(true) },
              ],
            });
            ed.addButton("tistory-plugins", {
              type: "menubutton",
              icon: "more",
              tooltip: "더보기",
              menu: [
                { text: "특수문자", icon: "charmap", onclick: () => ed.execCommand("kCharmap") },
                { text: "코드블럭", icon: "codesample", onclick: () => ed.execCommand("codeblock") },
                { text: "HTML블럭", icon: "code", onclick: () => ed.execCommand("openDialogHTML") },
              ],
            });
            ed.on("init", () => {
              ed.setContent(defaultValue);
            });
            ed.on("change keyup SetContent ExecCommand Undo Redo", () => {
              // kImage's serialize hook THROWS while an image is still uploading;
              // skip this tick (it fires another change event when upload ends).
              let html: string;
              try {
                html = ed.getContent();
              } catch {
                return;
              }
              onChangeRef.current(html);
            });
          },
        });
      })
      .catch((err) => console.error("[ononceditor]", err));

    return () => {
      cancelled = true;
      try {
        (window as any).tinymce?.get(editorId)?.remove();
      } catch {
        /* noop */
      }
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the WYSIWYG editor's content height in sync with the shared bodyHeight
  // (the HTML-source textarea gets the same height inline). Re-applied when
  // returning from source mode, since the iframe is hidden while editing source.
  useEffect(() => {
    const ed = editorRef.current;
    if (ed && !source) {
      try {
        ed.theme.resizeTo(null, bodyHeight);
      } catch {
        /* noop */
      }
    }
  }, [bodyHeight, source]);

  // Drag the handle below the editor to resize the body height (both modes).
  const startResize = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = bodyHeight;
    const onMove = (ev: PointerEvent) => {
      const next = Math.min(
        MAX_BODY_HEIGHT,
        Math.max(MIN_BODY_HEIGHT, startH + (ev.clientY - startY)),
      );
      setBodyHeight(next);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    // suppress text selection / set a global resize cursor during the drag
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ns-resize";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div className={`pe-body${source ? " pe-body--source" : ""}`}>
      <textarea id={editorId} defaultValue={defaultValue} />
      {source ? (
        <textarea
          className="pe-source"
          /* height = bodyHeight + 1: the WYSIWYG .mce-tinymce frame adds a 1px
             bottom border ON TOP of the bodyHeight-tall iframe, but this
             textarea is border-box (its borders live INSIDE bodyHeight), so
             without the +1 the editor box is 1px shorter in source mode and
             toggling modes jitters vertically by 1px. */
          style={{ height: bodyHeight + 1 }}
          value={sourceHtml}
          onChange={(e) => setSourceHtml(e.target.value)}
        />
      ) : null}
      <div
        className="pe-resize"
        role="separator"
        aria-orientation="horizontal"
        aria-label="본문 높이 조절"
        title="드래그하여 본문 높이 조절"
        onPointerDown={startResize}
      />
    </div>
  );
}
