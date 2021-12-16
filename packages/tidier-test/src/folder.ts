import {
  disjoin,
  EntryType,
  Folder,
  FolderEntry,
  withoutTrailingSlash,
  withTrailingSlash,
} from "tidier-core";
import { posix } from "path";
const { join, dirname } = posix;

export class InMemoryFolder implements Folder {
  path: string;
  volume: Record<string, string | null>;

  constructor(
    path: string,
    volume: Record<string, string | null> = Object.create(null)
  ) {
    path = withoutTrailingSlash(path);
    this.path = path;
    this.volume = volume;
    this.volume[path] = null;
  }

  child(path: string): Folder {
    return new InMemoryFolder(this.absolute(path), this.volume);
  }
  parent(): Folder | null {
    const parentPath = dirname(this.path);

    if (parentPath === this.path) {
      return null;
    } else {
      return new InMemoryFolder(parentPath, this.volume);
    }
  }
  absolute(path: string): string {
    return join(this.path, path);
  }
  relative(path: string): string {
    return disjoin(this.path, path);
  }
  list(path?: string): Promise<readonly FolderEntry[]> {
    const root = this.absolute(path || "/");
    const seenPaths = new Set<string>();
    const entries: FolderEntry[] = [];

    for (const [path, data] of Object.entries(this.volume)) {
      if (!isChildOf(root, path)) {
        continue;
      }

      const descendant = asDescendantOf(root, path);

      if (seenPaths.has(descendant)) {
        continue;
      }

      seenPaths.add(descendant);

      entries.push([
        disjoin(root, descendant),
        data === null ? "folder" : "file",
      ]);
    }

    return Promise.resolve(entries);
  }
  rename(path: string, newPath: string): Promise<void> {
    const oldPath = this.absolute(path);
    const data = this.volume[oldPath];

    if (data === undefined) {
      throw new Error("File does not exist.");
    }

    delete this.volume[oldPath];
    this.volume[this.absolute(newPath)] = data;

    return Promise.resolve();
  }
  entryType(path: string): Promise<EntryType | null> {
    const result = this.volume[join(this.path, path)];
    if (result === undefined) {
      return Promise.resolve(null);
    } else if (result === null) {
      return Promise.resolve("folder");
    } else {
      return Promise.resolve("file");
    }
  }
  readFile(path: string, _encoding?: BufferEncoding): Promise<string> {
    const result = this.volume[this.absolute(path)];

    if (result === undefined) {
      return Promise.reject(new Error("File not found"));
    } else if (result === null) {
      return Promise.reject(new Error("Entry is a folder"));
    } else {
      return Promise.resolve(result);
    }
  }
}

const isChildOf = (root: string, path: string) => {
  root = withTrailingSlash(root);

  return path.startsWith(root);
};

const asDescendantOf = (root: string, path: string) => {
  root = withTrailingSlash(root);

  const nextSlash = path.indexOf("/", root.length);

  if (nextSlash !== -1) {
    return path.substring(0, nextSlash);
  } else {
    return path;
  }
};
