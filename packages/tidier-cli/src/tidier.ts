import { check } from "./check";
import { TidierCLIOptions } from "./options";
import { projectFromOptions } from "./project";
import { watchProject } from "./watch";
import { write } from "./write";

export async function tidier(options: TidierCLIOptions) {
  const project = await projectFromOptions(options);

  if (options.watch) {
    await watchProject(project, options);
  } else if (options.check) {
    await check(project);
  } else if (options.write) {
    await write(project);
  }
}
