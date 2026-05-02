const _ = require("lodash");
const path = require("path");
const glob = require("glob");

// globPatterns = ["src/modules/admin/admin.routes.js"], excludes = undefined
function getGlobbedPaths(globPatterns, excludes) {
	let urlRegex = new RegExp("^(?:[a-z]+:)?//", "i");

	let output = [];

	if (_.isArray(globPatterns)) {
		globPatterns.forEach(function (globPattern) {
			output = _.union(output, getGlobbedPaths(globPattern, excludes));
		});
	} else if (_.isString(globPatterns)) {
		if (urlRegex.test(globPatterns)) {
			output.push(globPatterns);
		} else {
			let files = glob.sync(globPatterns);
			if (excludes) {
				files = files.map(function (file) {
					if (_.isArray(excludes)) {
						for (let i in excludes) {
							if (excludes.hasOwnProperty(i)) {
								file = file.replace(excludes[i], "");
							}
						}
					} else {
						file = file.replace(excludes, "");
					}
					return file;
				});
			}
			output = _.union(output, files);
		}
	}

	return output;
}

const getGlobalConfig=()=>{
    const assets = require(path.join(process.cwd(),"src/config/assets/defaults"));
    const config = {
        routes:getGlobbedPaths(assets.routes),
		strategies:getGlobbedPaths(assets.strategies)
    };
    return config;
}
const initEnvVariables=()=>{
	require("dotenv").config();
	const nodeCache = require(path.join(process.cwd(),"src/config/lib/nodecache.js"))
    const secrets = {
        PORT:process.env.PORT,
        COOKIE_SECRET:process.env.COOKIE_SECRET,
        TOKEN_SECRET:process.env.TOKEN_SECRET,
    }
    for (let key in secrets){
        nodeCache.setValue(key,secrets[key]);
    }
	// console.log("jwt====================",nodeCache.getValue("TOKEN_SECRET"));
	// console.log("cookie sec====================",nodeCache.getValue("COOKIE_SECRET"));
	// console.log("Port====================",nodeCache.getValue("PORT"));

}

module.exports.getGlobalConfig=getGlobalConfig;
module.exports.initEnvVariables=initEnvVariables;