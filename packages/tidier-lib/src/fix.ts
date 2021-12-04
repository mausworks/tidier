import { dirname, join } from "path";
import { Problem } from "./problem";
import { Project } from "./project";

export async function fix(
  project: Project,
  [path, { expectedName }]: Problem
): Promise<void> {
  const newPath = join(dirname(path), expectedName);

  if (project.ignores(newPath)) {
    throw new Error(`The new path '${path}' is ignored by the project.`);
  }

  const type = await project.folder.entryType(newPath);

  if (type) {
    throw new Error(`A ${type} with the new name '${expectedName}' exists.`);
  }

  project.folder.rename(path, newPath);
}
