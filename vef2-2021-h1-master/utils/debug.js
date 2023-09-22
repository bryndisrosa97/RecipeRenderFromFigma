const {
  DEBUG = false,
} = process.env;

export function debug(...m) {
  if (DEBUG) {
    console.info(...m);
  }
}
