import { build, emptyDir } from "https://deno.land/x/dnt@0.32.0/mod.ts";

const version = Deno.args[0];
if (!version) {
  let previous: string | undefined = undefined;
  try {
    previous = JSON.parse(Deno.readTextFileSync("./npm/package.json")).version;
  } catch {
    // ignore
  } finally {
    previous ??= "unknown";
  }
  throw new Error(`Provide a version number! Last one is: ${previous}`);
}

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  shims: {
    deno: true,
    custom: [{
      globalNames: ["TextEncoder", "TextDecoder"],
      module: "util",
    }],
  },
  package: {
    // package.json properties
    name: "o-son",
    version: Deno.args[0],
    description: "oson structured object notation",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/KnorpelSenf/oson.git",
    },
    bugs: {
      url: "https://github.com/KnorpelSenf/oson/issues",
    },
  },
});

// post build steps
Deno.copyFileSync("LICENSE", "npm/LICENSE");
Deno.copyFileSync("README.md", "npm/README.md");
const process = Deno.run({
  cmd: ["git", "tag", version],
});
await process.status();
