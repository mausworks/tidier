import { resolve } from "path";
import { Project, ProjectSearchOptions, Ignorefile } from "tidier-core";

import { TidierProjectOptions } from "./options";
import { FileDirectory } from "./directory";

export async function projectFromOptions(options: TidierProjectOptions) {
  const searchRoot = resolve(options.project || "");
  const folder = await FileDirectory.resolve(searchRoot);
  const project = await Project.near(folder, asSearchOptions(options));

  if (!project) {
    throw new Error(
      `Failed to find a project in '${searchRoot}' or its parent folders.`
    );
  }

  await addIgnorefiles(project, options["ignore-path"]);

  return project;
}

async function addIgnorefiles(
  { ignore, folder }: Project,
  ignorePaths: readonly string[]
) {
  const absolute = ignorePaths.map((path) => resolve(path));
  const relative = absolute.map((path) => folder.relative(path));

  for (const path of relative) {
    const ignorefile = await Ignorefile.load(folder, path);

    ignore.useIgnorefile(ignorefile);
  }
}

const asSearchOptions = (
  options: TidierProjectOptions
): ProjectSearchOptions => {
  if (options["ignore-path"]) {
    // In this case, we have to load the ignorefiles later.
    // as they will be resolved relative to the CWD and not the project root.
    return { ignorefiles: [], levels: 5 };
  } else {
    // In this case, we use the .gitignore at the project root.
    // Which is what the core abstractions will do if `ignorefiles` is omitted.
    return { levels: 5 };
  }
};
