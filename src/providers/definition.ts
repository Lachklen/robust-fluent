import {
  DefinitionProvider,
  Position,
  Range,
  Uri,
} from 'vscode'
import {
  getMessageIdSpan,
  getMessageValueSpan,
  getTermSpan,
  isTermOrMessageReference,
} from '../global-state'
import { getIdentifierRangeAtPosition } from '../utils'

const definitionProvider: DefinitionProvider = {
  provideDefinition(document, position) {
    // Handle $variable references — find first occurrence as "definition"
    const varRange = document.getWordRangeAtPosition(position, /\$[a-zA-Z][a-zA-Z0-9_-]*/)
    if (varRange) {
      const variableName = document.getText(varRange)
      const text = document.getText()
      const firstIndex = text.indexOf(variableName)
      if (firstIndex >= 0) {
        const start = document.positionAt(firstIndex)
        const end = document.positionAt(firstIndex + variableName.length)
        return [{
          originSelectionRange: varRange,
          targetUri: document.uri,
          targetRange: new Range(start, end),
          targetSelectionRange: new Range(start, end),
        }]
      }
      return
    }

    const originSelectionRange = getIdentifierRangeAtPosition(document, position)
    const identifier = document.getText(originSelectionRange)

    if (isTermOrMessageReference(document.uri.path, identifier, document.offsetAt(position)) === false) {
      return
    }

    const idSpan = identifier.startsWith('-')
      ? getTermSpan(document.uri.path, identifier)
      : getMessageIdSpan(document.uri.path, identifier)
    const idPosition = document.positionAt(idSpan.start)

    const messageValueSpan = getMessageValueSpan(document.uri.path, identifier)
    const messageValuePosition = document.positionAt(messageValueSpan.end)

    return [
      {
        originSelectionRange,
        targetUri: Uri.file(document.uri.path),
        targetRange: new Range(
          idPosition,
          messageValuePosition
        ),
        targetSelectionRange: new Range(
          idPosition,
          new Position(idPosition.line, identifier.length)
        ),
      },
    ]
  },
}

export default definitionProvider
