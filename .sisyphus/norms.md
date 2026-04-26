# 项目规范

## 提交规范

- 改完代码后运行 lint (`pnpm lint`)
- 不要自动提交代码，等待用户确认
- 用户确认后再提交

## 模板输出格式

当前使用单 JSON 文件输出格式：
- 文件名：`{templateId}.json`
- 位置：`dist/templates/{group}/{templateId}.json`
- 字段：id, name, version, description, author, license, code, style, signature