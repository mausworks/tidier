import { checkAndReport } from "./check";
import { TidierCLIOptions } from "./options";
import { projectFromOptions } from "./project";
import { write } from "./write";

export async function tidier(options: TidierCLIOptions, globs: string[]) {
  const project = await projectFromOptions(options);

  if (options.write) {
    await write(project, globs);
  } else if (options.check) {
    const exitCode = await checkAndReport(project, globs);

    process.exit(exitCode);
  }
}
