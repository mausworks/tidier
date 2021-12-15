import { dirname, join } from "path";
import { Project, check } from "tidier-core";
import { formatRecase } from "./output";

export async function write(project: Project) {
  const problems = await check(project);

  for (const [path, { expectedName, format }] of problems) {
    const newPath = join(dirname(path), expectedName);

    try {
      console.log(formatRecase(path, expectedName) + ` [${format.join(".")}]`);
      project.folder.rename(path, newPath);
    } catch (error) {
      console.log(error);
    }
  }
}
