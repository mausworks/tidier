import { red, green, black, bgGreen, bgRed } from "colors";
import { basename, dirname, join } from "path";
import {
  recase,
  Recasing,
  Project,
  Changeset,
  immutableChangeset,
  Change,
  EntryType,
} from "@tidier/lib";
import {
  formatRename,
  okConventionBanner,
  useConventionBanner,
} from "./output";

export interface CheckSummary {
  ok: Change<Recasing>[];
  problems: Record<string, Change<Recasing>[]>;
}

export async function checkNames(
  type: EntryType,
  project: Project
): Promise<Changeset<Recasing>> {
  const changeset = immutableChangeset<Recasing>();
  const conventions = project.listConventions(type);

  for (const { glob, format } of conventions) {
    const paths = await project.list(type, glob);

    for (const path of paths) {
      const name = basename(path);
      const folder = dirname(path);
      const newName = recase(name, format);

      changeset.add(join(folder, name), {
        name: newName,
        format: format.join("."),
      });
    }
  }

  return changeset;
}

export function summarizeResult(changes: Change<Recasing>[]): CheckSummary {
  const checkSummary: CheckSummary = { ok: [], problems: {} };

  for (const [path, rename] of changes) {
    const folder = dirname(path);

    if (join(folder, rename.name) !== path) {
      checkSummary.problems[rename.format] = [
        ...(checkSummary.problems[rename.format] || []),
        [path, rename],
      ];
    } else {
      checkSummary.ok.push([path, rename]);
    }
  }

  checkSummary.ok = checkSummary.ok.sort((l, r) => l[0].localeCompare(r[0]));

  return checkSummary;
}

export async function check(project: Project): Promise<number> {
  let hasProblems = false;
  const fileRenames = await checkNames("file", project);
  const folderRenames = await checkNames("folder", project);
  const changes = folderRenames.list().concat(fileRenames.list());

  const summary = summarizeResult(changes);

  console.log();
  console.log(okConventionBanner());

  for (const [path] of summary.ok) {
    const name = basename(path);
    const folder = dirname(path);

    console.log(`${folder}/${green(name)}`);
  }

  for (const [namePattern, changes] of Object.entries(summary.problems)) {
    console.log();
    console.log(useConventionBanner(namePattern));

    for (const change of changes) {
      console.log(formatRename(change));
    }

    hasProblems = true;
  }

  return hasProblems ? 1 : 0;
}
