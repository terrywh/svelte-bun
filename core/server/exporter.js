import { dirname } from "path";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";
import { DEV } from "esm-env";

export class exporter {
    constructor(options) {
        this.tempdir = join(cwd(), `module_${Date.now()}`)
        this.entries = [];
        this.options = options;
    }

    async collect(module) {
        console.time("collect");
        const description = await Bun.file(`${this.options.root}/node_modules/${module}/package.json`).json();

        function submodule(name) {
            if (Object.entries(description.exports[name]).length == 1 && !!description.exports[name]["types"]) {
                return false;
            } else if (name[0] == '.') {
                return module + name.substring(1);
            } else {
                return name;
            }
        }

        if (description.exports) for (let name in description.exports) {
            name = submodule(name);
            if (!name) {
                continue
            }
            await this.prepare(name);
        } else {
            await this.prepare(module);
        }
        console.timeEnd("collect");
    }

    async prepare(name) {
        const filename = join(this.tempdir, `${name}.js`);
        console.log("\t", name, "=>", filename)
        const filepath = dirname(filename);
        if (!this.options.dryrun) {
            await mkdir(filepath, { recursive: true });
            const file = Bun.file(filename);
            await Bun.write(file, `export * from '${name}';`);
        }
        this.entries.push(filename);
    }

    async cleanup() {
        console.time("cleanup");
        await rm(this.tempdir, { recursive: true, force: true });
        this.entries = [];
        console.timeEnd("cleanup");
    }

    async build() {
        console.time("build");
        /** @type {import("bun").BuildConfig} */
        const options = {
            conditions: ["browser"],
            target: "browser",
            format: "esm",
            root: this.tempdir,
            loader: {".js": "js", ".jsx": "jsx"},
            entrypoints: this.entries, // 在 svelte 模块中，需要共享引用
            // outdir: `${this.options.public}/module`,
            splitting: true,
        };
        if (DEV) {
            options.conditions.push("development");
            options.minify = false;
            options.sourcemap = "inline";
        } else {
            options.conditions.push("production");
            options.minify = true;
        }
        const result = await Bun.build(options);
        console.timeEnd("build");
        return result;
    }
}
