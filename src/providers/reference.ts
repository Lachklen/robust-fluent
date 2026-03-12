import { ReferenceProvider, Location, Range } from 'vscode'

const referenceProvider: ReferenceProvider = {
  provideReferences(document, position) {
    const wordRange = document.getWordRangeAtPosition(position, /\$[a-zA-Z][a-zA-Z0-9_-]*/)
    if (!wordRange) {
      return []
    }

    const variableName = document.getText(wordRange)
    const locations: Location[] = []
    const text = document.getText()

    // Find all occurrences of this variable in the document
    const regex = new RegExp(variableName.replace('$', '\\$'), 'g')
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      const start = document.positionAt(match.index)
      const end = document.positionAt(match.index + match[0].length)
      locations.push(new Location(document.uri, new Range(start, end)))
    }

    return locations
  },
}

export default referenceProvider
