jest.mock("fs");
jest.mock("fs/promises");

import { join, dirname } from "path";
import { fs, vol } from "memfs";
import fc from "fast-check";

import * as ap from "./__arbitraries__/arbitrary-paths";
import {
  createProjectSettings,
  ProjectSettings,
  TidierConfig,
  TIDIER_CONFIG_NAME,
} from "./config";
import { FileDirectory } from "./folder";
import { Project } from "./project";
import { createGlob } from ".";

const basicJSONConfig: TidierConfig = {
  ignore: [],
  files: {
    "**/*": "kebab-case.lc",
  },
  folders: {
    "**/*": "kebab-case",
  },
};

const basicSettings: ProjectSettings = createProjectSettings(basicJSONConfig);

const seedVolume = (
  root: string,
  filePaths: string[],
  folderPaths: string[]
) => {
  vol.reset();
  vol.mkdirSync(root, { recursive: true });

  for (const path of folderPaths) {
    if (!vol.existsSync(join(root, path))) {
      vol.mkdirSync(join(root, path), { recursive: true });
    }
  }

  for (const path of filePaths) {
    if (!vol.existsSync(join(root, dirname(path)))) {
      vol.mkdirSync(join(root, dirname(path)), { recursive: true });
    }

    vol.writeFileSync(join(root, path), "_file");
  }
};

describe("project creation", () => {
  it("creates a project when the root folder exists, and a config is provided", async () => {
    await fc.assert(
      fc.asyncProperty(ap.folder(true), async (rootPath) => {
        seedVolume(rootPath, [], []);

        const root = await FileDirectory.resolve(rootPath);
        expect(() => new Project(root, basicSettings)).not.toThrow();
      })
    );
  });

  it("reads the .gitignore files from the project root when using `fromConfig`", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        fc.array(fc.oneof(ap.folder(), ap.filePath()), { minLength: 1 }),
        async (rootPath, ignore) => {
          seedVolume(rootPath, [], []);
          const configPath = join(rootPath, TIDIER_CONFIG_NAME);

          fs.writeFileSync(configPath, JSON.stringify(basicJSONConfig));
          fs.writeFileSync(join(rootPath, ".gitignore"), ignore.join("\n"));

          const folder = new FileDirectory(rootPath);
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
        fc.set(ap.filePath(), { minLength: 2 }),
        async (rootPath, files) => {
          seedVolume(rootPath, files, []);

          const ignore = files.slice(0, files.length / 2);
          const root = await FileDirectory.resolve(rootPath);

          const project = new Project(root, { ...basicSettings, ignore });
          const paths = await project.list("file", createGlob("**/*"));

          for (const file of files) {
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
        fc.set(ap.folder(), { minLength: 2 }),
        async (rootPath, folders) => {
          seedVolume(rootPath, [], folders);

          const ignore = folders.slice(0, folders.length / 2);
          const root = await FileDirectory.resolve(rootPath);

          const project = new Project(root, { ...basicSettings, ignore });
          const paths = await project.list("folder", createGlob("**/*"));

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
          seedVolume(rootPath, [], folders);
          const otherRoot = folders[folders.length - 1];
          const configPath = join(rootPath, otherRoot, TIDIER_CONFIG_NAME);
          fs.writeFileSync(configPath, "{}");

          const root = await FileDirectory.resolve(rootPath);
          const project = new Project(root, basicSettings);
          const paths = await project.list("folder", createGlob("**/*"));

          expect(paths.includes(otherRoot)).toBe(false);
        }
      )
    );
  });
});
