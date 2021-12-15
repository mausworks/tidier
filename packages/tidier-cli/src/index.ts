import { TIDIER_CONFIG_NAME } from "tidier-core";
import yargs from "yargs";

import { tidier } from "./tidier";

export async function run() {
  const options = yargs(process.argv.slice(2))
    .scriptName("tidier")
    .usage("The workspace formatter")
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
    .option("project", {
      alias: "P",
      type: "string",
      demandOption: false,
      describe:
        "Explicitly define the project folder.\n" +
        `A '${TIDIER_CONFIG_NAME}' has to be located in (or above) this folder. ` +
        `By default; this is the location of the nearest '${TIDIER_CONFIG_NAME}.`,
    })
    .help().argv;

  await tidier(options);
}

run();
