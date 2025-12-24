# Copicseal 模板构建

## 输出目录结构

- `dist/`
  - `manifest.json`
  - `templates/default/manifest.json`
  - `templates/default/index.js`
  - `templates/default/index.css`

### `manifest.json`

```json
{
  "name": "默认模板库",
  "version": "1.0.0",
  "description": "默认模板库",
  "templates": [
    "./templates/default"
  ]
}
```

### `templates/default/manifest.json`

```json
{
  "name": "默认模板",
  "version": "1.0.0",
  "description": "默认模板，白色边框 + 底部信息",
  "entry": "index.js",
  "css": "index.css",
  "files": [
    "index.js",
    "index.css"
  ],
  "author": "kohai",
  "license": "MIT"
}
```

### `templates/default/index.js`

```js
exports.CoTest = (function (e) {
  return {/** CoTest 组件 */};
}(Vue));
```

### `templates/default/index.css`

```css
/*  */
```

## 组件列表

- `CoTest`
