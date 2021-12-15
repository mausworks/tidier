import { Project, Problem, check } from "tidier-core";
import { formatRecase } from "./output";

export interface CheckSummary {
  ok: string[];
  problems: Problem[];
}

export async function checkAndReport(project: Project): Promise<number> {
  const problems = await check(project);

  for (const [path, { expectedName, format }] of problems) {
    console.log(formatRecase(path, expectedName) + ` [${format.join(".")}]`);
  }

  return problems.length ? 1 : 0;
}
