import { basename } from "path";
import { init, parse } from 'es-module-lexer';

await init

export function rewriteImports(code, path, rewriteHandler) {
    if (!rewriteHandler) rewriteHandler = defaultRewriteHandler
    const [is] = parse(code, basename(path))
    let r = "", o = 0
    for (let i of is) {
        r += code.substring(o, i.s)
        o = i.e
        r += rewriteHandler(i.n) || "<unknown-module-path>"
    }
    r += code.substring(o)
    return r
}

export function defaultRewriteHandler(name) {
    if (name.startsWith("/") || name.startsWith("./") || name.startsWith("../")) // 相对或绝对路径保持不变
        return name
    // if (name == "svelte")
    //     return "/@module/svelte"
    // if (name.startsWith("svelte/"))
    //     return `/${name}.js`
    return `https://esm.sh/${name}`
    return `/@import/${name}.module`
}