const falseFetcher = require("./falseFetcher.js").default;
const createResolver = require("./createResolver.js").default;

const createBrowseResolver = ({
  uriFetcher = fetch,
  fsFetcher = falseFetcher,
  store = {}
}) =>
  createResolver({
    uriFetcher,
    fsFetcher,
    store
  });

exports.default = createBrowseResolver;
