import { Change, Rename } from "@tidier/lib";
import { bgGreen, bgRed, black, green, red } from "colors";
import { basename, dirname } from "path";

export function formatRename([path, rename]: Change<
  Rename | undefined
>): string {
  const name = basename(path);
  const folder = dirname(path);

  if (rename && name !== rename.name) {
    return `${folder}/${red(name)} ⟶  ${green(rename.name)}`;
  } else {
    return `${folder}/${green(name)}`;
  }
}

export function useConventionBanner(namePattern: string): string {
  return `${bgRed("  ")} ${red("USE")} ${bgRed(` ${black(namePattern)} `)}`;
}

export function okConventionBanner(): string {
  return `${bgGreen("  ")} ${green("OK")} ${bgGreen("                ")}`;
}
