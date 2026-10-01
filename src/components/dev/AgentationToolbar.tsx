"use client";

import { Agentation } from "agentation";

/**
 * Dev-only visual feedback toolbar. Annotate the page; Cursor reads notes via Agentation MCP.
 */
export function AgentationToolbar() {
  if (process.env.NODE_ENV !== "development") return null;
  return <Agentation endpoint="http://localhost:4747" />;
}
