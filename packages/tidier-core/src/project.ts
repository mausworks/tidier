import { join } from "path";

import { NameConvention } from "./convention";
import { ProjectSettings } from "./config";
import { Glob } from "./glob";
import {
  createProjectSettings,
  parseConfig,
  TIDIER_CONFIG_NAME,
} from "./config";
import { EntryType, Folder, FolderEntry } from "./folder";
import { Ignorefile, ProjectIgnore } from "./ignore";

/** Boy, you do not want to look in these ... */
const ALWAYS_IGNORE = ["**/.git"];

export type ProjectConventions = Record<EntryType, readonly NameConvention[]>;

export interface ProjectLoadOptions {
  /**
   * Paths to ignorefiles; such as .gitignore, .eslintignore or .npmignore,
   * relative to the project root.
   *
   * Tidier will include the patterns
   * specified in these files and never check
   * or attempt fixes for entries matching them.
   */
  ignorefiles?: readonly string[];
}

export interface ProjectSearchOptions extends ProjectLoadOptions {
  /** The maximum number of parent directories to search. */
  levels?: number;
}

const DEFAULT_LOAD_OPTS: Required<ProjectLoadOptions> = Object.freeze({
  ignorefiles: [".gitignore"],
});

const DEFAULT_SEARCH_OPTS: Required<ProjectSearchOptions> = Object.freeze({
  ...DEFAULT_LOAD_OPTS,
  levels: 5,
});

export class Project {
  readonly folder: Folder;
  readonly ignore: ProjectIgnore = new ProjectIgnore();

  #conventions: ProjectConventions;

  get conventions() {
    return this.#conventions;
  }

  constructor(folder: Folder, settings: ProjectSettings) {
    this.folder = folder;
    this.#useSettings(settings);
  }

  /**
   * Loads a project from a folder where a `.tidierrc` is located.
   * @param folder The folder to load the project from
   * @param options Additional load options
   */
  static async load(
    folder: Folder,
    options?: ProjectLoadOptions
  ): Promise<Project> {
    const { ignorefiles } = { ...DEFAULT_LOAD_OPTS, ...options };
    const settings = await loadProjectSettings(folder);
    const project = new Project(folder, settings);

    for (const path of ignorefiles) {
      const ignorefile = await Ignorefile.load(folder, path);

      project.ignore.useIgnorefile(ignorefile);
    }

    return project;
  }

  /**
   * Attempts to locate the nearest project to a given folder,
   * by searching the provided folder and its parents for a `.tidierrc`.
   * @param path The folder from which you want to search from
   * @param options Additional load and search options
   */
  static async near(
    folder: Folder,
    options?: ProjectSearchOptions
  ): Promise<Project | null> {
    const { levels, ...loadOptions } = { ...DEFAULT_SEARCH_OPTS, ...options };

    if (levels === 0) {
      return null;
    }

    const configType = await folder.entryType(TIDIER_CONFIG_NAME);

    if (configType === "file") {
      return Project.load(folder, loadOptions);
    } else {
      const parent = folder.parent();

      if (parent) {
        return Project.near(parent, { ...options, levels: levels - 1 });
      }
    }

    return null;
  }

  /**
   * Reloads the project with the options it was loaded with.
   * This is useful for when the config or an ignorefile has been updated.
   */
  async reload(): Promise<void> {
    const settings = await loadProjectSettings(this.folder);
    await this.ignore.reload();
    this.#useSettings(settings);
  }

  /**
   * Returns the naming convention for the given type and path.
   * If the path is ignored, or if no convention is found, `null` is returned.
   * @param type Whether to get a convention for a file or folder.
   * @param path A path relative to the project root.
   */
  getConvention(type: EntryType, path: string): NameConvention | null {
    return this.#getFromConventions(path, this.#conventions[type]);
  }

  /** Lists entries of the specified type matching the provided glob. */
  async list(
    glob: Glob,
    entryType?: EntryType
  ): Promise<readonly FolderEntry[]> {
    return await this.#collect([], "./", glob, entryType);
  }

  /** Returns whether the path is ignored within the project. */
  ignores(path: string): boolean {
    return this.ignore.ignores(path);
  }

  #useSettings(settings: ProjectSettings) {
    this.#conventions = {
      file: settings.fileConventions,
      folder: settings.folderConventions,
    };
    this.ignore.use(settings.ignore);
  }

  async #collect(
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

          await this.#collect(collected, path, glob, filter);
        }
      }
    }

    return collected;
  }

  #getFromConventions(path: string, conventions: readonly NameConvention[]) {
    if (this.ignores(path)) {
      return null;
    } else {
      return conventions.find(({ glob }) => glob.matches(path)) || null;
    }
  }
}

async function loadProjectSettings(folder: Folder): Promise<ProjectSettings> {
  const configData = await folder.readFile(TIDIER_CONFIG_NAME);
  const { ignore = [], ...conventions } = parseConfig(configData);
  const allIgnores = [...ALWAYS_IGNORE, ...ignore];

  return createProjectSettings({ ...conventions, ignore: allIgnores });
}
