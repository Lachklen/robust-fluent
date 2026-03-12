import { HoverProvider, MarkdownString } from 'vscode'
import { getMessageHover, isTermOrMessageReference } from '../global-state'
import { getIdentifierRangeAtPosition } from '../utils'
import { getDocForLanguage } from './function-docs'
import { getEffectiveLanguage } from '../utils/get-language'

const hoverProvider: HoverProvider = {
  provideHover(document, position) {
    // Check for SS14 function name hover
    const funcRange = document.getWordRangeAtPosition(position, /[A-Z][A-Z0-9_-]*(?=\()/)
    if (funcRange) {
      const funcName = document.getText(funcRange)
      const lang = getEffectiveLanguage()
      const doc = getDocForLanguage(funcName, lang)
      if (doc) {
        const md = new MarkdownString()
        md.appendMarkdown(`**${funcName}**\n\n${doc}`)
        return { contents: [md] }
      }
    }

    // Existing logic for message/term references
    const identifier = document.getText(getIdentifierRangeAtPosition(document, position))

    if (isTermOrMessageReference(document.uri.path, identifier, document.offsetAt(position)) === false) {
      return
    }

    const content = getMessageHover(document.uri.path, identifier)

    return {
      contents: [content],
    }
  },
}

export default hoverProvider
