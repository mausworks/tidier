import {
  createGlob,
  EntryType,
  recase,
  Project,
  Projects,
  NameConvention,
  FolderEntry,
  Folder,
} from "@tidier/lib";
import * as output from "./output";
import { commands } from "vscode";
import { basename, dirname, join } from "path";

const matchAnything = createGlob("*/**");

function registerCommands(projects: Projects) {
  commands.registerCommand("tidier.fixAll", async () => await fixAll(projects));
  commands.registerCommand(
    "tidier.fixFiles",
    async () => await fixType(projects, "file")
  );
  commands.registerCommand(
    "tidier.fixFolders",
    async () => await fixType(projects, "folder")
  );
}

const groupByType = (
  entries: readonly FolderEntry[]
): Record<EntryType, readonly string[]> => {
  const paths: Record<EntryType, string[]> = {
    file: [],
    folder: [],
  };

  for (const [path, type] of entries) {
    paths[type].push(path);
  }

  return paths;
};

async function fixType(projects: Projects, type: EntryType) {
  for (const project of projects.list()) {
    const entries = await project.list(matchAnything, type);
    const paths = entries.map(([path]) => path);
    const conventions = project.conventions[type];

    await recaseAll(project, paths, conventions);
  }
}

async function fixAll(projects: Projects) {
  for (const project of projects.list()) {
    const entries = await project.list(matchAnything);
    const paths = groupByType(entries);

    await recaseAll(project, paths.file, project.conventions.file);
    await recaseAll(project, paths.folder, project.conventions.folder);
  }
}

async function recaseAll(
  project: Project,
  paths: readonly string[],
  conventions: readonly NameConvention[]
) {
  // We need to keep track of these
  // Because multiple patterns might match,
  // but it's the first pattern that matters
  const seenPaths = new Set<string>();

  for (const { glob, format } of conventions) {
    for (const path of paths.filter(glob.matches)) {
      if (seenPaths.has(path)) {
        continue;
      }

      seenPaths.add(path);

      const name = basename(path);
      const newName = recase(name, format);

      if (name !== newName) {
        const folder = dirname(path);
        const newPath = join(folder, newName);

        if (await project.folder.entryType(newPath)) {
          output.log(
            `Cannot rename ${path} to ${newName}: File already exists`
          );
        } else if (!project.ignores(newPath)) {
          project.folder.rename(path, newPath);
          output.log(`${folder}/${name} ⟶  ${newName}`);

          seenPaths.add(newPath);
        }
      }
    }
  }
}
