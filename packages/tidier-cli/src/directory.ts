import { Dirent } from "fs";
import fs from "fs/promises";
import { dirname, resolve, relative } from "path";
import { EntryType, Folder, FolderEntry } from "tidier-core";

export class FileDirectory implements Folder {
  readonly path: string;

  /**
   * Creates a new file directory with the specified root.
   * If you need to ensure that the path exists and is a directory, use `resolve()` instead.
   * @param path An absolute path to a directory.
   */
  constructor(path: string) {
    this.path = path;
  }

  static async resolve(root: string): Promise<Folder> {
    const basePath = resolve(root);
    const status = await fs.stat(basePath);

    if (!status.isDirectory()) {
      throw new Error(`The path '${root}' does not resolve to a directory.`);
    }

    return new FileDirectory(basePath);
  }

  absolute(path: string) {
    return resolve(this.path, path);
  }

  relative(path: string) {
    return relative(this.path, path);
  }

  child(path: string): Folder {
    return new FileDirectory(this.absolute(path));
  }

  parent(): Folder | null {
    // `dirname` returns the same path if we are at the root.
    const parentPath = dirname(this.path);

    return parentPath === this.path ? null : new FileDirectory(parentPath);
  }

  rename(oldPath: string, newPath: string): Promise<void> {
    return fs.rename(this.absolute(oldPath), this.absolute(newPath));
  }

  async entryType(path: string): Promise<EntryType | null> {
    const status = await fs.stat(this.absolute(path)).catch(() => undefined);

    if (status?.isFile()) {
      return "file";
    } else if (status?.isDirectory()) {
      return "folder";
    } else {
      return null;
    }
  }

  async list(path = "./"): Promise<readonly FolderEntry[]> {
    const entries = await fs.readdir(this.absolute(path), {
      withFileTypes: true,
    });

    return entries.filter(isFileOrFolder).map(toFolderEntry);
  }

  async readFile(
    path: string,
    encoding: BufferEncoding = "utf-8"
  ): Promise<string> {
    return await fs.readFile(this.absolute(path), encoding);
  }
}

const isFileOrFolder = (entry: Dirent) => entry.isFile() || entry.isDirectory();

const toFolderEntry = (entry: Dirent): FolderEntry => [
  entry.name,
  entry.isFile() ? "file" : "folder",
];
