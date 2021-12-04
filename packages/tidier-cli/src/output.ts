import { bgGreen, bgRed, black, green, red } from "colors";
import { basename, dirname } from "path";

export function formatRecase(path: string, newName: string): string {
  const name = basename(path);
  const folder = dirname(path);

  return `${folder}/${red(name)} ⟶  ${green(newName)}`;
}

export function useConventionBanner(namePattern: string): string {
  return `${bgRed("  ")} ${red("USE")} ${bgRed(` ${black(namePattern)} `)}`;
}

export function okConventionBanner(): string {
  return `${bgGreen("  ")} ${green("OK")} ${bgGreen("                ")}`;
}
