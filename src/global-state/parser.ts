import {
  FluentParser,
  Visitor,
  Message,
  GroupComment,
  MessageReference,
  Term,
  TermReference,
  Junk,
  VariableReference,
} from '@fluent/syntax'
import buildHoverValue from './build-hover-value'

class VsCodeFluentVisitor extends Visitor {
  idSpan: { [messageIdentifier in string]: { start: number, end: number } }
  valueSpan: { [messageIdentifier in string]: { start: number, end: number } }
  termSpan: { [messageIdentifier in string]: { start: number, end: number } }
  hover: { [messageIdentifier in string]: string }
  groupComments: Array<{ name: string, start: number, end: number }>
  referenceSpan: { [messageIdentifier in string]: Array<{ start: number, end: number }> }
  junksAnnotations: Array<{ code: string, message: string, start: number, end: number }>
  variables: { [messageIdentifier in string]: Array<string> }
  private currentMessage?: string

  constructor() {
    super()
    this.idSpan = {}
    this.valueSpan = {}
    this.termSpan = {}
    this.hover = {}
    this.groupComments = []
    this.referenceSpan = {}
    this.junksAnnotations = []
    this.variables = {}
    this.currentMessage = undefined
  }

  visitGroupComment(node: GroupComment) {
    if (node.span === undefined) {
      return
    }

    const newGroupComment = {
      name: node.content,
      start: node.span.start,
      end: node.span.end,
    }

    this.groupComments.push(newGroupComment)
  }

  visitTerm(node: Term) {
    if (node.id.span && node.value.span) {
      this.termSpan[`-${node.id.name}`] = { start: node.id.span.start, end: node.id.span.end }
      this.valueSpan[`-${node.id.name}`] = { start: node.value.span.start, end: node.value.span.end }
    }

    this.hover[`-${node.id.name}`] = node.value.elements
      ? buildHoverValue(node.value.elements)
      : '[unknown]'

    this.genericVisit(node)
  }

  visitMessage(node: Message) {
    if (node.id.span && node.value?.span) {
      this.idSpan[node.id.name] = { start: node.id.span.start, end: node.id.span.end }
      this.valueSpan[node.id.name] = { start: node.value.span.start, end: node.value.span.end }
    }

    this.hover[node.id.name] = node.value?.elements
      ? buildHoverValue(node.value.elements)
      : '[unknown]'

    this.currentMessage = node.id.name
    this.genericVisit(node)
    this.currentMessage = undefined
  }

  visitTermReference(node: TermReference) {
    if (node.span && node.id.span) {
      if (this.referenceSpan[`-${node.id.name}`] === undefined) {
        this.referenceSpan[`-${node.id.name}`] = []
      }

      this.referenceSpan[`-${node.id.name}`].push({ start: node.id.span.start, end: node.id.span.end })
    }
  }

  visitMessageReference(node: MessageReference) {
    if (node.span && node.id.span) {
      if (this.referenceSpan[node.id.name] === undefined) {
        this.referenceSpan[node.id.name] = []
      }

      this.referenceSpan[node.id.name].push({ start: node.id.span.start, end: node.id.span.end })
    }
  }

  visitJunk(node: Junk) {
    node.annotations.forEach(annotation => {
      if (annotation.span === undefined) {
        return
      }

      this.junksAnnotations.push({
        code: annotation.code,
        message: annotation.message,
        start: annotation.span.start,
        end: annotation.span.end,
      })
    })
  }

  visitVariableReference(node: VariableReference): void {
    if (this.currentMessage === undefined) {
      return
    }

    if (this.variables[this.currentMessage] === undefined) {
      this.variables[this.currentMessage] = []
    }

    if (this.variables[this.currentMessage].includes(node.id.name)) {
      return
    }

    this.variables[this.currentMessage].push(node.id.name)
  }
}

const fluentParser = new FluentParser()

const preprocessSource = (source: string): string => {
  // Replace $variable in named arguments of term/function calls with "variable"
  // e.g., -term(count: $remaining) -> -term(count: "remaining")
  // This is needed because @fluent/syntax doesn't support $var as named argument values
  return source.replace(
    /(\w+:\s*)\$([a-zA-Z][a-zA-Z0-9_-]*)/g,
    '$1"$2"'
  )
}

const parser = (source: string) => {
  const ast = fluentParser.parse(preprocessSource(source))

  const visitorMessage = new VsCodeFluentVisitor()
  visitorMessage.visit(ast)

  return {
    hover: visitorMessage.hover,
    idSpan: visitorMessage.idSpan,
    valueSpan: visitorMessage.valueSpan,
    termSpan: visitorMessage.termSpan,
    groupComments: visitorMessage.groupComments,
    referenceSpan: visitorMessage.referenceSpan,
    junksAnnotations: visitorMessage.junksAnnotations,
    variables: visitorMessage.variables,
  }
}

export default parser
