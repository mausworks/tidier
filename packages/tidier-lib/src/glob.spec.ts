import fc from "fast-check";
import { Glob } from "./glob";

import { ap } from "@tidier/test";

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
    fc.property(fc.oneof(ap.filePath(), ap.folder()), (path) =>
      new Glob(path).matches(path)
    )
  );
});

test("different paths do not match each other", () => {
  fc.assert(
    fc.property(
      fc.set(fc.oneof(ap.filePath(), ap.folder()), {
        minLength: 2,
        maxLength: 2,
      }),
      ([one, theNext]) => !new Glob(one).matches(theNext)
    )
  );
});

test("ANYTHING matches any string", () => {
  fc.assert(fc.property(fc.string(), Glob.ANYTHING.matches));
});
