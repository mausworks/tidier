import fc, { ArrayConstraints } from "fast-check";
import { join } from "path";

const charCodes = {
  a: "a".charCodeAt(0),
  z: "z".charCodeAt(0),
};

export const fragmentChar = () =>
  fc
    .nat(charCodes.z - charCodes.a - 1)
    .map((value) => String.fromCharCode(charCodes.a + value + 1));

export const fragment = (minLength = 2, maxLength = 10) =>
  fc
    .array(fragmentChar(), { minLength, maxLength })
    .map((chars) => chars.join(""));

export const folder = (
  root = false,
  { minLength = 1, maxLength = 5 }: ArrayConstraints = {}
) =>
  fc
    .array(fragment(), { minLength, maxLength })
    .map((fragments) => (root ? "/" : "") + fragments.join("/"));

export const fileName = (maxFragments = 2) =>
  fc
    .array(fragmentChar(), {
      minLength: 1,
      maxLength: maxFragments,
    })
    .map((fragments) => fragments.join("."));

export const filePath = ({
  minLength = 1,
  maxLength = 5,
}: ArrayConstraints = {}) =>
  folder(false, { minLength, maxLength }).chain((dir) =>
    fileName().map((name) => join(dir, name))
  );
