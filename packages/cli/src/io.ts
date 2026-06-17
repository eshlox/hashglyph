/** Injectable console surface so commands stay testable (no global process use). */
export interface IO {
  log(message?: string): void;
  warn(message: string): void;
  error(message: string): void;
}

/** The real stdout/stderr-backed IO. */
export const consoleIO: IO = {
  log: (message = '') => process.stdout.write(`${message}\n`),
  warn: (message) => process.stderr.write(`${message}\n`),
  error: (message) => process.stderr.write(`${message}\n`),
};
