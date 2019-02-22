// Load library for js2xml conversion
var convertToXML = require("xml-js");
var xpath = require('xpath')
    , dom = require('xmldom').DOMParser

// Mock device data
var rawPayload = {
    "key1": "hello",
    "key2": "world"
};

// Vorto information model mapping specs
var mappingSpecs = {
    "infoModel": {
        "targetPlatformKey": "mapGreetings",
        "stereotypes": [],
        "mappingReference": null,
        "id": {
            "name": "GreetingsBot",
            "namespace": "com.greet",
            "version": "1.0.0",
            "prettyFormat": "com.greet:GreetingsBot:1.0.0"
        },
        "type": "InformationModel",
        "displayName": "GreetingsBot",
        "description": "Information Model for GreetingsBot",
        "fileName": null,
        "references": [{
            "name": "Greetings",
            "namespace": "com.greet",
            "version": "1.0.0",
            "prettyFormat": "com.greet:Greetings:1.0.0"
        }],
        "functionblocks": [{
            "targetPlatformKey": "mapGreetings",
            "stereotypes": [],
            "mappingReference": {
                "name": "GreetingsPayloadMappingMapgreetings",
                "namespace": "com.greet.mapping.fbs",
                "version": "1.0.0",
                "prettyFormat": "com.greet.mapping.fbs:GreetingsPayloadMappingMapgreetings:1.0.0"
            },
            "mandatory": false,
            "name": "greetings",
            "description": null,
            "type": {
                "name": "Greetings",
                "namespace": "com.greet",
                "version": "1.0.0",
                "prettyFormat": "com.greet:Greetings:1.0.0"
            },
            "constraints": [],
            "attributes": [],
            "multiple": false,
            "primitive": false
        }]
    },
    "properties": {
        "greetings": {
            "targetPlatformKey": "mapGreetings",
            "stereotypes": [],
            "mappingReference": null,
            "id": {
                "name": "Greetings",
                "namespace": "com.greet",
                "version": "1.0.0",
                "prettyFormat": "com.greet:Greetings:1.0.0"
            },
            "type": "Functionblock",
            "displayName": "Greetings",
            "description": "Functionblock for Greetings",
            "fileName": null,
            "references": [],
            "configurationProperties": [],
            "statusProperties": [{
                "targetPlatformKey": "mapGreetings",
                "stereotypes": [{
                    "name": "source",
                    "attributes": {
                        "xpath": "/key1"
                    }
                }],
                "mappingReference": null,
                "mandatory": true,
                "name": "greetingsValue",
                "description": null,
                "type": "STRING",
                "constraints": [],
                "attributes": [],
                "multiple": false,
                "primitive": true
            }],
            "faultProperties": [],
            "events": [],
            "operations": []
        }
    }
};

var outputObj = {};

// Convert rawPayload to xml in order to use xpath
var options = { compact: true, ignoreComment: true};
var xmlRawPayload = convertToXML.json2xml(rawPayload, options);

console.log("Raw device payload in xml ...\n" + xmlRawPayload);

// var xmlRawPayload = js2xmlparser.parse("rawPayload", rawPayload);
var doc = new dom().parseFromString(xmlRawPayload);

// Iterate through the mapping spec and look for function blocks
console.log("Mapping spec json ...");
console.log(mappingSpecs);

// Step 1: Iterate over number of function blocks in the information model

try {
    var numberOfFunctionBlocks = mappingSpecs.infoModel.functionblocks.length;
    if (numberOfFunctionBlocks) {
        console.log('Number of function blocks found = ' + numberOfFunctionBlocks);
        for (var i = 0; i < numberOfFunctionBlocks; i++) {
            var fbName = mappingSpecs.infoModel.functionblocks[i].name;
            var status = {};

            // Step 2: Search for status properties in the function block along with the mapping
            var numberOfStatusProperties = mappingSpecs.properties[fbName].statusProperties.length;
            if (numberOfStatusProperties) {
                console.log('Number of status properties found = ' + numberOfStatusProperties);

                for (var i = 0; i < numberOfStatusProperties; i++) {
                    var statusPropertyName = mappingSpecs.properties[fbName].statusProperties[i].name;
                    var path = mappingSpecs.properties[fbName].statusProperties[i].stereotypes[0].attributes.xpath;

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
}


outputObj = JSON.stringify(outputObj, null, 2);
console.log("Final output... \n" + outputObj);
