import type { Field } from 'payload'

/**
 * Vrátí objekt, který explicitně vynuluje všechna datová pole skupiny.
 *
 * Proč: při update Payload chybějící podpole doplní z původního dokumentu, takže
 * `skupina = {}` data nesmaže. Je třeba poslat každé pole s hodnotou null.
 */
export const prazdneHodnoty = (fields: Field[]): Record<string, unknown> =>
  fields.reduce<Record<string, unknown>>((acc, field) => {
    if ('name' in field && field.name) {
      if (field.type === 'group') acc[field.name] = prazdneHodnoty(field.fields)
      else if (field.type === 'checkbox') acc[field.name] = false
      else if (field.type === 'array' || (field.type === 'select' && field.hasMany))
        acc[field.name] = []
      else acc[field.name] = null
    } else if ('fields' in field) {
      // row, collapsible – nemají vlastní jméno, jejich pole patří do nadřazené úrovně
      Object.assign(acc, prazdneHodnoty(field.fields))
    }
    return acc
  }, {})
