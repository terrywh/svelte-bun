import { basename, resolve } from "node:path"
import { fileURLToPath } from "node:url"

function parse(options, field, value) {
    if (value.match(/\{.+\}$/)) value = eval(value.substring(1, value.length-1))
    else if (value.match(/^\d+\.\d*$/)) value = parseFloat(value)
    else if (value.match(/^\d+$/)) value = parseInt(value)
    else if (value.match(/^"[^"]+"/)) value = value.substring(1, value.length-1)

    if (Array.isArray(options[field])) options[field].push(value)
    else if (options[field]) options[field] = [options[field], value]
    else options[field] = value
}

export function parseArgs() {
    let argv
    if (basename(process.argv[0]) == 'node' || basename(process.argv[0]) == 'bun') {
        argv = process.argv.slice(2)
    } else {
        argv = process.argv.slice(1)
    }
    
    let options = {}
    /** @type {string} */
    let field
    /** @type {string} */
    let value
    for (let arg of argv) {
        if (arg.startsWith("--") && arg.includes("=")) {
            if (!!field) options[field] = true
            value = arg.split("=")
            parse(options, value[0].substring(2), value[1])
            field = undefined
        } else if (arg.startsWith("--")) {
            if (!!field) options[field] = true
            field = arg.substring(2)
        } else if (arg.startsWith("-") && arg.includes("=")) {
            if (!!field) options[field] = true
            value = arg.split("=")
            parse(options, value[0].substring(1),value[1])
            field = undefined
        } else if (arg.startsWith("-")) {
            if (!!field) options[field] = true
            field = arg.substring(1)
        } else {
            value = arg
            if (!!field) parse(options, field, value)
            else parse(options, "command", value)
            field = undefined
        }
    }
    if (!!field) options[field] = true
    return options
}

const A = 'A'.charCodeAt(0)
const Z = 'Z'.charCodeAt(0)
const Split = {
    "HelloWorld": function (s) {
        const r = []
        let o = 0
        for (let i=0;i<s.length;++i) {
            const x = s.charCodeAt(i)
            if (x >= A && x <= Z && i > 0) {
                r.push(s.substring(o, i))
                o = i
            }
        }
        if (o < s.length -1) {
            r.push(s.substring(o))
        }
        return r
    },
    "hello-world": function (s) {
        return s.split('-')
    },
    "HELLO_WORLD": function(s) {
        return s.split('_')
    }
}

/**
 * 
 * @param {string | object} inopt 
 * @param {"HelloWorld" | "hello-world" | "HELLO_WORLD"} style 
 * @returns 
 */
export function normalize(inopt, style) {
    if (typeof inopt == "string") {
        return Split[style](inopt).map((s) => s.toLowerCase()).join('-')
    }

    let osopt = {}
    for (const [key, val] of Object.entries(inopt)) {
        osopt[normalize(key, style)] = val
    }
    return osopt
}
/**
 * @typedef ParseArgsOptions
 * @property {"HelloWorld" | "hello-world" | "HELLO_WORLD"} [style="HelloWorld"];
 */

/**
 * 
 * @param {ParseArgsOptions} options 
 * @returns 
 */
export function parseOpts(options) {
    options = Object.assign({style: "HelloWorld"}, options)
    return normalize(parseArgs(), options.style)
}

export function __filename(meta) {
    return fileURLToPath(new URL(meta.url))
}

export function __dirname(meta) {
    return fileURLToPath(new URL(".", meta.url))
}

export function __entry() {
    if (basename(process.argv[0]) == 'node' || basename(process.argv[0]) == 'bun') {
        return resolve(process.cwd, process.argv[1])
    } else {
        return resolve(process.cwd, process.argv[0])
    }
}

export function __isEntry(meta) {
    return __filename(meta) == __entry()
}

if (__isEntry(import.meta)) {
    console.log(parseOpts({"style":"HelloWorld"}))
}