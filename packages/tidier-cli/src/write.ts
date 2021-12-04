import { dirname, join } from "path";
import { Glob, Project, scan } from "@tidier/lib";
import { formatRecase } from "./output";

export async function write(project: Project) {
  const problems = await scan(project, Glob.ANYTHING);

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
