import { check } from "./check";
import { TidierCLIOptions } from "./options";
import { projectFromOptions } from "./project";
import { write } from "./write";

export async function tidier(options: TidierCLIOptions) {
  const project = await projectFromOptions(options);

  if (options.check) {
    const exitCode = await check(project);
    process.exit(exitCode);
  } else if (options.write) {
    await write(project);
  }
}
