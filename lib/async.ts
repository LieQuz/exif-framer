/** Return the reason carried by an AbortSignal, or a plain AbortError. */
export function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException("The operation was aborted.", "AbortError");
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw abortReason(signal);
}

/** Reject as soon as the signal aborts, without waiting for the promise. */
export function abortable<T>(
  promise: Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortReason(signal));

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener("abort", onAbort);
      reject(abortReason(signal));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) {
      onAbort();
      return;
    }
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

/**
 * Run a task with a timeout. The task receives an AbortSignal so it can stop
 * its own work (image loads, workers, etc.) instead of leaving it running.
 */
export function withTimeout<T>(
  task: (signal: AbortSignal) => Promise<T>,
  ms: number,
  label = "Operation",
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const reason = new DOMException(`${label} timed out.`, "TimeoutError");
      controller.abort(reason);
      reject(reason);
    }, ms);
  });

  const work = Promise.resolve().then(() => task(controller.signal));

  return Promise.race([work, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}
