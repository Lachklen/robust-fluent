import { CompletionItem, CompletionItemKind, CompletionItemProvider, Position, SnippetString } from 'vscode'
import { getIdentifierRangeAtPosition } from '../utils'
import { getDeclaredVariables, isMessageSpan } from '../global-state'

const ss14Functions = [
  { name: 'CAPITALIZE', doc: 'Capitalizes the first letter of the value', snippet: 'CAPITALIZE(${1:\\$var})' },
  { name: 'TOSTRING', doc: 'Formats a number using .NET format string', snippet: 'TOSTRING(${1:\\$var}, "${2:F1}")' },
  { name: 'THE', doc: 'Adds "the" if entity name is not proper', snippet: 'THE(${1:\\$ent})' },
  { name: 'SUBJECT', doc: 'Subject pronoun (he/she/they/it)', snippet: 'SUBJECT(${1:\\$ent})' },
  { name: 'OBJECT', doc: 'Object pronoun (him/her/them/it)', snippet: 'OBJECT(${1:\\$ent})' },
  { name: 'POSS-ADJ', doc: 'Possessive adjective (his/her/their/its)', snippet: 'POSS-ADJ(${1:\\$ent})' },
  { name: 'POSS-PRONOUN', doc: 'Possessive pronoun (his/hers/theirs/its)', snippet: 'POSS-PRONOUN(${1:\\$ent})' },
  { name: 'REFLEXIVE', doc: 'Reflexive pronoun (himself/herself/themselves/itself)', snippet: 'REFLEXIVE(${1:\\$ent})' },
  { name: 'CONJUGATE-BE', doc: 'Conjugates "be" (is/are)', snippet: 'CONJUGATE-BE(${1:\\$ent})' },
  { name: 'CONJUGATE-HAVE', doc: 'Conjugates "have" (has/have)', snippet: 'CONJUGATE-HAVE(${1:\\$ent})' },
  { name: 'CONJUGATE-BASIC', doc: 'Basic verb conjugation', snippet: 'CONJUGATE-BASIC(${1:\\$ent})' },
  { name: 'PROPER', doc: 'Checks if entity name is a proper noun', snippet: 'PROPER(${1:\\$ent})' },
  { name: 'GENDER', doc: 'Gets entity gender (male/female/epicene/neuter)', snippet: 'GENDER(${1:\\$ent})' },
  { name: 'INDEFINITE', doc: 'Adds indefinite article (a/an)', snippet: 'INDEFINITE(${1:\\$var})' },
  { name: 'MAKEPLURAL', doc: 'Makes a word plural', snippet: 'MAKEPLURAL(${1:\\$var})' },
  { name: 'MANY', doc: 'Plural form based on count', snippet: 'MANY(${1:\\$var}, ${2:\\$count})' },
  { name: 'PRESSURE', doc: 'Formats pressure value with SI prefix', snippet: 'PRESSURE(${1:\\$var})' },
  { name: 'POWERWATTS', doc: 'Formats power in watts with SI prefix', snippet: 'POWERWATTS(${1:\\$var})' },
  { name: 'POWERJOULES', doc: 'Formats energy in joules with SI prefix', snippet: 'POWERJOULES(${1:\\$var})' },
  { name: 'UNITS', doc: 'Formats value with units', snippet: 'UNITS(${1:\\$var})' },
  { name: 'LOC', doc: 'Localization string lookup', snippet: 'LOC(${1:\\$var})' },
  { name: 'NATURALFIXED', doc: 'Natural fixed-point number format', snippet: 'NATURALFIXED(${1:\\$var}, ${2:decimals})' },
  { name: 'NATURALPERCENT', doc: 'Natural percentage format', snippet: 'NATURALPERCENT(${1:\\$var}, ${2:decimals})' },
  { name: 'PLAYTIME', doc: 'Formats playtime duration', snippet: 'PLAYTIME(${1:\\$var})' },
]

const ss14RichTextTags = [
  { name: 'color', doc: 'Colored text', snippet: '[color=${1:red}]${2:text}[/color]' },
  { name: 'bold', doc: 'Bold text', snippet: '[bold]${1:text}[/bold]' },
  { name: 'italic', doc: 'Italic text', snippet: '[italic]${1:text}[/italic]' },
  { name: 'font', doc: 'Custom font/size', snippet: '[font size=${1:14}]${2:text}[/font]' },
  { name: 'BubbleHeader', doc: 'Chat bubble header', snippet: '[BubbleHeader]${1:text}[/BubbleHeader]' },
  { name: 'BubbleContent', doc: 'Chat bubble content', snippet: '[BubbleContent]${1:text}[/BubbleContent]' },
  { name: 'Name', doc: 'Entity name tag', snippet: '[Name]${1:text}[/Name]' },
  { name: 'head', doc: 'Head section', snippet: '[head]${1:text}[/head]' },
]

const isInsidePlaceable = (lineText: string, character: number): boolean => {
  const textBeforeCursor = lineText.substring(0, character)
  let depth = 0
  for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
    if (textBeforeCursor[i] === '}') depth++
    if (textBeforeCursor[i] === '{') {
      if (depth === 0) return true
      depth--
    }
  }
  return false
}

const completionProvider: CompletionItemProvider = {
  provideCompletionItems(document, position, token, context) {
    const lineText = document.lineAt(position.line).text

    // Original: variable comment completions when line is just '#'
    if (lineText.trimEnd() === '#') {
      const messagePosition = new Position(position.line + 1, 0)
      const identifier = document.getText(getIdentifierRangeAtPosition(document, messagePosition))
      if (isMessageSpan(document.uri.path, identifier, document.offsetAt(messagePosition)) === false) {
        return
      }

      const initialSpace = lineText.endsWith(' ') ? '' : ' '
      const variableDocs = getDeclaredVariables(document.uri.path, identifier)
        .map(variable => `${variable}: `)
        .sort((a, b) => a.localeCompare(b))
        .join('\n# ')

      const item = new CompletionItem('Message comment', CompletionItemKind.Text)
      item.sortText = '\0'
      item.insertText = initialSpace + variableDocs

      return [item]
    }

    // SS14 function completions inside placeables { }
    if (isInsidePlaceable(lineText, position.character)) {
      return ss14Functions.map((func, index) => {
        const item = new CompletionItem(func.name, CompletionItemKind.Function)
        item.detail = func.doc
        item.documentation = func.doc
        item.insertText = new SnippetString(func.snippet)
        item.sortText = String(index).padStart(3, '0')
        return item
      })
    }

    // SS14 rich text tag completions when typing '['
    const textBeforeCursor = lineText.substring(0, position.character)
    if (textBeforeCursor.endsWith('[')) {
      return ss14RichTextTags.map((tag, index) => {
        const item = new CompletionItem(tag.name, CompletionItemKind.Snippet)
        item.detail = `SS14 Rich Text: ${tag.doc}`
        item.documentation = tag.doc
        item.insertText = new SnippetString(tag.snippet)
        item.sortText = String(index).padStart(3, '0')
        return item
      })
    }

    return
  },
}

export default completionProvider
