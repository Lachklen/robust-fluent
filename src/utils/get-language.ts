import * as vscode from 'vscode'
import { SupportedLanguage, supportedLanguages } from '../providers/function-docs'

export const getEffectiveLanguage = (): SupportedLanguage => {
  const configured = vscode.workspace.getConfiguration('vscodeFluent').get<string>('language') ?? 'auto'

  if (configured !== 'auto' && supportedLanguages.includes(configured as SupportedLanguage)) {
    return configured as SupportedLanguage
  }

  // Auto-detect from VS Code's display language
  const vscodeLanguage = vscode.env.language // e.g., "en", "ru", "de", "zh-cn"
  const baseLang = vscodeLanguage.split('-')[0] as SupportedLanguage // "zh-cn" -> "zh"

  if (supportedLanguages.includes(baseLang)) {
    return baseLang
  }

  return 'en' // fallback
}
