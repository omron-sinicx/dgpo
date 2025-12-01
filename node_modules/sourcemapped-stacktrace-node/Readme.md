# sourcemapped-stacktrace-node

⚠️ This is a lazy fork of a [sourcemapped-stacktrace](https://github.com/novocaine/sourcemapped-stacktrace). To do all things right I need to do a lot of refactoring, for which I do not have time right now. So I did minimal change to be able to use it as npm package. [This](https://github.com/novocaine/sourcemapped-stacktrace/pull/31) is a PR with first steps of a refactoring. **Highly experimental. Undocumented.**

## TODO

- Support node modules, but check if file is readable
- Support recursive resolution - if source map directs to minified file, than you can pickup sourcemap of minified file
- Implement build script using rollup
  - https://medium.com/@tarkus/how-to-build-and-publish-es6-modules-today-with-babel-and-rollup-4426d9c7ca71
  - https://github.com/kriasoft/babel-starter-kit
  - https://github.com/ochafik/es6-lenses/blob/master/package.json
  - [use typescript to lint jsdoc](https://github.com/GoogleChrome/puppeteer/pull/986/files)
  - [jsdoc to flow](https://github.com/Kegsay/flow-jsdoc)
  - [jsdoc to ts](https://github.com/brettle/jsdoc-to-typescript-declaration)

## Example

```javascript
const mapStackTrace = require("sourcemapped-stacktrace-node").default;

// puppeteer is not required to use sourcemapped-stacktrace-node
// it is used for example
const browser = await puppeteer.launch();
const page = await browser.newPage();
page.on("pageerror", e => {
  mapStackTrace(
    e.stack,
    result => {
      console.log(result.join("\n"));
    },
    { isChromeOrEdge: true }
  );
});
```

## Ideas

- use [unpkg](https://unpkg.com/#/) to get source of npm package
- create online tool similar to [this](https://pastcompute.github.io/ScriptMapper/), but for error traces

## ALternatives and usefull links

- https://github.com/ryanseddon/source-map/wiki/Source-maps:-languages,-tools-and-other-info
- http://sokra.github.io/source-map-visualization/
- [online source map tool](https://pastcompute.github.io/ScriptMapper/)
- [faster source map implementation](https://github.com/krisselden/fast-source-map)
- [sourcemap decoder](https://github.com/Rich-Harris/sourcemap-codec)

### other

- [base64vlq](http://www.murzwin.com/base64vlq.html)
- https://github.com/thlorenz/stack-mapper
- https://github.com/thlorenz/source-map-cjs
- https://github.com/thlorenz/convert-source-map/
- https://www.npmjs.com/package/source-map-cli
- https://github.com/janekp/mapstrace
- https://github.com/stacktracejs/stacktrace.js/
- https://github.com/csnover/TraceKit

# Here goes original readme

This is a simple module for applying source maps to JS stack traces in the browser.

## The problem this solves

You have Error.stack() in JS (maybe you're logging a trace, or you're looking at
traces in Jasmine or Mocha), and you need to apply a sourcemap so you can
understand whats happening because you're using some fancy compiled-to-js thing
like coffeescript or traceur. Unfortunately, the browser only applies sourcemaps when the
trace is viewed in its console, not to the underlying stack object, so you're
out of luck.

## Demo

http://novocaine.github.io/sourcemapped-stacktrace-demo/public_html/smst.html

## Install from npm

```
npm install sourcemapped-stacktrace
```

https://www.npmjs.com/package/sourcemapped-stacktrace

The npm bundle contains dist/sourcemapped-stacktrace.js, if that's what you're
after. The built product is not held in this repo.

## Setup

Include sourcemapped-stacktrace.js into your page using either an AMD module
loader or a plain old script include. As an AMD module it exposes the method
'mapStackTrace'. If an AMD loader is not found this function will be set on
window.sourceMappedStackTrace.mapStackTrace.

## API

### mapStackTrace(stack, done [, opts])

Re-map entries in a stacktrace using sourcemaps if available.

**Arguments:**

- *stack*: Array of strings from the browser's stack representation.

- *done*: Callback invoked with the transformed stacktrace (an Array of Strings) passed as the first argument

- *opts*: Optional options object containing:
  - *filter*: Function that filters each stacktrace line.
              It is invoked with _(line)_ and should return truthy/ falsy value.
              Sources which do not pass the filter won't be processed.
  - *cacheGlobally*: Boolean. If `true`, sourcemaps are cached across multiple `mapStackTrace()` calls,
                     allowing for better performance if called repeatedly, or when browser's cache is disabled.
                     Defaults to `false`.

**Supported browsers**
  - Chrome
  - Firefox
  - Safari
  - Internet Explorer 11 and up
  - Microsoft Edge

## Longer Explanation

Several modern browsers support sourcemaps when viewing stack traces from errors in their native console, but as of the time of writing there is no support for applying a sourcemap to the (highly non-standardised) [Error.prototype.stack](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Stack). Error.prototype.stack can be used for logging errors and for displaying errors in test frameworks, and it is not very convenient to have unmapped traces in either of those use cases.

This module fetches all the scripts referenced by the stack trace, determines
whether they have an applicable sourcemap, fetches the sourcemap from the
server, then uses the [Mozilla source-map library](https://github.com/mozilla/source-map/) to do the mapping. Browsers that support sourcemaps don't offer a standardised sourcemap API, so we have to do all that work ourselves.

The nice part about doing it ourselves is that the library could be extended to
work in browsers that don't support sourcemaps, which could be good for
logging and debugging problems. Currently, only Chrome and Firefox are supported, but it
would be easy to support those formats by ripping off [stacktrace.js](https://github.com/stacktracejs/stacktrace.js/).

## Known issues

* Doesn't support exception formats of any browser other than Chrome and
  Firefox
* Only supports JS containing //# sourceMappingURL= declarations (i.e. no
  support for the SourceMap: HTTP header (yet)
* Some prominent sourcemap generators (including CoffeeScript, Traceur, Babel)
  don't emit a list of 'names' in the source-map, which means that frames from transpiled code will have (unknown) instead of the original function name. Those generators should support this feature better.
