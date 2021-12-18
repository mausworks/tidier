import gitignore from "ignore";
import { basename } from "path";
import { Glob } from ".";
import { Folder, PathMatcher } from "./folder";

export type IgnoreSemantics = "gitignore" | "glob";

export interface IgnorefileOptions {
  /** The path of the file, relative to the folder. */
  path: string;
  /** The folder that the path is relative to. */
  folder: Folder;
  /** The patterns that are contained within the files. */
  patterns: string[];
  /** Which semantics to use when ignoring a file. */
  semantics: IgnoreSemantics;
}

const knownSemantics: Record<string, IgnoreSemantics | undefined> = {
  ".gitignore": "gitignore",
  ".eslintignore": "gitignore",
  ".prettierignore": "gitignore",
  ".tidierignore": "gitignore",
  ".npmignore": "glob",
  ".vscodeignore": "glob",
};

/** An ignorefile, such as .gitignore or .npmignore. */
export class Ignorefile {
  /**
   * Describes which semantics the ignorefile uses when matching,
   * either using gitignore semantics or basic glob semantics.
   */
  readonly semantics: IgnoreSemantics;
  /** The path to the ignorefile within the folder. */
  readonly path: string;
  /** The folder of the project for the ignorefile. */
  readonly #folder: Folder;
  /** The internal path matcher. */
  #ignores: PathMatcher;

  constructor({ path, folder, patterns, semantics }: IgnorefileOptions) {
    this.semantics = semantics;
    this.path = path;
    this.#folder = folder;
    this.#usePatterns(patterns);
  }

  /** Returns true if the path is ignored. */
  ignores(path: string): boolean {
    return this.#ignores(path);
  }

  /** Reloads the ignorefile, useful if the file has been updated. */
  async reload() {
    const patterns = await readPatterns(this.#folder, this.path);

    this.#usePatterns(patterns);
  }

  /**
   * Loads an ignorefile from the provided folder at the specified path.
   * The semantics of the ignorefile is determined based on the file name.
   * If the file doesn't exist, no error is thrown:
   * this is equivalent to having an empty ignorefile.
   * @param folder The folder to load the file from
   * @param path The path of the ignorefile within the folder
   */
  static async load(folder: Folder, path: string): Promise<Ignorefile> {
    const patterns = await readPatterns(folder, path);
    const semantics = knownSemantics[basename(path)] ?? "gitignore";

    return new Ignorefile({ path, patterns, semantics, folder });
  }

  #usePatterns(patterns: string[]) {
    this.#ignores =
      this.semantics === "gitignore"
        ? gitignoreMatcher(patterns)
        : globMatcher(patterns);
  }
}

/**
 * A state container ignorefiles and patterns ignored
 */
export class ProjectIgnore {
  #ignorefiles: Ignorefile[] = [];
  #patterns: string[];
  #ignoredBySettings: PathMatcher = () => false;

  /** The ignorefiles that are being used. */
  get ignorefiles(): readonly Ignorefile[] {
    return this.#ignorefiles;
  }

  /**
   * Patterns that are being directly used to ignore files.
   * This does not include the patterns from ignorefiles.
   */
  get patterns(): readonly string[] {
    return this.#patterns;
  }

  ignores(path: string): boolean {
    return (
      this.#ignoredBySettings(path) ||
      this.#ignorefiles.some((file) => file.ignores(path))
    );
  }

  /**
   * Adds the provided ignorefile,
   * unless it has already been added.
   */
  useIgnorefile(ignorefile: Ignorefile) {
    if (this.#ignorefiles.some((file) => file.path === ignorefile.path)) {
      return;
    }

    this.#ignorefiles.push(ignorefile);
  }

  /** Ignore the specified patterns. */
  use(patterns: string[]) {
    this.#patterns = patterns;
    this.#ignoredBySettings = gitignoreMatcher(patterns);
  }

  /** Reloads all ignorefiles. */
  async reload() {
    await Promise.all(this.#ignorefiles.map((file) => file.reload()));
  }
}

const parsePatterns = (data: string) =>
  data.split("\n").filter((line) => line.trim() && !line.startsWith("#"));

async function readPatterns(folder: Folder, path: string) {
  try {
    const data = await folder.readFile(path);
    const patterns = parsePatterns(data);

    return patterns;
  } catch {
    return [];
  }
}

function gitignoreMatcher(patterns: string[]): PathMatcher {
  const ignores = gitignore({ ignorecase: true }).add(patterns);

  return (path) => ignores.ignores(path);
}

function globMatcher(patterns: string[]): PathMatcher {
  const globs = patterns.map((pattern) => new Glob(pattern));
  const negates = globs.filter((glob) => glob.negates);
  const matches = globs.filter((glob) => !glob.negates);

  return (path) => {
    for (const glob of negates) {
      if (!glob.matches(path)) {
        return false;
      }
    }

    for (const glob of matches) {
      if (glob.matches(path)) {
        return true;
      }
    }

    return false;
  };
}
