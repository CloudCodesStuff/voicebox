import type { Metadata } from "next";

import { McpConnect } from "./mcp-connect";

export const metadata: Metadata = { title: "MCP" };

export default function McpPage() {
  return <McpConnect />;
}
