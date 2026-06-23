# 변경 이력

[English](./CHANGELOG.md) | **한국어**

**ononceditor**의 주요 변경 사항을 기록합니다. 이 프로젝트는
[유의적 버전(Semantic Versioning)](https://semver.org/lang/ko/)을 따릅니다.

## 0.2.0

### 추가
- **에디터 내 자동 임베드.** 한 줄에 **유튜브 URL**만 있는 문단(타이핑·붙여넣기·불러오기)이
  반응형 편집 불가 플레이어로 즉시 변환됩니다. 저장 시
  `<figure class="oe-embed"><iframe …/embed/ID></figure>`로 직렬화됩니다.
- **링크 미리보기 카드(옵트인).** 새 `linkPreviewUrl` prop: 지정하면 한 줄에 단독으로 있는
  **비유튜브 URL**이 해당 엔드포인트에서 OpenGraph 메타데이터를 받아 에디터에 라이브
  카드로 표시됩니다. 저장 시에는 **다시 맨 `<p>URL</p>`로 직렬화**되어, 발행 페이지에서
  하나의 렌더러로 렌더할 수 있습니다. 조회에 실패한 URL은 재요청하지 않습니다.
- 에디터 본문 CSS에 `.oe-embed`(반응형 16:9), `.oe-card` 스타일 추가.

### 변경
- 에디터 본문 `letter-spacing`을 `normal`로 변경(기존 `-0.011em`); 본문 타이포 조정
  (행간 1.7, 제목 여백 8px 그리드)으로 일반 발행 본문과 일치하도록 함.

### 참고
- 유튜브 자동 임베드는 항상 켜져 있습니다. 링크 카드는 `linkPreviewUrl`이 필요하며,
  생략하면 비활성화됩니다. 엔드포인트는 JSON `{ title, description, image, siteName }`을
  반환해야 합니다.

## 0.1.0

- 초기 릴리스, `ononc` 프로젝트에서 추출: 트림된 자체 호스팅 KEDITOR(TinyMCE 4.x) 런타임
  위의 props 기반 React 래퍼; 여러분의 엔드포인트로 인라인 이미지 업로드; HTML 소스 토글;
  드래그-투-리사이즈; 215자 특수문자 선택기; 코드 블록.
