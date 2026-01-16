const Hapi = require("@hapi/hapi");
const routes = require("./routes");
const {
  DEFAULT_PORT,
  DEFAULT_HOST,
  CORS_ORIGINS,
  CORS_HEADERS,
  CORS_ADDITIONAL_HEADERS,
  HTTP_STATUS_CODES,
  MESSAGES,
} = require("./constants/common.js");

/**
 * ContextProviderServer class that handles the Hapi server setup.
 * The server provides an API for indexing and retrieving context from code repositories.
 */
class ContextProviderServer {
  /**
   * Initializes the Hapi server with configuration and routes.
   */
  constructor() {
    this.server = null;
  }

  /**
   * Initialize and configure the Hapi server.
   * @param {number} port - The port to listen on.
   * @param {string} host - The host to bind to.
   */
  async initializeServer(port = DEFAULT_PORT, host = DEFAULT_HOST) {
    this.server = Hapi.server({
      port: port,
      host: host,
      routes: {
        cors: {
          origin: CORS_ORIGINS, // Enable CORS for all origins
          headers: CORS_HEADERS,
          additionalHeaders: CORS_ADDITIONAL_HEADERS,
        },
        validate: {
          failAction: async (request, h, err) => {
            // Custom validation error handling
            return h
              .response({
                success: false,
                error: err.message,
              })
              .code(HTTP_STATUS_CODES.BAD_REQUEST)
              .takeover();
          },
        },
      },
    });

    // Register routes
    await this.setupRoutes();
  }

  /**
   * Configure server routes.
   */
  async setupRoutes() {
    // Register all routes from the routes directory
    this.server.route(routes);
  }

  /**
   * Start the server on the specified port and host.
   * @param {number} port - The port to listen on.
   * @param {string} host - The host to bind to.
   * @returns {Promise<object>} A promise that resolves to the server instance.
   */
  async start(port = DEFAULT_PORT, host = DEFAULT_HOST) {
    try {
      await this.initializeServer(port, host);
      await this.server.start();
      console.log(`${MESSAGES.SERVER_RUNNING}${host}:${port}/`);
      return this.server;
    } catch (error) {
      console.error(`${MESSAGES.SERVER_START_FAILED}`, error);
      throw error;
    }
  }
}

module.exports = ContextProviderServer;
