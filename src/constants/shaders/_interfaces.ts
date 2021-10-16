export enum UniformType {
  Float,
  Int,
  Vector2,
  Vector3,
}

export type UniformDefinition = {
  name: string;
} & ({
  type: UniformType.Float,
  default: number,
  step?: number,
  min?: number,
  max?: number,
  divider?: number,
} | {
  type: UniformType.Int,
  default: number,
  step?: number,
  min?: number,
  max?: number,
  divider?: number,
} | {
  type: UniformType.Vector2,
  default: [number, number],
} | {
  type: UniformType.Vector3,
  default: [number, number, number],
});
