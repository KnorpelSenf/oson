import { build, emptyDir } from "https://deno.land/x/dnt@0.30.0/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  shims: { deno: true },
  package: {
    // package.json properties
    name: "oson",
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
