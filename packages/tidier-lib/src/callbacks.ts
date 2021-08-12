export type AnyFunction = (...args: any[]) => any;

export type Unsubscribe = () => void;

/** Describes an API for adding, removing and calling callbacks. */

export interface Callbacks<F extends (...args: any[]) => any> {
  /**
   * Add the given callback to this collection of callbacks,
   * and returns a function which removes the callback when called.
   * @param callback The callback you want to add.
   */
  add(callback: F): Unsubscribe;
  /**
   * Remove the given callback from this collection of callbacks.
   * @param callback The callback you want to remove.
   */
  remove(callback: F): void;
  /**
   * Calls on all callbacks within this collection with the given parameters.
   * @param params The parameters you want to call the callbacks with.
   */
  call(...params: Parameters<F>): void;
  /** Returns the number of callbacks within this collection */
  count(): void;
}

/**
 * Creates a wrapper for adding, removing and calling callbacks.
 *
 * **Initialize like:**
 * ```
 * const subscribers = callbacks();
 * const onGreeted = (callback) => subscribers.add(callback);
 * const greet = (message) => subscribers.call(message);
 * ```
 *
 * **Use as:**
 * ```
 * const unsubscribe = onGreeted(console.log);
 * greet("hello world");
 * unsubscribe();
 * ```
 *
 * @param initialCallbacks The callbacks you want to start off with.
 */
export default function callbacks<F extends (...args: any[]) => any>(
  initialCallbacks: F[] = []
): Callbacks<F> {
  const functions: F[] = initialCallbacks;

  function remove(callback: F) {
    const idx = functions.indexOf(callback);

    if (idx !== -1) {
      functions.splice(idx, 1);
    }
  }

  function add(callback: F) {
    if (typeof callback !== "function") {
      throw new Error(
        "The callback must be a function, provided: " + typeof callback
      );
    }

    functions.push(callback);

    return () => remove(callback);
  }

  function call(...params: Parameters<F>) {
    for (const callback of functions) {
      callback(...params);
    }
  }

  function count() {
    return functions.length;
  }

  return { call, remove, add, count };
}
