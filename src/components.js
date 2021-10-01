import { defineComponent, Types } from "bitecs";
import { Rect, Vector2 } from "./baseTypes";

export const Position = defineComponent(Vector2)
export const Direction = defineComponent(Vector2)
export const Velocity = defineComponent(Vector2)
export const Speed = defineComponent({value: Types.f32})
export const EntityData = defineComponent({dataID: Types.ui16, category: Types.ui8, variant: Types.ui8})
export const Hitbox = defineComponent(Rect)
export const Movement = defineComponent({maxSpeed: Types.f32})
export const Action = defineComponent({
  type: Types.ui8,
  item: Types.ui16,
  start: Types.ui32,
  duration: Types.ui32,
  trigger: Types.f32,
  target: [Types.f32, 2]
})
export const PerformingAction = defineComponent()
export const Chunk = defineComponent({terrain: [Types.ui16, 1024]})
export const Loading = defineComponent()
export const TargetPosition = defineComponent(Vector2)
export const TilePosition = defineComponent({x: Types.i32, y: Types.i32})
export const StaticEntity = defineComponent()
export const Door = defineComponent({locked: Types.ui8})
export const Collider = defineComponent()
export const PlayerCharacter = defineComponent()
export const Authority = defineComponent()
export const Inventory = defineComponent({
  items: [Types.ui16, 30],
  amounts: [Types.ui16, 30]
})
export const Equipped = defineComponent({slot: Types.i8})
export const Holding = defineComponent({item: Types.ui16})
export const Destroy = defineComponent()
export const Hitpoints = defineComponent({current: Types.f32, maximum: Types.f32})