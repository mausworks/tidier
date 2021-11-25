import * as fs from "fs/promises";
import { green, red } from "colors";
import { basename, dirname, join } from "path";
import { EntryType, Project, recase } from "@tidier/lib";

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
          console.log(`${folder}/${red(name)} 🞨 ${red(recase.name)}`);
          console.log(
            red(`A file with the new convention applied already exists`)
          );
        } else if (!project.ignores(newPath)) {
          fs.rename(
            project.folder.absolute(path),
            project.folder.absolute(newPath)
          );
          console.log(`${folder}/${red(name)} ⟶  ${green(newName)}`);

          seenPaths.add(newPath);
        }
      }
    }
  }
}

export async function write(project: Project) {
  await renameAll("file", project);
  await renameAll("folder", project);
}
