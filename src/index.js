import { addComponent, addEntity, Changed, createWorld, defineComponent, defineDeserializer, defineQuery, defineSerializer, defineSystem, DESERIALIZE_MODE, pipe, Types } from "bitecs"

console.log("Testing bitECS serializer")

const world = createWorld()

const ArrayComponent = defineComponent({arr: [Types.ui16, 1024]})
const serializeArray = defineSerializer([ArrayComponent])
const deserializeArray = defineDeserializer([ArrayComponent])

const eid = addEntity(world)
addComponent(world, ArrayComponent, eid)

const testArraySerializer = defineSystem(world => {
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
})

const Vector2Component = defineComponent({value: [Types.f32, 2]})
const serializeVector2 = defineSerializer([Vector2Component])
const deserializeVector2 = defineDeserializer([Vector2Component])

const eid2 = addEntity(world)
addComponent(world, Vector2Component, eid2)

const testVector2Serializer = defineSystem(world => {
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
})

const vector2Query = defineQuery([Vector2Component])
const serializeVector2FromQuery = pipe(vector2Query, serializeVector2)

const testQuerySerializer = defineSystem(world => {
  try {
    console.log("Serializing entity with Vector2 component from piped query")
    const packet = serializeVector2FromQuery(world)
    console.log(`Packet bytes: ${packet.byteLength}`)
    console.log("Deserializing packet")
    deserializeVector2(world, packet, DESERIALIZE_MODE.REPLACE)
    console.log("Deserialized packet OK!")
  }
  catch(err) {
    console.error(err)
  }
})

const serializeChangedVector2 = defineSerializer([Changed(Vector2Component)])
const deserializeChangedVector2 = defineDeserializer([Changed(Vector2Component)])

const eid3 = addEntity(world)
addComponent(world, Vector2Component, eid3)

const testChangedSerializer = defineSystem(world => {
  try {
    console.log("Serializing entity with changed Vector2 component")
    const packet = serializeChangedVector2([eid2])
    console.log(`Packet bytes: ${packet.byteLength}`)
    console.log("Deserializing packet")
    deserializeChangedVector2(world, packet, DESERIALIZE_MODE.REPLACE)
    console.log("Deserialized packet OK!")
  }
  catch(err) {
    console.error(err)
  }
})

const pipeline = pipe([
  testArraySerializer,
  testVector2Serializer,
  testQuerySerializer,
  testChangedSerializer
])

pipeline(world)