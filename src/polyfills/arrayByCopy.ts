/**
 * Thanks! - https://github.com/lucid-softworks/akari/blob/main/apps/akari/utils/polyfills/arrayByCopy.ts
 * Polyfills for the ES2023 "Change Array by Copy" methods that Hermes /
 * older JSC engines on iOS still don't ship. Expo's bundled JS runtimes
 * fall through to `undefined` for `Array.prototype.toSorted` on most
 * physical devices, which crashes any caller with `TypeError:
 * undefined is not a function (evaluating '<array>.toSorted(...)')`.
 *
 * We install them on the prototype only when missing, so any future
 * runtime upgrade that ships the native implementation takes precedence.
 * Definitions are non-enumerable (matches the native specs).
 *
 * Imported once at the top of `app/_layout.tsx`; the file has no
 * runtime side effects beyond patching the prototype.
 */

type Compare<T> = (a: T, b: T) => number;

if (typeof Array.prototype.toSorted !== 'function') {
  // oxlint-disable-next-line no-extend-native -- deliberate ES2023 polyfill
  Object.defineProperty(Array.prototype, 'toSorted', {
    value<T>(this: T[], compareFn?: Compare<T>): T[] {
      // Native semantics: returns a *copy* sorted with the same compare
      // function semantics as `Array.prototype.sort`. The default
      // comparator coerces values to strings - Array#sort already does
      // that when no fn is passed, so we just delegate.
      return this.slice().sort(compareFn);
    },
    writable: true,
    configurable: true,
  });
}

if (typeof Array.prototype.toReversed !== 'function') {
  Object.defineProperty(Array.prototype, 'toReversed', {
    value<T>(this: T[]): T[] {
      // `Array#reverse` mutates in place, so copy first.
      return this.slice().reverse();
    },
    writable: true,
    configurable: true,
  });
}

if (typeof Array.prototype.toSpliced !== 'function') {
  Object.defineProperty(Array.prototype, 'toSpliced', {
    value<T>(
      this: T[],
      start: number,
      deleteCount?: number,
      ...items: T[]
    ): T[] {
      const copy = this.slice();
      // Native `toSpliced` accepts the same overloaded signature as
      // `splice` but returns the *modified copy* instead of the removed
      // elements. Forwarding to `Array#splice` mutates the copy then
      // returns it.
      if (arguments.length === 0) {
        // `toSpliced()` with no args returns an unchanged copy; guard here
        // because `splice(undefined)` coerces start to 0 and would remove
        // the whole array.
        return copy;
      }
      if (deleteCount === undefined) {
        // `splice(start)` removes everything from `start` to end.
        copy.splice(start);
      } else {
        copy.splice(start, deleteCount, ...items);
      }
      return copy;
    },
    writable: true,
    configurable: true,
  });
}

if (typeof Array.prototype.with !== 'function') {
  Object.defineProperty(Array.prototype, 'with', {
    value<T>(this: T[], index: number, value: T): T[] {
      const len = this.length;
      // Spec: negative index counts from the end; throws RangeError if
      // out of bounds after normalisation.
      const actual = index < 0 ? len + index : index;
      if (actual < 0 || actual >= len) {
        throw new RangeError(`Invalid index : ${index}`);
      }
      const copy = this.slice();
      copy[actual] = value;
      return copy;
    },
    writable: true,
    configurable: true,
  });
}
