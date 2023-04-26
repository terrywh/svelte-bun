/**
 * @typedef {Object} RestfulServerOption
 */

/**
 * @typedef {Object} RestfulServerErrorEx
 * @property {number} code 错误号
 * @property {string} desc 描述
 */

/**
 * 错误
 */
export class RestfulServerError {
    /**
     * 
     * @param {number} code 
     * @param {string} desc 
     */
    constructor(code, desc) {
        /** @member {RestfulServerErrorEx} */
        this.error = { code, desc }
    }
}


/**
 * @callback RestfulServerHandler
 * @param {string} method 
 * @param {URLSearchParams} query
 * @param {Object} body
 * @returns {Object | RestfulServerError}
 */

/**
 * 默认错误处理器
 */
function defaultErrorHandler(method, query, body) {
    return new RestfulServerError(10404, `handler for path '${url.pathname}' not found`)
}

/**
 * 创建一个 RESTFUL 接口服务器（JSON）
 * @param {Record<string, RestfulServerHandler>} handler
 * @param {RestfulServerOption} options 
 * @returns {import("./main").ServerMux}
 */
export function createRestfulServer(handler, options) {
    handler = Object.assign({}, handler)
    /**
     * 
     * @param {URL} url 
     * @param {Request} req 
     * @returns {Promise<Response>}
     */
    const server = async function(url, req) {
        const cb = handler[url.pathname]
        if (!!cb) {
            const ctype = req.headers.get("content-type")
            let r
            try {
                if (!ctype) 
                    r = await cb(req.method, url.searchParams, null)
                else if (ctype.match("application/json"))
                    r = await cb(req.method, url.searchParams, await req.json())
                else if (ctype.match("form-data") || ctype.match("x-www-form-urlencoded"))
                    r = await cb(req.method, url.searchParams, await req.formData())
                else 
                    r = await cb(req.method, url.searchParams, null)
            } catch (ex) {
                r = ex
            }
            if (r instanceof Error)
                r = {"error": {"code": 10500, "desc": `unknown error ${r}`}}
            return new Response(JSON.stringify(r), {
                headers: {
                    "content-type": "application/json",
                }
            })
        }
        return false
    }
    server.handler = handler
    server.options = options
    return server;
}
