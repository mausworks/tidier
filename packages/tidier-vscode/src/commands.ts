import { createGlob, EntryType, recase, Project, Projects } from "@tidier/lib";
import * as output from "./output";
import { commands, ExtensionContext } from "vscode";
import { basename, dirname, join } from "path";

function registerCommands(projects: Projects) {
  commands.registerCommand("tidier.fixAll", () => fixAll(projects));
}

async function fixAll(projects: Projects) {
  const matchAnything = createGlob("**/*");

  for (const project of projects.list()) {
    project.list("file", matchAnything);
  }
}

async function renameAll(type: EntryType, project: Project) {
  // We need to keep track of these
  // Because multiple patterns might match,
  // but it's the first pattern that matters
  const seenPaths = new Set<string>();
  const conventions = project.listConventions(type);

  for (const { glob, format } of conventions) {
    const paths = await project.list(type, glob);

    for (const path of paths) {
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
