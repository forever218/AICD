---
title: 采用
---


任何个人或组织均可以采用 AICD

<BadgeBuilder />

## 机器可读 {#machine}

除面向读者的可见标识外，可以把同样的信息放进页面元数据

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
  "purpose": "语言润色与结构调整"
}
```

### HTTP Header

```http
AICD: 1.0; level=A3; review=yes
```

## 互操作 {#interop}

AICD 不重新发明数字内容溯源技术。数字签名、来源证明、内容完整性验证等需求，建议与 C2PA、Content Credentials、W3C 等成熟开放标准配合使用；AICD 只负责把「AI 是否参与、如何参与」这件事说清楚。

[回到倡议全文 →](/zh/initiative/#adoption)
