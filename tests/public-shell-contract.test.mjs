import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read=p=>readFileSync(p,'utf8');
const app=read('web/app.js');
const welcome=read('web/welcome-profile.js');
const constraints=read('web/constraints-preview.js');
const config=read('web/config.js');
const privacy=read('web/privacy.html');

test('public shell keeps both English and Bangla product paths',()=>{
  assert.match(welcome,/Start a new assessment/);
  assert.match(welcome,/নতুন মূল্যায়ন শুরু করুন/);
  assert.match(constraints,/sample-report\.html/);
  assert.match(constraints,/sample-report-bn\.html/);
});

test('payment remains disabled in the public shell',()=>{
  assert.match(config,/PAYMENTS_ENABLED = false/);
});

test('private QA report controls are excluded',()=>{
  assert.doesNotMatch(constraints,/Review full report \(test\)|Download PDF \(test\)|download-full-report-pdf|mode:'review'/);
});

test('privacy surface publishes only Mangrove public mailboxes',()=>{
  assert.match(privacy,/support@mangroveintel\.com/);
  assert.match(privacy,/privacy@mangroveintel\.com/);
  assert.doesNotMatch(privacy,/[A-Z0-9._%+-]+@(?:gmail|googlemail)\.com/i);
});

test('browser owns presentation, not scoring',()=>{
  for(const source of [app,welcome,constraints]){
    assert.doesNotMatch(source,/CAREER_WEIGHTS|capability_weights|preference_targets/);
  }
});
