// Load library for js2xml conversion
var convertToXML = require("xml-js");
var xpath = require('xpath')
    , dom = require('xmldom').DOMParser

module.exports = function (mappingSpecs, rawPayload) {
    var outputObj = {};

    // Convert rawPayload to xml in order to use xpath
    var options = { compact: true, ignoreComment: true };
    var xmlRawPayload = convertToXML.json2xml(rawPayload, options);

    console.log("Raw device payload in xml ...\n" + xmlRawPayload);

    // var xmlRawPayload = js2xmlparser.parse("rawPayload", rawPayload);
    var doc = new dom().parseFromString(xmlRawPayload);

    // Iterate through the mapping spec and look for function blocks
    // console.log("Mapping spec json ...");
    // console.log(mappingSpecs);

    // Step 1: Iterate over number of function blocks in the information model

    try {
        var numberOfFunctionBlocks = mappingSpecs.infoModel.functionblocks.length;
        if (numberOfFunctionBlocks) {
            console.log('Number of function blocks found = ' + numberOfFunctionBlocks);
            for (var countFB = 0; countFB < numberOfFunctionBlocks; countFB++) {
                var fbName = mappingSpecs.infoModel.functionblocks[countFB].name;

                var status = {};

                // Step 2: Search for status properties in the function block along with the mapping
                var numberOfStatusProperties = mappingSpecs.properties[fbName].statusProperties.length;
                if (numberOfStatusProperties) {
                    console.log('Number of status properties found = ' + numberOfStatusProperties);

                    for (var countSP = 0; countSP < numberOfStatusProperties; countSP++) {
                        var statusPropertyName = mappingSpecs.properties[fbName].statusProperties[countSP].name;
                        var path = mappingSpecs.properties[fbName].statusProperties[countSP].stereotypes[0].attributes.xpath;

                        // Replace single forward slash with a pair of forward slashes
                        path = path.replace(/\//g, "//");
                        console.log("path : " + path);

                        // Step 3 : Evaluate xpath expression
                        //var xpathResult = xpath.select("concat(//key1,//key2)", doc);
                        var xpathResult = xpath.select("string(" + path + ")", doc);

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