import picomatch from "picomatch";

const options: picomatch.PicomatchOptions = {
  dot: true,
  nocase: true,
} as const;

type Matcher = (input: string) => boolean;

/** A glob that quickly allows you to match paths towards a pattern. */
export class Glob {
  /** The pattern that is being used for matching. */
  readonly pattern: string;
  /**
   * Determines whether the glob matches the path.
   * @param path The path to match towards the glob.
   */
  readonly matches: Matcher;

  /** A glob that matches any file or folder. */
  static readonly ANYTHING: Glob = {
    pattern: "**/*",
    matches: () => true,
  } as const;

  /**
   * Creates a new glob that allows you to quickly match paths towards a pattern.
   * @param pattern The pattern to use for matching.
   */
  constructor(pattern: string) {
    this.pattern = pattern;
    this.matches = picomatch(pattern, options);
  }
}
