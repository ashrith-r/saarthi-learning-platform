import test from 'node:test';
import assert from 'node:assert/strict';
import { videoSource, safeMaterialUrl, validateMaterial } from '../services/materials.js';
test('video links normalize supported providers without accepting lookalike hosts', () => {
  assert.equal(videoSource('https://youtu.be/abcdefghijk').url, 'https://www.youtube-nocookie.com/embed/abcdefghijk');
  assert.equal(videoSource('https://youtube.com/watch?v=abcdefghijk&list=test').type, 'embed');
  assert.equal(videoSource('https://vimeo.com/12345').url, 'https://player.vimeo.com/video/12345');
  assert.equal(videoSource('https://example.org/lesson.mp4').type, 'video');
  assert.equal(videoSource('https://youtube.com.evil.example/watch?v=abcdefghijk').type, 'link');
  assert.equal(videoSource('javascript:alert(1)'), null);
});
test('material validation requires real content and safe links', () => {
  const body = { kind: 'document', title: 'Lesson notes', description: '', url: '' };
  assert.ok(validateMaterial(body)); assert.equal(validateMaterial(body, true), null);
  assert.ok(validateMaterial({ ...body, kind: 'video' }, true));
  assert.equal(safeMaterialUrl('https://user:pass@example.com/a'), null);
  assert.equal(safeMaterialUrl('data:text/html,test'), null);
});
