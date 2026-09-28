---
title: Adopt
---

Any individual or organisation may adopt AICD

<BadgeBuilder />

## Machine-readable {#machine}

Beyond the reader-facing marker, the same information can be placed in page metadata

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
  "tool": "a generative AI model",
  "purpose": "language polishing and restructuring"
}
```

### HTTP Header

```http
AICD: 1.0; level=A3; review=yes
```

## Site-wide declaration {#sitewide}

If an entire website follows AICD, it can publish a dedicated page — for example at `/aicd`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>This site follows AICD 1.0</title>
<meta name="description" content="This site follows the AICD AI Content Disclosure Protocol site-wide.">

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
    <p class="sheet__claim">This site follows the AICD protocol site-wide.</p>
    <p class="sheet__about">AICD is a wholly voluntary, open, non-profit protocol for AI content disclosure: where artificial intelligence has taken part in creating content, creators can tell their readers so and describe how far AI was involved. It does not detect AI, and it does not certify anything.</p>
    <ul class="sheet__levels">
      <li><b>A0</b><span>No AI</span></li>
      <li><b>A1</b><span>AI-assisted</span></li>
      <li><b>A2</b><span>AI-edited</span></li>
      <li><b>A3</b><span>Partially AI-generated</span></li>
      <li><b>A4</b><span>Mostly AI-generated</span></li>
      <li><b>A5</b><span>AI-generated</span></li>
      <li><b>A?</b><span>Unconfirmed</span></li>
    </ul>
    <p class="sheet__foot">
      AICD 1.0 · Published 2026.9.26<br>
      A voluntary declaration, not an AICD certification or endorsement<br>
      <a href="https://github.com/forever218/AICD">Read the protocol</a>
    </p>
  </main>
</body>
</html>
```

The page above is a voluntary declaration: it is not AICD certification or endorsement. If only part of a site follows AICD, state that scope on the page.

### Style preview {#sitewide-preview}

<SiteWidePreview />

## Interoperability {#interop}

AICD reuse existing digital content provenance technologies. For digital signatures, provenance proofs, and content integrity, pair it with mature open standards such as C2PA, Content Credentials, and W3C。

[Back to the full protocol →](/protocol/#adoption)
