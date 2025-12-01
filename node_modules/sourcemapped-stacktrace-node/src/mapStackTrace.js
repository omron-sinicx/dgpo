/*
 * sourcemapped-stacktrace.js
 * created by James Salter <iteration@gmail.com> (2014)
 *
 * https://github.com/novocaine/sourcemapped-stacktrace
 *
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

const SourceMapConsumer = require("source-map").SourceMapConsumer;

const getSourceMapUri = jsSource => {
  const match = jsSource.match("//# [s]ourceMappingURL=(.*)[\\s]*$", "m");
  if (match && match.length === 2) {
    return match[1];
  } else {
    return false;
  }
};

const absUrlRegex = new RegExp("^(?:[a-z]+:)?//", "i");

const sourceMapResolver = (sourceMapUri, uri, opts) => {
  const embeddedSourceMap = sourceMapUri.match(
    "data:application/json;(charset=[^;]+;)?base64,(.*)"
  );

  if (embeddedSourceMap && embeddedSourceMap[2]) {
    return Promise.resolve(atob(embeddedSourceMap[2]));
  }

  if (!absUrlRegex.test(sourceMapUri)) {
    // relative url; according to sourcemaps spec is 'source origin'
    const lastSlash = uri.lastIndexOf("/");
    if (lastSlash !== -1) {
      const origin = uri.slice(0, lastSlash + 1);
      sourceMapUri = origin + sourceMapUri;
    }
  }

  return opts.resolver(sourceMapUri);
};

const origName = (line, opts) => {
  const match = String(line).match(
    opts.isChromeOrEdge || opts.isIE11Plus ? / +at +([^ ]*).*/ : /([^@]*)@.*/
  );
  return match && match[1];
};

// mimic chrome's format
const formatOriginalPosition = (source, line, column, name) => {
  return `    at ${name ? name : "(unknown)"} (${source}:${line}:${column})`;
};

const createParseLine = ({ regex, expected_fields, start }) => {
  return line => {
    const parsedLine = line.match(regex);
    if (parsedLine && parsedLine.length === expected_fields) {
      const uri = parsedLine[1 + start];
      const lineNumber = parseInt(parsedLine[2 + start], 10);
      const column = parseInt(parsedLine[3 + start], 10);
      return { parsed: true, data: { uri, lineNumber, column } };
    }
    return { parsed: false, data: {} };
  };
};

const combine = (a, b) => {
  return line => {
    const { parsed, data } = a(line);
    if (parsed) return { parsed, data };
    else return b(line);
  };
};

const configs = opts => {
  let skipLines, parseLine;
  if (opts.isChromeOrEdge || opts.isIE11Plus) {
    const parseLineName = createParseLine({
      regex: /^ +at +((?:new )?[^ ]+) +\(?(.*):([0-9]+):([0-9]+)/,
      expected_fields: 5,
      start: 1
    });
    const parseLineNameless = createParseLine({
      regex: /^ +at +(.*):([0-9]+):([0-9]+)/,
      expected_fields: 4,
      start: 0
    });
    parseLine = combine(parseLineName, parseLineNameless);
    // skip first line containing exception message
    skipLines = 1;
  } else if (opts.isFirefox || opts.isSafari) {
    parseLine = createParseLine({
      regex: /@(.*):([0-9]+):([0-9]+)/,
      expected_fields: 4,
      start: 0
    });
    skipLines = 0;
  } else {
    throw new Error("unknown browser :(");
  }
  return { parseLine, skipLines };
};

const parseLine = async (line, opts) => {
  const { parseLine } = configs(opts);
  const { parsed, data } = parseLine(line);

  if (parsed) {
    const { uri, lineNumber, column } = data;
    const script = await opts.resolver(uri);
    if (script === false) {
      // console.log('script === false')
      return line;
    }
    if (!script.match) console.log(script);
    const sourceMapUri = getSourceMapUri(script);
    if (sourceMapUri === false) {
      // console.log('sourceMapUri === false')
      return line;
    }
    const sourceMapText = await sourceMapResolver(sourceMapUri, uri, opts);
    if (sourceMapText === false) {
      // console.log('sourceMapText === false')
      return line;
    }

    let sourceMap;

    try {
      sourceMap = new SourceMapConsumer(sourceMapText);
    } catch (e) {
      console.log(e);
    }

    if (sourceMap) {
      const origPos = sourceMap.originalPositionFor({
        line: lineNumber,
        column: column
      });

      if (
        origPos.source === null &&
        origPos.line === null &&
        origPos.column === null
      ) {
        console.log(`Error in SourceMap of ${uri}`);
        return line;
      }

      return formatOriginalPosition(
        origPos.source,
        origPos.line,
        origPos.column,
        origPos.name || origName(line, opts)
      );
    } else {
      // we can't find a map for that url, but we parsed the row.
      // reformat unchanged line for consistency with the sourcemapped
      // lines.
      return formatOriginalPosition(
        uri,
        lineNumber,
        column,
        origName(line, opts)
      );
    }
  } else {
    return line;
  }
};

const mapStackTrace = (stack, opts) => {
  const { skipLines } = configs(opts);
  const lines = stack.split("\n").slice(skipLines);
  return Promise.all(lines.map(x => parseLine(x, opts))).then(x =>
    x.join("\n")
  );
};

exports.default = mapStackTrace;
