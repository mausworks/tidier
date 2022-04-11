import fc, { ArrayConstraints } from "fast-check";
import { join } from "path";

const CHAR_CODE_A = "a".charCodeAt(0);
const CHAR_CODE_Z = "z".charCodeAt(0);

/** Generates a character which is a valid path segment. */
export const pathSegmentChar = () =>
  fc
    .nat(CHAR_CODE_Z - CHAR_CODE_A - 1)
    .map((value) => String.fromCharCode(CHAR_CODE_A + value + 1));

/** Generates a path segment (i.e. a folder or file name) */
export const pathSegment = (minLength = 1, maxLength = 10) =>
  fc
    .array(pathSegmentChar(), { minLength, maxLength })
    .map((chars) => chars.join(""));

/**
 * Generates a path to a folder.
 * @param root Whether this path should start with '/'.
 * @param constraints Constraints the number of path segments.
 */
export const folderPath = (
  root = false,
  { minLength = 1, maxLength = 5 }: ArrayConstraints = {}
) =>
  fc
    .array(pathSegment(), { minLength, maxLength })
    .map((fragments) => (root ? "/" : "") + fragments.join("/"));

/**
 * Generates a valid file name, e.g. `foo.bar`.
 * @param maxFragments The maximum number of fragments allowed in the name.
 */
export const fileName = (maxFragments = 2) =>
  fc
    .array(pathSegment(), { minLength: 1, maxLength: maxFragments })
    .map((fragments) => fragments.join("."));

/**
 * Generates a path to a file.
 * @param constraints Constraints the number of path segments.
 */
export const filePath = ({
  minLength = 1,
  maxLength = 5,
}: ArrayConstraints = {}) =>
  folderPath(false, { minLength, maxLength }).chain((dir) =>
    fileName().map((name) => join(dir, name))
  );
