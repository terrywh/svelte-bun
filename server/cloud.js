import * as http from "http"
import { resolve } from "path"
import { readFileSync } from "fs"
import { createHash, createHmac } from "crypto"
import "./test.js"


const secret = readFileSync(import.meta.dir + "/../cred").toString().split("\n")

function _hashPayload(method, endpoint, uri, query, payload) {
    payload = createHash("sha256").update(payload).digest("hex");
    const request = `${method}
${uri}
${query}
content-type:application/json; charset=utf-8
host:${endpoint}

content-type;host
${payload}`
    // console.log(request);
    return createHash("sha256").update(request).digest("hex");
}

function _hmacSign(secret, timestamp, svc, paying) {
    let date = new Date(timestamp * 1000);
    date = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, "0")}-${date.getUTCDate()}`
    let data = `TC3-HMAC-SHA256
${timestamp}
${date}/${svc}/tc3_request
${paying}`;
    // console.log(data);

    let dating = createHmac("sha256", "TC3" + secret).update(date).digest();
    let svcing = createHmac("sha256", dating).update(svc).digest();
    let sgning = createHmac("sha256", svcing).update("tc3_request").digest();
    
    return createHmac("sha256", sgning).update(data).digest("hex");
}


function auth(secret, timestamp, svc, sgning) {
    let date = new Date(timestamp * 1000);
    date = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, "0")}-${date.getUTCDate()}`

    return `TC3-HMAC-SHA256 Credential=${secret}/${date}/${svc}/tc3_request, SignedHeaders=content-type;host, Signature=${sgning}`;
}


export function headers(endpoint, region, action, payload) {
    const timestamp = parseInt(Date.now()/1000);
    const svc = endpoint.split(".").shift();
    return {
        "X-TC-Action": action,
        "X-TC-Region": region,
        "X-TC-Timestamp": timestamp,
        "X-TC-Version": "2018-05-25",
        "Authorization": auth(secret[0], timestamp, svc, _hmacSign(secret[1], timestamp, svc, _hashPayload("POST", endpoint, "/", "", payload))),
        "Content-Type": "application/json; charset=utf-8",
    };
}

export function tranlate(url, req, rsp) {
    const path = url.pathname.split("/")
    const data = [];
    req
        .on("data", function(chunk) {
            data.push(chunk);
        })
        .on("end", function() {
            const payload = Buffer.concat(data);
            fetch("https://" + path[1] + "/", {
                method: "POST",
                headers: headers(endpoint, path[2] || "ap-guangzhou", path[3], payload),
                body: payload,
            }).then(function(crsp) {
                crsp.json().then(function(json) {
                    rsp.write(JSON.stringify(json));
                    rsp.end();
                })
            });
        });
}



if (import.meta.path == resolve(process.cwd, process.argv[1])) {
console.log(_hashPayload("POST", "cvm.tencentcloudapi.com", "/", "",
    "{\"Limit\": 1, \"Filters\": [{\"Values\": [\"\\u672a\\u547d\\u540d\"], \"Name\": \"instance-name\"}]}")
    == "5ffe6a04c0664d6b969fab9a13bdab201d63ee709638e2749d62a09ca18d7031")
console.log("---------------------")

console.log(_hmacSign("Gu5t9xGARNpq86cd98joQYCN3*******", 1551113065, "cvm",
    "5ffe6a04c0664d6b969fab9a13bdab201d63ee709638e2749d62a09ca18d7031")
    == "2230eefd229f582d8b1b891af7107b91597240707d778ab3738f756258d7652c");
console.log("---------------------");


const timestamp = parseInt(Date.now()/1000);
const svc = "tke";
const method = "POST";
const endpoint = "tke.tencentcloudapi.com";
const payload = JSON.stringify({});


console.log(timestamp, payload)

const rsp = await fetch("https://" + endpoint + "/", {
    method: "POST",
    headers: headers(endpoint, "ap-guangzhou", "DescribeTKEEdgeClusters", payload),
    body: payload,
});
console.log(rsp);
console.log(await rsp.json())

}