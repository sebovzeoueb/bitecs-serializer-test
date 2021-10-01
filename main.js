(() => {
  // node_modules/bitecs/dist/index.mjs
  var TYPES_ENUM = {
    i8: "i8",
    ui8: "ui8",
    ui8c: "ui8c",
    i16: "i16",
    ui16: "ui16",
    i32: "i32",
    ui32: "ui32",
    f32: "f32",
    f64: "f64",
    eid: "eid"
  };
  var TYPES_NAMES = {
    i8: "Int8",
    ui8: "Uint8",
    ui8c: "Uint8Clamped",
    i16: "Int16",
    ui16: "Uint16",
    i32: "Int32",
    ui32: "Uint32",
    eid: "Uint32",
    f32: "Float32",
    f64: "Float64"
  };
  var TYPES = {
    i8: Int8Array,
    ui8: Uint8Array,
    ui8c: Uint8ClampedArray,
    i16: Int16Array,
    ui16: Uint16Array,
    i32: Int32Array,
    ui32: Uint32Array,
    f32: Float32Array,
    f64: Float64Array,
    eid: Uint32Array
  };
  var UNSIGNED_MAX = {
    uint8: 2 ** 8,
    uint16: 2 ** 16,
    uint32: 2 ** 32
  };
  var roundToMultiple = (mul) => (x) => Math.ceil(x / mul) * mul;
  var roundToMultiple4 = roundToMultiple(4);
  var $storeRef = Symbol("storeRef");
  var $storeSize = Symbol("storeSize");
  var $storeMaps = Symbol("storeMaps");
  var $storeFlattened = Symbol("storeFlattened");
  var $storeBase = Symbol("storeBase");
  var $storeType = Symbol("storeType");
  var $storeArrayCounts = Symbol("storeArrayCount");
  var $storeSubarrays = Symbol("storeSubarrays");
  var $subarrayCursors = Symbol("subarrayCursors");
  var $subarray = Symbol("subarray");
  var $subarrayFrom = Symbol("subarrayFrom");
  var $subarrayTo = Symbol("subarrayTo");
  var $parentArray = Symbol("subStore");
  var $tagStore = Symbol("tagStore");
  var $queryShadow = Symbol("queryShadow");
  var $serializeShadow = Symbol("serializeShadow");
  var $indexType = Symbol("indexType");
  var $indexBytes = Symbol("indexBytes");
  var $isEidType = Symbol("isEidType");
  var stores = {};
  var resize = (ta, size) => {
    const newBuffer = new ArrayBuffer(size * ta.BYTES_PER_ELEMENT);
    const newTa = new ta.constructor(newBuffer);
    newTa.set(ta, 0);
    return newTa;
  };
  var createShadow = (store, key) => {
    if (!ArrayBuffer.isView(store)) {
      const shadowStore = store[$parentArray].slice(0).fill(0);
      store[key] = store.map((_, eid4) => {
        const from = store[eid4][$subarrayFrom];
        const to = store[eid4][$subarrayTo];
        return shadowStore.subarray(from, to);
      });
    } else {
      store[key] = store.slice(0).fill(0);
    }
  };
  var resizeSubarray = (metadata, store, size) => {
    const cursors = metadata[$subarrayCursors];
    let type = store[$storeType];
    const length = store[0].length;
    const indexType = length <= UNSIGNED_MAX.uint8 ? TYPES_ENUM.ui8 : length <= UNSIGNED_MAX.uint16 ? TYPES_ENUM.ui16 : TYPES_ENUM.ui32;
    if (cursors[type] === 0) {
      const arrayCount = metadata[$storeArrayCounts][type];
      const summedLength = Array(arrayCount).fill(0).reduce((a, p) => a + length, 0);
      const array = new TYPES[type](roundToMultiple4(summedLength * size));
      array.set(metadata[$storeSubarrays][type]);
      metadata[$storeSubarrays][type] = array;
      array[$indexType] = TYPES_NAMES[indexType];
      array[$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT;
    }
    const start = cursors[type];
    let end = 0;
    for (let eid4 = 0; eid4 < size; eid4++) {
      const from = cursors[type] + eid4 * length;
      const to = from + length;
      store[eid4] = metadata[$storeSubarrays][type].subarray(from, to);
      store[eid4][$subarrayFrom] = from;
      store[eid4][$subarrayTo] = to;
      store[eid4][$subarray] = true;
      store[eid4][$indexType] = TYPES_NAMES[indexType];
      store[eid4][$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT;
      end = to;
    }
    cursors[type] = end;
    store[$parentArray] = metadata[$storeSubarrays][type].subarray(start, end);
  };
  var resizeRecursive = (metadata, store, size) => {
    Object.keys(store).forEach((key) => {
      const ta = store[key];
      if (Array.isArray(ta)) {
        resizeSubarray(metadata, ta, size);
        store[$storeFlattened].push(ta);
      } else if (ArrayBuffer.isView(ta)) {
        store[key] = resize(ta, size);
        store[$storeFlattened].push(store[key]);
      } else if (typeof ta === "object") {
        resizeRecursive(metadata, store[key], size);
      }
    });
  };
  var resizeStore = (store, size) => {
    if (store[$tagStore])
      return;
    store[$storeSize] = size;
    store[$storeFlattened].length = 0;
    Object.keys(store[$subarrayCursors]).forEach((k) => {
      store[$subarrayCursors][k] = 0;
    });
    resizeRecursive(store, store, size);
  };
  var resetStoreFor = (store, eid4) => {
    if (store[$storeFlattened]) {
      store[$storeFlattened].forEach((ta) => {
        if (ArrayBuffer.isView(ta))
          ta[eid4] = 0;
        else
          ta[eid4].fill(0);
      });
    }
  };
  var createTypeStore = (type, length) => {
    const totalBytes = length * TYPES[type].BYTES_PER_ELEMENT;
    const buffer = new ArrayBuffer(totalBytes);
    const store = new TYPES[type](buffer);
    store[$isEidType] = type === TYPES_ENUM.eid;
    return store;
  };
  var createArrayStore = (metadata, type, length) => {
    const size = metadata[$storeSize];
    const store = Array(size).fill(0);
    store[$storeType] = type;
    store[$isEidType] = type === TYPES_ENUM.eid;
    const cursors = metadata[$subarrayCursors];
    const indexType = length <= UNSIGNED_MAX.uint8 ? TYPES_ENUM.ui8 : length <= UNSIGNED_MAX.uint16 ? TYPES_ENUM.ui16 : TYPES_ENUM.ui32;
    if (!length)
      throw new Error("bitECS - Must define component array length");
    if (!TYPES[type])
      throw new Error(`bitECS - Invalid component array property type ${type}`);
    if (!metadata[$storeSubarrays][type]) {
      const arrayCount = metadata[$storeArrayCounts][type];
      const summedLength = Array(arrayCount).fill(0).reduce((a, p) => a + length, 0);
      const array = new TYPES[type](roundToMultiple4(summedLength * size));
      metadata[$storeSubarrays][type] = array;
      array[$indexType] = TYPES_NAMES[indexType];
      array[$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT;
    }
    const start = cursors[type];
    let end = 0;
    for (let eid4 = 0; eid4 < size; eid4++) {
      const from = cursors[type] + eid4 * length;
      const to = from + length;
      store[eid4] = metadata[$storeSubarrays][type].subarray(from, to);
      store[eid4][$subarrayFrom] = from;
      store[eid4][$subarrayTo] = to;
      store[eid4][$subarray] = true;
      store[eid4][$indexType] = TYPES_NAMES[indexType];
      store[eid4][$indexBytes] = TYPES[indexType].BYTES_PER_ELEMENT;
      end = to;
    }
    cursors[type] = end;
    store[$parentArray] = metadata[$storeSubarrays][type].subarray(start, end);
    return store;
  };
  var isArrayType = (x) => Array.isArray(x) && typeof x[0] === "string" && typeof x[1] === "number";
  var createStore = (schema, size) => {
    const $store = Symbol("store");
    if (!schema || !Object.keys(schema).length) {
      stores[$store] = {
        [$storeSize]: size,
        [$tagStore]: true,
        [$storeBase]: () => stores[$store]
      };
      return stores[$store];
    }
    schema = JSON.parse(JSON.stringify(schema));
    const arrayCounts = {};
    const collectArrayCounts = (s) => {
      const keys = Object.keys(s);
      for (const k of keys) {
        if (isArrayType(s[k])) {
          if (!arrayCounts[s[k][0]])
            arrayCounts[s[k][0]] = 0;
          arrayCounts[s[k][0]]++;
        } else if (s[k] instanceof Object) {
          collectArrayCounts(s[k]);
        }
      }
    };
    collectArrayCounts(schema);
    const metadata = {
      [$storeSize]: size,
      [$storeMaps]: {},
      [$storeSubarrays]: {},
      [$storeRef]: $store,
      [$subarrayCursors]: Object.keys(TYPES).reduce((a, type) => ({ ...a, [type]: 0 }), {}),
      [$storeFlattened]: [],
      [$storeArrayCounts]: arrayCounts
    };
    if (schema instanceof Object && Object.keys(schema).length) {
      const recursiveTransform = (a, k) => {
        if (typeof a[k] === "string") {
          a[k] = createTypeStore(a[k], size);
          a[k][$storeBase] = () => stores[$store];
          metadata[$storeFlattened].push(a[k]);
        } else if (isArrayType(a[k])) {
          const [type, length] = a[k];
          a[k] = createArrayStore(metadata, type, length);
          a[k][$storeBase] = () => stores[$store];
          metadata[$storeFlattened].push(a[k]);
        } else if (a[k] instanceof Object) {
          a[k] = Object.keys(a[k]).reduce(recursiveTransform, a[k]);
        }
        return a;
      };
      stores[$store] = Object.assign(Object.keys(schema).reduce(recursiveTransform, schema), metadata);
      stores[$store][$storeBase] = () => stores[$store];
      return stores[$store];
    }
  };
  var SparseSet = () => {
    const dense = [];
    const sparse = [];
    dense.sort = function(comparator) {
      const result = Array.prototype.sort.call(this, comparator);
      for (let i = 0; i < dense.length; i++) {
        sparse[dense[i]] = i;
      }
      return result;
    };
    const has = (val) => dense[sparse[val]] === val;
    const add = (val) => {
      if (has(val))
        return;
      sparse[val] = dense.push(val) - 1;
    };
    const remove = (val) => {
      if (!has(val))
        return;
      const index = sparse[val];
      const swapped = dense.pop();
      if (swapped !== val) {
        dense[index] = swapped;
        sparse[swapped] = index;
      }
    };
    return {
      add,
      remove,
      has,
      sparse,
      dense
    };
  };
  var DESERIALIZE_MODE = {
    REPLACE: 0,
    APPEND: 1,
    MAP: 2
  };
  var resized = false;
  var setSerializationResized = (v) => {
    resized = v;
  };
  var canonicalize = (target) => {
    let componentProps = [];
    let changedProps = new Map();
    if (Array.isArray(target)) {
      componentProps = target.map((p) => {
        if (!p)
          throw new Error("bitECS - Cannot serialize undefined component");
        if (typeof p === "function") {
          const [c, mod] = p();
          if (mod === "changed") {
            c[$storeFlattened].forEach((prop) => {
              const $ = Symbol();
              createShadow(prop, $);
              changedProps.set(prop, $);
            });
            return c[$storeFlattened];
          }
        }
        if (Object.getOwnPropertySymbols(p).includes($storeFlattened)) {
          return p[$storeFlattened];
        }
        if (Object.getOwnPropertySymbols(p).includes($storeBase)) {
          return p;
        }
      }).reduce((a, v) => a.concat(v), []);
    }
    return [componentProps, changedProps];
  };
  var defineSerializer = (target, maxBytes = 2e7) => {
    const isWorld = Object.getOwnPropertySymbols(target).includes($componentMap);
    let [componentProps, changedProps] = canonicalize(target);
    const buffer = new ArrayBuffer(maxBytes);
    const view = new DataView(buffer);
    return (ents) => {
      if (resized) {
        [componentProps, changedProps] = canonicalize(target);
        resized = false;
      }
      if (isWorld) {
        componentProps = [];
        target[$componentMap].forEach((c, component) => {
          if (component[$storeFlattened])
            componentProps.push(...component[$storeFlattened]);
          else
            componentProps.push(component);
        });
      }
      let world2;
      if (Object.getOwnPropertySymbols(ents).includes($componentMap)) {
        world2 = ents;
        ents = ents[$entityArray];
      } else {
        world2 = eidToWorld.get(ents[0]);
      }
      if (!ents.length)
        return;
      let where = 0;
      for (let pid = 0; pid < componentProps.length; pid++) {
        const prop = componentProps[pid];
        const $diff = changedProps.get(prop);
        view.setUint8(where, pid);
        where += 1;
        const countWhere = where;
        where += 4;
        let count = 0;
        for (let i = 0; i < ents.length; i++) {
          const eid4 = ents[i];
          if (!hasComponent(world2, prop[$storeBase](), eid4)) {
            continue;
          }
          view.setUint32(where, eid4);
          where += 4;
          if (prop[$tagStore]) {
            continue;
          }
          if (ArrayBuffer.isView(prop[eid4])) {
            const type = prop[eid4].constructor.name.replace("Array", "");
            const indexType = prop[eid4][$indexType];
            const indexBytes = prop[eid4][$indexBytes];
            const countWhere2 = where;
            where += indexBytes;
            let count2 = 0;
            for (let i2 = 0; i2 < prop[eid4].length; i2++) {
              const value = prop[eid4][i2];
              if ($diff && prop[eid4][i2] === prop[$diff][eid4][i2]) {
                continue;
              }
              view[`set${indexType}`](where, i2);
              where += indexBytes;
              view[`set${type}`](where, value);
              where += prop[eid4].BYTES_PER_ELEMENT;
              count2++;
            }
            if (count2 > 0) {
              view[`set${indexType}`](countWhere2, count2);
              count++;
            }
          } else {
            if ($diff && prop[$diff][eid4] !== prop[eid4]) {
              continue;
            }
            const type = prop.constructor.name.replace("Array", "");
            view[`set${type}`](where, prop[eid4]);
            where += prop.BYTES_PER_ELEMENT;
            if (prop[$diff])
              prop[$diff][eid4] = prop[eid4];
            count++;
          }
        }
        if (count > 0) {
          view.setUint32(countWhere, count);
        } else {
          where -= 5;
        }
      }
      return buffer.slice(0, where);
    };
  };
  var newEntities = new Map();
  var defineDeserializer = (target) => {
    const isWorld = Object.getOwnPropertySymbols(target).includes($componentMap);
    let [componentProps] = canonicalize(target);
    return (world2, packet, mode = 0) => {
      newEntities.clear();
      if (resized) {
        [componentProps] = canonicalize(target);
        resized = false;
      }
      if (isWorld) {
        componentProps = [];
        target[$componentMap].forEach((c, component) => {
          if (component[$storeFlattened])
            componentProps.push(...component[$storeFlattened]);
          else
            componentProps.push(component);
        });
      }
      const localEntities = world2[$localEntities];
      const localEntityLookup = world2[$localEntityLookup];
      const view = new DataView(packet);
      let where = 0;
      while (where < packet.byteLength) {
        const pid = view.getUint8(where);
        where += 1;
        const entityCount = view.getUint32(where);
        where += 4;
        const prop = componentProps[pid];
        for (let i = 0; i < entityCount; i++) {
          let eid4 = view.getUint32(where);
          where += 4;
          if (mode === DESERIALIZE_MODE.MAP) {
            if (localEntities.has(eid4)) {
              eid4 = localEntities.get(eid4);
            } else if (newEntities.has(eid4)) {
              eid4 = newEntities.get(eid4);
            } else {
              const newEid = addEntity(world2);
              localEntities.set(eid4, newEid);
              localEntityLookup.set(newEid, eid4);
              newEntities.set(eid4, newEid);
              eid4 = newEid;
            }
          }
          if (mode === DESERIALIZE_MODE.APPEND || mode === DESERIALIZE_MODE.REPLACE && !world2[$entitySparseSet].has(eid4)) {
            const newEid = newEntities.get(eid4) || addEntity(world2);
            newEntities.set(eid4, newEid);
            eid4 = newEid;
          }
          const component = prop[$storeBase]();
          if (!hasComponent(world2, component, eid4)) {
            addComponent(world2, component, eid4);
          }
          if (component[$tagStore]) {
            continue;
          }
          if (ArrayBuffer.isView(prop[eid4])) {
            const array = prop[eid4];
            const count = view[`get${array[$indexType]}`](where);
            where += array[$indexBytes];
            for (let i2 = 0; i2 < count; i2++) {
              const index = view[`get${array[$indexType]}`](where);
              where += array[$indexBytes];
              const value = view[`get${array.constructor.name.replace("Array", "")}`](where);
              where += array.BYTES_PER_ELEMENT;
              if (prop[$isEidType]) {
                let localEid = localEntities.get(value);
                if (!world2[$entitySparseSet].has(localEid))
                  localEid = addEntity(world2);
                prop[eid4][index] = localEid;
              } else
                prop[eid4][index] = value;
            }
          } else {
            const value = view[`get${prop.constructor.name.replace("Array", "")}`](where);
            where += prop.BYTES_PER_ELEMENT;
            if (prop[$isEidType]) {
              let localEid = localEntities.get(value);
              if (!world2[$entitySparseSet].has(localEid))
                localEid = addEntity(world2);
              prop[eid4] = localEid;
            } else
              prop[eid4] = value;
          }
        }
      }
    };
  };
  var $entityMasks = Symbol("entityMasks");
  var $entityComponents = Symbol("entityComponents");
  var $entitySparseSet = Symbol("entitySparseSet");
  var $entityArray = Symbol("entityArray");
  var $entityIndices = Symbol("entityIndices");
  var $removedEntities = Symbol("removedEntities");
  var defaultSize = 1e5;
  var globalEntityCursor = 0;
  var globalSize = defaultSize;
  var resizeThreshold = () => globalSize - globalSize / 5;
  var getGlobalSize = () => globalSize;
  var removed = [];
  var getEntityCursor = () => globalEntityCursor;
  var eidToWorld = new Map();
  var addEntity = (world2) => {
    if (globalEntityCursor >= resizeThreshold()) {
      const size = globalSize;
      const amount = Math.ceil(size / 2 / 4) * 4;
      const newSize = size + amount;
      globalSize = newSize;
      resizeWorlds(newSize);
      resizeComponents(newSize);
      setSerializationResized(true);
      console.info(`\u{1F47E} bitECS - resizing all data stores from ${size} to ${size + amount}`);
    }
    const eid4 = removed.length > 0 ? removed.shift() : globalEntityCursor++;
    world2[$entitySparseSet].add(eid4);
    eidToWorld.set(eid4, world2);
    world2[$notQueries].forEach((q) => {
      const match = queryCheckEntity(world2, q, eid4);
      if (match)
        queryAddEntity(q, eid4);
    });
    world2[$entityComponents].set(eid4, new Set());
    return eid4;
  };
  var removeEntity = (world2, eid4) => {
    if (!world2[$entitySparseSet].has(eid4))
      return;
    world2[$queries].forEach((q) => {
      queryRemoveEntity(world2, q, eid4);
    });
    removed.push(eid4);
    world2[$entitySparseSet].remove(eid4);
    world2[$entityComponents].delete(eid4);
    world2[$localEntities].delete(world2[$localEntityLookup].get(eid4));
    world2[$localEntityLookup].delete(eid4);
    for (let i = 0; i < world2[$entityMasks].length; i++)
      world2[$entityMasks][i][eid4] = 0;
  };
  function Changed(c) {
    return () => [c, "changed"];
  }
  function Any(...comps) {
    return function QueryAny() {
      return comps;
    };
  }
  function All(...comps) {
    return function QueryAll() {
      return comps;
    };
  }
  function None(...comps) {
    return function QueryNone() {
      return comps;
    };
  }
  var $queries = Symbol("queries");
  var $notQueries = Symbol("notQueries");
  var $queryAny = Symbol("queryAny");
  var $queryAll = Symbol("queryAll");
  var $queryNone = Symbol("queryNone");
  var $queryMap = Symbol("queryMap");
  var $dirtyQueries = Symbol("$dirtyQueries");
  var $queryComponents = Symbol("queryComponents");
  var $enterQuery = Symbol("enterQuery");
  var $exitQuery = Symbol("exitQuery");
  var registerQuery = (world2, query) => {
    const components2 = [];
    const notComponents = [];
    const changedComponents = [];
    query[$queryComponents].forEach((c) => {
      if (typeof c === "function") {
        const [comp, mod] = c();
        if (!world2[$componentMap].has(comp))
          registerComponent(world2, comp);
        if (mod === "not") {
          notComponents.push(comp);
        }
        if (mod === "changed") {
          changedComponents.push(comp);
          components2.push(comp);
        }
      } else {
        if (!world2[$componentMap].has(c))
          registerComponent(world2, c);
        components2.push(c);
      }
    });
    const mapComponents = (c) => world2[$componentMap].get(c);
    const allComponents = components2.concat(notComponents).map(mapComponents);
    const sparseSet = SparseSet();
    const archetypes = [];
    const changed = [];
    const toRemove = SparseSet();
    const entered = [];
    const exited = [];
    const generations = allComponents.map((c) => c.generationId).reduce((a, v) => {
      if (a.includes(v))
        return a;
      a.push(v);
      return a;
    }, []);
    const reduceBitflags = (a, c) => {
      if (!a[c.generationId])
        a[c.generationId] = 0;
      a[c.generationId] |= c.bitflag;
      return a;
    };
    const masks = components2.map(mapComponents).reduce(reduceBitflags, {});
    const notMasks = notComponents.map(mapComponents).reduce(reduceBitflags, {});
    const hasMasks = allComponents.reduce(reduceBitflags, {});
    const flatProps = components2.filter((c) => !c[$tagStore]).map((c) => Object.getOwnPropertySymbols(c).includes($storeFlattened) ? c[$storeFlattened] : [c]).reduce((a, v) => a.concat(v), []);
    const shadows = flatProps.map((prop) => {
      const $ = Symbol();
      createShadow(prop, $);
      return prop[$];
    }, []);
    const q = Object.assign(sparseSet, {
      archetypes,
      changed,
      components: components2,
      notComponents,
      changedComponents,
      allComponents,
      masks,
      notMasks,
      hasMasks,
      generations,
      flatProps,
      toRemove,
      entered,
      exited,
      shadows
    });
    world2[$queryMap].set(query, q);
    world2[$queries].add(q);
    allComponents.forEach((c) => {
      c.queries.add(q);
    });
    if (notComponents.length)
      world2[$notQueries].add(q);
    for (let eid4 = 0; eid4 < getEntityCursor(); eid4++) {
      if (!world2[$entitySparseSet].has(eid4))
        continue;
      const match = queryCheckEntity(world2, q, eid4);
      if (match)
        queryAddEntity(q, eid4);
    }
  };
  var diff = (q, clearDiff) => {
    if (clearDiff)
      q.changed = [];
    const { flatProps, shadows } = q;
    for (let i = 0; i < q.dense.length; i++) {
      const eid4 = q.dense[i];
      let dirty = false;
      for (let pid = 0; pid < flatProps.length; pid++) {
        const prop = flatProps[pid];
        const shadow = shadows[pid];
        if (ArrayBuffer.isView(prop[eid4])) {
          for (let i2 = 0; i2 < prop[eid4].length; i2++) {
            if (prop[eid4][i2] !== shadow[eid4][i2]) {
              dirty = true;
              shadow[eid4][i2] = prop[eid4][i2];
              break;
            }
          }
        } else {
          if (prop[eid4] !== shadow[eid4]) {
            dirty = true;
            shadow[eid4] = prop[eid4];
          }
        }
      }
      if (dirty)
        q.changed.push(eid4);
    }
    return q.changed;
  };
  var flatten = (a, v) => a.concat(v);
  var aggregateComponentsFor = (mod) => (x) => x.filter((f) => f.name === mod().constructor.name).reduce(flatten);
  var getAnyComponents = aggregateComponentsFor(Any);
  var getAllComponents = aggregateComponentsFor(All);
  var getNoneComponents = aggregateComponentsFor(None);
  var defineQuery = (...args) => {
    let components2;
    let any, all, none;
    if (Array.isArray(args[0])) {
      components2 = args[0];
    } else {
      any = getAnyComponents(args);
      all = getAllComponents(args);
      none = getNoneComponents(args);
    }
    if (components2 === void 0 || components2[$componentMap] !== void 0) {
      return (world2) => world2 ? world2[$entityArray] : components2[$entityArray];
    }
    const query = function(world2, clearDiff = true) {
      if (!world2[$queryMap].has(query))
        registerQuery(world2, query);
      const q = world2[$queryMap].get(query);
      commitRemovals(world2);
      if (q.changedComponents.length)
        return diff(q, clearDiff);
      return q.dense;
    };
    query[$queryComponents] = components2;
    query[$queryAny] = any;
    query[$queryAll] = all;
    query[$queryNone] = none;
    return query;
  };
  var queryCheckEntity = (world2, q, eid4) => {
    const { masks, notMasks, generations } = q;
    let or = 0;
    for (let i = 0; i < generations.length; i++) {
      const generationId = generations[i];
      const qMask = masks[generationId];
      const qNotMask = notMasks[generationId];
      const eMask = world2[$entityMasks][generationId][eid4];
      if (qNotMask && (eMask & qNotMask) !== 0) {
        return false;
      }
      if (qMask && (eMask & qMask) !== qMask) {
        return false;
      }
    }
    return true;
  };
  var queryAddEntity = (q, eid4) => {
    if (q.has(eid4))
      return;
    q.add(eid4);
    q.entered.push(eid4);
  };
  var queryCommitRemovals = (q) => {
    for (let i = q.toRemove.dense.length - 1; i >= 0; i--) {
      const eid4 = q.toRemove.dense[i];
      q.toRemove.remove(eid4);
      q.remove(eid4);
    }
  };
  var commitRemovals = (world2) => {
    if (!world2[$dirtyQueries].size)
      return;
    world2[$dirtyQueries].forEach(queryCommitRemovals);
    world2[$dirtyQueries].clear();
  };
  var queryRemoveEntity = (world2, q, eid4) => {
    if (!q.has(eid4) || q.toRemove.has(eid4))
      return;
    q.toRemove.add(eid4);
    world2[$dirtyQueries].add(q);
    q.exited.push(eid4);
  };
  var $componentMap = Symbol("componentMap");
  var components = [];
  var resizeComponents = (size) => {
    components.forEach((component) => resizeStore(component, size));
  };
  var defineComponent = (schema) => {
    const component = createStore(schema, getGlobalSize());
    if (schema && Object.keys(schema).length)
      components.push(component);
    return component;
  };
  var incrementBitflag = (world2) => {
    world2[$bitflag] *= 2;
    if (world2[$bitflag] >= 2 ** 31) {
      world2[$bitflag] = 1;
      world2[$entityMasks].push(new Uint32Array(world2[$size]));
    }
  };
  var registerComponent = (world2, component) => {
    if (!component)
      throw new Error(`bitECS - Cannot register null or undefined component`);
    const queries = new Set();
    const notQueries = new Set();
    const changedQueries = new Set();
    world2[$queries].forEach((q) => {
      if (q.allComponents.includes(component)) {
        queries.add(q);
      }
    });
    world2[$componentMap].set(component, {
      generationId: world2[$entityMasks].length - 1,
      bitflag: world2[$bitflag],
      store: component,
      queries,
      notQueries,
      changedQueries
    });
    if (component[$storeSize] < getGlobalSize()) {
      resizeStore(component, getGlobalSize());
    }
    incrementBitflag(world2);
  };
  var hasComponent = (world2, component, eid4) => {
    const registeredComponent = world2[$componentMap].get(component);
    if (!registeredComponent)
      return false;
    const { generationId, bitflag } = registeredComponent;
    const mask = world2[$entityMasks][generationId][eid4];
    return (mask & bitflag) === bitflag;
  };
  var addComponent = (world2, component, eid4, reset = true) => {
    if (eid4 === void 0)
      throw new Error("bitECS - entity is undefined.");
    if (!world2[$entitySparseSet].has(eid4))
      throw new Error("bitECS - entity does not exist in the world.");
    if (!world2[$componentMap].has(component))
      registerComponent(world2, component);
    if (hasComponent(world2, component, eid4))
      return;
    const c = world2[$componentMap].get(component);
    const { generationId, bitflag, queries, notQueries } = c;
    world2[$entityMasks][generationId][eid4] |= bitflag;
    queries.forEach((q) => {
      if (q.toRemove.has(eid4))
        q.toRemove.remove(eid4);
      const match = queryCheckEntity(world2, q, eid4);
      if (match)
        queryAddEntity(q, eid4);
      if (!match)
        queryRemoveEntity(world2, q, eid4);
    });
    world2[$entityComponents].get(eid4).add(component);
    if (reset)
      resetStoreFor(component, eid4);
  };
  var $size = Symbol("size");
  var $resizeThreshold = Symbol("resizeThreshold");
  var $bitflag = Symbol("bitflag");
  var $archetypes = Symbol("archetypes");
  var $localEntities = Symbol("localEntities");
  var $localEntityLookup = Symbol("localEntityLookp");
  var worlds = [];
  var resizeWorlds = (size) => {
    worlds.forEach((world2) => {
      world2[$size] = size;
      for (let i = 0; i < world2[$entityMasks].length; i++) {
        const masks = world2[$entityMasks][i];
        world2[$entityMasks][i] = resize(masks, size);
      }
      world2[$resizeThreshold] = world2[$size] - world2[$size] / 5;
    });
  };
  var createWorld = (obj = {}) => {
    const world2 = obj;
    resetWorld(world2);
    worlds.push(world2);
    return world2;
  };
  var resetWorld = (world2) => {
    const size = getGlobalSize();
    world2[$size] = size;
    if (world2[$entityArray])
      world2[$entityArray].forEach((eid4) => removeEntity(world2, eid4));
    world2[$entityMasks] = [new Uint32Array(size)];
    world2[$entityComponents] = new Map();
    world2[$archetypes] = [];
    world2[$entitySparseSet] = SparseSet();
    world2[$entityArray] = world2[$entitySparseSet].dense;
    world2[$bitflag] = 1;
    world2[$componentMap] = new Map();
    world2[$queryMap] = new Map();
    world2[$queries] = new Set();
    world2[$notQueries] = new Set();
    world2[$dirtyQueries] = new Set();
    world2[$localEntities] = new Map();
    world2[$localEntityLookup] = new Map();
    return world2;
  };
  var pipe = (...fns) => (input) => {
    let tmp = input;
    for (let i = 0; i < fns.length; i++) {
      const fn = fns[i];
      tmp = fn(tmp);
    }
    return tmp;
  };
  var Types = TYPES_ENUM;

  // src/baseTypes.js
  var Vector2 = { value: [Types.f32, 2] };
  var Rect = { x: Types.f32, y: Types.f32, width: Types.f32, height: Types.f32 };

  // src/components.js
  var Position = defineComponent(Vector2);
  var Direction = defineComponent(Vector2);
  var Velocity = defineComponent(Vector2);
  var Speed = defineComponent({ value: Types.f32 });
  var EntityData = defineComponent({ dataID: Types.ui16, category: Types.ui8, variant: Types.ui8 });
  var Hitbox = defineComponent(Rect);
  var Movement = defineComponent({ maxSpeed: Types.f32 });
  var Action = defineComponent({
    type: Types.ui8,
    item: Types.ui16,
    start: Types.ui32,
    duration: Types.ui32,
    trigger: Types.f32,
    target: [Types.f32, 2]
  });
  var PerformingAction = defineComponent();
  var Chunk = defineComponent({ terrain: [Types.ui16, 1024] });
  var Loading = defineComponent();
  var TargetPosition = defineComponent(Vector2);
  var TilePosition = defineComponent({ x: Types.i32, y: Types.i32 });
  var StaticEntity = defineComponent();
  var Door = defineComponent({ locked: Types.ui8 });
  var Collider = defineComponent();
  var PlayerCharacter = defineComponent();
  var Authority = defineComponent();
  var Inventory = defineComponent({
    items: [Types.ui16, 30],
    amounts: [Types.ui16, 30]
  });
  var Equipped = defineComponent({ slot: Types.i8 });
  var Holding = defineComponent({ item: Types.ui16 });
  var Destroy = defineComponent();
  var Hitpoints = defineComponent({ current: Types.f32, maximum: Types.f32 });

  // src/staticEntityComponents.js
  var staticEntityComponents_default = [Position, EntityData, StaticEntity, Door, Collider, Chunk];

  // src/creatureComponents.js
  var creatureComponents_default = [Position, Direction, Velocity, Movement, EntityData, Hitbox, TargetPosition, Speed, Holding];

  // src/chunkEntityComponents.js
  var chunkEntityComponents_default = [...new Set([...staticEntityComponents_default, ...creatureComponents_default, Chunk])];

  // src/index.js
  console.log("Testing bitECS serializer");
  var world = createWorld();
  var ArrayComponent = defineComponent({ arr: [Types.ui16, 1024] });
  var serializeArray = defineSerializer([ArrayComponent]);
  var deserializeArray = defineDeserializer([ArrayComponent]);
  var Vector2Component = defineComponent({ value: [Types.f32, 2] });
  var serializeVector2 = defineSerializer([Vector2Component]);
  var deserializeVector2 = defineDeserializer([Vector2Component]);
  var EntityData2 = defineComponent({ dataID: Types.ui16, category: Types.ui8, variant: Types.ui8 });
  var TagComponent = defineComponent();
  var serializeAll = defineSerializer([ArrayComponent, Vector2Component, EntityData2, TagComponent]);
  var deserializeAll = defineDeserializer([ArrayComponent, Vector2Component, EntityData2, TagComponent]);
  var eid = addEntity(world);
  addComponent(world, ArrayComponent, eid);
  var testArraySerializer = (world2) => {
    try {
      console.log("Serializing entity with array component");
      const packet = serializeArray([eid]);
      console.log(`Packet bytes: ${packet.byteLength}`);
      console.log("Deserializing packet");
      deserializeArray(world2, packet, DESERIALIZE_MODE.REPLACE);
      console.log("Deserialized packet OK!");
      console.log("Creating multiple entities with all components");
      const eids = [eid];
      for (let i = 0; i < 10; i++) {
        const eid4 = addEntity(world2);
        addComponent(world2, ArrayComponent, eid4);
        addComponent(world2, EntityData2, eid4);
        addComponent(world2, TagComponent, eid4);
        ArrayComponent.arr[eid4][5] = 3;
        EntityData2.category[eid4] = 2;
        EntityData2.dataID[eid4] = 3;
        EntityData2.variant[eid4] = 1;
        eids.push(eid4);
      }
      for (let i = 0; i < 10; i++) {
        const eid4 = addEntity(world2);
        addComponent(world2, Vector2Component, eid4);
        addComponent(world2, EntityData2, eid4);
        Vector2Component.value[eid4][1] = 0.8;
        EntityData2.category[eid4] = 6;
        EntityData2.dataID[eid4] = 7;
        EntityData2.variant[eid4] = 3;
        eids.push(eid4);
      }
      for (let i = 0; i < 10; i++) {
        const eid4 = addEntity(world2);
        addComponent(world2, Vector2Component, eid4);
        addComponent(world2, ArrayComponent, eid4);
        addComponent(world2, EntityData2, eid4);
        Vector2Component.value[eid4][0] = 0.3;
        ArrayComponent.arr[eid4][4] = 6;
        ArrayComponent.arr[eid4][5] = 8;
        EntityData2.category[eid4] = 19;
        EntityData2.dataID[eid4] = 3;
        EntityData2.variant[eid4] = 4;
        eids.push(eid4);
      }
      console.log("Serializing multiple entities with all components again");
      const packet2 = serializeAll(eids);
      console.log(`Packet bytes: ${packet2.byteLength}`);
      deserializeAll(world2, packet2, DESERIALIZE_MODE.REPLACE);
      console.log("Deserialized packet OK!");
      eids.length = 0;
      eids.push[eid];
      for (let i = 0; i < 10; i++) {
        const eid4 = addEntity(world2);
        addComponent(world2, ArrayComponent, eid4);
        addComponent(world2, EntityData2, eid4);
        ArrayComponent.arr[eid4][5] = 3;
        ArrayComponent.arr[eid4][2] = 1;
        EntityData2.category[eid4] = 2;
        EntityData2.dataID[eid4] = 3;
        EntityData2.variant[eid4] = 1;
        eids.push(eid4);
      }
      for (let i = 0; i < 10; i++) {
        const eid4 = addEntity(world2);
        addComponent(world2, Vector2Component, eid4);
        addComponent(world2, EntityData2, eid4);
        Vector2Component.value[eid4][1] = 0.8;
        Vector2Component.value[eid4][0] = -0.5;
        EntityData2.category[eid4] = 6;
        EntityData2.dataID[eid4] = 7;
        EntityData2.variant[eid4] = 3;
        eids.push(eid4);
      }
      for (let i = 0; i < 10; i++) {
        const eid4 = addEntity(world2);
        addComponent(world2, Vector2Component, eid4);
        addComponent(world2, ArrayComponent, eid4);
        addComponent(world2, EntityData2, eid4);
        Vector2Component.value[eid4][0] = 0.3;
        ArrayComponent.arr[eid4][4] = 6;
        ArrayComponent.arr[eid4][5] = 8;
        EntityData2.category[eid4] = 19;
        EntityData2.dataID[eid4] = 3;
        EntityData2.variant[eid4] = 4;
        eids.push(eid4);
      }
      console.log("Serializing multiple entities with all components again");
      const packet3 = serializeAll(eids);
      console.log(`Packet bytes: ${packet3.byteLength}`);
      deserializeAll(world2, packet3, DESERIALIZE_MODE.REPLACE);
      console.log("Deserialized packet OK!");
    } catch (err) {
      console.error(err);
    }
    return world2;
  };
  var eid2 = addEntity(world);
  addComponent(world, Vector2Component, eid2);
  var testVector2Serializer = (world2) => {
    try {
      console.log("Serializing entity with Vector2 component");
      const packet = serializeVector2([eid2]);
      console.log(`Packet bytes: ${packet.byteLength}`);
      console.log("Deserializing packet");
      deserializeVector2(world2, packet, DESERIALIZE_MODE.REPLACE);
      console.log("Deserialized packet OK!");
    } catch (err) {
      console.error(err);
    }
    return world2;
  };
  var vector2Query = defineQuery([Vector2Component]);
  var serializeVector2FromQuery = pipe(vector2Query, serializeVector2);
  var testQuerySerializer = (world2) => {
    try {
      console.log("Serializing entity with Vector2 component from piped query");
      console.log(`${vector2Query(world2).length} entities in query`);
      const packet = serializeVector2FromQuery(world2);
      if (!packet)
        return console.error("NULL Packet");
      else
        console.log(`Packet bytes: ${packet.byteLength}`);
      console.log("Deserializing packet");
      deserializeVector2(world2, packet, DESERIALIZE_MODE.REPLACE);
      console.log("Deserialized packet OK!");
    } catch (err) {
      console.error(err);
    }
    return world2;
  };
  var serializeChangedVector2 = defineSerializer([Changed(Vector2Component)]);
  var deserializeChangedVector2 = defineDeserializer([Changed(Vector2Component)]);
  var serializeChangedArray = defineSerializer([Changed(ArrayComponent)]);
  var eid3 = addEntity(world);
  addComponent(world, Vector2Component, eid3);
  addComponent(world, ArrayComponent, eid3);
  var testChangedSerializer = (world2) => {
    try {
      console.log("Serializing entity with changed Vector2 component");
      const packet = serializeChangedVector2([eid3]);
      console.log(`Packet bytes: ${packet.byteLength}`);
      console.log("Deserializing packet");
      deserializeChangedVector2(world2, packet, DESERIALIZE_MODE.REPLACE);
      console.log("Deserialized packet OK!");
      console.log("Serializing entity after no value change");
      const packet2 = serializeChangedVector2([eid3]);
      console.log(`Packet bytes: ${packet2.byteLength} (expected 0)`);
      console.log("Changing component value");
      Vector2Component.value[eid3][0] = 5;
      console.log("Serializing entity after value change");
      const packet3 = serializeChangedVector2([eid3]);
      console.log(`Packet bytes: ${packet3.byteLength}`);
      console.log("Serializing entity with changed array component");
      const packet4 = serializeChangedArray([eid3]);
      console.log(`Packet bytes: ${packet4.byteLength}`);
      console.log("Serializing entity after no value change");
      const packet5 = serializeChangedArray([eid3]);
      console.log(`Packet bytes: ${packet5.byteLength} (expected 0)`);
      console.log("Changing component value");
      ArrayComponent.arr[eid3][6] = 5;
      console.log("Serializing entity after value change");
      const packet6 = serializeChangedArray([eid3]);
      console.log(`Packet bytes: ${packet6.byteLength}`);
    } catch (err) {
      console.error(err);
    }
    return world2;
  };
  var actualComponentSerializer = defineSerializer(chunkEntityComponents_default);
  var actualComponentDeserializer = defineDeserializer(chunkEntityComponents_default);
  var testActualComponents = (world2) => {
    try {
      console.log("Creating chunk entities using actual components from game");
      const chunkEID = addEntity(world2);
      addComponent(world2, Chunk, chunkEID);
      addComponent(world2, Position, chunkEID);
      const eids = [chunkEID];
      for (let i = 0; i < 50; i++) {
        const eid4 = addEntity(world2);
        addComponent(world2, Position, eid4);
        addComponent(world2, EntityData2, eid4);
        addComponent(world2, StaticEntity, eid4);
        addComponent(world2, Hitpoints, eid4);
        if (Math.random() < 0.5)
          addComponent(world2, Collider, eid4);
        if (Math.random() < 0.5)
          addComponent(world2, Door, eid4);
        eids.push(eid4);
      }
      console.log("Serializing chunk entities");
      const packet = actualComponentSerializer(eids);
      console.log(`Packet bytes: ${packet.byteLength}`);
      actualComponentDeserializer(world2, packet);
      console.log("Deserialization OK!");
    } catch (err) {
      console.error(err);
    }
    return world2;
  };
  var pipeline = pipe(testArraySerializer, testVector2Serializer, testQuerySerializer, testChangedSerializer, testActualComponents);
  pipeline(world);
})();
//# sourceMappingURL=main.js.map
