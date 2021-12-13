jest.mock("fs");
jest.mock("fs/promises");

import { join, dirname } from "path";
import fc from "fast-check";
import { ap, InMemoryFolder } from "@tidier/test";

import {
  createProjectSettings,
  ProjectSettings,
  TidierConfig,
  TIDIER_CONFIG_NAME,
} from "./config";
import { Project } from "./project";
import { Glob } from "./glob";

const basicJSONConfig: TidierConfig = {
  ignore: [],
  files: { "**/*": "kebab-case.lc" },
  folders: { "**/*": "kebab-case" },
};

const basicSettings: ProjectSettings = createProjectSettings(basicJSONConfig);

const seedFolder = (
  root: string,
  filePaths: string[],
  folderPaths: string[]
): InMemoryFolder => {
  const folder = new InMemoryFolder(root);

  for (const path of folderPaths) {
    folder.volume[join(root, path)] = null;
  }

  for (const path of filePaths) {
    folder.volume[join(root, path)] = "_file";
  }

  return folder;
};

describe("project creation", () => {
  it("creates a project when the root folder exists, and a config is provided", async () => {
    await fc.assert(
      fc.asyncProperty(ap.folder(true), async (rootPath) => {
        const folder = seedFolder(rootPath, [], []);

        expect(() => new Project(folder, basicSettings)).not.toThrow();
      })
    );
  });

  it("reads the .gitignore files from the project root when using `fromConfig`", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        fc.array(fc.oneof(ap.folder(), ap.filePath()), { minLength: 1 }),
        async (rootPath, ignore) => {
          const folder = seedFolder(rootPath, [], []);
          const configPath = join(rootPath, TIDIER_CONFIG_NAME);
          folder.volume[configPath] = JSON.stringify(basicJSONConfig);
          folder.volume[join(rootPath, ".gitignore")] = ignore.join("\n");

          const project = await Project.load(folder);

          for (const path of ignore) {
            expect(project.ignores(path)).toBe(true);
          }
        }
      )
    );
  });
});

describe("listing", () => {
  it("lists all files (except ignored) with '**/*'", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        fc.set(ap.filePath({ minLength: 2, maxLength: 2 }), {
          minLength: 2,
          maxLength: 2,
        }),
        async (rootPath, files) => {
          const root = seedFolder(rootPath, files, []);
          const ignore = files.slice(0, files.length / 2);

          const project = new Project(root, { ...basicSettings, ignore });
          const entries = await project.list(Glob.ANYTHING, "file");
          const paths = entries.map(([path]) => path);

          for (const file of paths) {
            expect(paths.includes(file)).toBe(!ignore.includes(file));
          }
        }
      )
    );
  });

  it("lists all folders (except ignored) with '**/*'", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        fc.set(ap.folder(false, { maxLength: 1 }), {
          minLength: 2,
          maxLength: 2,
        }),
        async (rootPath, folders) => {
          const root = seedFolder(rootPath, [], folders);

          const ignore = folders.slice(0, Math.floor(folders.length / 2));

          const project = new Project(root, { ...basicSettings, ignore });
          const entries = await project.list(Glob.ANYTHING, "folder");
          const paths = entries.map(([path]) => path);

          for (const folder of folders) {
            expect(paths.includes(folder)).toBe(!ignore.includes(folder));
          }
        }
      )
    );
  });

  it("does not include other project files", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        fc.set(ap.folder(), { minLength: 2 }),
        async (rootPath, folders) => {
          const root = seedFolder(rootPath, [], folders);
          const otherRoot = folders[folders.length - 1];
          const configPath = join(rootPath, otherRoot, TIDIER_CONFIG_NAME);
          root.volume[configPath] = "{}";

          const project = new Project(root, basicSettings);
          const entries = await project.list(Glob.ANYTHING, "folder");

          expect(entries.map(([path]) => path).includes(otherRoot)).toBe(false);
        }
      )
    );
  });
});
