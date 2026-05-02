# Cache-Busting Playbook (it works)

The recipe that finally fixed math-display bleeds caused by stale browser caches. **Use this exact pattern site-wide. Nothing else fully works.**

## The root cause we kept missing

When CSS/JS/JSON files change but their URLs stay the same, browsers serve the cached old copy — sometimes for hours or days. Cache-control meta tags on HTML pages **do not** apply to subresources fetched by those pages. Every link in the chain (HTML → CSS → JS → JSON) needs its own cache-busting stamp, or the browser will mix old and new code and produce baffling behaviour (delimiter changes that "don't work", JSON that "didn't update", etc.).

## The five-link chain

Every one of these must be cache-busted:

```
1. HTML page                      <-- cache-control meta + ?v= on every CSS/JS include
2. CSS files                      <-- ?v= on the <link rel="stylesheet">
3. JS files                       <-- ?v= on the <script src>
4. JS-fetched JSON / data files   <-- ?v= appended at fetch() call site
5. Sub-pages reached from JS      <-- inherit via <meta name="site-version">
```

**The link that bit us:** #4. `engine.js` was doing `fetch('data/maths.json')` — no version. Even after we updated maths.json + bumped HTML, browsers kept the old JSON forever.

## The pattern that works

### a) Top-level HTML pages
```html
<head>
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <meta name="site-version" content="20260502-0237">  <!-- bumped automatically -->

  <link rel="stylesheet" href="css/reading-room.css?v=20260502-0237">
  <script src="js/engine.js?v=20260502-0237"></script>
</head>
```

### b) JS files that fetch JSON or other data
```js
const _sv = (document.querySelector('meta[name="site-version"]') || {}).content
            || String(Date.now());
fetch('data/' + subject + '.json?v=' + encodeURIComponent(_sv));
```

### c) The bumper script

The script must walk the **entire repo** (root + all subfolders), not just root HTMLs.

The bumper does three jobs:
1. Replace any existing `?v=YYYYMMDD-HHMM` with today's stamp
2. Update every `<meta name="site-version" content="...">`
3. Auto-stamp any newly-added naked CSS/JS includes (`href="x.css"` → `href="x.css?v=..."`)

Implementation lives in `bump-version.sh` + `bump-version-helper.py`. **Use the Python helper file pattern, not inline heredoc** — heredoc-with-regex breaks under linter formatting (we learned that the hard way).

## When you change a file, run

```
./bump-version.sh
```

…before committing. That's it. Every browser will refetch on next visit because every URL has changed.

## One-time workaround for the user's own browser

After the first deploy of new cache-busting, the browser may still hold the pre-busted version of files (because there was no `?v=` to differentiate). The fix:

1. DevTools → Network tab → check **"Disable cache"**
2. Cmd-Shift-R (hard refresh)
3. Disable cache can stay off after; the version stamps do the work going forward.

After that one manual bust, you never need to do it again.

## Recipe order when shipping a fix that touches CSS/JS/JSON

1. Edit the source files.
2. Run `./bump-version.sh`. This stamps every dependent reference.
3. `git add -A && git commit && git push`.
4. (First deploy only) tell yourself / collaborators to do the one-time DevTools hard refresh.

## Don'ts

- **Don't** rely on `<meta http-equiv="Cache-Control">` alone — it only affects the HTML response, not subresources.
- **Don't** use heredoc-embedded Python with regex inside a shell script — linters reformat the embedded `re.compile(r"...")` calls and break escapes. Put the Python in its own `.py` file.
- **Don't** version-stamp by hand — easy to miss one and the bleed comes back. Always run the script.
- **Don't** assume "it works on my phone, must work on desktop" — phones are often LESS aggressive about caching than desktop browsers. Desktop is where stale bugs hide.

## The historical post-mortem (so we never re-debug this)

- We chased "delimiter conflicts" and "renderMath timing bugs" for hours. Every fix appeared to fail.
- The real cause was that each "fixed" engine.js was being shipped to disk + push but the browser kept loading the **previous** version because nothing told it the URL had changed.
- The smoking gun was the screenshot showing literal `\(-1\)` text — KaTeX's auto-render had been correctly configured for hours, but the browser was running an engine.js from before that config existed.
- The fix is structural, not code-level: cache-busting at every link in the chain. Once done, edits propagate immediately on bump+push.
