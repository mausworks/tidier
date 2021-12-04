import { basename, dirname, join } from "path";
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

/** Check if there are problems in the provided project. */
export async function check(
  project: Project,
  glob: Glob = Glob.ANYTHING
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
