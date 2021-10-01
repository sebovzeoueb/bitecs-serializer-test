import { addComponent, addEntity, Changed, createWorld, defineComponent, defineDeserializer, defineQuery, defineSerializer, DESERIALIZE_MODE, pipe, Types } from "bitecs"
import chunkEntityComponents from "./chunkEntityComponents"
import { Chunk, Collider, Door, Hitpoints, Position, StaticEntity } from "./components"

console.log("Testing bitECS serializer")

const world = createWorld()

const ArrayComponent = defineComponent({arr: [Types.ui16, 1024]})
const serializeArray = defineSerializer([ArrayComponent])
const deserializeArray = defineDeserializer([ArrayComponent])
const Vector2Component = defineComponent({value: [Types.f32, 2]})
const serializeVector2 = defineSerializer([Vector2Component])
const deserializeVector2 = defineDeserializer([Vector2Component])
const EntityData = defineComponent({dataID: Types.ui16, category: Types.ui8, variant: Types.ui8})
const TagComponent = defineComponent()
const serializeAll = defineSerializer([ArrayComponent, Vector2Component, EntityData, TagComponent])
const deserializeAll = defineDeserializer([ArrayComponent, Vector2Component, EntityData, TagComponent])

const eid = addEntity(world)
addComponent(world, ArrayComponent, eid)

const testArraySerializer = world => {
  try {
    console.log("Serializing entity with array component")
    const packet = serializeArray([eid])
    console.log(`Packet bytes: ${packet.byteLength}`)
    console.log("Deserializing packet")
    deserializeArray(world, packet, DESERIALIZE_MODE.REPLACE)
    console.log("Deserialized packet OK!")
    console.log("Creating multiple entities with all components")
    const eids = [eid]
    for (let i = 0; i < 10; i++) {
      const eid = addEntity(world)
      addComponent(world, ArrayComponent, eid)
      addComponent(world, EntityData, eid)
      addComponent(world, TagComponent, eid)
      ArrayComponent.arr[eid][5] = 3
      EntityData.category[eid] = 2
      EntityData.dataID[eid] = 3
      EntityData.variant[eid] = 1
      eids.push(eid)
    }
    for (let i = 0; i < 10; i++) {
      const eid = addEntity(world)
      addComponent(world, Vector2Component, eid)
      addComponent(world, EntityData, eid)
      Vector2Component.value[eid][1] = 0.8
      EntityData.category[eid] = 6
      EntityData.dataID[eid] = 7
      EntityData.variant[eid] = 3
      eids.push(eid)
    }
    for (let i = 0; i < 10; i++) {
      const eid = addEntity(world)
      addComponent(world, Vector2Component, eid)
      addComponent(world, ArrayComponent, eid)
      addComponent(world, EntityData, eid)
      Vector2Component.value[eid][0] = 0.3
      ArrayComponent.arr[eid][4] = 6
      ArrayComponent.arr[eid][5] = 8
      EntityData.category[eid] = 19
      EntityData.dataID[eid] = 3
      EntityData.variant[eid] = 4
      eids.push(eid)
    }
    console.log("Serializing multiple entities with all components again")
    const packet2 = serializeAll(eids)
    console.log(`Packet bytes: ${packet2.byteLength}`)
    deserializeAll(world, packet2, DESERIALIZE_MODE.REPLACE)
    console.log("Deserialized packet OK!")
    eids.length = 0
    eids.push[eid]
    for (let i = 0; i < 10; i++) {
      const eid = addEntity(world)
      addComponent(world, ArrayComponent, eid)
      addComponent(world, EntityData, eid)
      ArrayComponent.arr[eid][5] = 3
      ArrayComponent.arr[eid][2] = 1
      EntityData.category[eid] = 2
      EntityData.dataID[eid] = 3
      EntityData.variant[eid] = 1
      eids.push(eid)
    }
    for (let i = 0; i < 10; i++) {
      const eid = addEntity(world)
      addComponent(world, Vector2Component, eid)
      addComponent(world, EntityData, eid)
      Vector2Component.value[eid][1] = 0.8
      Vector2Component.value[eid][0] = -0.5
      EntityData.category[eid] = 6
      EntityData.dataID[eid] = 7
      EntityData.variant[eid] = 3
      eids.push(eid)
    }
    for (let i = 0; i < 10; i++) {
      const eid = addEntity(world)
      addComponent(world, Vector2Component, eid)
      addComponent(world, ArrayComponent, eid)
      addComponent(world, EntityData, eid)
      Vector2Component.value[eid][0] = 0.3
      ArrayComponent.arr[eid][4] = 6
      ArrayComponent.arr[eid][5] = 8
      EntityData.category[eid] = 19
      EntityData.dataID[eid] = 3
      EntityData.variant[eid] = 4
      eids.push(eid)
    }
    console.log("Serializing multiple entities with all components again")
    const packet3 = serializeAll(eids)
    console.log(`Packet bytes: ${packet3.byteLength}`)
    deserializeAll(world, packet3, DESERIALIZE_MODE.REPLACE)
    console.log("Deserialized packet OK!")

  }
  catch(err) {
    console.error(err)
  }
  return world
}

const eid2 = addEntity(world)
addComponent(world, Vector2Component, eid2)

const testVector2Serializer = world => {
  try {
    console.log("Serializing entity with Vector2 component")
    const packet = serializeVector2([eid2])
    console.log(`Packet bytes: ${packet.byteLength}`)
    console.log("Deserializing packet")
    deserializeVector2(world, packet, DESERIALIZE_MODE.REPLACE)
    console.log("Deserialized packet OK!")
  }
  catch(err) {
    console.error(err)
  }
  return world
}

const vector2Query = defineQuery([Vector2Component])
const serializeVector2FromQuery = pipe(vector2Query, serializeVector2)

const testQuerySerializer = world => {
  try {
    console.log("Serializing entity with Vector2 component from piped query")
    console.log(`${vector2Query(world).length} entities in query`)
    const packet = serializeVector2FromQuery(world)
    if (!packet) return console.error("NULL Packet")
    else console.log(`Packet bytes: ${packet.byteLength}`)
    console.log("Deserializing packet")
    deserializeVector2(world, packet, DESERIALIZE_MODE.REPLACE)
    console.log("Deserialized packet OK!")
  }
  catch(err) {
    console.error(err)
  }
  return world
}

const serializeChangedVector2 = defineSerializer([Changed(Vector2Component)])
const deserializeChangedVector2 = defineDeserializer([Changed(Vector2Component)])
const serializeChangedArray = defineSerializer([Changed(ArrayComponent)])

const eid3 = addEntity(world)
addComponent(world, Vector2Component, eid3)
addComponent(world, ArrayComponent, eid3)

const testChangedSerializer = world => {
  try {
    console.log("Serializing entity with changed Vector2 component")
    const packet = serializeChangedVector2([eid3])
    console.log(`Packet bytes: ${packet.byteLength}`)
    console.log("Deserializing packet")
    deserializeChangedVector2(world, packet, DESERIALIZE_MODE.REPLACE)
    console.log("Deserialized packet OK!")
    console.log("Serializing entity after no value change")
    const packet2 = serializeChangedVector2([eid3])
    console.log(`Packet bytes: ${packet2.byteLength} (expected 0)`)
    console.log("Changing component value")
    Vector2Component.value[eid3][0] = 5
    console.log("Serializing entity after value change")
    const packet3 = serializeChangedVector2([eid3])
    console.log(`Packet bytes: ${packet3.byteLength}`)
    console.log("Serializing entity with changed array component")
    const packet4 = serializeChangedArray([eid3])
    console.log(`Packet bytes: ${packet4.byteLength}`)
    console.log("Serializing entity after no value change")
    const packet5 = serializeChangedArray([eid3])
    console.log(`Packet bytes: ${packet5.byteLength} (expected 0)`)
    console.log("Changing component value")
    ArrayComponent.arr[eid3][6] = 5
    console.log("Serializing entity after value change")
    const packet6 = serializeChangedArray([eid3])
    console.log(`Packet bytes: ${packet6.byteLength}`)
  }
  catch(err) {
    console.error(err)
  }
  return world
}

const actualComponentSerializer = defineSerializer(chunkEntityComponents)
const actualComponentDeserializer = defineDeserializer(chunkEntityComponents)

const testActualComponents = world => {
  try {
    console.log("Creating chunk entities using actual components from game")
    const chunkEID = addEntity(world)
    addComponent(world, Chunk, chunkEID)
    addComponent(world, Position, chunkEID)
    const eids = [chunkEID]
    for (let i = 0; i < 50; i++) {
      const eid = addEntity(world)
      addComponent(world, Position, eid)
      addComponent(world, EntityData, eid)
      addComponent(world, StaticEntity, eid)
      addComponent(world, Hitpoints, eid)
      if (Math.random() < 0.5) addComponent(world, Collider, eid)
      if (Math.random() < 0.5) addComponent(world, Door, eid)
      eids.push(eid)
    }
    console.log("Serializing chunk entities")
    const packet = actualComponentSerializer(eids)
    console.log(`Packet bytes: ${packet.byteLength}`)
    actualComponentDeserializer(world, packet)
    console.log("Deserialization OK!")
  }
  catch(err) {
    console.error(err)
  }
  return world
}

const pipeline = pipe(
  testArraySerializer,
  testVector2Serializer,
  testQuerySerializer,
  testChangedSerializer,
  testActualComponents
)

pipeline(world)