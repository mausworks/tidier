import fc from "fast-check";

import { immutableChangeset } from "./changeset";

describe("unique change set", () => {
  it("lists added changes", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string(),
        (original, change) => {
          const changeset = immutableChangeset<string>();

          changeset.add(original, change);

          expect(changeset.list()).toContainEqual([original, change]);
        }
      )
    );
  });

  it("does not overwrite prior additions", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string(),
        fc.string(),
        (original, change, update) => {
          const changeset = immutableChangeset<string>();

          changeset.add(original, change);
          changeset.add(original, update);

          expect(changeset.list()).toContainEqual([original, change]);
        }
      )
    );
  });
});
