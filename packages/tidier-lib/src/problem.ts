import { basename } from "path";
import { NameFormat } from "./convention";
import { EntryType } from "./folder";
import { Glob } from "./glob";
import { Project } from "./project";
import { recase } from "./recase";

/** A tuple consisting of a path to a folder entry, and some problem details. */
export type Problem = readonly [string, ProblemDetails];

export interface ProblemDetails {
  /** The type of the entry. */
  readonly type: EntryType;
  /** The expected name of the entry. */
  readonly expectedName: string;
  /** The format that the entry is expected to follow. */
  readonly format: NameFormat;
}

/** Scan the provided project for problems. */
export async function scan(
  project: Project,
  glob: Glob
): Promise<readonly Problem[]> {
  const problems: Record<string, ProblemDetails> = Object.create(null);
  const entries = await project.list(glob);

  for (const [path, type] of entries) {
    if (problems[path] !== undefined) {
      continue;
    }

    const convention = project.getConvention(type, path);

    if (!convention) {
      continue;
    }

    const name = basename(path);
    const expectedName = recase(name, convention.format);

    if (name !== expectedName) {
      problems[path] = {
        type,
        expectedName,
        format: convention.format,
      };
    }
  }

  return Object.entries(problems);
}
