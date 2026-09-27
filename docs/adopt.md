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

## Interoperability {#interop}

AICD does not reinvent digital content provenance. For digital signatures, provenance proofs, and content integrity, pair it with mature open standards such as C2PA, Content Credentials, and W3C; AICD only takes care of stating whether AI took part and how.

[Back to the full initiative →](/initiative/#adoption)
