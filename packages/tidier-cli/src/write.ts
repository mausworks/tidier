import { Project, check, fix, Glob } from "tidier-core";
import { formatRecase } from "./output";

export async function write(project: Project, globPatterns: string[]) {
  const globs = globPatterns.map((pattern) => new Glob(pattern));
  const problems = await check(project, ...globs);
  const overwrite = process.platform === "win32";

  for (const [path, details] of problems) {
    try {
      console.log(formatRecase(path, details.expectedName));

      await fix(project, [path, details], overwrite);
    } catch (error) {
      console.log(error);
    }
  }
}
