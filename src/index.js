import { SHACLEngine } from './Engine.js'

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
  }]
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
        "values": {
          "id": "schema:Article"
        }
      }, {
        "path": "schema:headline",
        "values": {
          "path": "news:title"
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
})()