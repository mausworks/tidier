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

export interface ChangeDispatcher {
  fileChanged(change: string, path: string): void;
  folderChange(change: string, path: string): void;
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

function watchFolder(
  project: Project,
  folder: string,
  dispatcher: ChangeDispatcher
): FSWatcher {
  const watchRoot = project.resolve(folder);
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

    if (stats?.isDirectory()) {
      dispatcher.folderChange(change, path);
    } else if (stats?.isFile()) {
      dispatcher.fileChanged(change, path);
    }
  });

  return watcher;
}

export async function watch(project: Project): Promise<ProjectWatcher> {
  const onFileChange = callbacks<PathCallback>();
  const onFolderChange = callbacks<PathCallback>();
  const watchers: Record<string, FSWatcher> = Object.create(null);

  for (const folder of await project.listFolders("**/*")) {
    watchers[folder] = watchFolder(project, folder, {
      folderChange: onFolderChange.call,
      fileChanged: onFileChange.call,
    });
  }

  onFolderChange.add(async (_, path) => {
    const stats = await stat(project.resolve(path)).catch(() => null);

    if ((!stats || !stats.isDirectory()) && watchers[path]) {
      watchers[path].close();
      delete watchers[path];
    } else {
      watchers[path] = watchFolder(project, path, {
        folderChange: onFolderChange.call,
        fileChanged: onFileChange.call,
      });
    }
  });

  return {
    onFileChange: onFileChange.add,
    onFolderChange: onFolderChange.add,
  };
}
