import { addComponent, addEntity, Changed, createWorld, defineComponent, defineDeserializer, defineQuery, defineSerializer, DESERIALIZE_MODE, pipe, Types } from "bitecs"

console.log("Testing bitECS serializer")

const world = createWorld()

const ArrayComponent = defineComponent({arr: [Types.ui16, 1024]})
const serializeArray = defineSerializer([ArrayComponent])
const deserializeArray = defineDeserializer([ArrayComponent])
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
  }
  catch(err) {
    console.error(err)
  }
  return world
}

const Vector2Component = defineComponent({value: [Types.f32, 2]})
const serializeVector2 = defineSerializer([Vector2Component])
const deserializeVector2 = defineDeserializer([Vector2Component])

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

const pipeline = pipe(
  testArraySerializer,
  testVector2Serializer,
  testQuerySerializer,
  testChangedSerializer
)

pipeline(world)