/* eslint-disable node/prefer-global/process */
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { run as buildComponents } from './build-components.js';

async function run() {
  let buildResult = null;

  try {
    // Step 1: Run the build-components process directly
    console.log('🚀 Starting build process...');
    buildResult = await buildComponents();

    // Step 2: Read manifest to get library id
    const manifestPath = path.join(buildResult.distDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const libraryId = manifest.id || 'templates';

    // Step 3: Create ZIP archive from dist directory
    console.log('\n📦 Creating ZIP archive...');
    await createZipFromDist(buildResult.distDir, libraryId);

    const zipPath = path.join(buildResult.distDir, `${libraryId}-templates.zip`);
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

    console.log(`\n✅ Build completed successfully!`);
    console.log(`📁 ZIP file: ${zipPath}`);
    console.log(`📊 Size: ${sizeDisplay} (${fileSizeInBytes} bytes)`);
  }
  catch (error) {
    console.error('❌ Build failed:', error.message);

    // Clean up on failure
    const distDir = buildResult?.distDir;
    if (distDir && fs.existsSync(distDir)) {
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

  const zipPath = path.join(distDir, `${libraryId}-templates.zip`);
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

  console.log(`📁 Created ZIP archive: ${zipPath}`);
}

run();
