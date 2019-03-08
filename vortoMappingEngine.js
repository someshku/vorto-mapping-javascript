// Load dependencies
const convertToXML = require("xml-js");
const log = require("loglevel");
const fontoxpath = require("fontoxpath");
const parser = require("slimdom-sax-parser");


module.exports = class VortoMapper {
    constructor(mappingSpec) {
        this.mappingSpec = mappingSpec;
    }
    
    setMappingSpec = function (mappingSpec) {
        this.mappingSpec = mappingSpec;
    }
    
    setLogLevel = function (message) {
        if (["trace", "debug", "info", "warn", "error"].includes(message)) {
            log.setLevel(message);
        }
    }
    
    // avoid export of fontoxpath and just pass on all arguments to the fontoxpath method
    registerCustomXPathFunction = function () {
        fontoxpath.registerCustomXPathFunction.apply(null, arguments);
    }

    transform = function (rawPayload) {
        let outputObj = {};

        // Convert rawPayload to xml in order to use xpath
        const options = { compact: true, ignoreComment: true };
        let xmlRawPayload = convertToXML.json2xml(rawPayload, options);

        // Add a root element 
        xmlRawPayload = `<rootNode>${xmlRawPayload}</rootNode>`;
        log.debug("Raw device payload in xml ...\n" + xmlRawPayload);

        const doc = parser.sync(xmlRawPayload);

        // Iterate through the mapping spec and look for function blocks
        // Step 1: Iterate over number of function blocks in the information model

        try {
            const numberOfFunctionBlocks = mappingSpec.infoModel.functionblocks.length;
            if (numberOfFunctionBlocks) {
                log.debug('Number of function blocks found = ' + numberOfFunctionBlocks);
                for (let countFB = 0; countFB < numberOfFunctionBlocks; countFB++) {
                    const fbName = mappingSpec.infoModel.functionblocks[countFB].name;

                    let status = {};

                    // Step 2: Search for status properties in the function block along with the mapping
                    const numberOfStatusProperties = mappingSpec.properties[fbName].statusProperties.length;
                    if (numberOfStatusProperties) {
                        log.debug('Number of status properties found = ' + numberOfStatusProperties);

                        for (let countSP = 0; countSP < numberOfStatusProperties; countSP++) {
                            const statusPropertyName = mappingSpec.properties[fbName].statusProperties[countSP].name;
                            const path = mappingSpec.properties[fbName].statusProperties[countSP].stereotypes[0].attributes.xpath;

                            log.debug("path : " + path);
                            if (path) {

                                // Step 3 : Evaluate xpath expression
                                const xpathResult = fontoxpath.evaluateXPathToString(path, doc);
                                log.debug("xpathResult = " + xpathResult);
                                status[statusPropertyName] = xpathResult;
                            }
                        }
                    }
                    // Step 3: Add all properties under the user defined function block variable
                    outputObj[fbName] = { "status": status };
                }
            }
        } catch (err) {
            log.error("Error : " + err.message);
            throw new Error('Failed!\n' + err.message);
        }
        
        outputObjStr = JSON.stringify(outputObj, null, 0);
        log.debug("Final output... \n" + outputObjStr);
        
        return outputObjStr;
    }
}
