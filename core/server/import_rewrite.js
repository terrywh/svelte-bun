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

export function defaultRewriteHandler(n) {
    if (n.startsWith("/") || n.startsWith("./") || n.startsWith("../")) // 相对或绝对路径保持不变
        return n
    return `/@module/${n}/index.mjs` // 访问非 JS 文件 | 内部包，补充完整路径
}