const ITERACIONES = 180000;

function bytesAHex(bytes) {
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

function hexABytes(hex) {
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < result.length; i += 1) result[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return result;
}

function requiereWebCrypto() {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error('Este navegador no dispone de Web Crypto. Abre la app con Live Server o desde GitHub Pages (HTTPS).');
  }
}

export async function crearCredencial(contrasena) {
  requiereWebCrypto();
  const sal = new Uint8Array(16);
  globalThis.crypto.getRandomValues(sal);
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(contrasena), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: sal, iterations: ITERACIONES, hash: 'SHA-256' }, keyMaterial, 256);
  return { sal: bytesAHex(sal), hash: bytesAHex(bits), iteraciones: ITERACIONES, intentosFallidos: 0, bloqueado: false };
}

export async function verificarContrasena(contrasena, credencial) {
  requiereWebCrypto();
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(contrasena), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: hexABytes(credencial.sal), iterations: credencial.iteraciones || ITERACIONES, hash: 'SHA-256' }, keyMaterial, 256);
  const calculado = bytesAHex(bits);
  if (calculado.length !== credencial.hash.length) return false;
  let diferencia = 0;
  for (let i = 0; i < calculado.length; i += 1) diferencia |= calculado.charCodeAt(i) ^ credencial.hash.charCodeAt(i);
  return diferencia === 0;
}
