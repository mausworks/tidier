import { Project, Glob, check } from "tidier-core";
import { formatRecase } from "./output";

export async function checkAndReport(
  project: Project,
  globPatterns: string[]
): Promise<number> {
  const globs = globPatterns.map((pattern) => new Glob(pattern));
  const problems = await check(project, ...globs);

  for (const [path, { expectedName, format }] of problems) {
    console.log(formatRecase(path, expectedName) + ` [${format.join(".")}]`);
  }

  return problems.length ? 1 : 0;
}
