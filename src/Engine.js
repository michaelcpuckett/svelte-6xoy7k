import jsonld from 'jsonld'
// import '../node_modules/jsonld/dist/jsonld.js' 

class SHACL {
  async getConstraintComponent(type) {
    switch (type) {
      case 'property': return PropertyConstraintComponent
      case 'hasValue': return HasValueConstraintComponent
      case 'shClass': return ClassConstraintComponent
      case 'minCount': return MinCountConstraintComponent
      case 'maxCount': return MaxCountConstraintComponent
      case 'minLength': return MinLengthConstraintComponent
      case 'maxLength': return MaxLengthConstraintComponent
      case 'datatype': return DatatypeConstraintComponent
      case 'nodeKind': return NodeKindConstraintComponent
      default: return
    }
  }
  async getRuleComponent(type) {
    switch (type) {
      case 'property': return PropertyConstraintComponent
      case 'values': return ValuesComponent
      case 'rule': return RuleComponent
    }
    if (type.values) {
      return new ValuesComponent(type)
    }
  }
  async matchTargets(targets, $data) {
    // console.log($data)
    if (targets.find(({ targetNode }) => targetNode)) {
      const targetNode = targets.find(({ targetNode }) => targetNode).targetNode.id
      return $data.filter(({ id }) => id === targetNode)
    }
    if (targets.find(({ targetClass }) => targetClass)) {
      const targetClass = targets.find(({ targetClass }) => targetClass).targetClass.id
      return $data.filter(({ type }) => type === targetClass)
    }
    if (targets.find(({ targetSubjectsOf }) => targetSubjectsOf)) {
      const targetSubjectsOf = targets.find(({ targetSubjectsOf }) => targetSubjectsOf).targetSubjectsOf.id
      return $data.filter(({ [targetSubjectsOf]: predicate }) => predicate || predicate === false)
    }
    // if (targets.find(({ targetObjectsOf }) => targetObjectsOf)) {
    //   const targetObjectsOf = targets.find(({ targetObjectsOf }) => targetObjectsOf).targetObjectsOf.id
    //   return $data.filter(({ type }) => type === targetObjectsOf)
    // }
  }
  async getTargets({
    targetNode,
    targetClass,
    targetSubjectsOf,
    targetObjectsOf
  }) {
    return targetNode ?
      [{ targetNode }] :
      targetClass ?
        [{ targetClass }] :
        targetSubjectsOf ?
          [{ targetSubjectsOf }] :
          targetObjectsOf ?
            [{ targetObjectsOf }] :
            null
  }
  async getConstraintsByType({
    class: shClass,
    datatype,
    nodeKind,
    minCount,
    maxCount,
    minExclusive,
    minInclusive,
    maxExclusive,
    maxInclusive,
    minLength,
    maxLength,
    pattern,
    languageIn,
    uniqueLang,
    equals,
    disjoint,
    lessThan,
    lessThanOrEqualTo,
    not,
    and,
    or,
    xone,
    node,
    property,
    qualifiedValueShape,
    qualifiedMinCount,
    qualifiedMaxCount,
    hasValue,
    in: shIn
  }) {
    return [
      { shClass },
      { datatype },
      { nodeKind },
      { minCount },
      { maxCount },
      { minExclusive },
      { minInclusive },
      { maxExclusive },
      { maxInclusive },
      { minLength },
      { maxLength },
      { pattern },
      { languageIn },
      { uniqueLang },
      { equals },
      { disjoint },
      { lessThan },
      { lessThanOrEqualTo },
      { not },
      { and },
      { or },
      { xone },
      { node },
      { property },
      { qualifiedValueShape },
      { qualifiedMinCount },
      { qualifiedMaxCount },
      { hasValue },
      { shIn }
    ].filter(obj => Object.values(obj).find(_ => _))
  }
  async getRulesByType({
    values,
    rule,
    property,
  }) {
    return [
      { values },
      { rule },
      { property }
    ].filter(obj => Object.values(obj).find(_ => _))
  }
  async getOrderFromRule(type, rule, target, focusNode) {
    const Component = await this.getRuleComponent(type, focusNode)
    if (Component) {
      const component = Component._values ? Component : new Component(rule)
      return component.getOrder(target, focusNode)
    } else {
      console.log('NO COMPONENT FOUND')
    }
  }
  async inferFromRule(type, rule, target, focusNode, order) {
    const Component = await this.getRuleComponent(type, focusNode)
    if (Component) {
      const component = Component._values ? Component : new Component(rule)
      return component.infer(target, focusNode, order)
    } else {
      console.log('NO COMPONENT FOUND')
    }
  }
  async validateConstraint(type, constraint, target, focusNode) {
    const component = new (await this.getConstraintComponent(type))(constraint)
    return component.validate(target, focusNode)
  }
  async getOrderFromShape(shape, data, focusNode) {
    const rulesByType = await this.getRulesByType(shape)
    return await this.getInferenceOrder([data], rulesByType, focusNode)
  }
  async inferShape(shape, data, focusNode, order) {
    const rulesByType = await this.getRulesByType(shape)
    return await this.getInferenceResult([data], rulesByType, focusNode, order)
  }
  async validateShape(shape, data, focusNode) {
    const constraintsByType = await this.getConstraintsByType(shape)
    return await this.getValidationResult([data], constraintsByType, focusNode)
  }
  async getInferenceOrder(matchedTargets, rulesByType, focusNode) {
    return (rulesByType && rulesByType.length) ? (await Promise.all(matchedTargets.map(async target => {
      return await Promise.all(rulesByType.map(async rulesOfType => await Promise.all(Object.entries(rulesOfType).map(async ([ type, rules ]) => {
        if (type === 'property') {
          return await Promise.all((Array.isArray(rules) ? rules : [rules]).map(async rule => await this.getOrderFromRule(type, rule, target, (Array.isArray(focusNode.property) ? focusNode.property : [focusNode.property]).find(({ path }) => path.id === rule.path.id))))
        } else {
          return await this.getOrderFromRule(type, rules, target, focusNode)
        }
      }))))
    }))) : 0
  }
  async getInferenceResult(matchedTargets, rulesByType, focusNode, order) {
    return (rulesByType && rulesByType.length) ? (await Promise.all(matchedTargets.map(async target => {
      return await Promise.all(rulesByType.map(async rulesOfType => await Promise.all(Object.entries(rulesOfType).map(async ([ type, rules ]) => {
        if (type === 'property') {
          return await Promise.all((Array.isArray(rules) ? rules : [rules]).map(async rule => await this.inferFromRule(type, rule, target, (Array.isArray(focusNode.property) ? focusNode.property : [focusNode.property]).find(({ path }) => path.id === rule.path.id), order)))
        } else {
          return await this.inferFromRule(type, rules, target, focusNode, order)
        }
      }))))
    }))) : true
  }
  async getValidationResult(matchedTargets, constraintsByType, focusNode) {
    return (constraintsByType && constraintsByType.length) ? (await Promise.all(matchedTargets.map(async target => {
      return await Promise.all(constraintsByType.map(async constraintsOfType => await Promise.all(Object.entries(constraintsOfType).map(async ([ type, constraints ]) => {
        if (Array.isArray(constraints)) {
          return await Promise.all(constraints.map(async constraint => await this.validateConstraint(type, constraint, target, focusNode)))
        } else {
          return await this.validateConstraint(type, constraints, target, focusNode)
        }
      }))))
    }))) : true
  }
}

SHACL.prototype.toJSON = function() {
  return {
    type: this.constructor.name,
    ...Object.fromEntries(Object.entries(this).filter(([key]) => key !== '__proto__'))
  }
}

class ConstraintComponent extends SHACL {
  constructor(constraint) {
    super()
    this.constraint = constraint
  }
}

class PropertyConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async getOrder(target, focusNode) {
    if (this.constraint.path) {
      const nextTargets = typeof target[focusNode.path.id] === 'object' ? Array.isArray(target[focusNode.path.id]) ? target[focusNode.path.id] : [target[focusNode.path.id]] : [target]
      return await Promise.all(nextTargets.map(async target => await this.getOrderFromShape(this.constraint, target, focusNode)))
    } else {
      throw new Error('NO PATH')
    }
  }
  async infer(target, focusNode, order) {
    if (this.constraint.path) {
      const path = focusNode.path.id === 'rdf:type' ? 'type' : focusNode.path.id
      const nextTargets = typeof target[path] === 'object' ? Array.isArray(target[path]) ? target[path] : [target[path]] : [target]
      if (typeof target[path] === 'object') {
        // console.log('obj', this.constraint, nextTargets)
      }
      if (!target[path]) {
        console.log({ target, nextTargets, path, originalPath: focusNode.path.id, focusNode, order, constraint: this.constraint })
      } else {
        console.log('...', [{ target, nextTargets, path, originalPath: focusNode.path.id, focusNode, order, constraint: this.constraint }])
      }
      return await Promise.all(nextTargets.map(async target => await this.inferShape(this.constraint, target, focusNode, order)))
    } else {
      throw new Error('NO PATH')
    }
  }
  async validate(target, focusNode) {
    const nextTargets = [target, ...typeof target[this.constraint.path.id] === 'object' ? Array.isArray(target[this.constraint.path.id]) ? target[this.constraint.path.id] : [target[this.constraint.path.id]] : []]
    const validationResult = await Promise.all(nextTargets.map(async target => await this.validateShape(this.constraint, target, this.constraint.path.id)))

    return {
      component: this,
      focusNode,
      target,
      validationResult: Array.isArray(validationResult) ? validationResult.flat(Infinity) : validationResult
    }
  }
}

class HasValueConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async validate(target, focusNode) {
    return {
      component: this,
      focusNode,
      target,
      validationResult: target[focusNode] === this.constraint
    }
  }
}

class ClassConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async validate(target, focusNode) {
    return {
      component: this,
      focusNode,
      target,
      validationResult: target.type === this.constraint.id || (target['rdf:type'] && target['rdf:type'].id === this.constraint.id)
    }
  }
}

class MinCountConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async validate(target, focusNode) {
    return {
      component: this,
      focusNode,
      target,
      validationResult: (this.constraint === 1 && !Array.isArray(target[focusNode]) && (target[focusNode] || target[focusNode] !== false)) || (Array.isArray(target[focusNode]) && target[focusNode].length >= this.constraint)
    }
  }
}

class MaxCountConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async validate(target, focusNode) {
    return {
      component: this,
      focusNode,
      target,
      validationResult: Array.isArray(target[focusNode]) && (target[focusNode].length <= this.constraint)
    }
  }
}

class MinLengthConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async validate(target, focusNode) {
    return {
      component: this,
      focusNode,
      target,
      validationResult: typeof target[focusNode] === 'string' && target[focusNode].length >= this.constraint
    }
  }
}

class MaxLengthConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async validate(target, focusNode) {
    return {
      component: this,
      focusNode,
      target,
      validationResult: typeof target[focusNode] === 'string' && target[focusNode].length <= this.constraint
    }
  }
}

class DatatypeConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async validate(target, focusNode) {
    return {
      component: this,
      focusNode,
      target,
      validationResult: typeof target[focusNode] === this.constraint.id.split('../2001/XMLSchema#')[1]
    }
  }
}

class NodeKindConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async validate(target, focusNode) {
    const node = target[focusNode]
    const nodeKinds = {
      BlankNode: ['BlankNode'],
      IRI: ['NamedNode'],
      Literal: ['Literal'],
      BlankNodeOrIRI: ['BlankNode', 'NamedNode'],
      BlankNodeOrLiteral: ['BlankNode', 'Literal'],
      IRIOrLiteral: ['NamedNode', 'Literal']
    }
    return {
      component: this,
      validationValue: (() => {
        switch (true) {
          case (typeof node === 'string') && node.startsWith('http'): return 'NamedNode'
          case (typeof node === 'string') && node.startsWith('_:'): return 'BlankNode'
          case typeof node === 'string': return 'Literal'
          case (typeof target === 'object') && target.id && target.id.startsWith('http'): return 'NamedNode'
          case (typeof target === 'object') && target.id && target.id.startsWith('_:'): return 'BlankNode'
          case typeof target === 'object': return 'BlankNode'
          default: return 'Literal'
        }
      })(),
      validationResult: nodeKinds[this.constraint.id].includes((() => {
        switch (true) {
          case (typeof node === 'string') && node.startsWith('http'): return 'NamedNode'
          case (typeof node === 'string') && node.startsWith('_:'): return 'BlankNode'
          case typeof node === 'string': return 'Literal'
          case (typeof target === 'object') && target.id && target.id.startsWith('http'): return 'NamedNode'
          case (typeof target === 'object') && target.id && target.id.startsWith('_:'): return 'BlankNode'
          case typeof target === 'object': return 'BlankNode'
          default: return 'Literal'
        }
      })())
    }
  }
}

class RuleComponent {
  constructor(rule) {
    this.rule = rule
  }
  async getOrder(target) {
    return Math.max(target.order || 0, this.rule.order || 0)
  }
  async infer(target, focusNode, order) {
    const subject = this.rule.subject.id === 'this' ? target : target[this.rule.subject.path.id]
    if (order !== await this.getOrder(target))  {
      return subject
    }
    if (!subject[this.rule.predicate.id]) {
      if (this.rule.object.path) {
        subject[this.rule.predicate.id] = subject[this.rule.object.path.id]
      } else {
        subject[this.rule.predicate.id] = this.rule.object
      }
    }
    return subject
  }
}

class ValuesComponent {
  constructor(values) {
    this.values = values
  }
  async getOrder(_, focusNode) {
    return focusNode.order || 0
  }
  async infer(target, focusNode, order) {
    if (order !== await this.getOrder(target, focusNode))  {
      return target
    }
    target = target ? JSON.parse(JSON.stringify(target)) : target
    const path = focusNode.path.id === 'rdf:type' ? 'type' : focusNode.path.id
    // console.log('values', JSON.parse(JSON.stringify({ values: this.values, target, focusNode })))
    // console.log(this.values, target, focusNode.path.id)
    // if (!target[focusNode.path.id]) {
      if (this.values.path) {
        target[path] = target[this.values.path.id]
      } else {
        target[path] = focusNode.path.id === 'rdf:type' ? this.values.id : this.values
      }
    // }
    return target
  }
}

export class SHACLEngine extends SHACL {
  constructor(shapesGraph, dataGraph) {
    super()
    this.originalShapesGraph = shapesGraph
    this.originalDataGraph = dataGraph
  }
  async init() {
    const {
      "@context": dataContext,
      ...data
    } = await jsonld.frame(this.originalDataGraph, {
      "@context": {
        "id": "@id",
        "type": "@type"
      }
    }, {
      embed: true
    })

    this.originalDataContext = dataContext
    this.$data = data["@graph"] || [data]

    const {
      "@context": shapesContext,
      ...shapes
    } = await jsonld.frame(this.originalShapesGraph, {
      "@context": {
        "@base": "http://www.w3.org/ns/shacl#",
        "@vocab": "http://www.w3.org/ns/shacl#",
        "id": "@id",
        "type": "@type"
      }
    }, {
      embed: true
    })

    this.originalShapesContext = shapesContext
    this.$shapes = shapes["@graph"] || [shapes]
  }
  async infer() {
    const ruleOrders = [0,1,2]// [...new Set((await this.getInferenceOrderList()).flat(Infinity))]
    // console.log(ruleOrders, await this.getInferenceOrderList())
    const results = await ruleOrders.reduce(async (promise, order) => {
      const p = await promise
      console.log({ p })
      const prev = JSON.parse(JSON.stringify([...new Set(p.map(node => JSON.stringify(node)))].map(node => JSON.parse(node))))
      // console.log(prev)
      const thisResult = await this.getInferenceResults(order, prev)
      console.log({ thisResult: thisResult.flat(Infinity) })
      const inferredGraph = await jsonld.expand({
        "@context": {
          "id": "@id",
          "type": "@type"
        },
        "@graph": thisResult
      }, {
        "@context": {
          "id": "@id",
          "type": "@type"
        }
      })
      return inferredGraph
    }, await jsonld.expand({
      "@context": {
        "id": "@id",
        "type": "@type"
      },
      "@graph": this.$data
    }, {
      "@context": {
        "id": "@id",
        "type": "@type"
      }
    }))

    // console.log(results["@context"])

    const inferredGraph = (await jsonld.compact(results, {
      "@context": {
        "id": "@id",
        "type": "@type"
      }
    }))["@graph"]

    this._inferredGraph = inferredGraph

    console.log({ inferredGraph })

    const {
      "@context": c,
      "@graph": g
    } = await jsonld.compact(await jsonld.frame(await jsonld.compact({
      "@context": {
        "id": "@id",
        "type": "@type"
      },
      "@graph": inferredGraph//[...new Set(inferredGraph.map(item => JSON.stringify(item)))].map(item => JSON.parse(item)).filter(({ id }) => !id || this.$data.id === id)
    }, {
      "@context": {
        ...this.originalDataGraph["@context"]
      }
    }), {
      "@context": {
        ...this.originalDataGraph["@context"]
      }
    }, {
      "@context": this.originalDataGraph["@context"]
    }, {
      embed: true
    }), {
      "@context": this.originalDataGraph["@context"]
    })

    const {
      "@context": _c,
      "@graph": _g,
      ...originalData
    } = this.originalDataGraph

    const originalIDs = (_g || [originalData]).filter(({ "@id": id }) => id).map(({ "@id": id }) => id)

    console.log({ g })
    const {
      "@context": finalContext,
      "@graph": dataGraph
    } = {
      "@context": c,
      "@graph": g//.filter(({ "@id": id }) => !id || (id && !id.startsWith('_:b') && originalIDs.includes(id)))
    }

    this.inferredGraph = await jsonld.frame({
      "@context": finalContext,
      ...(dataGraph.length > 1 ? {
        "@graph": dataGraph
      } : dataGraph[0])
    }, {
      "@context": finalContext
    }, {
      embed: true,
      omitDefault: true
    })

    return this.inferredGraph
  }
  async validate() {
    const {
      "@context": context,
      "@graph": reportGraph
    } = await jsonld.frame({
      "@context": {
        "@base": "http://www.w3.org/ns/shacl#",
        "@vocab": "http://www.w3.org/ns/shacl#",
        "id": "@id",
        "type": "@type"
      },
      "@graph": [...new Set((await this.getValidationResults()).flat(Infinity).map(item => JSON.stringify(item)))].map(item => JSON.parse(item))
    }, {
      "@context": {
        "@base": "http://www.w3.org/ns/shacl#",
        "@vocab": "http://www.w3.org/ns/shacl#",
        "id": "@id",
        "type": "@type"
      }
    })
    const report = reportGraph.filter(({ validationResult }) => typeof validationResult !== 'undefined' && validationResult !== true).map(node => ({
      ...node
    })).filter(({ validationResult }) => typeof validationResult !== 'undefined' && validationResult !== true)
    const conforms = report ? !report.length : true

    this.validationReport = {
      conforms,
      ...(report.length ? { report } : null)
    }

    return this.validationReport
  }
  async getValidationResults() {
    const nodesWithTargets = (await Promise.all(this.$shapes.map(async node => [await this.getTargets(node), node]))).map(([hasTargets, node]) => hasTargets ? node : null).filter(_ => _)
    return await Promise.all(nodesWithTargets.map(async node => {
      const targets = await this.getTargets(node)
      const matchedTargets = await this.matchTargets(targets, this._inferredGraph)
      const constraintsByType = await this.getConstraintsByType(node)
      return (await this.getValidationResult(matchedTargets, constraintsByType, node))
    }))
  }
  async getInferenceOrderList() {
    const nodesWithTargets = (await Promise.all(this.$shapes.map(async node => [await this.getTargets(node), node]))).map(([hasTargets, node]) => hasTargets ? node : null).filter(_ => _)
    return await Promise.all(nodesWithTargets.map(async node => {
      const targets = await this.getTargets(node)
      const matchedTargets = await this.matchTargets(targets, JSON.parse(JSON.stringify(this.$data)))
      const rulesByType = await this.getRulesByType(node)
      return await this.getInferenceOrder(matchedTargets, rulesByType, node)
    }))
  }
  async getInferenceResults(order, data) {
    const nodesWithTargets = (await Promise.all(this.$shapes.map(async node => [await this.getTargets(node), node]))).map(([hasTargets, node]) => hasTargets ? node : null).filter(_ => _)
    return await Promise.all(nodesWithTargets.map(async node => {
      const targets = await this.getTargets(node)
      const matchedTargets = await this.matchTargets(targets, data)
      const rulesByType = await this.getRulesByType(node)
      // console.log({ matchedTargets })
      return await this.getInferenceResult(matchedTargets, rulesByType, node, order)
    }))
  }
}