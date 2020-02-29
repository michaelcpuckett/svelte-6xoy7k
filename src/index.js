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
    },
    "friendOf": {
      "@type": "@id"
    }
  },
  "@graph": [
    {
      "id": "HAN",
      "type": "Human",
      "firstName": "Han",
      "friendOf": [
        "LEIA",
        "LUKE"
      ],
      "lastName": "Solo"
    },
    {
      "id": "LEIA",
      "type": "Human",
      "firstName": "Leia",
      "friendOf": "LUKE",
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
      "friendOf": "LEIA",
      "friendsWith": [
        "LEIA",
        "HAN",
        "R2-D2"
      ],
      "lastName": "Skywalker"
    },
    {
      "id": "R2-D2",
      "type": "AstromechDroid",
      "firstName": "R2-D2",
      "friendOf": "LUKE"
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
        "path": "ex:friendsWith"
      }, {
        "path": "ex:friendOf"
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
  const inferredAndFramed = await jsonld.frame(engine.inferredGraph, {
    "@context": {
      "@base": "http://example.org/",
      "@vocab": "http://example.org/",
      "id": "@id",
      "type": "@type",
      "friendOf": { "@type": "@id" },
      "friendsWith": { "@type": "@id" },
      "friend": { "@type": "@id", "@container": "@set" }
    },
    "@explicit": false,
    "friendOf": { "@type": "@null", "@default": null },
    "friendsWith": { "@type": "@null", "@default": null },
    "friend": { "@embed": false }
  }, {
    "omitDefault": true,
    "requireAll": false
  })
  console.log(inferredAndFramed)
  // console.log(diff.addedDiff(engine.originalDataGraph, engine.inferredGraph))
})()