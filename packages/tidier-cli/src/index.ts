import { TIDIER_CONFIG_NAME } from "tidier-core";
import yargs from "yargs";

import { tidier } from "./tidier";

export default async function run() {
  const { _: args, ...options } = yargs(process.argv.slice(2))
    .usage(
      "Usage: tidier [options] [...globs]\n\n" +
        "The provided globs are always relative to the project: consider quoting them."
    )
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
      default: true,
      type: "boolean",
    })
    .option("project", {
      alias: "p",
      type: "string",
      demandOption: false,
      describe:
        "Explicitly define the project folder.\n" +
        `A '${TIDIER_CONFIG_NAME}' has to be located in (or above) this folder. ` +
        `By default; this is the location of the nearest '${TIDIER_CONFIG_NAME}.`,
    })
    .help().argv;

  await tidier(options, args.map(String));
}
