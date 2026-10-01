import test from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../app/js/markdown.js";

test("Absätze, fett, kursiv", () => {
  const h = renderMarkdown("Ein **fetter** und *kursiver* Text.\n\nZweiter Absatz.");
  assert.equal(h, "<p>Ein <strong>fetter</strong> und <em>kursiver</em> Text.</p>\n<p>Zweiter Absatz.</p>");
});

test("Überschriften und Listen", () => {
  const h = renderMarkdown("### Titel\n\n- eins\n- zwei\n\n1. a\n2. b");
  assert.match(h, /<h5>Titel<\/h5>/);
  assert.match(h, /<ul><li>eins<\/li><li>zwei<\/li><\/ul>/);
  assert.match(h, /<ol><li>a<\/li><li>b<\/li><\/ol>/);
});

test("HTML in den Daten wird escaped, nie interpretiert", () => {
  const h = renderMarkdown('<script>alert(1)</script> <img src=x onerror="alert(2)"> **<b>x</b>**');
  assert.ok(!h.includes("<script"));
  assert.ok(!h.includes("<img"));
  assert.ok(!h.includes("<b>"));
  assert.match(h, /&lt;script&gt;/);
  assert.match(h, /<strong>&lt;b&gt;x&lt;\/b&gt;<\/strong>/);
});

test("Markdown-Links werden nicht zu Links", () => {
  const h = renderMarkdown("[klick](javascript:alert(1))");
  assert.ok(!h.includes("<a"));
});
