#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable node/prefer-global/process */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import ora from 'ora';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 简化的Logger类，类似于项目中的logger
class Logger {
  constructor() {
    this.startTime = Date.now();
  }

  info(message, details = '') {
    const timestamp = this.getTimestamp();
    const fullMessage = details ? `${message} ${chalk.gray('→')} ${details}` : message;
    console.log(`${chalk.blue('ℹ️')} [${timestamp}] ${fullMessage}`);
  }

  success(message, details = '') {
    const timestamp = this.getTimestamp();
    const fullMessage = details ? `${message} ${chalk.gray('→')} ${details}` : message;
    console.log(`${chalk.green('✅')} [${timestamp}] ${fullMessage}`);
  }

  warning(message, details = '') {
    const timestamp = this.getTimestamp();
    const fullMessage = details ? `${message} ${chalk.gray('→')} ${details}` : message;
    console.log(`${chalk.yellow('⚠️')} [${timestamp}] ${fullMessage}`);
  }

  error(message, details = '') {
    const timestamp = this.getTimestamp();
    const fullMessage = details ? `${message} ${chalk.gray('→')} ${details}` : message;
    console.log(`${chalk.red('❌')} [${timestamp}] ${fullMessage}`);
  }

  title(title, subtitle = '') {
    const border = chalk.cyan('═').repeat(50);
    const titleLine = chalk.cyan(`╔${border}╗`);
    const content = chalk.white(`║${title.padEnd(50)}║`);
    const subtitleLine = subtitle ? chalk.gray(`║${subtitle.padEnd(50)}║`) : '';
    const endLine = chalk.cyan(`╚${border}╝`);

    console.log(`\n${titleLine}`);
    console.log(content);
    if (subtitleLine)
      console.log(subtitleLine);
    console.log(`${endLine}\n`);
  }

  spinner(text) {
    return ora({
      text: chalk.yellow(text),
      spinner: 'dots12',
      color: 'yellow',
    });
  }

  stats(title, data) {
    console.log(`\n${chalk.magenta('📊')} ${chalk.magentaBright.bold(title)}:`);
    Object.entries(data).forEach(([key, value]) => {
      const formattedValue = typeof value === 'number' ? chalk.cyanBright(value.toString()) : chalk.gray(value);
      console.log(`   ${chalk.white('•')} ${key}: ${formattedValue}`);
    });
    console.log('');
  }

  progress(current, total, label = 'Progress') {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((percentage / 100) * 20);
    const empty = 20 - filled;
    const bar = chalk.green('█').repeat(filled) + chalk.gray('░').repeat(empty);

    process.stdout.write(`\r${chalk.blue('🔄')} ${label}: [${bar}] ${percentage}% (${current}/${total})`);
    if (current === total) {
      console.log('\n');
    }
  }

  formatTime(ms) {
    if (ms < 1000)
      return `${ms}ms`;
    if (ms < 60000)
      return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  timing(label) {
    const duration = Date.now() - this.startTime;
    console.log(`${chalk.gray('⏱️')} ${label}: ${chalk.cyanBright(this.formatTime(duration))}`);
  }

  getTimestamp() {
    return new Date().toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  separator(char = '─', length = 50) {
    console.log(chalk.gray(char.repeat(length)));
  }

  space() {
    console.log('');
  }

  section(title) {
    this.separator();
    console.log(`${chalk.cyan('▶')} ${chalk.cyanBright.bold(title)}`);
    this.separator();
  }
}

// 创建logger实例
const logger = new Logger();

// 执行 ESLint 检查
function runEslintCheck(targetDir) {
  return new Promise((resolve, reject) => {
    logger.section('代码质量检查');

    const eslintPath = path.join(__dirname, '..', 'node_modules', '.bin', 'eslint');
    const targetPath = targetDir;

    if (!fs.existsSync(eslintPath)) {
      logger.warning('ESLint 未找到', '跳过代码质量检查');
      resolve();
      return;
    }

    logger.info('运行 ESLint 检查', targetPath);

    const eslintProcess = spawn(eslintPath, [targetPath, '--fix'], {
      stdio: 'inherit',
      shell: true,
    });

    eslintProcess.on('close', (code) => {
      if (code === 0) {
        logger.success('代码质量检查通过');
        resolve();
      }
      else {
        logger.warning('ESLint 检查发现问题', '请查看上方输出并手动修复');
        resolve(); // 不阻塞流程，即使 ESLint 有问题也继续
      }
    });

    eslintProcess.on('error', (error) => {
      logger.warning('ESLint 执行失败', error.message);
      resolve(); // 不阻塞流程
    });
  });
}

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 问题函数
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

// 验证输入
function validateInput(input, type) {
  if (!input || input.trim() === '') {
    return false;
  }

  if (type === 'group') {
    // 分组名称只能包含字母、数字、连字符和下划线
    return /^[\w-]+$/.test(input.trim());
  }

  if (type === 'template') {
    // 模板名称只能包含字母、数字、连字符和下划线
    return /^[\w-]+$/.test(input.trim());
  }

  return true;
}

// 路径设置
const ROOT_DIR = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'src', 'templates');
const ROOT_MANIFEST_PATH = path.join(TEMPLATES_DIR, 'manifest.json');

// Vue 模板
const VUE_TEMPLATE = `<template>
  <div class="tpl-card" :style="{}">
    <img class="main-image" :src="imgUrl">
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

defineOptions({
  id: '{GROUP_ID}-{TEMPLATE_ID}',
  name: '{TEMPLATE_NAME}',
  title: '{TEMPLATE_NAME}',
});

defineProps({
  utils: {
    type: Object,
    default: () => ({}),
  },
  imgUrl: String,
  info: {
    type: Object,
    default: () => ({}),
  },
  borderPadding: {
    type: Number,
    default: 0.04,
    __co: {
      label: '相框边距',
    },
  },
});
</script>

<style lang="scss" scoped>
.tpl-card {
  padding: 0.04rem 0.04rem 0;
  color: #000;
  background-color: #fff;
}

.card-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 0.4rem;
  padding-left: 0.1rem;
  padding-right: 0.1rem;
  padding-top: 0.02rem;
  font-size: 0.1rem;
}

.main-image {
  width: 1rem;
  height: auto;
}
</style>`;

// 创建目录
function createDirectories(groupName, templateName) {
  const groupDir = path.join(TEMPLATES_DIR, groupName);
  const templateDir = path.join(groupDir, templateName);

  logger.info('创建目录', templateDir);
  fs.mkdirSync(templateDir, { recursive: true });
  return templateDir;
}

// 创建 Vue 文件
function createVueFile(templateDir, groupName, templateName) {
  const vuePath = path.join(templateDir, 'index.vue');
  let vueContent = VUE_TEMPLATE;

  // 替换模板变量
  vueContent = vueContent
    .replace(/\{GROUP_ID\}/g, groupName.toLowerCase())
    .replace(/\{TEMPLATE_ID\}/g, templateName.toLowerCase())
    .replace(/\{TEMPLATE_NAME\}/g, templateName);

  logger.info('创建 Vue 文件', vuePath);
  fs.writeFileSync(vuePath, vueContent, 'utf8');
}

// 创建 Manifest 文件
function createManifestFile(templateDir, groupName, templateName) {
  const manifestPath = path.join(templateDir, 'manifest.json');

  const manifest = {
    id: `${templateName.toLowerCase()}`,
    name: templateName,
    version: '1.0.0',
    description: `${templateName} 模板`,
    entry: 'index.js',
    css: 'index.css',
    files: [
      'index.js',
      'index.css',
    ],
    author: '',
    license: 'MIT',
  };

  logger.info('创建 Manifest 文件', manifestPath);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

// 更新根目录 Manifest 文件
function updateRootManifest(groupName, templateName, templateId) {
  logger.info('更新根目录 Manifest 文件', ROOT_MANIFEST_PATH);

  if (!fs.existsSync(ROOT_MANIFEST_PATH)) {
    logger.warning('根目录 Manifest 文件不存在', '创建新的...');
    const defaultManifest = {
      id: 'CopicsealDefault',
      name: 'Copicseal 默认模板库',
      version: '1.0.0',
      description: 'Copicseal 默认模板库',
      groups: [],
    };
    fs.writeFileSync(ROOT_MANIFEST_PATH, JSON.stringify(defaultManifest, null, 2), 'utf8');
  }

  const manifestContent = fs.readFileSync(ROOT_MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(manifestContent);

  // 查找或创建分组
  let group = manifest.groups.find(g => g.id === groupName);
  if (!group) {
    logger.info('创建新的模板分组', groupName);
    group = {
      id: groupName,
      name: `模板分组 ${groupName}`,
      description: `${groupName} 模板分组`,
      templates: [],
    };
    manifest.groups.push(group);
  }

  // 写回文件
  fs.writeFileSync(ROOT_MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
}

// 显示使用说明
function showUsage() {
  logger.title('Copicseal 模板创建工具', '快速创建新的 Vue 模板');

  logger.section('使用方法');
  logger.info('交互式创建', '直接运行脚本');
  logger.info('命令行参数', 'node build/create-template.js <group> <template-name>');

  logger.space();
}

// 主函数
async function main() {
  let groupName, templateName;

  // 检查命令行参数
  if (process.argv.length >= 4) {
    groupName = process.argv[2];
    templateName = process.argv[3];
  }
  else {
    // 交互式模式
    showUsage();

    logger.section('模板配置');

    // 获取分组名称
    while (true) {
      groupName = await question(`${chalk.cyan('🏷️')} 输入分组名称 ${chalk.gray('(例如: photography-templates)')}: `);
      groupName = groupName.trim();

      if (validateInput(groupName, 'group')) {
        logger.success('分组名称验证通过', groupName);
        break;
      }
      else {
        logger.error('分组名称格式无效', '只能包含字母、数字、连字符和下划线');
      }
    }

    // 获取模板名称
    while (true) {
      templateName = await question(`${chalk.cyan('📋')} 输入模板名称 ${chalk.gray('(例如: LandscapeCard)')}: `);
      templateName = templateName.trim();

      if (validateInput(templateName, 'template')) {
        logger.success('模板名称验证通过', templateName);
        break;
      }
      else {
        logger.error('模板名称格式无效', '只能包含字母、数字、连字符和下划线');
      }
    }

    logger.space();
  }

  const templateId = `${groupName.toLowerCase()}-${templateName.toLowerCase()}`;

  logger.section('开始创建');
  logger.info('分组名称', groupName);
  logger.info('模板名称', templateName);
  logger.info('模板ID', templateId);

  const buildSpinner = logger.spinner('正在创建模板文件...');
  buildSpinner.start();

  try {
    // 检查是否已存在
    const templateDir = path.join(TEMPLATES_DIR, groupName, templateName);
    if (fs.existsSync(templateDir)) {
      buildSpinner.stop();
      logger.error('模板已存在', templateDir);
      rl.close();
      return;
    }

    // 创建文件
    const newTemplateDir = createDirectories(groupName, templateName);
    createVueFile(newTemplateDir, groupName, templateName);
    createManifestFile(newTemplateDir, groupName, templateName);
    updateRootManifest(groupName, templateName, templateId);

    buildSpinner.stop();

    logger.success('模板创建成功!', newTemplateDir);

    // 执行 ESLint 检查
    await runEslintCheck(TEMPLATES_DIR);

    logger.section('后续步骤');
    logger.info('1. 编辑 Vue 文件', path.join(newTemplateDir, 'index.vue'));
    logger.info('2. 编辑配置文件', path.join(newTemplateDir, 'manifest.json'));
    logger.info('3. 重启应用', '查看新模板');

    logger.stats('创建统计', {
      模板路径: newTemplateDir,
      分组: groupName,
      模板: templateName,
      完成时间: new Date().toLocaleString('zh-CN'),
    });

    logger.timing('总耗时');
  }
  catch (error) {
    buildSpinner.stop();
    logger.error('创建模板时出错', error.message);
  }
  finally {
    rl.close();
  }
}

// 运行主函数
main();
