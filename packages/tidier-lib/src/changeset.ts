export type Change<T> = [string, T];

/** Describes a set of changes. */
export interface Changeset<T> {
  /** List the changes in the changeset. */
  list(): Change<T>[];
  /** Add a new change to the changeset. */
  add(original: string, change: T): void;
}

/**
 * Creates a new immutable changeset.
 * While you can add new changes to it,
 * you cannot modify existing changes in it.
 * Attempting to do so is simply no-op.
 */
export function immutableChangeset<T>(): Changeset<T> {
  const changes: Record<string, T> = Object.create(null);

  return {
    list: () => Object.entries<T>(changes),
    add(original, change) {
      if (changes[original] === undefined) {
        changes[original] = change;
      }
    },
  };
}
