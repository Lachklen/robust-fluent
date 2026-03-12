import {
  Diagnostic,
  DiagnosticSeverity,
  Range,
  TextDocument,
} from 'vscode'
import { getJunksAnnotations } from '../global-state'

// Error codes that should be warnings instead of errors
// These are common in SS14 FTL files and are not critical
const warningCodes = new Set([
  'E0003', // Expected token (often from SS14 extensions)
  'E0014', // Expected literal (from $var in named args)
])

const diagnosticsFromJunkAnnotations = (uri: string, textDocument: TextDocument) => {
  const junksAnnotations = getJunksAnnotations(uri)

  const diagnostics = junksAnnotations.map(annotation => {
    const start = textDocument.positionAt(annotation.start)
    const end = textDocument.positionAt(annotation.end)

    const severity = warningCodes.has(annotation.code)
      ? DiagnosticSeverity.Warning
      : DiagnosticSeverity.Error

    const diagnostic = new Diagnostic(new Range(start, end), annotation.message, severity)
    diagnostic.code = annotation.code

    return diagnostic
  })

  return diagnostics
}

export default diagnosticsFromJunkAnnotations
