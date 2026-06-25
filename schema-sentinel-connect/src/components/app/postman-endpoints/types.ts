export type MethodKey =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type KV = {
  id: string;
  key: string;
  value: string;
  desc: string;
  enabled: boolean;
};

export type BodyState = { kind: string; raw: string; rawLang: string };

export type State = {
  name: string;
  method: string;
  url: string;
  params: KV[];
  headers: KV[];
  authKind: string;
  bearer: string;
  body: BodyState;
  preScript: string;
  postScript: string;
  settings: {
    followRedirects: boolean;
    ssl: boolean;
    timeout: number;
    interval: number;
  };
};

export type ResponseShape = {
  status: number;
  time: number;
  size: string;
  body: string;
  headers: Record<string, string>;
};

export type ColEndpoint = { name: string; method: string; active: boolean };
export type Col = { id: string; name: string; endpoints: ColEndpoint[] };

export type AutoHeader = { key: string; value: string; auto?: boolean };
