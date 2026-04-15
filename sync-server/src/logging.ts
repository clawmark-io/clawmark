export type Logger = {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
};

export function createLogger(accessToken: string): Logger {
  const redact = (msg: string) => msg.replaceAll(accessToken, "***");

  return {
    info: (msg: string) => console.log(`[INFO]  ${redact(msg)}`),
    warn: (msg: string) => console.warn(`[WARN]  ${redact(msg)}`),
    error: (msg: string) => console.error(`[ERROR] ${redact(msg)}`),
  };
}
