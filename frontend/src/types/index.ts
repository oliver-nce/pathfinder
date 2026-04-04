// Pathfinder — Type definitions (extracted from NCE Studio)
// Contains ONLY the types needed by PathFinder components.

export interface FieldMeta {
  fieldname: string
  fieldtype: string
  label: string
  options?: string
  reqd?: boolean
  read_only?: boolean
  hidden?: boolean
  default?: any
  description?: string
}

export interface PathSegment {
  doctype: string
  fieldname: string
  fieldtype: string
  label: string
}

export interface FieldPath {
  segments: PathSegment[]
  dotNotation: string
  terminalField: FieldMeta
}
