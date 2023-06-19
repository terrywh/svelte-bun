import { HttpError, defaultErrorHandler } from "./error.js"
/**
 * @typedef {Object} RestfulServerOption
 * @property {RestfulServerHandler} errorHandler
 */

/**
 * @callback RestfulServerHandler
 * @param {Request} req
 * @param {any} r
 * @returns {Response | Promise<Response>}
 */

/**
 * @callback RestfulServerServiceHandler
 * @param {string} method 
 * @param {URLSearchParams} query
 * @param {Object} body
 * @returns {Object | HttpError | Promise<Object> | Promise<HttpError>}
 */

/**
 * 创建一个 RESTFUL 接口服务器（JSON）
 * @param {Record<string, RestfulServerServiceHandler>} handler
 * @param {RestfulServerOption} options 
 * @returns {import("./main").ServerMux}
 */
export function createRestfulServer(handler, options) {
    handler = Object.assign({}, handler)
    options = Object.assign({}, {}, options)
    if (!options.errorHandler) options.errorHandler = defaultErrorHandler
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
                    r = await cb(req.method, url.searchParams, await req.text())
            } catch (ex) {
                r = ex
            }
            if (r instanceof Error) // 错误响应
                return options.errorHandler(req, r)
            else if (r instanceof Response) // 自定义响应
                return r
            else // JSON 响应
                return new Response(JSON.stringify(r), { headers: {
                        "content-type": "application/json",
                }})
        }
        return false // 交给下个服务处理器
    }
    server.handler = handler
    server.options = options
    return server;
}
