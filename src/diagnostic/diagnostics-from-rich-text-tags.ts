import { Diagnostic, DiagnosticSeverity, Range, TextDocument } from 'vscode'

const diagnosticsFromRichTextTags = (textDocument: TextDocument): Diagnostic[] => {
  const diagnostics: Diagnostic[] = []
  const text = textDocument.getText()

  // CHECK 1: Empty value after = in tags
  // Matches [color=], [font=], [anyTag=], [color= ], etc.
  // This causes a runtime parser crash in SS14
  const emptyValueRegex = /\[([a-zA-Z][a-zA-Z0-9]*)\s*=\s*\]/g
  let match: RegExpExecArray | null
  while ((match = emptyValueRegex.exec(text)) !== null) {
    const pos = textDocument.positionAt(match.index)
    const lineText = textDocument.lineAt(pos.line).text.trimStart()
    if (lineText.startsWith('#')) continue // skip comments

    const tagName = match[1]
    const start = textDocument.positionAt(match.index)
    const end = textDocument.positionAt(match.index + match[0].length)
    diagnostics.push(new Diagnostic(
      new Range(start, end),
      `Empty value in [${tagName}=] tag. Expected a value after '='. This will cause a runtime parser error.`,
      DiagnosticSeverity.Error
    ))
  }

  // CHECK 2: Empty closing tag [/]
  const emptyClosingRegex = /\[\/\s*\]/g
  while ((match = emptyClosingRegex.exec(text)) !== null) {
    const pos = textDocument.positionAt(match.index)
    const lineText = textDocument.lineAt(pos.line).text.trimStart()
    if (lineText.startsWith('#')) continue

    const start = textDocument.positionAt(match.index)
    const end = textDocument.positionAt(match.index + match[0].length)
    diagnostics.push(new Diagnostic(
      new Range(start, end),
      'Empty closing tag [/]. Expected a tag name like [/color], [/bold], etc.',
      DiagnosticSeverity.Error
    ))
  }

  // CHECK 3: Tag without name [=value]
  const noNameRegex = /\[=([^\]]*)\]/g
  while ((match = noNameRegex.exec(text)) !== null) {
    const pos = textDocument.positionAt(match.index)
    const lineText = textDocument.lineAt(pos.line).text.trimStart()
    if (lineText.startsWith('#')) continue

    const start = textDocument.positionAt(match.index)
    const end = textDocument.positionAt(match.index + match[0].length)
    diagnostics.push(new Diagnostic(
      new Range(start, end),
      'Tag without name. Expected a tag name before \'=\'.',
      DiagnosticSeverity.Error
    ))
  }

  // IMPORTANT: Do NOT flag these as errors:
  // - [color] without = -> valid pop/closing tag in SS14
  // - [/color] -> valid closing tag
  // - [bold], [italic], etc. without = -> valid opening tags
  // - Missing closing tags -> at most a warning (not implemented here to avoid noise)

  return diagnostics
}

export default diagnosticsFromRichTextTags
