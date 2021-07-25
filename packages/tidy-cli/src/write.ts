import * as fs from "fs/promises";
import { green, red } from "colors";
import { basename, dirname, join } from "path";
import { Project, rename } from "@tidy/lib";

async function renameAll(type: "files" | "folders", project: Project) {
  // We need to keep track of these
  // Because multiple patterns might match,
  // but it's the first pattern that matters
  const seenPaths = new Set<string>();
  const conventions =
    type === "files" ? project.fileConventions : project.folderConventions;

  for (const { glob, format } of conventions) {
    const paths =
      type === "files"
        ? await project.listFiles(glob)
        : await project.listFolders(glob);

    for (const path of paths) {
      if (seenPaths.has(path)) {
        continue;
      }

      seenPaths.add(path);

      const name = basename(path);
      const newName = rename(name, format);

      if (name !== newName) {
        const folder = dirname(path);
        const newPath = join(folder, newName);

        if (await project.hasFile(newPath)) {
          console.log(`${folder}/${red(name)} 🞨 ${red(rename.name)}`);
          console.log(
            red(`A file with the new convention applied already exists`)
          );
        } else if (!project.ignores(newPath)) {
          fs.rename(project.resolve(path), project.resolve(newPath));
          console.log(`${folder}/${red(name)} ⟶  ${green(newName)}`);

          seenPaths.add(newPath);
        }
      }
    }
  }
}

export async function write(project: Project) {
  await renameAll("files", project);
}
