import fc, { ArrayConstraints } from "fast-check";
import { join } from "path";

const CHAR_CODE_A = "a".charCodeAt(0);
const CHAR_CODE_Z = "z".charCodeAt(0);

export const fragmentChar = () =>
  fc
    .nat(CHAR_CODE_Z - CHAR_CODE_A - 1)
    .map((value) => String.fromCharCode(CHAR_CODE_A + value + 1));

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

export const folderName = () => fileName(1);

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
