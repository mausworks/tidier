import { resolve } from "path";
import { Project } from "@tidier/core";

import { TidierProjectOptions } from "./options";
import { FileDirectory } from "./directory";

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
