import { check } from "./check";
import { TidyCLIOptions } from "./options";
import { projectFromOptions } from "./project";
import { write } from "./write";

export async function tidy(options: TidyCLIOptions) {
  const project = await projectFromOptions(options);

  if (options.check) {
    await check(project);
  } else if (options.write) {
    await write(project);
  }
}
