import type { AutoHeader, MethodKey, State } from "./types";
import { newKV, uid } from "./utils";

export const METHOD_COLORS: Record<
  string,
  { bg: string; text: string; light: string }
> = {
  GET: { bg: "#1a9c52", text: "#fff", light: "rgba(26,156,82,0.15)" },
  POST: { bg: "#d97706", text: "#fff", light: "rgba(217,119,6,0.15)" },
  PUT: { bg: "#2563eb", text: "#fff", light: "rgba(37,99,235,0.15)" },
  PATCH: { bg: "#7c3aed", text: "#fff", light: "rgba(124,58,237,0.15)" },
  DELETE: { bg: "#dc2626", text: "#fff", light: "rgba(220,38,38,0.15)" },
  HEAD: { bg: "#0891b2", text: "#fff", light: "rgba(8,145,178,0.15)" },
  OPTIONS: { bg: "#db2777", text: "#fff", light: "rgba(219,39,119,0.15)" },
};

export const METHODS: MethodKey[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

export const AUTO_HEADERS: AutoHeader[] = [
  { key: "Authorization", value: "Bearer {{API_TOKEN}}", auto: true },
  { key: "Host", value: "<calculated when request is sent>", auto: true },
  { key: "User-Agent", value: "SchemaGuard/1.0 (Runtime/v2.4)", auto: true },
  { key: "Accept", value: "*/*", auto: true },
  { key: "Accept-Encoding", value: "gzip, deflate, br", auto: true },
  { key: "Connection", value: "keep-alive", auto: true },
];

export const initialState: State = {
  name: "Get all endpoints",
  method: "GET",
  url: "http://localhost:5000/api/endpoints",
  params: [newKV()],
  headers: [
    { id: uid(), key: "Accept", value: "application/json", desc: "", enabled: true },
    newKV(),
  ],
  authKind: "bearer",
  bearer: "sk_live_•••••••••••••••••••••••••••••••••",
  body: {
    kind: "none",
    raw: '{\n  "name": "My Endpoint",\n  "url": "https://api.example.com/v1/users",\n  "method": "GET"\n}',
    rawLang: "JSON",
  },
  preScript:
    "// Runs before each request\n// pm.request.headers.add({ key: 'X-Trace-ID', value: pm.variables.replaceIn('{{$randomUUID}}') });\n",
  postScript:
    "// Runs after response\npm.test('Status 200', () => pm.response.to.have.status(200));\npm.test('Response time < 500ms', () => pm.expect(pm.response.responseTime).to.be.below(500));\n",
  settings: { followRedirects: true, ssl: true, timeout: 8000, interval: 5 },
};
