import YAML from "yaml";

export type OutputFormat = "json" | "yaml";

export function formatOutput(data: unknown, format: OutputFormat): string {
  if (format === "yaml") {
    return YAML.stringify(data);
  }
  return JSON.stringify(data, null, 2);
}

export function formatError(error: unknown, format: OutputFormat): string {
  const message = error instanceof Error ? error.message : String(error);
  return formatOutput({ error: message }, format);
}

export function printResult(data: unknown, format: OutputFormat): void {
  console.log(formatOutput(data, format));
}

export function printError(error: unknown, format: OutputFormat): void {
  console.error(formatError(error, format));
}
