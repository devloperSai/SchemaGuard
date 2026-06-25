import { CodeEditor } from "../CodeEditor";

export function DocsTab({ name }: { name: string }) {
  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10, lineHeight: 1.6 }}>
        Document this endpoint. Use <code style={{ fontFamily: "monospace", background: "rgba(255,255,255,0.08)", padding: "1px 4px", borderRadius: 3 }}>{"{{VAR}}"}</code> for environment variables.
      </div>
      <CodeEditor value={`# ${name}\n\nDescribe what this endpoint returns, owners, SLAs, and any drift-handling notes.\n\n## Response Schema\n\n- \`data[]\` — Array of endpoint configs\n- \`meta.schema_version\` — Current baseline version\n`} onChange={() => {}} lang="Markdown" minH={280} />
    </div>
  );
}
