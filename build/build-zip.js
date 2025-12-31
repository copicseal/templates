/* eslint-disable node/prefer-global/process */
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { run as buildComponents } from './build-components.js';
import { logger } from './logger.js';

async function run() {
  logger.title('ZIP 打包构建器', '构建模板并打包为 ZIP 文件');

  let buildResult = null;

  try {
    // Step 1: Run the build-components process directly
    const spinner = logger.spinner('正在运行构建进程...');
    spinner.start();
    buildResult = await buildComponents();
    spinner.succeed('构建进程完成');

    // Step 2: Read manifest to get library id
    const manifestPath = path.join(buildResult.distDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const libraryId = manifest.id || 'templates';

    logger.info('读取清单文件', `库ID: ${libraryId}`);

    // Step 3: Create ZIP archive from dist directory
    logger.section('创建 ZIP 压缩包');
    await createZipFromDist(buildResult.distDir, libraryId);

    const zipPath = path.join(buildResult.distDir, `${libraryId}.tpl.zip`);
    const stats = fs.statSync(zipPath);
    const fileSizeInBytes = stats.size;
    const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
    const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

    let sizeDisplay;
    if (fileSizeInBytes < 1024) {
      sizeDisplay = `${fileSizeInBytes} bytes`;
    }
    else if (fileSizeInBytes < 1024 * 1024) {
      sizeDisplay = `${fileSizeInKB} KB`;
    }
    else {
      sizeDisplay = `${fileSizeInMB} MB`;
    }

    logger.success('ZIP 构建完成', `文件大小: ${sizeDisplay}`);
    logger.stats('构建结果', {
      'ZIP 文件路径': path.basename(zipPath),
      '文件大小': sizeDisplay,
      '原始字节数': fileSizeInBytes.toLocaleString(),
      '库ID': libraryId,
    });
  }
  catch (error) {
    logger.error('构建失败', error.message);

    // Clean up on failure
    const distDir = buildResult?.distDir;
    if (distDir && fs.existsSync(distDir)) {
      logger.info('清理失败构建', '正在删除临时文件');
      fs.rmSync(distDir, { recursive: true, force: true });
    }

    process.exit(1);
  }
}

/**
 * Create a ZIP archive from the dist directory
 */
async function createZipFromDist(distDir, libraryId = 'templates') {
  if (!fs.existsSync(distDir)) {
    throw new Error(`Dist directory not found: ${distDir}`);
  }

  const zipPath = path.join(distDir, `${libraryId}.tpl.zip`);
  const zip = new JSZip();

  // Recursively add all files from dist directory to ZIP
  function addFilesToZip(dir, zipFolder = zip) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        // Add directory to ZIP
        const newFolder = zipFolder.folder(item);
        addFilesToZip(fullPath, newFolder);
      }
      else {
        // Add file to ZIP
        const content = fs.readFileSync(fullPath);
        zipFolder.file(item, content);
      }
    }
  }

  // Add all files from dist directory
  addFilesToZip(distDir);

  // Generate ZIP file
  const zipContent = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6,
    },
  });

  // Write ZIP file to dist directory
  fs.writeFileSync(zipPath, zipContent);

  logger.success('ZIP 压缩包已创建', path.basename(zipPath));
}

run();
