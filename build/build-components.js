/* eslint-disable node/prefer-global/process */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';

// 加载.env文件
config();

// Directory containing Vue components
const componentsDir = path.resolve(process.cwd(), 'src/templates');

// Dist directory
const distDir = path.resolve(process.cwd(), 'dist');

// Clean dist directory first
if (fs.existsSync(distDir)) {
  console.log('Cleaning dist directory...');
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Get all component directories
const componentFiles = fs.readdirSync(componentsDir)
  .filter(item => fs.lstatSync(path.join(componentsDir, item)).isDirectory());

console.log(`Found ${componentFiles.length} components: ${componentFiles.join(', ')}`);

// Build each component
componentFiles.forEach(async (componentName) => {
  console.log(`\nBuilding component: ${componentName}`);

  try {
    // Set COMPONENT_NAME environment variable and run build
    const env = { ...process.env, COMPONENT_NAME: componentName };
    execSync('pnpm build', { env, stdio: 'inherit' });

    const componentTemplateDir = path.join(distDir, 'templates', componentName);
    fs.mkdirSync(componentTemplateDir, { recursive: true });

    // Copy component's JSON file as manifest.json
    const componentJsonPath = path.join(componentsDir, componentName, `manifest.json`);
    if (fs.existsSync(componentJsonPath)) {
      const componentJson = JSON.parse(fs.readFileSync(componentJsonPath, 'utf8'));
      fs.writeFileSync(path.join(componentTemplateDir, 'manifest.json'), JSON.stringify(componentJson, null, 2));
      console.log(`✓ Copied and updated ${componentName} manifest.json`);
    }

    // Post-process the generated index.js file to match expected format
    const indexFile = path.join(componentTemplateDir, 'index.js');
    if (fs.existsSync(indexFile)) {
      const content = fs.readFileSync(indexFile, 'utf8');

      // Convert var xxx = (function(e) {...})(Vue); to exports.xxx = function(Vue) {...}(Vue);
      // Use string manipulation for better reliability with minified code
      const startStr = `var ${componentName}=(function(`;
      const endStr = `})(Vue);`;

      const startIndex = content.indexOf(startStr);
      const endIndex = content.lastIndexOf(endStr);

      if (startIndex !== -1 && endIndex !== -1) {
        // Replace IIFE wrapper with exports format
        // Extract the entire IIFE content and rebuild it with exports
        const iifeContent = content.substring(startIndex, endIndex + endStr.length);

        // Replace var xxx = (function(e) {...})(Vue); with exports.xxx = (function(e) {...})(Vue);
        const newContent = iifeContent.replace(`var ${componentName}=`, `exports.${componentName}=`);
        const signedContent = await codeSign(newContent);
        fs.writeFileSync(indexFile, signedContent, 'utf8');
        console.log(`✓ Successfully processed ${componentName} index.js`);
      }
      else {
        console.warn(`✗ Could not process ${componentName} index.js - pattern not found`);
        console.log('File content:');
        console.log(content);
      }
    }

    console.log(`✓ Successfully built ${componentName}`);
  }
  catch (error) {
    console.error(`✗ Failed to build ${componentName}:`, error.message);
    process.exit(1);
  }
});

const manifestJsonPath = path.join(componentsDir, 'manifest.json');
if (fs.existsSync(manifestJsonPath)) {
  const rootManifest = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
  rootManifest.templates = componentFiles.map(component => `./templates/${component}`); // List template paths

  fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(rootManifest, null, 2));
}

console.log('\n🎉 All components built successfully!');

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
