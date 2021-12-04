import toRegexp from "glob-to-regexp";

const options: toRegexp.Options = {
  globstar: true,
  extended: true,
  flags: "i",
} as const;

/** A glob that quickly allows you to match paths towards a pattern. */
export class Glob {
  /** The pattern that is being used for matching. */
  readonly pattern: string;
  /** The regular expression that is internally used for matching paths. */
  readonly #regexp: RegExp;
  /** A glob pattern that matches any file or folder. */
  static readonly ANYTHING = new Glob("*/**");

  /**
   * Creates a new glob that allows you to quickly match paths towards a pattern.
   * @param pattern The pattern to use for matching.
   */
  constructor(pattern: string) {
    this.pattern = pattern;
    this.#regexp = toRegexp(pattern, options);
  }

  /**
   * Determines whether the glob matches the path.
   * @param path The path to match towards the glob.
   */
  public matches = (path: string) => this.#regexp.test(path);
}
