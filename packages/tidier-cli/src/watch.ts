import fs from "fs/promises";
import { basename, dirname, join } from "path";
import {
  createGlob,
  NameConvention,
  PathCallback,
  Project,
  Rename,
  rename,
  watch,
} from "@tidier/lib";

import { TidierCLIActions } from "./options";
import {
  formatRename,
  okConventionBanner,
  useConventionBanner,
} from "./output";

const RENAME_DELAY = 100;

function renameToConvention(
  path: string,
  conventions: readonly NameConvention[]
): Rename | null {
  for (const convention of conventions) {
    const glob = createGlob(convention.glob);

    if (glob.matches(path)) {
      const name = basename(path);
      const newName = rename(name, convention.format);

      if (newName === name) {
        return null;
      }

      return { name: newName, format: convention.format.join(".") };
    }
  }

  return null;
}

export async function watchProject(
  project: Project,
  { write }: TidierCLIActions
) {
  const name = basename(project.resolve("."));
  console.log(`Watching project '${name}' ...`);

  const watcher = await watch(project);

  async function renameFile(path: string, newName: string) {
    setTimeout(async () => {
      await fs.rename(
        project.resolve(path),
        project.resolve(join(dirname(path), newName))
      );
    }, RENAME_DELAY);
  }

  const handleChange =
    (conventions: readonly NameConvention[]): PathCallback =>
    async (_, path) => {
      const rename = renameToConvention(path, conventions);

      if (!write) {
        console.clear();

        if (rename) {
          console.log(useConventionBanner(rename.format));
          console.log(formatRename([path, rename]));
        } else {
          console.log(okConventionBanner());
          console.log(formatRename([path, undefined]));
        }
      } else if (rename) {
        await renameFile(path, rename.name);

        console.log(formatRename([path, rename]));
      }
    };

  watcher.onFileChange(handleChange(project.fileConventions));
  watcher.onFolderChange(handleChange(project.folderConventions));
}
