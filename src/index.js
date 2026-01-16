#!/usr/bin/env node

// Configure native modules for standalone deployment before loading other dependencies
require('../scripts/native-config');

const { Command } = require("commander");
const dotenv = require("dotenv");
const {
  DEFAULT_PORT,
  DEFAULT_HOST,
  APPLICATION_VERSION,
  APPLICATION_NAME,
  APPLICATION_DESCRIPTION,
  MESSAGES,
} = require("./constants/common.js");

dotenv.config();

const program = new Command();

program
  .name(APPLICATION_NAME)
  .description(APPLICATION_DESCRIPTION)
  .version(APPLICATION_VERSION);

program
  .command("serve")
  .description("Start the context provider server")
  .option(
    "-p, --port <number>",
    "Port to run the server on",
    DEFAULT_PORT.toString(),
  )
  .option("-h, --host <host>", "Host to bind the server to", DEFAULT_HOST)
  .action(async (options) => {
    try {
      const ContextProviderServer = require("./server.js");
      const server = new ContextProviderServer();

      const port = parseInt(options.port);
      const host = options.host;

      console.log(`${MESSAGES.SERVER_STARTING} ${host}:${port}...`);
      await server.start(port, host);

      // Keep the process running
      console.log(MESSAGES.SERVER_STOP_INSTRUCTION);
      process.on("SIGINT", () => {
        console.log(MESSAGES.SERVER_SHUTTING_DOWN);
        process.exit(0);
      });
    } catch (error) {
      console.error(`${MESSAGES.SERVER_START_FAILED}`, error.message);
      process.exit(1);
    }
  });

program.parse();
