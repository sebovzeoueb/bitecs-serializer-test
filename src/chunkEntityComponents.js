import { Chunk } from "./components";
import staticEntityComponents from "./staticEntityComponents";
import creatureComponents from "./creatureComponents";

// using a Set ensures unique elements
export default [...new Set([...staticEntityComponents, ...creatureComponents, Chunk])]