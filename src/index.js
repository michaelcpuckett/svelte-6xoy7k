import { SHACLEngine } from './Engine.js'
import * as diff from 'deep-object-diff'

const exampleDataGraph = {
  "@context": {
    "@base": "http://news.org/",
    "@vocab": "http://news.org/",
    // "id": "@id",
    // "type": "@type"
  },
  "articles": [{
    "title": "Headline 1",
    "author": "Alice Jones"
  }, {
    "title": "Headline 2",
    "author": "Bob Ezekial"
  }],
  "foo": "bar"
}

const exampleShapesGraph = {
  "@context": {
    "@base": "http://www.w3.org/ns/shacl#",
    "@vocab": "http://www.w3.org/ns/shacl#",
    "news": "http://news.org/",
    "schema": "http://schema.org/",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "rdf:type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    "id": "@id",
    "type": "@type",
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
    "targetSubjectsOf": "news:articles",
    "property": [{
      "path": "rdf:type",
      "values": {
        "id": "schema:ItemList"
      }
    }, {
      "path": "schema:itemListElement",
      "values": {
        "path": "news:articles"
      },
      "property": [{
        "path": "rdf:type",
        "order": 1,
        "values": {
          "id": "schema:Article"
        }
      }, {
        "path": "schema:headline",
        "order": 1,
        "values": {
          "path": "news:title"
        }
      }, {
        "path": "schema:author",
        "order": 2,
        "values": {
          "path": "news:author"
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
  console.log(engine.validationReport)
  console.log(engine.inferredGraph)
  console.log(diff.addedDiff(engine.originalDataGraph, engine.inferredGraph))
})()