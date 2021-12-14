import { disjoin, EntryType, Folder, FolderEntry } from "@tidier/lib";
import { dirname, join } from "path";
import { FileType, Uri, workspace } from "vscode";

export class VSCodeFolder implements Folder {
  path: string;
  uri: Uri;

  constructor(uri: Uri) {
    this.uri = uri;
    this.path = uri.path;
  }

  relative(path: string): string {
    return disjoin(this.path, path);
  }

  absolute(path: string): string {
    return join(this.path, path);
  }

  child(path: string): Folder {
    return new VSCodeFolder(Uri.joinPath(this.uri, path));
  }

  parent(): Folder | null {
    // `dirname` returns the same path if we are at the root.
    const parentPath = dirname(this.path);

    return parentPath === this.path
      ? null
      : new VSCodeFolder(this.uri.with({ path: parentPath }));
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const uri = Uri.joinPath(this.uri, oldPath);
    const newUri = Uri.joinPath(this.uri, newPath);

    await workspace.fs.rename(uri, newUri, { overwrite: true });
  }

  async list(path?: string): Promise<readonly FolderEntry[]> {
    const uri = Uri.joinPath(this.uri, path ?? "/");
    const entries = await workspace.fs.readDirectory(uri);

    return entries.filter(fileOrFolder).map(toFolderEntry);
  }

  async entryType(path: string): Promise<EntryType | null> {
    const uri = Uri.joinPath(this.uri, path);

    try {
      const stat = await workspace.fs.stat(uri);

      if (stat.type === FileType.Directory) {
        return "folder";
      } else if (stat.type === FileType.File) {
        return "file";
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  async readFile(path: string, encoding?: BufferEncoding): Promise<string> {
    const uri = Uri.joinPath(this.uri, path);
    const data = await workspace.fs.readFile(uri);

    return Buffer.from(data).toString(encoding);
  }
}

const fileOrFolder = ([, type]: [string, FileType]) =>
  type === FileType.File || type === FileType.Directory;
const toFolderEntry = ([name, type]: [string, FileType]): FolderEntry => [
  name,
  type === FileType.Directory ? "folder" : "file",
];
