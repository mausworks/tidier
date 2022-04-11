import { TestFolder } from "tidier-test";
import { createProjectSettings, TidierConfig } from "./config";
import { checkPath, getProblemDetails, ProblemDetails } from "./problem";
import { Project } from "./project";

const fileConvention = "kebab-case";
const folderConvention = "kebab-case";

const config: TidierConfig = {
  files: { "**/*": fileConvention },
  folders: { "**/*": folderConvention },
};

describe("checking a specific path for problems", () => {
  it("returns null if the path does not exist", async () => {
    const folder = new TestFolder("root");
    const project = new Project(folder, createProjectSettings(config));

    await expect(checkPath(project, "some-path")).resolves.toBeNull();
  });

  it("returns null if the name is as expected", async () => {
    const folder = new TestFolder("root", { "root/some-path": null });
    const project = new Project(folder, createProjectSettings(config));

    await expect(checkPath(project, "some-path")).resolves.toBeNull();
  });

  it("returns problem details if there is a problem", async () => {
    const folder = new TestFolder("root", { "root/SOME_PATH": null });
    const project = new Project(folder, createProjectSettings(config));

    await expect(
      checkPath(project, "SOME_PATH")
    ).resolves.toEqual<ProblemDetails>({
      expectedName: "some-path",
      format: [folderConvention],
      type: "folder",
    });
  });
});

describe("getting problem details", () => {
  const folder = new TestFolder("root");
  const project = new Project(folder, createProjectSettings(config));

  it("returns problem details if there is a problem", () => {
    const folderDetails = getProblemDetails(project, ["SOME_PATH", "folder"]);
    const fileDetails = getProblemDetails(project, ["SOME_PATH", "file"]);

    expect(folderDetails).toEqual<ProblemDetails>({
      expectedName: "some-path",
      format: [folderConvention],
      type: "folder",
    });

    expect(fileDetails).toEqual<ProblemDetails>({
      expectedName: "some-path",
      format: [fileConvention],
      type: "file",
    });
  });

  it("returns null if there is no problem", () => {
    const folderDetails = getProblemDetails(project, ["some-path", "folder"]);
    const fileDetails = getProblemDetails(project, ["some-path", "file"]);

    expect(folderDetails).toBeNull();
    expect(fileDetails).toBeNull();
  });
});
