import { Project, Projects } from "@tidier/lib";
import { basename } from "path";
import { showErrorDialog } from "./ui";
import * as output from "./output";
import { Uri, WorkspaceFolder } from "vscode";
import { VSCodeFolder } from "./folder";

export async function discoverProjectsInWorkspace(
  projects: Projects,
  workspaceFolders: readonly WorkspaceFolder[]
) {
  for (const { uri, name } of workspaceFolders) {
    const folder = new VSCodeFolder(uri);

    try {
      const discovered = await Projects.discover(folder);

      output.log(`Discovered ${discovered.count} project(s) in ${uri.fsPath}.`);

      projects.combine(discovered);
    } catch (error) {
      output.log(`Failed to discover projects in ${uri.path}.`);
      output.log(String(error));

      showErrorDialog(`Tidier: Failed to discover projects in '${name}'.`);
    }
  }

  output.log("Projects loaded:");
  projects.list().forEach((project) => output.log(" - " + project.folder.path));
}

export async function handleLoadProject(projects: Projects, uri: Uri) {
  try {
    const folder = new VSCodeFolder(uri);
    const project = await Project.load(folder);
    projects.add(project);

    output.log(`Included project at ${project.folder.path}.`);
  } catch (error) {
    const name = basename(uri.path);
    showErrorDialog(`Tidier: Failed to load project '${name}'.`);

    output.log(`Failed to load project: ${String(error)}`);
  }
}

export async function handleProjectReload(project: Project) {
  try {
    await project.reload();
    output.log(`Reloaded project at ${project.folder.path}`);
  } catch (error) {
    const name = basename(project.folder.path);

    showErrorDialog(`Tidier: Failed to reload project '${name}''`);
    output.log(`Failed to reload project at ${project.folder.path}.`);
    output.log(String(error));
  }
}
