// require("es6-promise").polyfill();
require("isomorphic-fetch");

const defaultFsFetcher = require("./fsFetcher.js").default;
const createResolver = require("./createResolver.js").default;

const createNodeResolver = ({
  uriFetcher = fetch,
  fsFetcher = defaultFsFetcher,
  store = {}
}) =>
  createResolver({
    uriFetcher,
    fsFetcher,
    store
  });

exports.default = createNodeResolver;
