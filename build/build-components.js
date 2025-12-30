/* eslint-disable node/prefer-global/process */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';

config();

export async function run() {
  const componentsDir = path.resolve(process.cwd(), 'src/templates');
  const distDir = path.resolve(process.cwd(), 'dist');

  initDist(distDir);

  const templates = scanTemplates(componentsDir);

  const groups = buildGroups(templates);

  console.log(`Found ${templates.length} templates in ${groups.length} groups`);

  for (const template of templates) {
    await buildTemplate(template, componentsDir, distDir);
  }

  generateManifest(distDir, componentsDir, templates);

  console.log('\n🎉 All components built successfully!');

  return { distDir, templates, groups };
}

function initDist(distDir) {
  if (fs.existsSync(distDir)) {
    console.log('Cleaning dist directory...');
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
}

function scanTemplates(dir, baseDir = dir) {
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
      url: `./templates/${template.relativePath}`,
    });
  });

  groups.forEach((group) => {
    group.templates = templateMap.get(group.id);
  });

  return groups;
}

async function buildTemplate(template, componentsDir, distDir) {
  console.log(`\nBuilding template: ${template.name}`);

  try {
    buildComponent(template);

    const templateDistDir = path.join(distDir, 'templates', template.relativePath);
    fs.mkdirSync(templateDistDir, { recursive: true });

    copyManifest(template, templateDistDir);
    await processIndexFile(template, templateDistDir);

    console.log(`✓ Successfully built ${template.name}`);
  }
  catch (error) {
    console.error(`✗ Failed to build ${template.name}:`, error.message);
    process.exit(1);
  }
}

function buildComponent(template) {
  const env = {
    ...process.env,
    COMPONENT_NAME: template.name,
    COMPONENT_PATH: template.relativePath,
  };
  execSync('pnpm build', { env, stdio: 'inherit' });
}

function copyManifest(template, templateDistDir) {
  const manifestPath = path.join(templateDistDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(template.manifest, null, 2));
  console.log(`✓ Copied ${template.name} manifest.json`);
}

async function processIndexFile(template, templateDistDir) {
  const indexFile = path.join(templateDistDir, 'index.js');
  if (!fs.existsSync(indexFile))
    return;

  const content = fs.readFileSync(indexFile, 'utf8');
  const processedContent = transformExports(content, template.name);

  if (processedContent) {
    const signedContent = await codeSign(processedContent);
    fs.writeFileSync(indexFile, signedContent, 'utf8');
    console.log(`✓ Successfully processed ${template.name} index.js`);
  }
  else {
    console.warn(`✗ Could not process ${template.name} index.js - pattern not found`);
  }
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
  const manifestJsonPath = path.join(componentsDir, 'manifest.json');
  if (!fs.existsSync(manifestJsonPath))
    return;

  const rootManifest = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));

  const templatesByGroup = new Map();
  templates.forEach((template) => {
    const groupId = template.groupId || 'default';
    if (!templatesByGroup.has(groupId))
      templatesByGroup.set(groupId, []);
    templatesByGroup.get(groupId).push({
      name: template.name,
      url: `./templates/${template.relativePath.replace(/\\/g, '/')}`,
    });
  });

  if (rootManifest.groups && Array.isArray(rootManifest.groups)) {
    rootManifest.groups.forEach((group) => {
      group.templates = templatesByGroup.get(group.id) || [];
    });
  }

  fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(rootManifest, null, 2));
}

async function codeSign(code) {
  const res = await fetch('https://copicseal-trusted-code-signer.kohai.top/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      password: process.env.SIGN_PASSWORD,
    }),
  });

  const { signature } = await res.json();

  return `${code}

/* @signature:alg=ed25519;value=${signature} */
`;
}

run();
