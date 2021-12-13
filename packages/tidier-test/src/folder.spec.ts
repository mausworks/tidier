import { InMemoryFolder } from ".";

test("listing", async () => {
  const folder = new InMemoryFolder("/foo", {
    "/foo": null,
    "/foo/bar/baz": null,
    "/foo/bar/baz/bat/": null,
    "/foo/bar/hello.txt": "hello world",
    "/foo/bar/hi.txt": "hi",
  });

  expect((await folder.list("bar")).map(([path]) => path)).toEqual(
    expect.arrayContaining(["baz", "hello.txt", "hi.txt"])
  );
});
