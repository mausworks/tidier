import yargs from "yargs";

import { tidy } from "./tidy";

const options = yargs(process.argv.slice(2))
  .scriptName("tidy")
  .usage("A CLI for keeping your projects tidy!")
  .options("write", {
    alias: "w",
    describe: "Write fixes to problems to the project.",
    demandOption: false,
    default: false,
    type: "boolean",
  })
  .option("check", {
    alias: "c",
    describe: "Check for problems within the project.",
    demandOption: false,
    default: false,
    type: "boolean",
  })
  .option("config", {
    alias: "C",
    demandOption: false,
    type: "string",
    describe:
      "Explicitly define which config file to use.\n" +
      "By default; this file is found by searching 'up' from the CWD.",
  })
  .option("project", {
    alias: "P",
    type: "string",
    demandOption: false,
    describe:
      "Explicitly define the project folder.\n" +
      "A 'tidy.config.json' file has to be located in (or above) this folder, " +
      "or the '--config' has to be set. " +
      "By default; this is the location of the resolved 'tidy.config.json'.",
  })
  .help().argv;

tidy(options).catch((error) => console.error(error));
