import { join } from "path";
import fc from "fast-check";
import { arb, TestFolder } from "tidier-test";

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
): TestFolder => {
  const folder = new TestFolder(root);

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
      fc.asyncProperty(arb.folderPath(true), async (rootPath) => {
        const folder = seedFolder(rootPath, [], []);

        expect(() => new Project(folder, basicSettings)).not.toThrow();
      })
    );
  });

  it("reads the .gitignore files from the project root when using `load` without any options", async () => {
    await fc.assert(
      fc.asyncProperty(
        arb.folderPath(true),
        fc.array(fc.oneof(arb.folderPath(), arb.filePath()), { minLength: 1 }),
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

  it("reads the specified ignorefiles on `load`", async () => {
    await fc.assert(
      fc.asyncProperty(
        arb.folderPath(true),
        fc.array(
          fc.tuple(
            arb.filePath(),
            fc.set(fc.oneof(arb.folderPath(), arb.filePath()), { minLength: 1 })
          ),
          { minLength: 2 }
        ),
        async (rootPath, ignorefiles) => {
          const folder = seedFolder(rootPath, [], []);
          const readFileSpy = jest.spyOn(folder, "readFile");
          const configPath = join(rootPath, TIDIER_CONFIG_NAME);
          folder.volume[configPath] = JSON.stringify(basicJSONConfig);

          for (const [path, lines] of ignorefiles) {
            folder.volume[join(rootPath, path)] = lines.join("\n");
          }

          const project = await Project.load(folder, {
            ignorefiles: ignorefiles.map(([path]) => path),
          });

          for (const [ignorefilePath, lines] of ignorefiles) {
            expect(readFileSpy).toHaveBeenCalledWith(ignorefilePath);

            for (const path of lines) {
              expect(project.ignores(path)).toBe(true);
            }
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
        arb.folderPath(true),
        fc.set(arb.filePath({ minLength: 2, maxLength: 2 }), {
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
        arb.folderPath(true),
        fc.set(arb.folderPath(false, { maxLength: 1 }), {
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
        arb.folderPath(true),
        fc.set(arb.folderPath(), { minLength: 2 }),
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
