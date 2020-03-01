import jsonld from 'jsonld'
import { SHACLEngine } from './Engine.js'
import * as diff from 'deep-object-diff'

const exampleDataGraph = {
  "@context": {
    "@base": "http://example.org/",
    "@vocab": "http://example.org/",
    "id": "@id",
    "type": "@type"
  },
  "@graph": [
    {
      "id": "HEROES",
      "member": [
        {
          "id": "MILLENIUM_FALCON",
          "type": "CorellianFreighter",
          "modelNumber": "YT 492727ZED"
        },
        {
          "id": "HAN",
          "type": "Human",
          "firstName": "Han",
          "lastName": "Solo",
          "ship": {
            "id": "MILLENIUM_FALCON"
          }
        },
        {
          "id": "R2-D2",
          "type": "AstromechDroid"
        },
        {
          "id": "LUKE",
          "type": "Human",
          "firstName": "Luke",
          "friendsWith": [
            {
              "id": "HAN"
            },
            {
              "id": "R2-D2"
            }
          ],
          "lastName": "Skywalker"
        },
        {
          "id": "LEIA",
          "type": "Human",
          "firstName": "Leia",
          "friendsWith": [
            {
              "id": "HAN"
            },
            {
              "id": "LUKE"
            }
          ],
          "lastName": "Organa"
        }
      ]
    },
    {
      "id": "MILLENIUM_FALCON",
      "type": "CorellianFreighter",
      "modelNumber": "YT 492727ZED"
    },
    {
      "id": "HAN",
      "type": "Human",
      "firstName": "Han",
      "lastName": "Solo",
      "ship": {
        "id": "MILLENIUM_FALCON",
        "type": "CorellianFreighter",
        "modelNumber": "YT 492727ZED"
      }
    },
    {
      "id": "R2-D2",
      "type": "AstromechDroid"
    },
    {
      "id": "LUKE",
      "type": "Human",
      "firstName": "Luke",
      "friendsWith": [
        {
          "id": "HAN",
          "type": "Human",
          "firstName": "Han",
          "lastName": "Solo",
          "ship": {
            "id": "MILLENIUM_FALCON",
            "type": "CorellianFreighter",
            "modelNumber": "YT 492727ZED"
          }
        },
        {
          "id": "R2-D2",
          "type": "AstromechDroid"
        }
      ],
      "lastName": "Skywalker"
    },
    {
      "id": "LEIA",
      "type": "Human",
      "firstName": "Leia",
      "friendsWith": [
        {
          "id": "HAN",
          "type": "Human",
          "firstName": "Han",
          "lastName": "Solo",
          "ship": {
            "id": "MILLENIUM_FALCON",
            "type": "CorellianFreighter",
            "modelNumber": "YT 492727ZED"
          }
        },
        {
          "id": "LUKE",
          "type": "Human",
          "firstName": "Luke",
          "friendsWith": [
            {
              "id": "HAN"
            },
            {
              "id": "R2-D2",
              "type": "AstromechDroid"
            }
          ],
          "lastName": "Skywalker"
        }
      ],
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
    "property": {
      "path": "ex:friend",
      "minCount": 1,
      "values": [{
        "path": "ex:friendsWith"
      }, {
        "path": {
          "inversePath": "ex:friendsWith"
        }
      }]
    }
  }]
}

;(async () => {
  const engine = new SHACLEngine(exampleShapesGraph, exampleDataGraph)
  await engine.init()
  await engine.infer()
  await engine.validate()
  // console.log(engine.validationReport)
  console.log(engine.inferredGraph)
  const inferredAndFramed = await jsonld.frame(engine.inferredGraph, {
    "@context": {
      "@base": "http://example.org/",
      "@vocab": "http://example.org/",
      "id": "@id",
      "type": "@type",
      "friend": { "@type": "@id", "@container": "@set" }
    },
    "friendsWith": {
      "@embed": false,
      "@null": true,
      "@container": null
    },
    "friend": {
      "@embed": false
    }
  }, {
    "embed": true,
    "explicit": false,//true,//true,//false,
    // "null": true,
    "omitDefault": true,
    "requireAll": false//true
  })
  console.log(inferredAndFramed)
  // console.log(diff.addedDiff(engine.originalDataGraph, engine.inferredGraph))
})()