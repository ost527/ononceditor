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
import { makeResizingUploadHandler } from "./resize-image";

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
  /** Base path where the KEDITOR runtime assets are served (default "/editor-runtime"). */
  baseUrl?: string;
  /** Initial editor body height in px. */
  initialHeight?: number;
  /** Downscale inserted images so their longest side is <= this many px (in the
   *  browser, before upload). Set to 0 to disable. Default 1920. */
  maxImageDimension?: number;
  /** Endpoint that returns OpenGraph metadata for a URL as JSON
   *  ({title,description,image,siteName}). When set, a bare non-YouTube URL on
   *  its own line is shown live as a link-preview card in the editor (it still
   *  serializes back to a bare URL). Omit to disable link cards. */
  linkPreviewUrl?: string;
};

/**
 * Self-contained, props-driven rich-text editor built on the self-hosted
 * KEDITOR (TinyMCE 4.9.6 fork) runtime. Owns the KEDITOR mount/init, the
 * HTML-source toggle, the drag-to-resize body height, and the custom toolbar
 * buttons (기본모드/더보기). It has NO knowledge of any host app (no server
 * actions, no domain types, no form) — wire persistence via `onChange`.
 *
 * Requires the KEDITOR runtime assets to be served at `baseUrl` (default
 * "/editor-runtime") and the editor chrome stylesheet imported once by the host
 * (`import "ononceditor/styles.css"`).
 */
export function RichTextEditor({
  defaultValue = "",
  onChange,
  uploadUrl,
  baseUrl = "/editor-runtime",
  initialHeight = DEFAULT_BODY_HEIGHT,
  maxImageDimension = 1920,
  linkPreviewUrl,
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
        const imageUploadUrl = uploadUrl ?? KIMAGE.upload_url;
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
            "body.content{max-width:1136px;margin:0 auto;padding:16px 0;box-sizing:border-box;position:relative;color:#0f172a;letter-spacing:normal;-webkit-font-smoothing:antialiased;font-family:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,system-ui,Roboto,'Helvetica Neue','Segoe UI','Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif;}" +
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
          kImage: {
            ...KIMAGE,
            upload_url: imageUploadUrl,
            upload_handler: makeResizingUploadHandler(
              imageUploadUrl,
              maxImageDimension,
            ),
          },
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
            ed.addButton("oe-mode", {
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
            ed.addButton("oe-more", {
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

            // --- auto-embed: a paragraph whose sole content is a URL becomes a
            //     live, non-editable block in the editor — a YouTube player, or
            //     (when linkPreviewUrl is set) an OpenGraph link card. YouTube
            //     serializes to <figure class="oe-embed"><iframe …/embed/ID>; link
            //     cards serialize BACK to a bare <p>URL</p> (see GetContent below)
            //     so a publisher can render them with a single renderer. ---
            const ytEmbedId = (raw: string): string | null => {
              let u: URL;
              try {
                u = new URL(raw);
              } catch {
                return null;
              }
              const host = u.hostname.replace(/^www\./, "").toLowerCase();
              let id: string | null = null;
              if (host === "youtu.be") {
                id = u.pathname.split("/")[1] || null;
              } else if (
                host === "youtube.com" ||
                host === "m.youtube.com" ||
                host === "music.youtube.com" ||
                host === "youtube-nocookie.com"
              ) {
                if (u.pathname === "/watch") {
                  id = u.searchParams.get("v");
                } else {
                  const m = u.pathname.match(/^\/(?:embed|shorts|v|live)\/([^/?#]+)/);
                  id = m ? m[1] : null;
                }
              }
              return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
            };
            const escAttr = (s: string) =>
              s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const escHtml = (s: string) =>
              s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const hostOf = (raw: string) => {
              try {
                return new URL(raw).hostname.replace(/^www\./, "");
              } catch {
                return raw;
              }
            };
            const cardInnerHtml = (url: string, d: any) => {
              const domain = hostOf(url);
              const title = escHtml((d && d.title) || domain);
              const site = escHtml((d && d.siteName) || domain);
              const desc = d && d.description ? '<span class="oe-card__desc">' + escHtml(d.description) + "</span>" : "";
              const thumb = d && d.image ? '<span class="oe-card__thumb"><img src="' + escAttr(d.image) + '" alt=""></span>' : "";
              return (
                '<a class="oe-card__link" href="' +
                escAttr(url) +
                '" target="_blank" rel="noopener noreferrer nofollow">' +
                thumb +
                '<span class="oe-card__body"><span class="oe-card__title">' +
                title +
                "</span>" +
                desc +
                '<span class="oe-card__domain">' +
                site +
                "</span></span></a>"
              );
            };
            let autoEmbedding = false;
            const inflight = new Set<string>();
            const noRetry = new Set<string>();
            const ensureTrailing = (fig: any) => {
              if (!fig.nextSibling) fig.parentNode.appendChild(ed.dom.create("p", {}, "<br>"));
            };
            // Mutate inside a bookmark so the caret survives node replacement,
            // then push the new HTML out via onChange.
            const withSelection = (fn: () => void) => {
              autoEmbedding = true;
              const bookmark = ed.selection.getBookmark(2, true);
              try {
                fn();
              } finally {
                try {
                  ed.selection.moveToBookmark(bookmark);
                } catch {
                  /* the bookmarked node may have been replaced; ignore */
                }
                autoEmbedding = false;
                try {
                  onChangeRef.current(ed.getContent());
                } catch {
                  /* kImage serialize throws mid-upload; ignore */
                }
              }
            };
            const autoEmbed = () => {
              if (autoEmbedding) return;
              const body = ed.getBody && ed.getBody();
              if (!body) return;
              const yts: { p: any; id: string }[] = [];
              const links: { p: any; url: string }[] = [];
              body.querySelectorAll("p").forEach((p: any) => {
                const text = (p.textContent || "").trim();
                if (!text || !/^https?:\/\//i.test(text)) return;
                // Only a paragraph whose sole content is the URL (plain text or a
                // single auto-linked <a>).
                const soloLink =
                  p.children.length === 1 &&
                  p.children[0].tagName === "A" &&
                  (p.children[0].textContent || "").trim() === text;
                if (!soloLink && p.children.length !== 0) return;
                const id = ytEmbedId(text);
                if (id) yts.push({ p, id });
                else links.push({ p, url: text });
              });
              if (yts.length) {
                withSelection(() => {
                  yts.forEach(({ p, id }) => {
                    const fig = ed.dom.create(
                      "figure",
                      { class: "oe-embed", "data-oe-embed": "youtube", contenteditable: "false" },
                      '<iframe src="https://www.youtube-nocookie.com/embed/' +
                        id +
                        '" frameborder="0" allowfullscreen></iframe>',
                    );
                    p.parentNode.replaceChild(fig, p);
                    ensureTrailing(fig);
                  });
                });
              }
              // Link cards need an OG endpoint — opt-in via linkPreviewUrl.
              if (linkPreviewUrl) {
                links.forEach(({ p, url }) => {
                  if (inflight.has(url) || noRetry.has(url)) return;
                  inflight.add(url);
                  fetch(linkPreviewUrl + "?url=" + encodeURIComponent(url))
                    .then((r) => (r.ok ? r.json() : null))
                    .then((data) => {
                      inflight.delete(url);
                      // A failed/empty lookup: don't retry it on every keystroke.
                      if (!data) {
                        noRetry.add(url);
                        return;
                      }
                      // Re-validate: the node may have been edited/removed while
                      // the request was in flight.
                      if (autoEmbedding || !p.parentNode || (p.textContent || "").trim() !== url) return;
                      withSelection(() => {
                        const fig = ed.dom.create(
                          "figure",
                          { class: "oe-card", "data-oe-card": url, contenteditable: "false" },
                          cardInnerHtml(url, data),
                        );
                        p.parentNode.replaceChild(fig, p);
                        ensureTrailing(fig);
                      });
                    })
                    .catch(() => {
                      inflight.delete(url);
                      noRetry.add(url);
                    });
                });
              }
            };
            // Serialize a link card BACK to a bare <p>URL</p> so saved content
            // stays a plain URL (the publisher renders the card). YouTube embeds
            // are kept as <figure><iframe> for the publisher to convert.
            ed.on("GetContent", (e: any) => {
              if (!e.content || e.content.indexOf("oe-card") === -1) return;
              e.content = e.content.replace(
                /<figure\b[^>]*\bdata-oe-card="([^"]*)"[^>]*>[\s\S]*?<\/figure>/gi,
                (_m: string, url: string) => "<p>" + url + "</p>",
              );
            });
            // Paste (복붙) is the common case; Enter finishes a typed/auto-linked
            // line; SetContent covers loading saved content with a bare URL.
            ed.on("paste", () => window.setTimeout(autoEmbed, 50));
            ed.on("keyup", (e: any) => {
              if (e.keyCode === 13) window.setTimeout(autoEmbed, 0);
            });
            ed.on("SetContent", () => window.setTimeout(autoEmbed, 0));
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
