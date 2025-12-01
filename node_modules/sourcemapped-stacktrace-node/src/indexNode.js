const mapStackTrace = require("./mapStackTrace.js").default;
const createNodeResolver = require("./createNodeResolver.js").default;

exports.createNodeResolver = createNodeResolver;
exports.default = (stack, opts) => {
  const { store, ...other } = opts;
  other.resolver = other.resolver || createNodeResolver({ store });
  return mapStackTrace(stack, other);
};
