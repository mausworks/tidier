import { resolve } from "path";
import { Project, FileDirectory } from "@tidier/lib";

import { TidierProjectOptions } from "./options";

export async function projectFromOptions(options: TidierProjectOptions) {
  const path = resolve(process.cwd(), options.project || "");
  const folder = new FileDirectory(path);
  const project = await Project.near(folder);

  if (!project) {
    throw new Error(
      "Failed to resolve project, a config was not found nor specified."
    );
  }

  return project;
}
