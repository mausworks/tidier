import fc from "fast-check";
import { arb, InMemoryFolder } from "tidier-test";
import { Ignorefile, ProjectIgnore } from "./ignore";

const arbitraryIgnorePaths = () =>
  fc.set(fc.oneof(arb.folderPath(), arb.filePath()), { minLength: 1 });

describe("loading ignorefiles", () => {
  it("reads the file with the specified path on load and reload", async () => {
    await fc.assert(
      fc.asyncProperty(
        arb.folderPath(true),
        arb.fileName(),
        arbitraryIgnorePaths(),
        async (root, fileName, contents) => {
          const folder = new InMemoryFolder(root, {
            [`${root}/${fileName}`]: contents.join("\n"),
          });
          const readFileSpy = jest.spyOn(folder, "readFile");
          const ignorefile = await Ignorefile.load(folder, fileName);
          await ignorefile.reload();

          expect(readFileSpy).toHaveBeenCalledWith(fileName);
          expect(readFileSpy).toHaveBeenLastCalledWith(fileName);
          expect(readFileSpy).toHaveBeenCalledTimes(2);
        }
      )
    );
  });

  it("does not err when an ignorefile doesn't exist", async () => {
    await fc.assert(
      fc.asyncProperty(
        arb.folderPath(true),
        arb.fileName(),
        async (root, fileName) => {
          const folder = new InMemoryFolder(root);
          await expect(
            Ignorefile.load(folder, fileName)
          ).resolves.not.toThrow();
        }
      )
    );
  });
});

describe("ignorefile glob semantics", () => {
  test("excluding specific files", () => {
    const folder = new InMemoryFolder("/root");
    const patterns = ["**/*.js", "!**/foo.js"];
    const ignorefile = new Ignorefile({
      semantics: "glob",
      path: "ignorefile",
      folder: folder,
      patterns,
    });

    expect(ignorefile.ignores("bar.js")).toBe(true);
    expect(ignorefile.ignores("foo/bar/baz.js")).toBe(true);
    expect(ignorefile.ignores("foo.js")).toBe(false);
    expect(ignorefile.ignores("foo/bar/foo.js")).toBe(false);
    expect(ignorefile.ignores("bat.txt")).toBe(false);
  });
});

describe("project ignores", () => {
  it("does not add duplicate ignorefiles", () => {
    fc.assert(
      fc.property(arb.filePath(), (path) => {
        const folder = new InMemoryFolder(path);
        const ignorefiles = [
          new Ignorefile({ path, folder, patterns: [], semantics: "glob" }),
          new Ignorefile({ path, folder, patterns: [], semantics: "glob" }),
        ];

        const ignore = new ProjectIgnore();

        for (const ignorefile of ignorefiles) {
          ignore.useIgnorefile(ignorefile);
        }

        expect(ignore.ignorefiles).toHaveLength(1);
      })
    );
  });

  it("ignores files that are ignored by settings", () => {
    fc.assert(
      fc.property(arbitraryIgnorePaths(), (paths) => {
        const ignore = new ProjectIgnore();
        ignore.use(paths);

        expect(ignore.patterns).toEqual(paths);

        for (const path of paths) {
          expect(ignore.ignores(path)).toBe(true);
        }
      })
    );
  });

  it("ignores files that are ignored by ignorefiles", () => {
    fc.assert(
      fc.property(arbitraryIgnorePaths(), (paths) => {
        const ignore = new ProjectIgnore();
        const ignorefile = new Ignorefile({
          path: "/.gitignore",
          folder: new InMemoryFolder("/"),
          patterns: paths,
          semantics: "gitignore",
        });

        ignore.useIgnorefile(ignorefile);

        for (const path of paths) {
          expect(ignore.ignores(path)).toBe(true);
        }
      })
    );
  });

  it("reloads all ignorefiles on reload", async () => {
    await fc.assert(
      fc.asyncProperty(
        arb.folderPath(true),
        fc.set(arb.fileName(), { minLength: 2, maxLength: 3 }),
        async (root, ignorefileNames) => {
          const ignores = new ProjectIgnore();
          const folder = new InMemoryFolder(root);

          for (const name of ignorefileNames) {
            folder.volume[`${root}/${name}`] = "foo.js";
            const ignorefile = await Ignorefile.load(folder, name);

            ignores.useIgnorefile(ignorefile);
          }

          const readFileSpy = jest.spyOn(folder, "readFile");
          ignores.reload();

          for (const name of ignorefileNames) {
            expect(readFileSpy).toHaveBeenCalledWith(name);
          }
        }
      )
    );
  });
});
