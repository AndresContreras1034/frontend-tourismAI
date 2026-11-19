const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const RETRY_DELAYS_MS = [5000, 15000];

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason || new DOMException("Aborted", "AbortError"));
    };

    if (signal?.aborted) {
      onAbort();
    } else {
      signal?.addEventListener("abort", onAbort, { once: true });
    }
  });
}

export async function fetchWithRenderRetry(
  url,
  options = {},
  { onRetry, retries = RETRY_DELAYS_MS.length } = {}
) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get("content-type") || "";
      const isUnexpectedContent =
        response.ok && !contentType.includes("application/json");
      if (
        !RETRYABLE_STATUSES.has(response.status) &&
        !isUnexpectedContent
      ) {
        return response;
      }

      await response.body?.cancel();
      lastError = new Error(
        isUnexpectedContent
          ? "Render devolvió una página de espera en lugar de la respuesta del servicio."
          : `Render respondió con estado ${response.status} al reactivar el servicio.`
      );
      if (attempt === retries) {
        throw lastError;
      }
    } catch (error) {
      if (options.signal?.aborted || attempt === retries) {
        throw error;
      }
      lastError = error;
    }

    onRetry?.(attempt + 1);
    await wait(RETRY_DELAYS_MS[attempt] || RETRY_DELAYS_MS.at(-1), options.signal);
  }

  throw lastError;
}
