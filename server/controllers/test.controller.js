// Dev-only simulator: lets you flip an endpoint's response shape on demand
// so you can test drift detection without depending on a real third-party
// API to change its schema. Not mounted behind `protect` — it's not real
// user data, just a fake upstream to poll against.
let schemaVersion = "v1";

const PAYLOADS = {
  v1: {
    id: "inv_001",
    amount: 12450,
    currency: "USD",
    customer: { id: "cus_1", name: "Acme Corp" },
  },
  v2: {
    id: "inv_001",
    total_due: 12450, // "amount" renamed -> total_due (REMOVED + ADDED)
    currency: { code: "USD", symbol: "$" }, // string -> object (TYPE_CHANGED)
    customer: { id: "cus_1", name: "Acme Corp", tier: "gold" }, // new nested field (ADDED)
  },
};

export const getSample = (req, res) => {
  res.status(200).json(PAYLOADS[schemaVersion]);
};

export const toggleSchema = (req, res) => {
  schemaVersion = schemaVersion === "v1" ? "v2" : "v1";
  res.status(200).json({ success: true, schemaVersion });
};

export const getSchemaStatus = (req, res) => {
  res.status(200).json({ schemaVersion });
};
