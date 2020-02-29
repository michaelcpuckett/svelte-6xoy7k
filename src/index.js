import jsonld from 'jsonld'
import { SHACLEngine } from './Engine.js'
import * as diff from 'deep-object-diff'

const exampleDataGraph = {
  "@context": {
    "@base": "http://example.org/",
    "@vocab": "http://example.org/",
    "id": "@id",
    "type": "@type",
    "friendsWith": {
      "@type": "@id"
    }
  },
  "@graph": [
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
      "id": "LEIA",
      "type": "Human",
      "firstName": "Leia",
      "friendsWith": [
        "LUKE",
        "HAN"
      ],
      "lastName": "Organa"
    },
    {
      "id": "LUKE",
      "type": "Human",
      "firstName": "Luke",
      "friendsWith": [
        "HAN",
        {
          "id": "R2-D2",
          "type": "AstromechDroid"
        }
      ],
      "lastName": "Skywalker"
    },
    // {
    //   "id": "R2-D2",
    //   "type": "AstromechDroid",
    //   "firstName": "R2-D2",
    //   "friendOf": "LUKE"
    // }
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
    "class": { "@type": "@id" },
    "datatype": { "@type": "@id" },
    "nodeKind": { "@type": "@id" },
    "subject": { "@type": "@id" },
    "predicate": { "@type": "@id" }
  },
  "@graph": [{
    "type": "NodeShape",
    "targetSubjectsOf": "ex:firstName",
    "property": {
      "path": "ex:friend",
      "values": [{
        "path": "ex:friendsWith",
        "nodes": {
          "targetSubjectsOf": "ex:friendWith",
          "property": {
            "path": "ex:friendWith"
          }
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
  // console.log(engine.inferredGraph)
  const inferredAndFramed = await jsonld.flatten(await jsonld.frame(engine.inferredGraph, {
    "@context": {
      "@base": "http://example.org/",
      "@vocab": "http://example.org/",
      "id": "@id",
      "type": "@type",
      "friend": { "@type": "@id", "@container": "@set" },
      "ship": { "@type": "@id", "@container": "@set" }
    }
  }, {
    "explicit": false,
    "null": false,
    "omitDefault": true,
    "requireAll": false
  }), {
    "@context": {
      "@base": "http://example.org/",
      "@vocab": "http://example.org/",
      "id": "@id",
      "type": "@type",
      "friend": { "@type": "@id", "@container": "@set" },
      "friendsWith": { "@type": "@id", "@container": "@set" },
      "ship": { "@type": "@id", "@container": "@set" }
    }
  })
  console.log(inferredAndFramed)
  // console.log(diff.addedDiff(engine.originalDataGraph, engine.inferredGraph))
})()