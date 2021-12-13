export type EntryType = "file" | "folder";

export type FolderEntry = readonly [string, EntryType];

export interface Folder {
  /** The location of the folder, an absolute path. */
  readonly path: string;
  /** Returns a child folder of the same type. */
  child(path: string): Folder;
  /** Returns the parent folder, or `null` if the folder does not have any parents. */
  parent(): Folder | null;
  /** Converts a relative path to an absolute path. */
  absolute(path: string): string;
  /** Converts an absolute path to a relative path. */
  relative(path: string): string;
  /** Lists all files and folders in the specified directory. */
  list(path?: string): Promise<readonly FolderEntry[]>;

  rename(oldPath: string, newPath: string): Promise<void>;
  /**
   * Gets the type of the entry at the specified path.
   * Returns null if the entry does not exist.
   */
  entryType(path: string): Promise<EntryType | null>;
  /** Reads the file at the path with the specified encoding */
  readFile(path: string, encoding?: BufferEncoding): Promise<string>;
}

export const withTrailingSlash = (path: string) =>
  path.endsWith("/") ? path : path + "/";

export const withoutTrailingSlash = (path: string) =>
  path.endsWith("/") ? path.substring(0, path.length - 1) : path;

/**
 * Gets a relative path from two overlapping absolute paths: the inverse of `join()`.
 * If `path` is not a direct sub-path of `root`, an error is thrown.
 *
 * @param root The path you want to disjoin `path` from.
 * @param name The path to disjoin.
 */
export function disjoin(root: string, path: string) {
  root = withTrailingSlash(root);

  if (path === root || withTrailingSlash(path) === root) {
    return "";
  } else if (path.startsWith(root)) {
    return path.substr(root.length);
  } else {
    throw new Error(`The path '${path}' is not a subpath of '${root}'.`);
  }
}
