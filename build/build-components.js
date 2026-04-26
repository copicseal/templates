/* eslint-disable node/prefer-global/process */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';
import { logger } from './logger.js';

config();

export async function run() {
  logger.title('模板组件构建器', '开始构建所有模板组件');

  const componentsDir = path.resolve(process.cwd(), 'src/templates');
  const distDir = path.resolve(process.cwd(), 'dist');

  initDist(distDir);

  const templates = scanTemplates(componentsDir);
  const groups = buildGroups(templates);

  logger.info(`扫描完成`, `发现 ${templates.length} 个模板，分为 ${groups.length} 个分组`);

  for (const template of templates) {
    await buildTemplate(template, componentsDir, distDir);
  }

  cleanupAllTemplates(distDir, templates);
  generateManifest(distDir, componentsDir, templates);

  logger.success('所有组件构建完成', `共构建 ${templates.length} 个模板`);
  logger.timing('构建总耗时');

  logger.stats('构建统计', {
    模板总数: templates.length,
    分组数量: groups.length,
    输出目录: path.basename(distDir),
  });

  return { distDir, templates, groups };
}

function initDist(distDir) {
  logger.section('初始化输出目录');

  if (fs.existsSync(distDir)) {
    logger.info('清理输出目录', '正在删除现有内容');
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  fs.mkdirSync(distDir, { recursive: true });
  logger.success('输出目录已准备', path.basename(distDir));
}

function scanTemplates(dir, baseDir = dir) {
  logger.info('扫描模板目录', path.basename(dir));

  const items = fs.readdirSync(dir);
  const templates = [];

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.relative(baseDir, fullPath);

    if (fs.lstatSync(fullPath).isDirectory()) {
      const manifestPath = path.join(fullPath, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const parts = relativePath.split(path.sep);
        const groupId = parts.length >= 2 ? parts[0] : 'default';
        templates.push({
          name: item,
          path: fullPath,
          relativePath,
          groupId,
          manifest: JSON.parse(fs.readFileSync(manifestPath, 'utf8')),
        });
        logger.info('发现模板', `${item} (分组: ${groupId})`);
      }
      else {
        templates.push(...scanTemplates(fullPath, baseDir));
      }
    }
  }

  return templates;
}

function buildGroups(templates) {
  const groups = [];
  const templateMap = new Map();

  templates.forEach((template) => {
    const groupId = template.manifest.groupId || 'default';
    if (!templateMap.has(groupId)) {
      templateMap.set(groupId, []);
      groups.push({
        id: groupId,
        name: template.manifest.groupName || groupId,
        templates: [],
      });
    }
    templateMap.get(groupId).push({
      name: template.name,
      url: `./templates/${groupId}/${template.name}.json`,
    });
  });

  groups.forEach((group) => {
    group.templates = templateMap.get(group.id);
  });

  return groups;
}

async function buildTemplate(template, componentsDir, distDir) {
  const spinner = logger.spinner(`正在构建模板: ${template.name}`);
  spinner.start();

  try {
    const templateDistDir = path.join(distDir, 'templates', template.groupId);
    fs.mkdirSync(templateDistDir, { recursive: true });

    cleanupTemplateOutput(templateDistDir, template.name);

    buildComponent(template);

    const builtTemplatePath = path.join(distDir, 'templates', template.groupId, template.name);
    const result = await processTemplateFilesFromBuilt(template, builtTemplatePath);
    const outputJson = {
      id: template.manifest.id,
      name: template.manifest.name,
      version: template.manifest.version,
      description: template.manifest.description,
      author: template.manifest.author,
      license: template.manifest.license,
      code: result.code,
      style: result.style,
      signature: result.signature,
    };

    const outputPath = path.join(templateDistDir, `${template.name}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(outputJson, null, 2));
    logger.success('JSON 输出完成', outputPath);

    spinner.succeed(`模板构建完成: ${template.name}`);
  }
  catch (error) {
    spinner.fail(`模板构建失败: ${template.name}`);
    logger.error('构建错误', error.message);
    process.exit(1);
  }
}

async function processTemplateFilesFromBuilt(template, builtPath) {
  const jsFile = path.join(builtPath, 'index.js');
  const cssFile = path.join(builtPath, 'index.css');

  let code = '';
  let style = '';
  let signature = '';

  if (fs.existsSync(jsFile)) {
    const jsContent = fs.readFileSync(jsFile, 'utf8');
    const processedCode = transformExports(jsContent, template.name);
    if (processedCode) {
      signature = await getCodeSignature(processedCode);
      code = `${processedCode}

/* @signature:alg=ed25519;value=${signature} */`;

      logger.success('代码处理完成', `${template.name}/index.js`);
    }
    else {
      logger.warning('代码处理跳过', `${template.name}/index.js - 未找到匹配模式`);
    }
  }

  if (fs.existsSync(cssFile)) {
    style = fs.readFileSync(cssFile, 'utf8');
  }

  return { code, style, signature };
}

function cleanupTemplateOutput(templateDistDir, templateName) {
  const templatePath = path.join(templateDistDir, templateName);
  if (fs.existsSync(templatePath)) {
    fs.rmSync(templatePath, { recursive: true, force: true });
  }
}

function cleanupAllTemplates(distDir, templates) {
  logger.section('清理临时文件');

  templates.forEach((template) => {
    const builtPath = path.join(distDir, 'templates', template.groupId, template.name);
    if (fs.existsSync(builtPath)) {
      fs.rmSync(builtPath, { recursive: true, force: true });
    }
  });

  logger.success('临时文件已清理');
}

function buildComponent(template) {
  const env = {
    ...process.env,
    COMPONENT_NAME: template.name,
    COMPONENT_PATH: template.relativePath,
  };
  execSync('pnpm build', { env, stdio: 'inherit' });
}

async function getCodeSignature(code) {
  const res = await fetch('https://copicseal-trusted-code-signer.kohai.top/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      password: process.env.SIGN_PASSWORD,
    }),
  });
  const { signature } = await res.json();
  return signature;
}

function transformExports(content, componentName) {
  const startStr = `var ${componentName}=(function(`;
  const endStr = `})(Vue);`;

  const startIndex = content.indexOf(startStr);
  const endIndex = content.lastIndexOf(endStr);

  if (startIndex === -1 || endIndex === -1)
    return null;

  const iifeContent = content.substring(startIndex, endIndex + endStr.length);
  return iifeContent.replace(`var ${componentName}=`, `exports.${componentName}=`);
}

function generateManifest(distDir, componentsDir, templates) {
  logger.section('生成清单文件');

  const manifestJsonPath = path.join(componentsDir, 'manifest.json');
  if (!fs.existsSync(manifestJsonPath)) {
    logger.warning('清单文件未找到', path.basename(manifestJsonPath));
    return;
  }

  const rootManifest = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));

  const templatesByGroup = new Map();
  templates.forEach((template) => {
    const groupId = template.groupId || 'default';
    if (!templatesByGroup.has(groupId))
      templatesByGroup.set(groupId, []);
    templatesByGroup.get(groupId).push({
      name: template.name,
      id: template.manifest.id,
      description: template.manifest.description,
      url: `./templates/${groupId}/${template.name}.json`,
    });
  });

  if (rootManifest.groups && Array.isArray(rootManifest.groups)) {
    rootManifest.groups.forEach((group) => {
      group.templates = templatesByGroup.get(group.id) || [];
    });
  }

  fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(rootManifest, null, 2));
  logger.success('清单文件已生成', path.join(path.basename(distDir), 'manifest.json'));
}

run();
