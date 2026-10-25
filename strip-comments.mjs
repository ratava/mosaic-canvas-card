/**
 * Build-time comment stripper for the RELEASE bundle. Wired into vite.config.prod.ts
 * only — the dev build (vite.config.ts) keeps its comments.
 *
 * Runs as a `pre` transform, so it sees raw .ts source before vite's esbuild TS
 * transform, and it operates purely in memory: nothing on disk is ever modified.
 *
 * Modes:
 *   js    real JS/TS comments only (// and block). esbuild's minifier already
 *         removes these, so on its own this saves exactly 0 bytes — verified by
 *         byte-identical output hashes.
 *   tmpl  block comments sitting INSIDE template literals. Those are string data
 *         (the CSS section dividers and rationale notes in css`...`), so the
 *         minifier can't touch them and they DO ship. This is the only mode that
 *         moves the number: ~11 kB raw / ~4.9 kB gzipped off a ~580 kB build.
 *   all   both — the default, and what the release build uses. `js` costs nothing
 *         but keeps the saving intact if minify is ever turned down.
 *
 * Implementation is a char-by-char lexer tracking code / '' / "" / `` (with ${}
 * nesting) / regex-literal state, so template contents and strings containing "//"
 * are never mangled. Same approach as wrap-num-inputs.js used for the number
 * steppers — a regex would corrupt the css`` blocks.
 */

const IDENT = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$'.split(''));
// After these, a '/' is division, not the start of a regex literal.
const NO_REGEX_AFTER = new Set([')', ']', '}', ...IDENT]);

/** Replacement for a removed block comment: keep a newline if it spanned lines
 *  (ASI safety), otherwise a space so adjacent tokens can't fuse. */
const blockGap = (text) => (text.includes('\n') ? '\n' : ' ');

/**
 * Inside a template literal there is no such thing as a comment to the parser —
 * `/*` is only a comment by convention, because that is how the CSS in css`...`
 * writes one. Markup uses the same two characters for other things: `accept="image/*"`
 * is a MIME glob, not a comment, and stripping from there to the next comment
 * terminator in the file silently deletes hundreds of lines of markup.
 *
 * So a template `/*` is only a comment when BOTH hold:
 *   - it is not inside a "quoted attribute value", and
 *   - its body contains no backtick and no `${`.
 * A real CSS comment satisfies both trivially. The failure mode of guessing wrong
 * is now "a comment survives into the bundle" (a few bytes) rather than "markup
 * disappears" — which is the only acceptable direction for this trade.
 */
const looksLikeRealComment = (text) => !text.includes('`') && !text.includes('${');

export function stripComments(code, mode = 'all') {
  const stripJs = mode === 'js' || mode === 'all';
  const stripTmpl = mode === 'tmpl' || mode === 'all';
  const n = code.length;
  const out = [];
  // Context stack: 'code' (top level, blocks, and inside ${}) or 'tmpl'.
  const stack = ['code'];
  // Per-template-frame flag: are we inside a "quoted attribute value"? Only double
  // quotes are tracked — an apostrophe in template prose ("doesn't") is common and
  // tracking it would desync on every one of them. Indexed by stack position, so a
  // nested template inside ${} gets its own state.
  const inAttr = [false];
  let prevSig = '';
  let i = 0;

  while (i < n) {
    const c = code[i];
    const ctx = stack[stack.length - 1];

    if (ctx === 'tmpl') {
      if (c === '\\') { out.push(code.slice(i, i + 2)); i += 2; continue; }
      if (c === '`') { stack.pop(); inAttr.pop(); out.push(c); i++; prevSig = '`'; continue; }
      if (c === '$' && code[i + 1] === '{') {
        stack.push('code'); inAttr.push(false); out.push('${'); i += 2; prevSig = '{'; continue;
      }
      if (c === '"') {
        inAttr[inAttr.length - 1] = !inAttr[inAttr.length - 1];
        out.push(c); i++; continue;
      }
      // A block comment inside a template literal is string data (CSS/HTML).
      // Note: '//' is deliberately NOT treated as a comment here — templates are
      // full of protocol-relative and https:// URLs. And '/*' is only a comment
      // outside an attribute value and when it doesn't look like markup — see
      // looksLikeRealComment.
      if (c === '/' && code[i + 1] === '*') {
        let j = code.indexOf('*/', i + 2);
        j = j === -1 ? n : j + 2;
        const text = code.slice(i, j);
        const strip = stripTmpl && !inAttr[inAttr.length - 1] && looksLikeRealComment(text);
        out.push(strip ? blockGap(text) : text);
        i = j;
        continue;
      }
      out.push(c); i++; continue;
    }

    // --- code context (top level, block bodies, and ${} interpolations) ---
    if (c === '/' && code[i + 1] === '/') {
      let j = code.indexOf('\n', i);
      if (j === -1) j = n;
      if (!stripJs) out.push(code.slice(i, j));
      i = j; // leave the newline itself in place
      continue;
    }
    if (c === '/' && code[i + 1] === '*') {
      let j = code.indexOf('*/', i + 2);
      j = j === -1 ? n : j + 2;
      const text = code.slice(i, j);
      // Preserve legal comments so a stripped build stays licence-compliant and
      // comparable against the baseline, which keeps them too.
      const legal = text.startsWith('/*!') || /@license|@preserve/.test(text);
      if (stripJs && !legal) out.push(blockGap(text));
      else out.push(text);
      i = j;
      continue;
    }
    if (c === '/' && !NO_REGEX_AFTER.has(prevSig)) {
      // Regex literal — copy verbatim to the unescaped closing '/'.
      let j = i + 1;
      let inClass = false;
      while (j < n) {
        const d = code[j];
        if (d === '\\') { j += 2; continue; }
        if (d === '[') inClass = true;
        else if (d === ']') inClass = false;
        else if (d === '/' && !inClass) { j++; break; }
        else if (d === '\n') break;
        j++;
      }
      out.push(code.slice(i, j)); i = j; prevSig = '/'; continue;
    }
    if (c === "'" || c === '"') {
      const q = c;
      let j = i + 1;
      while (j < n) {
        const d = code[j];
        if (d === '\\') { j += 2; continue; }
        if (d === q || d === '\n') { j++; break; }
        j++;
      }
      out.push(code.slice(i, j)); i = j; prevSig = q; continue;
    }
    // Every stack.push/pop is mirrored on inAttr so the two stay index-aligned.
    if (c === '`') { stack.push('tmpl'); inAttr.push(false); out.push(c); i++; prevSig = '`'; continue; }
    if (c === '{') { stack.push('code'); inAttr.push(false); out.push(c); i++; prevSig = '{'; continue; }
    if (c === '}') {
      // Closes either a block/object or the ${} we pushed a 'code' frame for.
      if (stack.length > 1) { stack.pop(); inAttr.pop(); }
      out.push(c); i++; prevSig = '}'; continue;
    }
    if (!/\s/.test(c)) prevSig = c;
    out.push(c); i++;
  }

  return out.join('');
}

/** Vite plugin. Strips comments from every first-party .ts in the module graph. */
export default function stripCommentsPlugin(mode = 'all') {
  if (!['js', 'tmpl', 'all'].includes(mode)) {
    throw new Error(`stripComments mode must be js|tmpl|all, got "${mode}"`);
  }
  let removed = 0;
  let files = 0;
  return {
    name: 'mc-strip-comments',
    enforce: 'pre',
    transform(code, id) {
      // Query suffixes (?used, ?raw) and .d.ts never reach the bundle as code,
      // but the test is cheap and harmless either way.
      if (!/\.ts(\?|$)/.test(id) || id.includes('node_modules')) return null;
      const stripped = stripComments(code, mode);
      if (stripped.length !== code.length) {
        removed += code.length - stripped.length;
        files++;
      }
      return { code: stripped, map: null };
    },
    buildEnd() {
      console.log(
        `[mc-strip-comments] mode=${mode}: removed ${removed.toLocaleString()} chars from ${files} files`
      );
    },
  };
}
