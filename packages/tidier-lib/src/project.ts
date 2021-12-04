import { join, basename, dirname } from "path";
import ignore, { Ignore } from "ignore";

import { NameConvention } from "./convention";
import { ProjectSettings } from "./config";
import { Glob } from "./glob";
import {
  createProjectSettings,
  parseConfig,
  TIDIER_CONFIG_NAME,
} from "./config";
import { EntryType, Folder } from "./folder";
import { FolderEntry, Problem } from ".";

/** Boy, you do not want to look in these ... */
const ALWAYS_IGNORE = ["**/.git"];

export type ProjectConventions = Record<EntryType, readonly NameConvention[]>;

export class Project {
  public readonly folder: Folder;

  #conventions: ProjectConventions;
  #ignore: Ignore;

  public get conventions() {
    return this.#conventions;
  }

  constructor(folder: Folder, settings: ProjectSettings) {
    this.folder = folder;
    this.applySettings(settings);
  }

  /**
   * Loads a project from a folder where a `.tidierrc` is located.
   * Also also loads the `.gitignore` if one exists at the root of the folder.
   * @param folder The folder to load the project from.
   */
  public static async load(folder: Folder): Promise<Project> {
    const settings = await loadProjectSettings(folder);

    return new Project(folder, settings);
  }

  /**
   * Attempts to locate the nearest project to a given folder,
   * by searching the provided folder and its parents for a `.tidierrc`.
   * @param path The folder from which you want to search from.
   * @param levels The maximum number of parents to search.
   */
  public static async near(
    folder: Folder,
    levels = 5
  ): Promise<Project | null> {
    if (levels === 0) {
      return null;
    }

    const configType = await folder.entryType(TIDIER_CONFIG_NAME);

    if (configType === "file") {
      return Project.load(folder);
    } else {
      const parent = folder.parent();

      if (parent) {
        return Project.near(parent, --levels);
      }
    }

    return null;
  }

  /**
   * Reloads the project settings.
   * This is useful for when the config or .gitignore has been updated, and you want to reload it.
   */
  public async reload(): Promise<void> {
    const settings = await loadProjectSettings(this.folder);
    this.applySettings(settings);
  }

  /**
   * Returns the naming convention for the given type and path.
   * If the path is ignored, or if no convention is found, `null` is returned.
   * @param type Whether to get a convention for a file or folder.
   * @param path A path relative to the project root.
   */
  public getConvention(type: EntryType, path: string): NameConvention | null {
    return this.getFromConventions(path, this.#conventions[type]);
  }

  /** Lists entries of the specified type matching the provided glob. */
  public async list(
    glob: Glob,
    entryType?: EntryType
  ): Promise<readonly FolderEntry[]> {
    return await this.collect([], "./", glob, entryType);
  }

  /** Returns whether the path is ignored within the project. */
  public ignores(path: string): boolean {
    return this.#ignore.ignores(path);
  }

  private applySettings(settings: ProjectSettings) {
    this.#ignore = ignore({ ignorecase: true }).add(settings.ignore);
    this.#conventions = {
      file: settings.fileConventions,
      folder: settings.folderConventions,
    };
  }

  private async collect(
    collected: FolderEntry[],
    folderPath: string,
    glob: Glob,
    filter?: EntryType
  ): Promise<readonly FolderEntry[]> {
    const entries = await this.folder.list(folderPath);
    const includeFiles = !filter || filter === "file";
    const includeFolders = !filter || filter === "folder";

    for (const [name, type] of entries) {
      const path = join(folderPath, name);

      if (this.ignores(path)) {
        continue;
      }

      if (includeFiles && type === "file" && glob.matches(path)) {
        collected.push([path, type]);
      } else if (type === "folder") {
        const configPath = join(path, TIDIER_CONFIG_NAME);
        const configType = await this.folder.entryType(configPath);

        if (configType !== "file") {
          if (includeFolders && glob.matches(path)) {
            collected.push([path, type]);
          }

          await this.collect(collected, path, glob, filter);
        }
      }
    }

    return collected;
  }

  private getFromConventions(
    path: string,
    conventions: readonly NameConvention[]
  ) {
    if (this.ignores(path)) {
      return null;
    } else {
      return conventions.find(({ glob }) => glob.matches(path)) || null;
    }
  }
}

async function loadProjectSettings(folder: Folder) {
  const configData = await folder.readFile(TIDIER_CONFIG_NAME);
  const { ignore = [], ...conventions } = parseConfig(configData);
  const gitignore = await readGitignore(folder);
  const allIgnores = [...ALWAYS_IGNORE, ...ignore, ...gitignore];

  return createProjectSettings({ ...conventions, ignore: allIgnores });
}

export async function readGitignore(
  folder: Folder
): Promise<readonly string[]> {
  try {
    const lines = await folder.readFile(".gitignore", "utf-8");

    return lines.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  } catch {
    return [];
  }
}
