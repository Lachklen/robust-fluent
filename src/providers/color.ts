import {
  DocumentColorProvider,
  TextDocument,
  Color,
  ColorInformation,
  ColorPresentation,
  Range,
} from 'vscode'

const colorProvider: DocumentColorProvider = {
  provideDocumentColors(document: TextDocument): ColorInformation[] {
    const colors: ColorInformation[] = []
    const text = document.getText()

    // Match [color=#RRGGBB] or [color=#RRGGBBAA] patterns
    const colorRegex = /\[color=(#[0-9a-fA-F]{6,8})\]/g
    let match: RegExpExecArray | null

    while ((match = colorRegex.exec(text)) !== null) {
      const hex = match[1]
      const startPos = document.positionAt(match.index + '[color='.length)
      const endPos = document.positionAt(match.index + '[color='.length + hex.length)
      const range = new Range(startPos, endPos)

      // Parse hex to Color
      const r = parseInt(hex.substring(1, 3), 16) / 255
      const g = parseInt(hex.substring(3, 5), 16) / 255
      const b = parseInt(hex.substring(5, 7), 16) / 255
      const a = hex.length === 9 ? parseInt(hex.substring(7, 9), 16) / 255 : 1

      colors.push(new ColorInformation(range, new Color(r, g, b, a)))
    }

    return colors
  },

  provideColorPresentations(color: Color): ColorPresentation[] {
    const r = Math.round(color.red * 255).toString(16).padStart(2, '0')
    const g = Math.round(color.green * 255).toString(16).padStart(2, '0')
    const b = Math.round(color.blue * 255).toString(16).padStart(2, '0')

    let hex: string
    if (color.alpha < 1) {
      const a = Math.round(color.alpha * 255).toString(16).padStart(2, '0')
      hex = `#${r}${g}${b}${a}`.toUpperCase()
    } else {
      hex = `#${r}${g}${b}`.toUpperCase()
    }

    return [new ColorPresentation(hex)]
  },
}

export default colorProvider
