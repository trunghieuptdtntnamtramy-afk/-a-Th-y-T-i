import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesContent = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');

test('firestore.rules starts with rules_version = 2 and default-deny catch-all', () => {
  assert.match(rulesContent, /^rules_version\s*=\s*'2';/);
  assert.match(rulesContent, /match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
});

test('firestore.rules enforces email_verified == true and validates path IDs', () => {
  assert.match(rulesContent, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesContent, /function isValidId\(id\)/);
  assert.match(rulesContent, /\^\[a-zA-Z0-9_\\\\-\]\+\$/);
});

test('firestore.rules isolates PII and prevents self-assigned teacher/admin roles', () => {
  assert.match(rulesContent, /match \/private\/info/);
  assert.match(rulesContent, /incoming\(\)\.role == 'student'/);
  assert.match(rulesContent, /incoming\(\)\.teacherApproved == false/);
});

test('firestore.rules covers every collection in firebase-blueprint.json without blanket list reads', () => {
  const blueprint = JSON.parse(fs.readFileSync(new URL('./firebase-blueprint.json', import.meta.url), 'utf8'));
  const expectedCollections = ['users', 'studyTasks', 'thinkReflections', 'aiSessions', 'factChecks', 'selfTests', 'surveys'];
  for (const col of expectedCollections) {
    assert.ok(rulesContent.includes(`match /${col}/`), `Missing match block for ${col}`);
  }
  assert.ok(blueprint.firestore['/users/{userId}/private/info']);
  assert.doesNotMatch(rulesContent, /allow list:\s*if isSignedIn\(\);/);
});
