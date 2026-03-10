import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

const MODELS = [
  { group: "OpenAI", options: [
    { label: "GPT 4o Mini", value: "openai/gpt-4o-mini" },
    { label: "GPT OSS 120B", value: "openai/gpt-oss-120b" },
    { label: "GPT 5.4", value: "openai/gpt-5.4-2026-03-05" },
    { label: "GPT 5.4 Pro", value: "openai/gpt-5.4-pro-2026-03-05" }
  ]},
  { group: "Anthropic", options: [
    { label: "Claude 4.5 Sonnet", value: "anthropic/claude-4.5-sonnet" },
    { label: "Claude 4.5 Opus", value: "anthropic/claude-4.5-opus" },
    { label: "Claude 4.6 Sonnet", value: "anthropic/claude-4.6-sonnet" },
    { label: "Claude 4.6 Opus", value: "anthropic/claude-4.6-opus" }
  ]},
  { group: "Google", options: [
    { label: "Gemini 2.5 Flash", value: "google/gemini-2.5-flash" },
    { label: "Gemini 3 Flash Preview", value: "google/gemini-3-flash-preview" },
    { label: "Gemini 3.1 Preview", value: "google/gemini-3.1-preview" },
    { label: "Gemini 3.1 Pro Preview", value: "google/gemini-3.1-pro-preview" },
    { label: "Gemini 3.1 Flash-Lite", value: "google/gemini-3.1-flash-lite-preview" }
  ]},
  { group: "X.AI", options: [
    { label: "Grok 4.1 Fast Reasoning", value: "x-ai/grok-4.1-fast-reasoning" },
    { label: "Grok 4.1 Fast Non-Reasoning", value: "x-ai/grok-4-1-fast-non-reasoning" },
    { label: "Grok Code Fast 1", value: "x-ai/grok-code-fast-1" }
  ]},
  { group: "DeepSeek", options: [
    { label: "DeepSeek V3.1", value: "deepseek/deepseek-v3.1" },
    { label: "DeepSeek V3.2", value: "deepseek/deepseek-v3.2" }
  ]},
  { group: "Qwen", options: [
    { label: "Qwen3.5 397B A17B", value: "qwen/qwen3.5-397b-a17b" },
    { label: "Qwen3 Coder 480B", value: "qwen/qwen3-coder-480b-a35b-instruct" },
    { label: "Qwen3 235B A22B", value: "qwen/qwen3-vl-235b-a22b-instruct" }
  ]},
  { group: "MiniMax", options: [
    { label: "MiniMax M2", value: "minimax/minimax-m2" },
    { label: "MiniMax M2.1", value: "minimax/minimax-m2.1" },
    { label: "MiniMax M2.5", value: "minimax/minimax-m2.5" }
  ]},
  { group: "Moonshot", options: [
    { label: "Kimi K2", value: "moonshotai/kimi-k2-0905" },
    { label: "Kimi K2 Thinking", value: "moonshotai/kimi-k2-thinking" },
    { label: "Kimi K2.5", value: "moonshotai/kimi-k2.5" }
  ]},
  { group: "Zhipu", options: [
    { label: "GLM 4.6", value: "zai-org/glm-4.6" }
  ]}
];

export default function Settings() {
  const [provider, setProvider] = useState("commonstack");
  const [model, setModel] = useState("openai/gpt-oss-120b");
  const [apiKey, setApiKey] = useState("");
  const [sheetId, setSheetId] = useState("");
  const [xSheetName, setXSheetName] = useState("X_Posts");
  const [redditSheetName, setRedditSheetName] = useState("Reddit_Posts");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const jsonStr = await invoke<string>("load_settings");
        const data = JSON.parse(jsonStr);
        if (data.provider) setProvider(data.provider);
        if (data.commonstack_model) setModel(data.commonstack_model);
        if (data.commonstack_api_key) setApiKey(data.commonstack_api_key);
        if (data.sheet_id) setSheetId(data.sheet_id);
        if (data.x_sheet_name) setXSheetName(data.x_sheet_name);
        if (data.reddit_sheet_name) setRedditSheetName(data.reddit_sheet_name);
        if (data.google_webhook_url) setWebhookUrl(data.google_webhook_url);
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      const payload = {
        provider,
        commonstack_model: model,
        commonstack_api_key: apiKey,
        sheet_id: sheetId,
        x_sheet_name: xSheetName,
        reddit_sheet_name: redditSheetName,
        google_webhook_url: webhookUrl,
        headless: true, // required by scraper logic
        max_concurrent: 5
      };
      
      await invoke("save_settings", { settingsJson: JSON.stringify(payload, null, 2) });
      setMsg("Settings saved successfully!");
    } catch (err) {
      setMsg("Error saving settings: " + String(err));
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="max-w-3xl space-y-8 pb-10">
      <div className="bg-[var(--color-slate-bg)] border border-[var(--color-border)] rounded-[var(--radius-normal)] p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold mb-1">API Configuration</h2>
          <p className="text-sm text-gray-400">Manage your LLM provider, models, and keys.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="provider" className="block text-sm font-medium mb-1.5">
              Provider
            </label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="block w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-slate-surface)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-slate-primary)] focus:border-[var(--color-slate-primary)]"
            >
              <option value="commonstack">CommonStack (Default)</option>
              <option value="openai">OpenAI Direct</option>
              <option value="anthropic">Anthropic Direct</option>
            </select>
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium mb-1.5">
              Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="block w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-slate-surface)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-slate-primary)] focus:border-[var(--color-slate-primary)]"
            >
              {MODELS.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium mb-1.5">
            API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="block w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-slate-surface)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-slate-primary)] focus:border-[var(--color-slate-primary)]"
            placeholder="sk-..."
          />
        </div>
      </div>

      <div className="bg-[var(--color-slate-bg)] border border-[var(--color-border)] rounded-[var(--radius-normal)] p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold mb-1">Google Sheets Integration</h2>
          <p className="text-sm text-gray-400">Configure where to read URLs and write metrics.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="sheetId" className="block text-sm font-medium mb-1.5">
              Google Sheet ID
            </label>
            <input
              type="text"
              id="sheetId"
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
              className="block w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-slate-surface)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-slate-primary)] focus:border-[var(--color-slate-primary)]"
              placeholder="1BxiMvs0XRYFgwnK..."
            />
            <p className="mt-1 text-xs text-gray-500">The long string of characters in your Google Sheet URL.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="xSheetName" className="block text-sm font-medium mb-1.5">
                X (Twitter) Sheet Name
              </label>
              <input
                type="text"
                id="xSheetName"
                value={xSheetName}
                onChange={(e) => setXSheetName(e.target.value)}
                className="block w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-slate-surface)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-slate-primary)] focus:border-[var(--color-slate-primary)]"
              />
            </div>
            <div>
              <label htmlFor="redditSheetName" className="block text-sm font-medium mb-1.5">
                Reddit Sheet Name
              </label>
              <input
                type="text"
                id="redditSheetName"
                value={redditSheetName}
                onChange={(e) => setRedditSheetName(e.target.value)}
                className="block w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-slate-surface)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-slate-primary)] focus:border-[var(--color-slate-primary)]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="webhookUrl" className="block text-sm font-medium mb-1.5">
              Google Apps Script Webhook URL
            </label>
            <input
              type="url"
              id="webhookUrl"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="block w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-slate-surface)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-slate-primary)] focus:border-[var(--color-slate-primary)]"
              placeholder="https://script.google.com/macros/s/..."
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        {msg && <span className="text-sm text-[var(--color-slate-primary)]">{msg}</span>}
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-[var(--color-slate-primary)] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}