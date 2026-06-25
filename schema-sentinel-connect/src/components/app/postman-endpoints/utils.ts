import type { KV } from "./types";

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function newKV(): KV {
  return { id: uid(), key: "", value: "", desc: "", enabled: true };
}
