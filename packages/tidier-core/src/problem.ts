import { basename, dirname, join } from "path";
import { NameFormat } from "./convention";
import { EntryType, FolderEntry } from "./folder";
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

    const details = getProblemDetails(project, [path, type]);

    if (details) {
      problems[path] = details;
    }
  }

  return Object.entries(problems);
}

/** Check a specific path for problems. */
export async function checkPath(
  project: Project,
  path: string
): Promise<ProblemDetails | null> {
  const type = await project.folder.entryType(path);

  if (!type) {
    return null;
  }

  return getProblemDetails(project, [path, type]);
}

export function getProblemDetails(project: Project, [path, type]: FolderEntry) {
  const convention = project.getConvention(type, path);

  if (!convention) {
    return null;
  }

  const name = basename(path);
  const expectedName = recase(name, convention.format);

  if (name === expectedName) {
    return null;
  } else {
    return {
      type,
      expectedName,
      format: convention.format,
    };
  }
}

export async function fix(
  project: Project,
  [path, { expectedName }]: Problem,
  overwrite = false
): Promise<void> {
  const newPath = join(dirname(path), expectedName);

  if (project.ignores(newPath)) {
    throw new Error(`The new path '${path}' is ignored by the project.`);
  }

  if (!overwrite) {
    const type = await project.folder.entryType(newPath);

    if (type) {
      throw new Error(`A ${type} with the new name '${expectedName}' exists.`);
    }
  }

  await project.folder.rename(path, newPath);
}
