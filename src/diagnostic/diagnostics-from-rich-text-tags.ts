import {
  Diagnostic,
  DiagnosticSeverity,
  Position,
  Range,
  TextDocument,
} from 'vscode'

// Tags that REQUIRE a value after = (e.g., [color=red])
const tagsRequiringValue = new Set(['color'])

// Tags that CAN have attributes but are not strictly required to
const tagsWithOptionalAttributes = new Set(['font'])

// Tags that should NOT have = (e.g., [bold], [italic])
const tagsNoValue = new Set([
  'bold', 'italic', 'BubbleHeader', 'BubbleContent', 'Name', 'head',
  'mono', 'b', 'i', 'bi', 'cb', 'ci', 'cbi', 'cbold', 'citalic', 'cbolditalic',
])

// All known tags (for unclosed tag checking)
const allKnownTags = new Set([
  ...tagsRequiringValue, ...tagsWithOptionalAttributes, ...tagsNoValue,
])

// Tags that require a closing counterpart
const closingRequiredTags = [
  'color', 'bold', 'italic', 'font', 'BubbleHeader', 'BubbleContent', 'Name', 'head',
  'mono', 'b', 'i', 'bi', 'cb', 'ci', 'cbi', 'cbold', 'citalic', 'cbolditalic',
]

const isCommentLine = (textDocument: TextDocument, offset: number): boolean => {
  const pos = textDocument.positionAt(offset)
  const lineText = textDocument.lineAt(pos.line).text.trimStart()
  return lineText.startsWith('#')
}

const diagnosticsFromRichTextTags = (textDocument: TextDocument): Diagnostic[] => {
  const diagnostics: Diagnostic[] = []
  const text = textDocument.getText()

  // CHECK 1: Empty value after = in tags (e.g. [color=], [font= ])
  const emptyValueRegex = /\[(\w+)\s*=\s*\]/g
  let match: RegExpExecArray | null
  while ((match = emptyValueRegex.exec(text)) !== null) {
    if (isCommentLine(textDocument, match.index)) continue

    const tagName = match[1]
    const start = textDocument.positionAt(match.index)
    const end = textDocument.positionAt(match.index + match[0].length)
    diagnostics.push(new Diagnostic(
      new Range(start, end),
      `Empty value in [${tagName}=] tag. Expected a value (color name, #hex, number, or variable) after '='.`,
      DiagnosticSeverity.Error
    ))
  }

  // CHECK 2: [color] without = (not a closing tag)
  const colorNoValueRegex = /(?<!\/)(\[color\])/g
  while ((match = colorNoValueRegex.exec(text)) !== null) {
    if (isCommentLine(textDocument, match.index)) continue

    const start = textDocument.positionAt(match.index)
    const end = textDocument.positionAt(match.index + match[0].length)
    diagnostics.push(new Diagnostic(
      new Range(start, end),
      '[color] tag requires a value. Use [color=red], [color=#FF0000], or [color={$variable}].',
      DiagnosticSeverity.Error
    ))
  }

  // CHECK 3: Empty closing tag [/]
  const emptyClosingRegex = /\[\/\s*\]/g
  while ((match = emptyClosingRegex.exec(text)) !== null) {
    if (isCommentLine(textDocument, match.index)) continue

    const start = textDocument.positionAt(match.index)
    const end = textDocument.positionAt(match.index + match[0].length)
    diagnostics.push(new Diagnostic(
      new Range(start, end),
      'Empty closing tag [/]. Expected a tag name like [/color], [/bold], etc.',
      DiagnosticSeverity.Error
    ))
  }

  // CHECK 4: Tag without name [=value]
  const noNameRegex = /\[=([^\]]*)\]/g
  while ((match = noNameRegex.exec(text)) !== null) {
    if (isCommentLine(textDocument, match.index)) continue

    const start = textDocument.positionAt(match.index)
    const end = textDocument.positionAt(match.index + match[0].length)
    diagnostics.push(new Diagnostic(
      new Range(start, end),
      "Tag without name. Expected a tag name before '='.",
      DiagnosticSeverity.Error
    ))
  }

  // CHECK 5: Unclosed tags (Warning)
  // Track open/close tags per message block.
  // A message starts at a line matching `identifier =` at column 0 and continues
  // through indented continuation lines.
  const lines: string[] = []
  for (let i = 0; i < textDocument.lineCount; i++) {
    lines.push(textDocument.lineAt(i).text)
  }

  type OpenTag = { tag: string, line: number, col: number }

  const flushUnclosed = (openTagStack: OpenTag[]) => {
    for (const openTag of openTagStack) {
      const start = new Position(openTag.line, openTag.col)
      const end = new Position(openTag.line, openTag.col + openTag.tag.length + 2)
      diagnostics.push(new Diagnostic(
        new Range(start, end),
        `Unclosed [${openTag.tag}] tag. Expected a matching [/${openTag.tag}] closing tag.`,
        DiagnosticSeverity.Warning
      ))
    }
  }

  let openTagStack: OpenTag[] = []
  let inMessage = false

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const lineText = lines[lineNum]
    const isMessageStart = /^-?[a-zA-Z][a-zA-Z0-9_-]*\s*=/.test(lineText)
    const isComment = lineText.trimStart().startsWith('#')
    const isContinuation = lineText.startsWith(' ') || lineText.startsWith('\t')

    if (isMessageStart) {
      // Flush unclosed tags from previous message
      flushUnclosed(openTagStack)
      openTagStack = []
      inMessage = true
    } else if (!isContinuation || isComment) {
      // End of message block
      if (inMessage) {
        flushUnclosed(openTagStack)
        openTagStack = []
        inMessage = false
      }
      continue
    }

    if (isComment) continue
    if (!inMessage && !isMessageStart) continue

    // Find opening tags on this line
    for (const tagName of closingRequiredTags) {
      const openRegex = new RegExp(`\\[${tagName}(?:=[^\\]]*)?\\]`, 'g')
      let tagMatch: RegExpExecArray | null
      while ((tagMatch = openRegex.exec(lineText)) !== null) {
        openTagStack.push({ tag: tagName, line: lineNum, col: tagMatch.index })
      }

      // Find closing tags and pop matching opens
      const closeRegex = new RegExp(`\\[\\/${tagName}\\]`, 'g')
      while ((tagMatch = closeRegex.exec(lineText)) !== null) {
        // Remove the last matching open tag from the stack
        for (let i = openTagStack.length - 1; i >= 0; i--) {
          if (openTagStack[i].tag === tagName) {
            openTagStack.splice(i, 1)
            break
          }
        }
      }
    }
  }

  // Flush any remaining unclosed tags at end of file
  flushUnclosed(openTagStack)

  return diagnostics
}

export default diagnosticsFromRichTextTags
