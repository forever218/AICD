---
title: 採用
---


任何個人或組織均可採用 AICD

<BadgeBuilder />

## 機器可讀 {#machine}

除面向讀者的可見標識外，可以把同樣的信息放進頁面元數據

### HTML Metadata

```html
<meta name="aicd-version" content="1.0" />
<meta name="aicd-level" content="A3" />
<meta name="aicd-review" content="yes" />
```

### JSON

```json
{
  "aicd": "1.0",
  "level": "A3",
  "review": true,
  "tool": "某生成式 AI 模型",
  "purpose": "語言潤色與結構調整"
}
```

### HTTP Header

```http
AICD: 1.0; level=A3; review=yes
```

## 全站聲明 {#sitewide}

如果網站全站都遵循 AICD，可以設立一個獨立頁面（例如 `/aicd`）
```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>本站遵循 AICD 1.0</title>
<meta name="description" content="本站全站遵循 AICD 人工智能內容主動披露協議。">

<!-- 可選的機器可讀欄位，請改成你站點的實際情況 -->
<meta name="aicd-version" content="1.0">
<meta name="aicd-level" content="A2">
<meta name="aicd-review" content="yes">

<style>
  :root {
    color-scheme: light dark;
    --paper: #fbfaf7;
    --ink: #1f2229;
    --soft: #4b5059;
    --rule: #dedad2;
    --mark: #a63a2c;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --paper: #16181d;
      --ink: #edebe6;
      --soft: #a6aab3;
      --rule: #2f333b;
      --mark: #d4776a;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 2.5rem 1.25rem;
    background: var(--paper);
    color: var(--ink);
    font: 16px/1.8 Georgia, "Songti SC", "Noto Serif SC", serif;
    -webkit-font-smoothing: antialiased;
  }
  .sheet {
    width: 100%;
    max-width: 34rem;
    padding: clamp(2rem, 7vw, 3.4rem) clamp(1.4rem, 6vw, 2.8rem);
    border: 1px solid var(--rule);
    text-align: center;
  }
  .sheet__kicker {
    margin: 0 0 1.5rem;
    font: 500 0.7rem/1.4 ui-monospace, "SFMono-Regular", monospace;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--soft);
  }
  .sheet__title {
    margin: 0;
    font-size: clamp(2.7rem, 12vw, 3.7rem);
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1;
  }
  .sheet__mark {
    width: 2.6rem;
    height: 2px;
    margin: 1.5rem auto;
    border: 0;
    background: var(--mark);
  }
  .sheet__claim {
    margin: 0 0 1.6rem;
    font-size: 1.08rem;
  }
  .sheet__about {
    margin: 0 auto;
    max-width: 27rem;
    font-size: 0.95rem;
    line-height: 1.9;
    color: var(--soft);
  }
  .sheet__levels {
    list-style: none;
    margin: 2rem 0 0;
    padding: 1.5rem 0 0;
    border-top: 1px solid var(--rule);
    display: grid;
    gap: 0.45rem;
  }
  .sheet__levels li {
    display: flex;
    align-items: baseline;
    gap: 0.8rem;
    text-align: left;
    font-size: 0.94rem;
  }
  .sheet__levels b {
    flex: none;
    width: 2.4rem;
    font: 500 0.88rem/1.7 ui-monospace, "SFMono-Regular", monospace;
    color: var(--mark);
  }
  .sheet__levels span { color: var(--soft); }
  .sheet__foot {
    margin: 2rem 0 0;
    padding-top: 1.4rem;
    border-top: 1px solid var(--rule);
    font: 400 0.76rem/1.8 ui-monospace, "SFMono-Regular", monospace;
    letter-spacing: 0.06em;
    color: var(--soft);
  }
  .sheet__foot a { color: inherit; text-underline-offset: 0.2em; }
</style>
</head>
<body>
  <main class="sheet">
    <h1 class="sheet__title">AICD 1.0</h1>
    <hr class="sheet__mark">
    <p class="sheet__claim">本站全站遵循 AICD 協議。</p>
    <p class="sheet__about">AICD 是一份完全自願、開放、非營利的 AI 內容披露協議：當人工智能參與了內容創作，創作者可以主動告知讀者，並說明人工智能的參與程度。它不做檢測，也不做認證。</p>
    <ul class="sheet__levels">
      <li><b>A0</b><span>未使用 AI</span></li>
      <li><b>A1</b><span>AI 輔助</span></li>
      <li><b>A2</b><span>AI 編輯</span></li>
      <li><b>A3</b><span>AI 部分生成</span></li>
      <li><b>A4</b><span>AI 主要生成</span></li>
      <li><b>A5</b><span>AI 生成</span></li>
      <li><b>A?</b><span>未確認</span></li>
    </ul>
    <p class="sheet__foot">
      AICD 1.0 · 發布 2026.9.26<br>
      本頁為自願遵循聲明，不構成 AICD 認證或背書<br>
      <a href="https://github.com/forever218/AICD">了解協議全文</a>
    </p>
  </main>
</body>
</html>
```

上面的頁面是自願遵循聲明，不構成 AICD 認證或背書。若只有部分欄目遵循 AICD，請在頁面中寫明適用範圍。

### 樣式預覽 {#sitewide-preview}

<SiteWidePreview />

## 互通性 {#interop}

AICD 複用現有數位內容溯源技術。數字簽名、來源證明、內容完整性驗證等需求，建議與 C2PA、Content Credentials、W3C 等成熟開放標準配合使用。

[回到協議全文 →](/zh-tw/protocol/#adoption)
