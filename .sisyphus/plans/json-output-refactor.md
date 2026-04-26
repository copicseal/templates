# 模板打包输出格式重构计划

## 背景

**当前输出结构**：
```
dist/templates/{group}/{template}/
├── manifest.json    # 模板元信息
├── index.js        # 组件代码 (IIFE 包装)
└── index.css      # 样式代码
```

**目标输出结构**：
```
dist/templates/{group}/{template}.json
```

单一 JSON 文件包含所有内容。

## 目标

将模板输出从多文件（manifest.json + index.js + index.css）改为单个 JSON 文件：
- manifest 字段：原有 manifest.json 内容（展开为顶层字段）
- code 字段：index.js 代码（内联）
- style 字段：index.css 样式（内联）
- signature 字段：代码签名

## 已确认问题

1. **文件名格式**：使用 templateId 作为文件名（如 TplDefault.json），保留 group 分组目录 ✅
2. **字段命名**：`manifest`（展开为顶层字段）、`code`、`style`、`signature` ✅
3. **签名处理**：保留，对 code 文本内容进行签名 ✅
4. **根 manifest**：保留，记录每个分组和模板的 name、id、description ✅

## 变更范围

### 1. build/build-components.js
- 修改 `buildTemplate()` 输出逻辑
- 将多文件写入改为单 JSON 文件写入
- 从构建后的 dist 目录读取 index.js/index.css

### 2. dist/manifest.json
- 记录每个分组和模板的 name、id、description、url

## 执行步骤

### Step 1: 修改 build-components.js ✅
```
1. 修改 buildTemplate() → 输出 .json 文件
2. 从构建后的目录读取 index.js/index.css
3. 添加签名处理
```

### Step 2: 调整 manifest 生成逻辑 ✅
```
生成 dist/manifest.json 包含所有分组和模板引用
```

### Step 3: 验证构建 ✅
```
npm run build:tpl
# 输出结构验证通过
```

## 输出示例

**文件结构**：
```
dist/
├── manifest.json
└── templates/
    ├── group1/
    │   ├── TplDefault.json      # 6.8KB
    │   ├── TplDefault2.json
    │   └── TplDefault5.json
    ├── group2/
    │   └── TplDefault3.json  # 9.1KB
    └── group3/
        └── TplWatermark.json # 2.8KB
```

**JSON 结构**：
```json
{
  "id": "TplDefault",
  "name": "默认模板(白色边框)",
  "version": "1.0.0",
  "description": "默认模板，白色边框 + 底部信息",
  "code": "exports.TplDefault=(function(t){...} /* @signature:alg=ed25519;value=... */",
  "style": ".tpl-card {...}",
  "signature": "hbgglsAydojI..."
}
```

**根 manifest**：
```json
{
  "groups": [
    {
      "id": "group1",
      "name": "模板分组1",
      "templates": [
        { "name": "TplDefault", "id": "TplDefault", "description": "...", "url": "./templates/group1/TplDefault.json" }
      ]
    }
  ]
}
```

## 状态：✅ 已完成
