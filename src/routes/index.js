const indexerRoutes = require("./indexer.route.js");
const retrieveRoutes = require("./retrieve.route.js");

const routes = [...indexerRoutes, ...retrieveRoutes];

module.exports = routes;
