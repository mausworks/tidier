import { join } from "path";
import { withoutTrailingSlash } from ".";
import { TIDIER_CONFIG_NAME } from "./config";
import { Folder, withTrailingSlash } from "./folder";
import { Project } from "./project";

export class Projects {
  /** The projects, sorted by longest root first. */
  #members: readonly Project[];

  get count() {
    return this.#members.length;
  }

  constructor(projects: readonly Project[] = []) {
    this.#members = sortByLongestPath([...projects]);
  }

  /**
   * Returns the project which best matches the path.
   * @param path The path which you want to find the project for.
   */
  bestMatch(path: string): Project | null {
    for (const project of this.#members) {
      const { folder } = project;
      const withSlash = withTrailingSlash(folder.path);

      if (folder.path === path || path.startsWith(withSlash)) {
        return project;
      }
    }

    return null;
  }

  /** Lists all projects. */
  list(): readonly Project[] {
    return this.#members;
  }

  /**
   * Discovers all projects recursively within the folder.
   * @param folder The folder you want to search.
   * @param maxDepth The maximum depth of sub folders.
   */
  static async discover(
    folder: Folder,
    maxDepth = Infinity
  ): Promise<Projects> {
    const roots = await collectProjects([], folder, "./", maxDepth);

    return new Projects(roots);
  }

  /**
   * Find the project with the specified folder path,
   * or null if the project is not included.
   */
  find(path: string): Project | null {
    return this.#members.find(pathMatcher(path)) || null;
  }

  /** Includes the specified project if it is not already included. */
  add(project: Project): void {
    if (!this.find(project.folder.path)) {
      this.#members = sortByLongestPath([...this.#members, project]);
    }
  }

  /** Combines the provided projects with these projects. */
  combine(projects: Projects): void {
    const newProjects: Project[] = [];

    for (const proj of this.#members.concat(projects.#members)) {
      if (!newProjects.find((p) => p.folder.path === proj.folder.path)) {
        newProjects.push(proj);
      }
    }

    this.#members = sortByLongestPath(newProjects);
  }

  /** Removes the project with the specified path. */
  remove(path: string): void {
    this.#members = this.#members.filter(
      (project) => project.folder.path !== path
    );
  }
}

const pathMatcher = (path: string) => {
  path = withoutTrailingSlash(path);

  return ({ folder }: Project) => withoutTrailingSlash(folder.path) === path;
};

const sortByLongestPath = (projects: Project[]) =>
  projects.sort(longestRootLength);

const avoidCollect = new Set(["node_modules"]);

const shouldCollectFolder = (name: string) =>
  !avoidCollect.has(name) && !name.startsWith(".");

async function collectProjects(
  projects: Project[],
  folder: Folder,
  path: string,
  maxDepth: number
): Promise<Project[]> {
  if (maxDepth-- === 0) {
    return projects;
  }

  for (const [name, type] of await folder.list(path)) {
    if (type === "folder" && shouldCollectFolder(name)) {
      await collectProjects(projects, folder, join(path, name), maxDepth);
    } else if (name === TIDIER_CONFIG_NAME) {
      const projectFolder = folder.child(path);
      const project = await Project.load(projectFolder);

      projects.push(project);
    }
  }

  return projects;
}

function longestRootLength(left: Project, right: Project): number {
  return right.folder.path.length - left.folder.path.length;
}
