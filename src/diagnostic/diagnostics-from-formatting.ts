import {
  Diagnostic,
  DiagnosticSeverity,
  Range,
  TextDocument,
} from 'vscode'

const diagnosticsFromFormatting = (textDocument: TextDocument): Diagnostic[] => {
  const diagnostics: Diagnostic[] = []
  const text = textDocument.getText()
  const lines = text.split('\n')

  // Track selector blocks
  let inSelector = false
  let selectorVariants: Array<{ line: number, bracketColumn: number, isDefault: boolean }> = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect selector start: line contains "->"
    if (line.includes('->')) {
      inSelector = true
      selectorVariants = []
      continue
    }

    if (inSelector) {
      // Detect variant line: leading whitespace, optional *, then [
      const variantMatch = line.match(/^(\s*)(\*?)(\[)([a-zA-Z0-9_-]+)\]/)
      if (variantMatch) {
        const leadingSpaces = variantMatch[1].length
        const isDefault = variantMatch[2] === '*'
        const bracketColumn = leadingSpaces + (isDefault ? 1 : 0) // column of '['
        selectorVariants.push({ line: i, bracketColumn, isDefault })
        continue
      }

      // Detect end of selector block (closing } or non-variant content)
      if (selectorVariants.length > 0 && (line.match(/^\s*\}/) || (!line.match(/^\s*\*?\[/) && line.trim() !== ''))) {
        // Check alignment
        const bracketColumns = selectorVariants.map(v => v.bracketColumn)
        const allSame = bracketColumns.every(c => c === bracketColumns[0])

        if (!allSame) {
          // Find the most common column (the "correct" one)
          const columnCounts = new Map<number, number>()
          bracketColumns.forEach(c => columnCounts.set(c, (columnCounts.get(c) || 0) + 1))
          const expectedColumn = [...columnCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]

          for (const variant of selectorVariants) {
            if (variant.bracketColumn !== expectedColumn) {
              const lineText = lines[variant.line]
              const range = new Range(variant.line, 0, variant.line, lineText.length)
              diagnostics.push(
                new Diagnostic(
                  range,
                  `Selector variant bracket '[' is at column ${variant.bracketColumn}, expected ${expectedColumn}. Align all '[' brackets in the selector.`,
                  DiagnosticSeverity.Warning
                )
              )
            }
          }
        }

        if (line.match(/^\s*\}/)) {
          inSelector = false
          selectorVariants = []
        }
      }
    }
  }

  return diagnostics
}

export default diagnosticsFromFormatting
