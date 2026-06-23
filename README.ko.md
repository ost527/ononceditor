# ononceditor

[English](./README.md) | **한국어**

자체 호스팅 [KEDITOR](https://t1.daumcdn.net/keditor/opensource/KEDITOR-0.7.21.zip)
(TinyMCE 4.x 포크) 런타임 위에 만든 **React용 WYSIWYG 리치 텍스트 에디터**입니다.
**props 기반의 controlled-ish 컴포넌트**로, 초기 HTML을 넘겨주면 변경 시 HTML을
돌려받습니다 — 저장, 폼, 페이지 레이아웃은 전적으로 여러분의 몫입니다.

- 툴바: 문단모양 · 글꼴 · B/I/U/S · 글자색/배경색 · 정렬 · 이미지(grid) · 인용 · 표 · 링크 · 리스트 · 구분선 · 더보기(특수문자/코드블럭/HTML블럭) · 기본모드(HTML source)
- **여러분의** 엔드포인트로 인라인 이미지 업로드, 드래그-투-그리드 레이아웃, 코드 블록, 215자 특수문자 선택기.
- **자동 임베드**: 한 줄에 유튜브 URL만 있으면 반응형 플레이어로, `linkPreviewUrl`을 지정하면 그 외 단독 URL은 라이브 OpenGraph 링크 카드로 변환됩니다. 저장 시에는 깔끔한 HTML(`<figure><iframe>` / 맨 URL)로 직렬화되어 페이지에서 렌더하면 됩니다.
- 순수 HTML을 출력합니다 — 게시 전 여러분 쪽에서 sanitize하세요(예: DOMPurify).

> 상태: `0.2.0`, `ononc` 프로젝트에서 추출. 번들된 에디터 런타임은 LGPL-2.1입니다([라이선스](#라이선스) 참고).

## 설치

```bash
npm install ononceditor
```

Peer deps: `react >=18`, `react-dom >=18`.

## 1) 런타임 에셋 서빙

이 패키지는 트림된 KEDITOR 런타임을 `ononceditor/editor-runtime` 아래에 번들합니다.
앱이 정적으로 서빙하는 디렉터리로 복사해서 `baseUrl`(기본값 `/editor-runtime`)에서
접근 가능하게 하세요. Next.js 앱 예시:

```bash
cp -R node_modules/ononceditor/editor-runtime public/editor-runtime
```

(`postinstall`/`prebuild` 스크립트로 자동화하면 clean install 후에도 유지됩니다.)
다른 위치에서 서빙한다면 컴포넌트에 `baseUrl`을 넘기세요.

## 2) 스타일 한 번 import

```ts
import "ononceditor/styles.css";
```

에디터 크롬은 몇 가지 CSS 커스텀 속성(`--color-foreground`, `--color-border`,
`--radius-md`, `--font-sans` 등)을 사용합니다. 테마에서 정의하거나 `styles.css`를
여러분의 디자인 시스템에 맞게 오버라이드하세요.

## 3) 사용법

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

| Prop | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `defaultValue` | `string` | `""` | 초기 HTML. 마운트 이후에는 에디터가 콘텐츠를 소유합니다(uncontrolled). |
| `onChange` | `(html: string) => void` | – | 변경이 있을 때마다 최신 HTML로 호출됩니다. |
| `uploadUrl` | `string` | `/api/upload` | 이미지 업로드를 받는 엔드포인트. |
| `baseUrl` | `string` | `/editor-runtime` | 런타임 에셋이 서빙되는 위치. |
| `initialHeight` | `number` | `620` | 에디터 본문 초기 높이(px). |
| `maxImageDimension` | `number` | `1920` | 삽입 이미지의 가장 긴 변을 이 px 이하로 축소(브라우저에서 업로드 전); `0`이면 비활성화. |
| `linkPreviewUrl` | `string` | – | URL의 OpenGraph JSON(`{title,description,image,siteName}`)을 반환하는 엔드포인트. 지정하면 한 줄에 단독으로 있는 비유튜브 URL이 에디터에서 라이브 링크 미리보기 카드로 변환됩니다(저장 시 맨 URL로 직렬화). 생략하면 비활성화. |

### 업로드 엔드포인트 규약

`uploadUrl`은 이미지 파일이 담긴 `multipart/form-data` POST를 받고, JSON
`{ "url": "https://…", "filename": "…", "location": "…" }`로 응답해야 합니다.

## 라이선스

**ononceditor 래퍼 코드**는 [MIT](./LICENSE)입니다.

`editor-runtime/` 아래 번들된 에디터 런타임은 **KEDITOR**(TinyMCE 4.x 포크)이며
**GNU LGPL v2.1**입니다 — 라이선스 전문은 `editor-runtime/LICENSE`에 포함되고,
대응 소스는 공식 KEDITOR 릴리스와 <https://github.com/tinymce/tinymce>입니다.
번들된 KEDITOR 런타임은 upstream 0.7.21에서 **수정**되었습니다(플러그인 트림,
아이콘 재스킨, 링크 플러그인 패치, 스타일 조정). 파일 단위 변경 내역은
`editor-runtime/MODIFICATIONS.md`에 정리되어 있습니다.

코드 블록 기능은 **CodeMirror**(MIT)를 번들하고, 런타임은 **core-js** /
**regenerator-runtime** 폴리필(MIT)을 번들합니다. **highlight.js**(BSD-3-Clause
문법 테마)와 **Pretendard** 폰트는 번들이 아니라 **CDN(jsDelivr)에서 런타임에
로드**되므로 네트워크 접근이 필요합니다(오프라인 사용 시 self-host 후 `CODEBLOCK` /
`getContentCss`를 조정). 서드파티 라이선스 전문은
`editor-runtime/THIRD-PARTY-LICENSES.txt`에 포함됩니다.

이 프로젝트는 **Kakao/Tistory와 제휴하거나 보증받은 것이 아닙니다**.
