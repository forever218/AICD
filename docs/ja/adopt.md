---
title: 採用
---

個人でも組織でも AICD を採用することができます

<BadgeBuilder />

## 機械可読 {#machine}

読者に向けた表示に加えて、同じ情報をページのメタデータに置くことができます

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
  "tool": "ある生成 AI モデル",
  "purpose": "文章の推敲と構成の調整"
}
```

### HTTP Header

```http
AICD: 1.0; level=A3; review=yes
```

## サイト全体の宣言 {#sitewide}

ウェブサイト全体が AICD を採用する場合は、専用のページを公開できます。たとえば /aicd のような場所です

```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>このサイトは AICD 1.0 に準拠しています</title>
<meta name="description" content="このサイトは、サイト全体で AICD AIコンテンツ自主開示プロトコルに準拠しています。">

<!-- optional machine-readable fields — change them to match your site -->
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
    font: 16px/1.8 Georgia, "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", "Songti SC", "Noto Serif SC", serif;
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
    <p class="sheet__claim">このサイトは、サイト全体で AICD プロトコルに準拠しています。</p>
    <p class="sheet__about">AICD は、AI コンテンツの開示に関する完全に任意の、開かれた、非営利のプロトコルです。人工知能がコンテンツ制作に関与した場合、作り手はそのことを読者に伝え、AI がどの程度関与したかを説明することができます。AI を検出するものではなく、何かを認証するものでもありません。</p>
    <ul class="sheet__levels">
      <li><b>A0</b><span>AI 不使用</span></li>
      <li><b>A1</b><span>AI による補助</span></li>
      <li><b>A2</b><span>AI による編集</span></li>
      <li><b>A3</b><span>AI による部分生成</span></li>
      <li><b>A4</b><span>AI による主要生成</span></li>
      <li><b>A5</b><span>AI による生成</span></li>
      <li><b>A?</b><span>未確認</span></li>
    </ul>
    <p class="sheet__foot">
      AICD 1.0 · 発行 2026.9.26<br>
      任意の宣言であり、AICD の認証や推奨ではありません<br>
      <a href="https://github.com/forever218/AICD">プロトコルを読む</a>
    </p>
  </main>
</body>
</html>
```

上のページは任意の宣言であり、AICD の認証や推奨ではありません。サイトの一部のみが AICD に準拠する場合は、その範囲をページに明記してください。

### スタイルプレビュー {#sitewide-preview}

<SiteWidePreview />

## 相互運用性 {#interop}

AICD は既存のデジタルコンテンツ来歴技術を再利用します。電子署名、来歴の証明、内容の完全性には、C2PA、Content Credentials、W3C などの成熟したオープン標準と組み合わせてください。

[プロトコル全文へ →](/ja/protocol/#adoption)
