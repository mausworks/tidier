import fs, { FSWatcher } from "fs";
import { stat } from "fs/promises";
import { join } from "path";
import callbacks, { Unsubscribe } from "./callbacks";
import { Project } from "./project";

export type PathChange = "update" | "delete";

export type PathCallback = (change: PathChange, path: string) => Promise<void>;

export interface ProjectWatcher {
  onFileChange(callback: PathCallback): Unsubscribe;
  onFolderChange(callback: PathCallback): Unsubscribe;
}

function getChange(stats: fs.Stats | null, event: string): PathChange | null {
  if (stats === null) {
    return "delete";
  } else if (event === "rename") {
    return "update";
  } else {
    return null;
  }
}

export async function watch(project: Project): Promise<ProjectWatcher> {
  const onFileChange = callbacks<PathCallback>();
  const onFolderChange = callbacks<PathCallback>();
  const watchers: Record<string, FSWatcher> = Object.create(null);

  function addWatcher(folder: string) {
    const watchRoot = project.resolve(folder);

    if (watchers[watchRoot]) {
      return;
    }

    const watcher = fs.watch(watchRoot, { encoding: "utf-8" });

    watcher.on("change", async (event: string, name: string) => {
      const path = join(folder, name);

      if (project.ignores(path)) {
        return;
      }

      const stats = await stat(project.resolve(path)).catch(() => null);
      const change = getChange(stats, event);

      if (!change) {
        return;
      }

      if (stats?.isFile()) {
        onFileChange.call(change, path);
      } else if (stats?.isDirectory()) {
        const rootPath = join(watchRoot, path, name);

        if (change === "delete" && watchers[rootPath]) {
          watchers[rootPath].close();
          delete watchers[rootPath];
        } else if (change === "update" && !watchers[rootPath]) {
          addWatcher(join(path, name));
        }

        onFolderChange.call(change, path);
      }
    });

    watcher.on("close", () => {
      if (watchers[watchRoot]) {
        delete watchers[watchRoot];
      }
    });

    watcher.on("error", () => {
      if (watchers[watchRoot]) {
        delete watchers[watchRoot];
      }
    });

    watchers[watchRoot] = watcher;
  }

  for (const folder of await project.listFolders("**/*")) {
    addWatcher(folder);
  }

  return {
    onFileChange: onFileChange.add,
    onFolderChange: onFolderChange.add,
  };
}
