const path = require("path");
const express = require(path.join(process.cwd(),"src/config/lib/express"));
const nodeCache = require(path.join(process.cwd(),"src/config/lib/nodecache"))

module.exports.start=()=>{
    const app = express()
    app.listen(nodeCache.getValue("PORT"),()=>{
        console.log("listening to " + nodeCache.getValue("PORT"));
    })
}