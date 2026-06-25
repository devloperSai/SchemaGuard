/**
 * Extracts a schema from any JSON response
 * Recursively maps field names to their data types
 * Handles nested objects, arrays, nulls, mixed types
 */

const getType = (value) => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
};

const extractSchema = (data, depth = 0) => {
  // Prevent infinite recursion on deeply nested objects
  if (depth > 10) return "object";

  if (data === null) return "null";
  if (Array.isArray(data)) {
    if (data.length === 0) return "array<unknown>";
    // Sample first item to determine array element schema
    const sample = data[0];
    if (typeof sample === "object" && sample !== null) {
      return { _type: "array", _items: extractSchema(sample, depth + 1) };
    }
    return `array<${getType(sample)}>`;
  }

  if (typeof data === "object") {
    const schema = {};
    for (const [key, value] of Object.entries(data)) {
      schema[key] = extractSchema(value, depth + 1);
    }
    return schema;
  }

  return getType(data);
};

export default extractSchema;
