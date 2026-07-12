'use strict';

// Tests for babyplan/design-previews/preview.html
//
// This repo has no test framework configured, so these tests use Node's
// built-in test runner (`node --test`) and make no assumptions about any
// bundler/build step, since preview.html is a self-contained static file.
//
// Scope: only the CSS change to `nav.jump .wrap` (switch from horizontal
// scrolling to wrapping so the nav tabs are no longer clipped/hidden off
// screen) is covered here, per the PR diff.

const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PREVIEW_HTML_PATH = path.join(__dirname, 'preview.html');

describe('babyplan/design-previews/preview.html - nav.jump .wrap styling', () => {
  let html;
  let navWrapRule;

  before(() => {
    html = fs.readFileSync(PREVIEW_HTML_PATH, 'utf8');

    // Isolate just the `<style>` block's `nav.jump .wrap{...}` declaration.
    // Using a targeted regex (rather than a full CSS parser) keeps this test
    // dependency-free while still precisely matching the selector changed in
    // the PR (as opposed to the unrelated top-level `.wrap{...}` rule used
    // for page content, or `.tablewrap`, `.tabs`, `.act-switch`, etc.).
    const match = html.match(/nav\.jump\s*\.wrap\s*\{([^}]*)\}/);
    assert.ok(match, 'expected to find a `nav.jump .wrap{...}` CSS rule in preview.html');
    navWrapRule = match[1];
  });

  test('the file exists and is non-empty', () => {
    assert.ok(html.length > 0);
  });

  test('nav.jump .wrap enables flex-wrap so tabs wrap instead of clipping', () => {
    assert.match(navWrapRule, /flex-wrap\s*:\s*wrap\s*;/);
  });

  test('nav.jump .wrap no longer relies on horizontal scrolling', () => {
    assert.doesNotMatch(navWrapRule, /overflow-x\s*:\s*auto/);
    assert.doesNotMatch(navWrapRule, /scrollbar-width\s*:\s*thin/);
  });

  test('nav.jump .wrap retains its flex layout and spacing', () => {
    assert.match(navWrapRule, /display\s*:\s*flex\s*;/);
    assert.match(navWrapRule, /gap\s*:\s*\.15rem\s*;/);
    assert.match(navWrapRule, /padding-top\s*:\s*\.5rem\s*;/);
    assert.match(navWrapRule, /padding-bottom\s*:\s*\.5rem\s*;/);
  });

  test('there is exactly one nav.jump .wrap rule (no duplicate/conflicting declarations)', () => {
    const occurrences = html.match(/nav\.jump\s*\.wrap\s*\{/g) || [];
    assert.equal(occurrences.length, 1);
  });

  test('unrelated overflow-x rules elsewhere in the stylesheet (e.g. .tablewrap) are unaffected', () => {
    // Regression/negative check: make sure fixing nav.jump .wrap did not
    // accidentally remove overflow-x handling from other, unrelated
    // scrollable containers such as the timeline table wrapper.
    assert.match(html, /\.tablewrap\s*\{[^}]*overflow-x\s*:\s*auto/);
  });

  test('the nav tab list still renders all expected tabs (structure untouched by the CSS fix)', () => {
    const tabMatches = html.match(/<button role="tab" id="navtab-[^"]+"/g) || [];
    // 14 tabs existed before and after this CSS-only change; wrapping must
    // not have been introduced by (or require) removing any nav items.
    assert.equal(tabMatches.length, 14);
  });
});