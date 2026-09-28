const REMOTE_URI = /^https?:\/\//;

// `require(...)` is typed `any`, so the `RemoteUri` type alone can't reject a bundled image.
export function assertRemoteLoaderUri(loaderUri: unknown) {
  if (loaderUri !== undefined && (typeof loaderUri !== 'string' || !REMOTE_URI.test(loaderUri))) {
    throw new Error('RemoteImage: `loaderUri` must be a remote http(s) URL, not a bundled image.');
  }
}
