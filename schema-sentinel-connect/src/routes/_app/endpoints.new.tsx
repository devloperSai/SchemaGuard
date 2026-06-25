import { createFileRoute } from "@tanstack/react-router";
import { EndpointBuilder } from "@/components/app/EndpointBuilder";
import { store } from "@/lib/store";
import { useState } from "react";

export const Route = createFileRoute("/_app/endpoints/new")({
  head: () => ({ meta: [{ title: "New endpoint — SchemaGuard" }] }),
  component: NewEndpoint,
});

function NewEndpoint() {
  const [initial] = useState(() => store.newEndpointTemplate(null));
  return <EndpointBuilder initial={initial} />;
}
