import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesText = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');

test('Dirty Dozen Security Invariants in firestore.rules', () => {
  // 1. Default deny catch-all
  assert.ok(rulesText.includes('match /{document=**} {\n      allow read, write: if false;\n    }'));
  // 2. Strict key allowlists on all entities
  assert.ok(rulesText.includes('data.keys().hasAll(['));
  assert.ok(rulesText.includes('data.keys().hasOnly(['));
  // 3. Verified email check on writes
  assert.ok(rulesText.includes('request.auth.token.email_verified == true'));
  // 4. Terminal state locking on requests
  assert.ok(rulesText.includes("existing().status == 'pending'"));
  // 5. Recipient-only request acceptance
  assert.ok(rulesText.includes('existing().toUid == request.auth.uid'));
  // 6. Denial of wallet size checks
  assert.ok(rulesText.includes('data.caption.size() <= 500'));
  // 7. Message sender identity check
  assert.ok(rulesText.includes('data.senderUid == request.auth.uid'));
  // 8. Query Enforcer on list operations
  assert.ok(rulesText.includes('(existing().senderUid == request.auth.uid || existing().receiverUid == request.auth.uid)'));
  // 9. Server timestamp enforcement
  assert.ok(rulesText.includes('incoming().createdAt == request.time'));
  // 10. Immortal field protection
  assert.ok(rulesText.includes('incoming().createdAt == existing().createdAt'));
  // 11. Path variable regex hardening
  assert.ok(rulesText.includes("id.matches('^[a-zA-Z0-9_\\\\-]+$')"));
  // 12. Study note focusMinutes integer bounds
  assert.ok(rulesText.includes('data.focusMinutes is int && data.focusMinutes >= 1 && data.focusMinutes <= 240'));
});
