import fc from "fast-check";
import { createGlob } from "./glob";

import * as ap from "./__arbitraries__/arbitrary-paths";

const matches = {
  "*": ["foo", "bar", "baz", "bat"],
  "**/*": ["foo", "bar/baz", "foo/bar/baz/bat.foo"],
  "**/*.{ts,js}": ["foo/bar.ts", "some-other/path/file.js"],
};

test("explicit matches", () => {
  for (const [pattern, values] of Object.entries(matches)) {
    const glob = createGlob(pattern);

    for (const value of values) {
      expect(glob.matches(value)).toBe(true);
    }
  }
});

test("paths match themselves", () => {
  fc.assert(
    fc.property(fc.oneof(ap.filePath(), ap.folder()), (path) =>
      createGlob(path).matches(path)
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
      ([one, theNext]) => !createGlob(one).matches(theNext)
    )
  );
});
