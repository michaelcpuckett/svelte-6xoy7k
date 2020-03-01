import jsonld from 'jsonld'
import { SHACLEngine } from './Engine.js'
import * as diff from 'deep-object-diff'

const exampleDataGraph = {
  "@context": {
    "@base": "http://example.org/",
    "@vocab": "http://example.org/",
    "id": "@id",
    "type": "@type",
    "friend": { "@type": "@id", "@container": "@set" },
    "marriedTo": { "@type": "@id", "@container": "@set" },
    "flownBy": { "@type": "@id", "@container": "@set" },
    "fliesIn": { "@type": "@id", "@container": "@set" }
  },
  "@graph": [
    {
      "id": "HAN",
      "type": "Human",
      "firstName": "Han",
      "lastName": "Solo",
      "marriedTo": "LEIA",
      "fliesIn": {
        "id": "MILLENIUM_FALCON",
        "type": "CorellianFreighter",
        "modelNumber": "YT 492727ZED"
      }
    },
    {
      "id": "LANDO",
      "type": "Human",
      "firstName": "Lando",
      "lastName": "Calrissian",
      "friend": [
        "HAN",
        "CHEWBACCA",
        "LEIA"
      ],
      "fliesIn": {
        "id": "MILLENIUM_FALCON"
      }
    },
    {
      "id": "CHEWBACCA",
      "type": "Wookee",
      "friend": ["HAN", "LEIA"],
      "fliesIn": {
        "id": "MILLENIUM_FALCON"
      }
    },
    {
      "id": "R2-D2",
      "type": "AstromechDroid"
    },
    {
      "id": "C-3PO",
      "type": "ProtocolDroid",
      "friend": ["R2-D2", "LUKE", "LEIA"]
    },
    {
      "id": "LUKE",
      "type": "Human",
      "firstName": "Luke",
      "friend": ["HAN", "R2-D2"],
      "lastName": "Skywalker"
    },
    {
      "id": "LEIA",
      "type": "Human",
      "firstName": "Leia",
      "friend": ["HAN", "LUKE"],
      "lastName": "Organa"
    }
  ]
}

const exampleShapesGraph = {
  "@context": {
    "@base": "http://www.w3.org/ns/shacl#",
    "@vocab": "http://www.w3.org/ns/shacl#",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "ex": "http://example.org/",
    "id": "@id",
    "type": "@type",
    "targetNode": { "@type": "@id" },
    "targetClass": { "@type": "@id" },
    "targetSubjectsOf": { "@type": "@id" },
    "targetObjectsOf": { "@type": "@id" },
    "path": { "@type": "@id" },
    "inversePath": { "@type": "@id" },
    "class": { "@type": "@id" },
    "datatype": { "@type": "@id" },
    "nodeKind": { "@type": "@id" },
    "subject": { "@type": "@id" },
    "predicate": { "@type": "@id" }
  },
  "@graph": [{
    "type": "NodeShape",
    "targetObjectsOf": "ex:member",
    "property": [{
      "path": "ex:friend",
      "minCount": 1,
      "values": [{
        "path": "ex:friend"
      }, {
        "path": {
          "inversePath": "ex:friend"
        }
      }]
    }, {
      "path": "ex:marriedTo",
      "minCount": 1,
      "values": [{
        "path": "ex:marriedTo"
      }, {
        "path": {
          "inversePath": "ex:marriedTo"
        }
      }]
    }, {
      "path": "ex:flownBy",
      "minCount": 1,
      "values": [{
        "path": {
          "inversePath": "ex:fliesIn"
        }
      }]
    }]
  }]
}

;(async () => {
  const engine = new SHACLEngine(exampleShapesGraph, exampleDataGraph)
  await engine.init()
  await engine.infer()
  await engine.validate()
  // console.log(engine.validationReport)
  console.log(engine.inferredGraph)
  // const inferredAndFramed = await jsonld.flatten(engine.inferredGraph, {
  //   "@context": {
  //     "@base": "http://example.org/",
  //     "@vocab": "http://example.org/",
  //     "id": "@id",
  //     "type": "@type",
  //     "friend": { "@type": "@id", "@container": "@set" },
  //     "marriedTo": { "@type": "@id", "@container": "@set" },
  //     "flownBy": { "@type": "@id", "@container": "@set" },
  //     "fliesIn": { "@type": "@id", "@container": "@set" }
  //   },
  //   "fliesIn": {
  //     "@embed": false
  //   },
  //   "flownBy": {
  //     "@embed": false
  //   },
  //   "friend": {
  //     "@embed": false
  //   },
  //   "marriedTo": {
  //     "@embed": false
  //   }
  // }, {
  //   "embed": true,
  //   "explicit": false,//true,//true,//false,
  //   // "null": true,
  //   "omitDefault": true,
  //   "requireAll": false//true
  // })
  // console.log(inferredAndFramed)
  // console.log(diff.addedDiff(engine.originalDataGraph, engine.inferredGraph))
})()