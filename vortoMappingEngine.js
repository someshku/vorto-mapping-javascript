// Load library for js2xml conversion
var convertToXML = require("xml-js");

var fontoxpath = require('fontoxpath'),
    parser = require('slimdom-sax-parser');

module.exports = function (mappingSpec, rawPayload) {
    var outputObj = {};

    // Convert rawPayload to xml in order to use xpath
    var options = { compact: true, ignoreComment: true };
    var xmlRawPayload = convertToXML.json2xml(rawPayload, options);

    // Add a root element 
    xmlRawPayload = "<rootNode>" + xmlRawPayload + "</rootNode>";
    console.log("Raw device payload in xml ...\n" + xmlRawPayload);

    const doc = parser.sync(xmlRawPayload);

    // Iterate through the mapping spec and look for function blocks
    // Step 1: Iterate over number of function blocks in the information model

    try {
        var numberOfFunctionBlocks = mappingSpec.infoModel.functionblocks.length;
        if (numberOfFunctionBlocks) {
            console.log('Number of function blocks found = ' + numberOfFunctionBlocks);
            for (var countFB = 0; countFB < numberOfFunctionBlocks; countFB++) {
                var fbName = mappingSpec.infoModel.functionblocks[countFB].name;

                var status = {};

                // Step 2: Search for status properties in the function block along with the mapping
                var numberOfStatusProperties = mappingSpec.properties[fbName].statusProperties.length;
                if (numberOfStatusProperties) {
                    console.log('Number of status properties found = ' + numberOfStatusProperties);

                    for (var countSP = 0; countSP < numberOfStatusProperties; countSP++) {
                        var statusPropertyName = mappingSpec.properties[fbName].statusProperties[countSP].name;
                        var path = mappingSpec.properties[fbName].statusProperties[countSP].stereotypes[0].attributes.xpath;
                        path = "/rootNode" + path;

                        // Replace single forward slash with a pair of forward slashes
                        console.log("path : " + path);

                        // Step 3 : Evaluate xpath expression
                        var xpathResult = fontoxpath.evaluateXPathToString(path, doc);
                        console.log("xpathResult = " + xpathResult);
                        status[statusPropertyName] = xpathResult;
                    }

                }
                // Step 3: Add all properties under the user defined function block variable
                outputObj[fbName] = { "status": status };

            }
        }


    } catch (err) {
        console.log("Error : " + err.message);
        throw new Error('Failed!\n' + err.message);
    }

    outputObj = JSON.stringify(outputObj, null, 0);
    console.log("Final output... \n" + outputObj);

    return outputObj;
};