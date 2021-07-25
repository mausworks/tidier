import { red, green, black, bgGreen, bgRed } from "colors";
import { basename, dirname, join } from "path";
import {
  rename,
  Rename,
  Project,
  Changeset,
  immutableChangeset,
  Change,
} from "@tidy/lib";

export interface CheckSummary {
  ok: Change<Rename>[];
  problems: Record<string, Change<Rename>[]>;
}

export async function checkNames(
  type: "files" | "folder",
  project: Project
): Promise<Changeset<Rename>> {
  const changeset = immutableChangeset<Rename>();
  const conventions =
    type === "folder" ? project.folderConventions : project.fileConventions;

  for (const { glob, format } of conventions) {
    const filePaths =
      type === "files"
        ? await project.listFiles(glob)
        : await project.listFolders(glob);

    for (const path of filePaths) {
      const name = basename(path);
      const folder = dirname(path);
      const newName = rename(name, format);

      changeset.add(join(folder, name), {
        name: newName,
        format: format.join("."),
      });
    }
  }

  return changeset;
}

export function summarizeResult(changes: Change<Rename>[]): CheckSummary {
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

export async function check(project: Project) {
  const fileRenames = await checkNames("files", project);
  const folderRenames = await checkNames("folder", project);
  const changes = folderRenames.list().concat(fileRenames.list());

  const summary = summarizeResult(changes);

  console.log();
  console.log(`${bgGreen("  ")} ${green("OK")} ${bgGreen("                ")}`);

  for (const [path] of summary.ok) {
    const name = basename(path);
    const folder = dirname(path);

    console.log(`${folder}/${green(name)}`);
  }

  for (const [convention, change] of Object.entries(summary.problems)) {
    console.log();
    console.log(
      `${bgRed("  ")} ${red("USE")} ${bgRed(` ${black(convention)} `)}`
    );

    for (const [path, rename] of change) {
      const name = basename(path);
      const folder = dirname(path);

      console.log(`${folder}/${red(name)} ⟶  ${green(rename.name)}`);
    }
  }
}
