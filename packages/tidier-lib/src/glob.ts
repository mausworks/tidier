import toRegex from "glob-to-regexp";

export interface Glob {
  pattern: string;
  matches(path: string): boolean;
}

const options: toRegex.Options = {
  globstar: true,
  extended: true,
  flags: "i",
} as const;

export function createGlob(pattern: string): Glob {
  const regex = toRegex(pattern, options);

  return {
    pattern,
    matches: (path) => regex.test(path),
  };
}
