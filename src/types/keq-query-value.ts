export type KeqQueryPrimitive = string | number | null | bigint | undefined
export type KeqQueryObject = { [Key in string]: KeqQueryValue | undefined }
export type KeqQueryArray = KeqQueryValue[]
export type KeqQueryValue = KeqQueryPrimitive | KeqQueryArray | KeqQueryObject
