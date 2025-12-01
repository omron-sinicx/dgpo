const falseFetcher = require("./falseFetcher.js").default;

const createResolver = ({ uriFetcher, fsFetcher, store }) => {
  return uri => {
    if (store[uri]) {
      return store[uri];
    }

    if (uri.match(/<anonymous>/)) {
      return (store[uri] = falseFetcher(uri));
    }

    // TODO need more heuristic here
    // if it starts as from http://, https://, file://
    // if it starts from ../node_modules (webpack thing)
    // use referer to try restor path
    if (uri.match(/^\.\.\/node_modules/)) {
      uri = uri.replace("../", "");
      return (store[uri] = fsFetcher(uri));
    }

    if (uri.match(/node_modules/)) {
      return (store[uri] = falseFetcher(uri));
    }

    if (uri.indexOf("/") === -1) {
      return (store[uri] = falseFetcher(uri));
    }

    return store[uri] = new Promise((resolve) => {
      uriFetcher(uri).then(response => {
        if (response.status === 200) {
          return resolve(response.text());
        } else {
          console.log(`${uri}: ${response}`);
          return resolve(false);
        }
      }).catch(e => {
        console.log(`${uri}: ${e}`);
        return resolve(false);
      })
    });
  };
};

exports.default = createResolver;
