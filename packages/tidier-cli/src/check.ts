import { Project, Problem, scan, Glob } from "@tidier/lib";
import {
  formatRecase,
  okConventionBanner,
  useConventionBanner,
} from "./output";

export interface CheckSummary {
  ok: string[];
  problems: Problem[];
}

export async function check(project: Project): Promise<number> {
  const problems = await scan(project, Glob.ANYTHING);

  for (const [path, { expectedName, format }] of problems) {
    console.log(formatRecase(path, expectedName) + ` [${format.join(".")}]`);
  }

  return problems.length ? 1 : 0;
}
