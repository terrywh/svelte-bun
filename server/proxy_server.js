/**
 * 代理指定的接口（JSON）
 * @param {Record<string, ServeJsonOption>} options
 * @returns 
 */
export function _serveJson(options) {
    /**
     * 
     * @param {Request} req 
     * @returns 
     */
    const normalizeHeaders = function(req) {
        // 删除可能影响请求构建逻辑的头
        req.headers.delete("content-length")
        req.headers.delete("transfer-encoding")
        req.headers.delete("host")
        req.headers.delete("connection")
        
        for (let field of req.headers.keys()) {
            if (field.startsWith("accept")) req.headers.delete(field)
            if (field.startsWith("sec-")) req.headers.delete(field)
        }
    }
    /**
     * 
     * @param {Headers|URLSearchParams} target 
     * @param {Headers|URLSearchParams} source
     */
    const merge = function(target, source) {
        for (const entry of source.entries()) {
            target.delete(entry[0])
        }
        for (const entry of source.entries()) {
            target.append(field, value)
        }
    }
    /**
     * 
     * @param {URL} url 
     * @param {Request} req 
     */
    const jsonServer = async function (url, req) {
        let target = url.pathname.substring(1)
        if (!target.startsWith("http://") && !target.startsWith("https://")) return // 处理其他中间件
        const domain = target.split("/")[2], option = options[domain]
        
        if (!!option) // 非法请求
            return new Response(JSON.stringify({
                "error": {"code": 403, "info": "not allowed"}
            }), {status: 403})
        
        normalizeHeaders(req)
        let search = url.searchParams
        let payload = await req.json()

        if (option.modifier) modifier(req.headers, url.searchParams, payload)
        if (option.headers instanceof Headers) merge(req.headers, option.headers)
        else if (option.headers) merge(req.headers, option.headers)
        if (option.search instanceof URLSearchParams) merge(url.searchParams, option.search)
        else if (options.search) merge(req.searchParams, option.search)
        if (option.payload) Object.assign(payload, option.payload)
        
        // headers["user-agent"] = "bun/" + Bun.version
        target += '?' + search.toString()
        const res = await fetch(target, {
            headers: headers,
            method: req.method,
            body: payload ? JSON.stringify(payload) : null,
        })
        return res
    }

    return jsonServer
}