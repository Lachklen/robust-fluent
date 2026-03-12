type FunctionDoc = {
  en: string
  ru: string
}

export const ss14FunctionDocs: Record<string, FunctionDoc> = {
  'CAPITALIZE': {
    en: 'Capitalizes the first letter of the value.',
    ru: 'Делает первую букву значения заглавной.',
  },
  'TOSTRING': {
    en: 'Formats a number using a .NET format string.\n\nUsage: `{ TOSTRING($var, "F1") }`',
    ru: 'Форматирует число с использованием строки формата .NET.\n\nИспользование: `{ TOSTRING($var, "F1") }`',
  },
  'THE': {
    en: 'Adds "the" before the entity name if it is not a proper noun.',
    ru: 'Добавляет \u00ABthe\u00BB перед именем сущности, если оно не является именем собственным.',
  },
  'SUBJECT': {
    en: 'Returns the subject pronoun (he/she/they/it) for the entity.',
    ru: 'Возвращает местоимение подлежащего (he/she/they/it) для сущности.',
  },
  'OBJECT': {
    en: 'Returns the object pronoun (him/her/them/it) for the entity.',
    ru: 'Возвращает местоимение дополнения (him/her/them/it) для сущности.',
  },
  'POSS-ADJ': {
    en: 'Returns the possessive adjective (his/her/their/its) for the entity.',
    ru: 'Возвращает притяжательное прилагательное (his/her/their/its) для сущности.',
  },
  'POSS-PRONOUN': {
    en: 'Returns the possessive pronoun (his/hers/theirs/its) for the entity.',
    ru: 'Возвращает притяжательное местоимение (his/hers/theirs/its) для сущности.',
  },
  'REFLEXIVE': {
    en: 'Returns the reflexive pronoun (himself/herself/themselves/itself) for the entity.',
    ru: 'Возвращает возвратное местоимение (himself/herself/themselves/itself) для сущности.',
  },
  'CONJUGATE-BE': {
    en: 'Conjugates "be" for the entity (is/are).',
    ru: 'Спрягает глагол \u00ABbe\u00BB для сущности (is/are).',
  },
  'CONJUGATE-HAVE': {
    en: 'Conjugates "have" for the entity (has/have).',
    ru: 'Спрягает глагол \u00ABhave\u00BB для сущности (has/have).',
  },
  'CONJUGATE-BASIC': {
    en: 'Basic verb conjugation \u2014 adds "s" for third person singular.',
    ru: 'Базовое спряжение глагола \u2014 добавляет \u00ABs\u00BB для третьего лица единственного числа.',
  },
  'PROPER': {
    en: 'Returns whether the entity name is a proper noun (true/false).',
    ru: 'Возвращает, является ли имя сущности именем собственным (true/false).',
  },
  'GENDER': {
    en: 'Returns the grammatical gender of the entity (male/female/epicene/neuter).',
    ru: 'Возвращает грамматический род сущности (male/female/epicene/neuter).',
  },
  'INDEFINITE': {
    en: 'Adds the indefinite article (a/an) before the value.',
    ru: 'Добавляет неопределённый артикль (a/an) перед значением.',
  },
  'MAKEPLURAL': {
    en: 'Converts a word to its plural form.',
    ru: 'Преобразует слово во множественное число.',
  },
  'MANY': {
    en: 'Returns the plural form based on count.\n\nUsage: `{ MANY($var, $count) }`',
    ru: 'Возвращает форму множественного числа на основе количества.\n\nИспользование: `{ MANY($var, $count) }`',
  },
  'PRESSURE': {
    en: 'Formats a pressure value with appropriate SI prefix (kPa, MPa, etc.).',
    ru: 'Форматирует значение давления с соответствующей приставкой СИ (кПа, МПа и т.д.).',
  },
  'POWERWATTS': {
    en: 'Formats power in watts with appropriate SI prefix (W, kW, MW, etc.).',
    ru: 'Форматирует мощность в ваттах с соответствующей приставкой СИ (Вт, кВт, МВт и т.д.).',
  },
  'POWERJOULES': {
    en: 'Formats energy in joules with appropriate SI prefix (J, kJ, MJ, etc.).',
    ru: 'Форматирует энергию в джоулях с соответствующей приставкой СИ (Дж, кДж, МДж и т.д.).',
  },
  'UNITS': {
    en: 'Formats a value with its associated units.',
    ru: 'Форматирует значение с соответствующими единицами измерения.',
  },
  'LOC': {
    en: 'Performs a localization string lookup.',
    ru: 'Выполняет поиск строки локализации.',
  },
  'NATURALFIXED': {
    en: 'Formats a number with a fixed number of decimal places.\n\nUsage: `{ NATURALFIXED($var, 2) }`',
    ru: 'Форматирует число с фиксированным количеством десятичных знаков.\n\nИспользование: `{ NATURALFIXED($var, 2) }`',
  },
  'NATURALPERCENT': {
    en: 'Formats a number as a percentage.\n\nUsage: `{ NATURALPERCENT($var, 1) }`',
    ru: 'Форматирует число в процентах.\n\nИспользование: `{ NATURALPERCENT($var, 1) }`',
  },
  'PLAYTIME': {
    en: 'Formats a playtime duration into a human-readable string.',
    ru: 'Форматирует время игры в читаемую строку.',
  },
}

export type SupportedLanguage = 'en' | 'ru'

export const supportedLanguages: SupportedLanguage[] = ['en', 'ru']

export const getDocForLanguage = (funcName: string, lang: SupportedLanguage): string | undefined => {
  const doc = ss14FunctionDocs[funcName]
  if (!doc) return undefined
  return doc[lang] ?? doc['en']
}
