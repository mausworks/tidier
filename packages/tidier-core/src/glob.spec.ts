import fc from "fast-check";
import { Glob } from "./glob";

import { arb } from "tidier-test";
import { join } from "path";

const matches = {
  "*": ["foo", "bar", "baz", "bat"],
  "**/*": ["foo", "bar/baz", "bat", "uhvsxkihnh", "foo/bar/baz/bat.foo"],
  "**/*.{ts,js}": ["foo/bar.ts", "some-other/path/file.js"],
};

test("explicit matches", () => {
  for (const [pattern, values] of Object.entries(matches)) {
    const glob = new Glob(pattern);

    for (const value of values) {
      expect(glob.matches(value)).toBe(true);
    }
  }
});

test("paths match themselves", () => {
  fc.assert(
    fc.property(fc.oneof(arb.filePath(), arb.folderPath()), (path) =>
      new Glob(path).matches(path)
    )
  );
});

test("different paths do not match each other", () => {
  fc.assert(
    fc.property(
      fc.set(fc.oneof(arb.filePath(), arb.folderPath()), {
        minLength: 2,
        maxLength: 2,
      }),
      ([one, theNext]) => !new Glob(one).matches(theNext)
    )
  );
});

test('patterns starts with "!" sets `negates` to true', () => {
  expect(new Glob("!foo/bar").negates).toBe(true);
});

describe("appending a prefix to the glob", () => {
  it("appends the prefix to the path", () => {
    fc.assert(
      fc.property(
        arb.folderPath(),
        fc.array(fc.oneof(arb.folderPath(), arb.filePath())),
        (prefix, paths) => {
          for (const path of paths) {
            const glob = Glob.within(prefix, path);

            expect(glob.pattern).toBe(join(prefix, path));
          }
        }
      )
    );
  });

  it('preserves the "!" at the start for negating patterns', () => {
    fc.assert(
      fc.property(
        arb.folderPath(),
        fc.array(fc.oneof(arb.folderPath(), arb.filePath())),
        (prefix, paths) => {
          for (const path of paths) {
            const glob = Glob.within(prefix, "!" + path);

            expect(glob.pattern).toBe("!" + join(prefix, path));
          }
        }
      )
    );
  });
});

test("ANYTHING matches any string", () => {
  fc.assert(fc.property(fc.string(), Glob.ANYTHING.matches));
});

test("prefixing glob patterns", () => {
  const tests = [
    [["foo", "!**/*.ts"], "!foo/**/*.ts"],
    [["/foo/", "!/**/*.ts"], "!/foo/**/*.ts"],
    [["/", "foo/bar"], "foo/bar"],
    [["", "foo/bar"], "foo/bar"],
  ];

  for (const [[path, pattern], result] of tests) {
    expect(Glob.within(path, pattern).pattern).toBe(result);
  }
});
