/**
 * 代码签名验证工具
 * 提供从接口获取公钥、本地验证签名等功能
 */

export type PublicKeyData = {
  alg: string
  publicKey: string
};

// 公钥缓存
let fetchPublicKeyPromise: Promise<PublicKeyData | null> | null = null;

async function fetchPublicKey(): Promise<PublicKeyData | null> {
  try {
    const response = await fetch('https://trusted-code-signer.copicseal.com/public-key');
    if (!response.ok) {
      throw new Error(`获取公钥失败: ${response.status}`);
    }
    const publicKeyData = await response.json();
    return publicKeyData;
  }
  catch (error) {
    console.warn('从接口获取公钥失败:', error);
    return null;
  }
}

async function getPublicKey() {
  if (fetchPublicKeyPromise) {
    return fetchPublicKeyPromise;
  }

  fetchPublicKeyPromise = fetchPublicKey();
  return fetchPublicKeyPromise;
}

export async function verifySignedCode(code: string): Promise<boolean> {
  const extracted = extractCode(code);
  if (!extracted)
    return false;

  const { content, signature } = extracted;
  const publicKeyPem = await getPublicKey();
  if (!publicKeyPem || !publicKeyPem.publicKey)
    return false;

  const publicKey = await crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(publicKeyPem.publicKey),
    { name: 'Ed25519' },
    false,
    ['verify'],
  );

  const valid = await crypto.subtle.verify(
    'Ed25519',
    publicKey,
    Uint8Array.from(atob(signature), c => c.charCodeAt(0)),
    new TextEncoder().encode(content),
  );

  return valid;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----(BEGIN|END) PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '');

  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    buf[i] = binary.charCodeAt(i);
  }

  return buf.buffer;
}
/**
 * 从代码中提取签名和内容
 */
function extractCode(code: string): { content: string, signature: string } | null {
  // eslint-disable-next-line regexp/no-super-linear-backtracking
  const match = code.match(/\/\*\s*@signature:[\s\S]*?value=([\w+/=]+)[\s\S]*?\*\//);

  if (!match)
    return null;

  const signature = match[1]!;

  const content = code
    .replace(/\/\*\s*@signature[\s\S]*?\*\//, '')
    .replace(/\/\/# sourceMappingURL=[\s\S]*$/, '')
    .trim();

  return { content, signature };
}
