import { compile } from "svelte/compiler";
import { join, relative } from "path";
import { init, parse } from 'es-module-lexer';

await init;

async function transpile(path, code, options) {
    const [imports] = parse(code);
    let buffer = "", offset = 0;
    for (const i of imports) {
        buffer += code.substring(offset, i.s);
        const path = code.substring(i.s, i.e);
        if (path.startsWith(".") || path.startsWith("/")) {
            buffer += path;
        } else {
            buffer += "/" + (await transpileImport(path));
        }
        offset = i.e;
    }
    buffer += code.substring(offset);
    return buffer;
}

async function transpileImport(name) {
    name = relative(".", await Bun.resolve(name, "."));
    if (name.startsWith("node_modules/svelte") && name.endsWith("-server.js")) {
        name = name.substring(0, name.length - 10) + "-client.js";
    }
    if (name == "node_modules/esm-env/dev-fallback.js") {
        name = "node_modules/esm-env/true.js"; // DEV == true
    }
    return name;
}

/**
 * 
 * @return {ServerMux}
 */
export function createSvelteServer(options) {
    options.compile = Object.assign({}, options.compile, {
        dev: true,
    })
    const server = async function (url, req) {
        if (url.pathname.startsWith("/node_modules/")) {
            const path = join(options.root, url.pathname);
            return new Response(await transpile(url.pathname, await Bun.file(path).text(), options.compile), {
                headers: {
                    "Content-Type": "application/javascript",
                }
            });
        } else if (url.pathname.endsWith(".svelte") || url.pathname.endsWith(".svelte.js")) {
            const compileOptions = Object.assign({}, options.compile, {
                filename: url.pathname,
            })
            const path = join(options.public, url.pathname);
            const r = compile(await Bun.file(path).text(), compileOptions);
            return new Response(await transpile(url.pathname, r.js.code, options.compile), {
                headers: {
                    "Content-Type": "application/javascript",
                }
            });
        } else if (url.pathname.endsWith(".js")) {
            const path = join(options.public, url.pathname);
            return new Response(await transpile(url.pathname, await Bun.file(path).text(), options.compile), {
                headers: {
                    "Content-Type": "application/javascript",
                }
            });
        }
        return false;
    };
    server.options = options;
    return server; 
}
