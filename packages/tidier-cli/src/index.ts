import { TIDIER_CONFIG_NAME } from "tidier-core";
import yargs from "yargs";

import { tidier } from "./tidier";

export default async function run() {
  const { _: args, ...options } = yargs(process.argv.slice(2))
    .usage("Usage: tidier [options] [...globs]")
    .options("write", {
      alias: "w",
      describe: "Write problem fixes to the project.",
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
    .option("ignore-path", {
      type: "array",
      default: [".gitignore"],
      describe:
        "Path to a file with patterns describing which entries to ignore." +
        "Defaults to .gitignore at the project root.",
    })
    .help().argv;

  await tidier(options, args.map(String));
}
