import picomatch from "picomatch";
import { withoutLeadingSlash, withTrailingSlash } from "./folder";

const options: picomatch.PicomatchOptions = {
  dot: true,
  nocase: true,
} as const;

type PathMatcher = (path: string) => boolean;

/** A glob that quickly allows you to match paths towards a pattern. */
export class Glob {
  /** The pattern that is being used for matching. */
  readonly pattern: string;
  /**
   * Determines whether the glob matches the path.
   * @param path The path to match.
   */
  readonly matches: PathMatcher;
  /**
   * Whether the glob pattern is a plain path.
   * If true, the glob does not use any wildcards,
   * brace expansion or any extended glob matching feature.
   */
  readonly isPath: boolean;

  /** A glob that matches any file or folder. */
  static readonly ANYTHING: Glob = Object.freeze({
    pattern: "**/*",
    isPath: false,
    matches: () => true,
  });

  /**
   * Creates a new glob that allows you to quickly match paths towards a pattern.
   * @param pattern The pattern to use for matching.
   */
  constructor(pattern: string) {
    this.pattern = pattern;
    this.isPath = isPlainPath(pattern);
    this.matches = this.isPath
      ? pathMatch(pattern)
      : picomatch(pattern, options);
  }

  /**
   * Prefixes the glob pattern with the provided path,
   * resulting in a glob which matches entries relative to it.
   * @param path The prefix path.
   * @param pattern The pattern to match within the prefix path.
   */
  static within(path: string, pattern: string): Glob {
    if (!path || path === "/") {
      return new Glob(pattern);
    } else {
      const negate = pattern.startsWith("!");
      pattern = negate ? pattern.substring(1) : pattern;

      return new Glob(
        (negate ? "!" : "") +
          withTrailingSlash(path) +
          withoutLeadingSlash(pattern)
      );
    }
  }
}

function pathMatch(expected: string): PathMatcher {
  expected = expected.toLowerCase();

  return (path) => path.toLowerCase() === expected;
}

const GLOB_CHAR_PATTERN = /[\?\*\!\{]|[\+\@]\(/;

function isPlainPath(pattern: string) {
  return !GLOB_CHAR_PATTERN.test(pattern);
}
