import { promises as fs } from "fs";
import { resolve, join, relative } from "path";
import ignore from "ignore";

import { NameConvention } from "./convention";
import { containsConfig, TidierConfig } from "./config";
import { createGlob, Glob } from "./glob";

/** Boy, you do not want to look in these ... */
const ALWAYS_IGNORE = ["**/.git"];

/**
 * A high level abstraction which allows you to handle
 * files and folders within the of the project,
 * as well as access configuration and conventions.
 */
export interface Project {
  /** Glob patterns for files to always exclude. */
  readonly ignore: string[];
  /** The naming conventions to use for files within the project. */
  readonly fileConventions: readonly NameConvention[];
  /** The naming conventions to use for folders within the project. */
  readonly folderConventions: readonly NameConvention[];
  /**
   * Resolve a path relative to the project,
   * returning its absolute path.
   */
  resolve(path: string): string;
  /**
   * Converts a path that is absolute,
   * to relative to the project.
   */
  relative(path: string): string;
  /** Lists all folders in the project that matches the glob pattern. */
  listFolders(glob: string): Promise<readonly string[]>;
  /** Lists all files in the project that matches the glob pattern. */
  listFiles(glob: string): Promise<readonly string[]>;
  /** Returns whether the path is ignored within the project. */
  ignores(path: string): boolean;
  /** Returns true if the project contains this file, and it is not ignored. */
  hasFile(path: string): Promise<boolean>;
  /** Returns true if the project contains this file, and it is not ignored. */
  hasFolder(path: string): Promise<boolean>;
}

export async function readGitignore(root: string): Promise<readonly string[]> {
  try {
    const lines = await fs.readFile(join(root, ".gitignore"), "utf-8");

    return lines.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  } catch {
    return [];
  }
}

async function validateProjectRoot(root: string): Promise<void> {
  try {
    const status = await fs.stat(root);

    if (!status.isDirectory()) {
      throw new Error(`Path '${root}' is not a folder.`);
    }
  } catch (error) {
    throw new Error(`Could not create project: ${error.message}`);
  }
}

export async function createProject(
  root: string,
  config: TidierConfig
): Promise<Project> {
  await validateProjectRoot(root);

  /** Resolve the absolute path in the file system. */
  const resolvePath = (path: string) => {
    const resolved = resolve(root, path);

    if (resolved.startsWith(root + "/") || resolved === root) {
      return resolved;
    } else {
      throw new Error(
        `The provided path '${path}' resolves to outside the root.`
      );
    }
  };

  /** Resolve a path, relative to the project. */
  const relativePath = (path: string) => relative(root, path);

  const gitignore = await readGitignore(root);

  const ig = ignore({ ignorecase: true }).add([
    ...ALWAYS_IGNORE,
    ...gitignore,
    ...config.ignore,
  ]);

  async function collect(
    results: string[],
    folder: string,
    glob: Glob,
    type: "file" | "folder"
  ): Promise<string[]> {
    const absolutePath = resolvePath(folder);
    const entries = await fs.readdir(absolutePath, { withFileTypes: true });

    for (const entry of entries) {
      const path = join(folder, entry.name);

      if (ig.ignores(path)) {
        continue;
      }

      if (type === "file" && entry.isFile() && glob.matches(path)) {
        results.push(path);
      } else if (entry.isDirectory()) {
        const isAnotherProject = await containsConfig(resolvePath(path));

        if (!isAnotherProject) {
          if (type === "folder" && glob.matches(path)) {
            results.push(path);
          }

          await collect(results, join(folder, entry.name), glob, type);
        }
      }
    }

    return results;
  }

  return {
    ignore: config.ignore,
    fileConventions: config.fileConventions,
    folderConventions: config.folderConventions,
    resolve: resolvePath,
    relative: relativePath,
    ignores: (path) => ig.ignores(path),
    async listFiles(glob) {
      return await collect([], "", createGlob(glob), "file");
    },
    async listFolders(glob) {
      return await collect([], "", createGlob(glob), "folder");
    },
    async hasFile(path) {
      if (ig.ignores(path)) {
        return false;
      } else {
        try {
          const status = await fs.stat(resolvePath(path));

          return status.isFile();
        } catch {
          return false;
        }
      }
    },
    async hasFolder(path) {
      if (ig.ignores(path)) {
        return false;
      } else {
        try {
          const status = await fs.stat(resolvePath(path));

          return status.isDirectory();
        } catch {
          return false;
        }
      }
    },
  };
}
