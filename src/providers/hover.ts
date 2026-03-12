import { HoverProvider, MarkdownString } from 'vscode'
import { getMessageHover, isTermOrMessageReference } from '../global-state'
import { getIdentifierRangeAtPosition } from '../utils'

const ss14FunctionDocs: Record<string, string> = {
  'CAPITALIZE': 'Capitalizes the first letter of the value.',
  'TOSTRING': 'Formats a number using a .NET format string.\n\nUsage: `{ TOSTRING($var, "F1") }`',
  'THE': 'Adds "the" before the entity name if it is not a proper noun.',
  'SUBJECT': 'Returns the subject pronoun (he/she/they/it) for the entity.',
  'OBJECT': 'Returns the object pronoun (him/her/them/it) for the entity.',
  'POSS-ADJ': 'Returns the possessive adjective (his/her/their/its) for the entity.',
  'POSS-PRONOUN': 'Returns the possessive pronoun (his/hers/theirs/its) for the entity.',
  'REFLEXIVE': 'Returns the reflexive pronoun (himself/herself/themselves/itself) for the entity.',
  'CONJUGATE-BE': 'Conjugates "be" for the entity (is/are).',
  'CONJUGATE-HAVE': 'Conjugates "have" for the entity (has/have).',
  'CONJUGATE-BASIC': 'Basic verb conjugation — adds "s" for third person singular.',
  'PROPER': 'Returns whether the entity name is a proper noun (true/false).',
  'GENDER': 'Returns the grammatical gender of the entity (male/female/epicene/neuter).',
  'INDEFINITE': 'Adds the indefinite article (a/an) before the value.',
  'MAKEPLURAL': 'Converts a word to its plural form.',
  'MANY': 'Returns the plural form based on count.\n\nUsage: `{ MANY($var, $count) }`',
  'PRESSURE': 'Formats a pressure value with appropriate SI prefix (kPa, MPa, etc.).',
  'POWERWATTS': 'Formats power in watts with appropriate SI prefix (W, kW, MW, etc.).',
  'POWERJOULES': 'Formats energy in joules with appropriate SI prefix (J, kJ, MJ, etc.).',
  'UNITS': 'Formats a value with its associated units.',
  'LOC': 'Performs a localization string lookup.',
  'NATURALFIXED': 'Formats a number with a fixed number of decimal places.\n\nUsage: `{ NATURALFIXED($var, 2) }`',
  'NATURALPERCENT': 'Formats a number as a percentage.\n\nUsage: `{ NATURALPERCENT($var, 1) }`',
  'PLAYTIME': 'Formats a playtime duration into a human-readable string.',
}

const hoverProvider: HoverProvider = {
  provideHover(document, position) {
    // Check for SS14 function name hover
    const funcRange = document.getWordRangeAtPosition(position, /[A-Z][A-Z0-9_-]*(?=\()/)
    if (funcRange) {
      const funcName = document.getText(funcRange)
      const doc = ss14FunctionDocs[funcName]
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
