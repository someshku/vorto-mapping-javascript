// Load dependencies
var convertToXML = require("xml-js");
var log = require("loglevel");
var fontoxpath = require("fontoxpath"),
    parser = require("slimdom-sax-parser");

var mappingSpec = null;

exports.setLogLevel = function (message) {
    if (["trace", "debug", "info", "warn", "error"].includes(message)) {
        log.setLevel(message);
    }
}

exports.setMappingSpec = function (mapping) {
    mappingSpec = mapping;
}

exports.fontoxpath = fontoxpath;

exports.transform = function (rawPayload) {
    var outputObj = {};

    // Convert rawPayload to xml in order to use xpath
    var options = { compact: true, ignoreComment: true };
    var xmlRawPayload = convertToXML.json2xml(rawPayload, options);

    // Add a root element 
    xmlRawPayload = "<rootNode>" + xmlRawPayload + "</rootNode>";
    log.debug("Raw device payload in xml ...\n" + xmlRawPayload);

    const doc = parser.sync(xmlRawPayload);

    // Iterate through the mapping spec and look for function blocks
    // Step 1: Iterate over number of function blocks in the information model

    try {
        var numberOfFunctionBlocks = mappingSpec.infoModel.functionblocks.length;
        if (numberOfFunctionBlocks) {
            log.debug('Number of function blocks found = ' + numberOfFunctionBlocks);
            for (var countFB = 0; countFB < numberOfFunctionBlocks; countFB++) {
                var fbName = mappingSpec.infoModel.functionblocks[countFB].name;

                var status = {};

                // Step 2: Search for status properties in the function block along with the mapping
                var numberOfStatusProperties = mappingSpec.properties[fbName].statusProperties.length;
                if (numberOfStatusProperties) {
                    log.debug('Number of status properties found = ' + numberOfStatusProperties);

                    for (var countSP = 0; countSP < numberOfStatusProperties; countSP++) {
                        var statusPropertyName = mappingSpec.properties[fbName].statusProperties[countSP].name;
                        var path = mappingSpec.properties[fbName].statusProperties[countSP].stereotypes[0].attributes.xpath;

                        log.debug("path : " + path);
                        if (path) {

                            // Step 3 : Evaluate xpath expression
                            var xpathResult = fontoxpath.evaluateXPathToString(path, doc);
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

    outputObj = JSON.stringify(outputObj, null, 0);
    log.debug("Final output... \n" + outputObj);

    return outputObj;
};