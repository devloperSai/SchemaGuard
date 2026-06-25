const SEVERITY = {
  CRITICAL: "critical", // field removed — breaking
  HIGH: "high", // field type changed — breaking
  LOW: "low", // field added — informational
};

const flattenSchema = (schema, prefix = "") => {
  const fields = {};
  if (typeof schema !== "object" || schema === null) {
    fields[prefix] = schema;
    return fields;
  }
  if (schema._type === "array") {
    fields[prefix] = "array";
    Object.assign(fields, flattenSchema(schema._items, `${prefix}[]`));
    return fields;
  }
  for (const [key, value] of Object.entries(schema)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !value._type) {
      Object.assign(fields, flattenSchema(value, fullKey));
    } else {
      fields[fullKey] = value;
    }
  }
  return fields;
};

const diffSchemas = (baselineSchema, currentSchema) => {
  const baselineFlat = flattenSchema(baselineSchema);
  const currentFlat = flattenSchema(currentSchema);

  const addedFields = [];
  const removedFields = [];
  const typeChangedFields = [];

  const baselineKeys = new Set(Object.keys(baselineFlat));
  const currentKeys = new Set(Object.keys(currentFlat));

  for (const key of baselineKeys) {
    if (!currentKeys.has(key)) {
      removedFields.push({
        field: key,
        baselineType: baselineFlat[key],
        severity: SEVERITY.CRITICAL,
      });
    }
  }
  for (const key of currentKeys) {
    if (!baselineKeys.has(key)) {
      addedFields.push({
        field: key,
        liveType: currentFlat[key],
        severity: SEVERITY.LOW,
      });
    }
  }
  for (const key of baselineKeys) {
    if (currentKeys.has(key)) {
      const baseType = JSON.stringify(baselineFlat[key]);
      const currType = JSON.stringify(currentFlat[key]);
      if (baseType !== currType) {
        typeChangedFields.push({
          field: key,
          baselineType: baselineFlat[key],
          liveType: currentFlat[key],
          severity: SEVERITY.HIGH,
        });
      }
    }
  }

  const severity =
    removedFields.length > 0
      ? SEVERITY.CRITICAL
      : typeChangedFields.length > 0
        ? SEVERITY.HIGH
        : SEVERITY.LOW;

  const hasDrift =
    addedFields.length > 0 ||
    removedFields.length > 0 ||
    typeChangedFields.length > 0;

  return { hasDrift, severity, addedFields, removedFields, typeChangedFields };
};

export default diffSchemas;
