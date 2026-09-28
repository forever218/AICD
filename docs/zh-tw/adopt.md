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

## 互通性 {#interop}

AICD 複用現有數位內容溯源技術。數字簽名、來源證明、內容完整性驗證等需求，建議與 C2PA、Content Credentials、W3C 等成熟開放標準配合使用。

[回到協議全文 →](/zh-tw/protocol/#adoption)
