/*
 * Pruebas de la lógica pura de las herramientas. Carga los scripts en un
 * contexto con un `window`/`document` mínimo, igual que el navegador.
 * Ejecutar con: node --test tests/
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadApp() {
  const window = {};
  const context = vm.createContext({
    window,
    document: { addEventListener() {} },
    crypto: globalThis.crypto,
    TextEncoder, TextDecoder, btoa, atob
  });
  const html = fs.readFileSync(path.join(__dirname, '../src/index.html'), 'utf8');
  for (const [, src] of html.matchAll(/<script src="([^"]+)"><\/script>/g)) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', src), 'utf8'), context, { filename: src });
  }
  return window.Utilitario.lib;
}

const lib = loadApp();

test('RUT: dígito verificador', () => {
  assert.strictEqual(lib.rut.computeDV('12345678'), '5');
  assert.strictEqual(lib.rut.computeDV('11111111'), '1');
  assert.strictEqual(lib.rut.computeDV('10000013'), 'K');
  assert.strictEqual(lib.rut.computeDV('6'), 'K');
  assert.strictEqual(lib.rut.computeDV('3'), '5');
});

test('RUT: validar en distintos formatos', () => {
  assert.strictEqual(lib.rut.parse('12.345.678-5').valid, true);
  assert.strictEqual(lib.rut.parse('123456785').valid, true);
  assert.strictEqual(lib.rut.parse('10000013-k').valid, true);
  const bad = lib.rut.parse('12345678-9');
  assert.strictEqual(bad.valid, false);
  assert.strictEqual(bad.expected, '5');
  assert.throws(() => lib.rut.parse('abc'));
});

test('RUT: formatos', () => {
  assert.strictEqual(lib.rut.format('12345678', '5', 'puntos'), '12.345.678-5');
  assert.strictEqual(lib.rut.format('1234567', '4', 'puntos'), '1.234.567-4');
  assert.strictEqual(lib.rut.format('12345678', '5', 'guion'), '12345678-5');
  assert.strictEqual(lib.rut.format('12345678', '5', 'plano'), '123456785');
});

test('RUT: los generados son válidos', () => {
  for (const rut of lib.rut.generate(500, 'puntos')) {
    assert.match(rut, /^\d{1,2}\.\d{3}\.\d{3}-[\dK]$/);
    assert.strictEqual(lib.rut.parse(rut).valid, true, rut);
  }
});

test('Hash: vectores conocidos', async () => {
  assert.strictEqual(lib.hash.md5(''), 'd41d8cd98f00b204e9800998ecf8427e');
  assert.strictEqual(lib.hash.md5('The quick brown fox jumps over the lazy dog'), '9e107d9d372bb6826bd81d3542a419d6');
  assert.strictEqual(lib.hash.md5('ñandú'), require('node:crypto').createHash('md5').update('ñandú').digest('hex'));
  const long = 'x'.repeat(1000);
  assert.strictEqual(lib.hash.md5(long), require('node:crypto').createHash('md5').update(long).digest('hex'));
  assert.strictEqual(await lib.hash.hash('SHA-256', 'abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('Base64: ida y vuelta con UTF-8 y URL-safe', () => {
  const text = '{"fecha":"ñandú 🎉"}';
  const enc = lib.base64.encode(text);
  assert.strictEqual(lib.base64.decode(enc), text);
  assert.strictEqual(lib.base64.decode(enc.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')), text);
});

test('AES: cifrar y descifrar', async () => {
  const enc = await lib.aes.encrypt('secreto ñ 🎉', 'clave');
  assert.notStrictEqual(enc, await lib.aes.encrypt('secreto ñ 🎉', 'clave'));
  assert.strictEqual(await lib.aes.decrypt(enc, 'clave'), 'secreto ñ 🎉');
  await assert.rejects(lib.aes.decrypt(enc, 'otra'), /Contraseña incorrecta/);
  await assert.rejects(lib.aes.decrypt('hola', 'clave'), /no fue cifrado/);
});

test('Aleatorios: longitudes y caracteres', () => {
  assert.match(lib.random.hex(16), /^[0-9a-f]{32}$/);
  assert.match(lib.random.base64url(32), /^[A-Za-z0-9_-]{43}$/);
  assert.strictEqual(lib.random.password(25).length, 25);
});
