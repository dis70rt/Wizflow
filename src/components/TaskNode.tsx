import React, { useState, useEffect, useMemo } from "react";
import { Handle, Position } from "reactflow";
import {
  Terminal,
  Globe,
  ChevronDown,
  ChevronUp,
  X,
  Upload,
  Mail,
  Bug,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import OutputConfig from "./OutputConfig";

interface TaskNodeProps {
  data: {
    label: string;
    type: "SHELL" | "RESTAPI" | "EMAIL";
    onUpdate: (data: any) => void;
    onDelete: () => void;
    command?: string;
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    outputs?: Record<
      string,
      { type: string; path?: string; json_path?: string }
    >;
    file?: File;
    status?: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
    loading?: boolean;
    breakpoint?: boolean;
    subject?: string;
    emailBody?: string;
    recipients?: string[];
  };
}

export default function TaskNode({ data }: TaskNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rotation, setRotation] = useState(0);

  const outputConfigData = useMemo(() => {
    const outputKey = Object.keys(data.outputs || {})[0] || "";
    const output = data.outputs ? data.outputs[outputKey] : undefined;
    return {
      outputKey,
      type: output?.type || "",
      filePath: output?.type === "file" ? output?.path : "",
      jsonPath: output?.type === "json" ? output?.json_path : "",
    };
  }, [data.outputs]);

  useEffect(() => {
    let animationFrame: number;

    const animate = () => {
      setRotation((prev) => (prev + 2) % 360);
      animationFrame = requestAnimationFrame(animate);
    };

    if (data.status === "RUNNING") {
      animate();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [data.status]);

  useEffect(() => {
    let animationFrame: number;

    const animate = () => {
      setRotation((prev) => (prev + 2) % 360);
      animationFrame = requestAnimationFrame(animate);
    };

    if (data.loading) {
      animate();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [data.loading]);

  const getIcon = () => {
    switch (data.type) {
      case "SHELL":
        return Terminal;
      case "RESTAPI":
        return Globe;
      case "EMAIL":
        return Mail;
      default:
        return Terminal;
    }
  };

  const Icon = getIcon();

  const getStatusIcon = () => {
    switch (data.status) {
      case "COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "RUNNING":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const updateNodeData = (updates: Partial<typeof data>) => {
    data.onUpdate({ ...data, ...updates });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updateNodeData({ file });
    }
  };

  const handleRecipientsChange = (value: string) => {
    const emails = value
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
    updateNodeData({ recipients: emails });
  };

  return (
    <div
      className={`shadow-lg rounded-md border-2 relative transition-colors duration-200 ${
        data.breakpoint
          ? "border-orange-400 bg-orange-50"
          : data.status === "COMPLETED"
          ? "border-green-400 bg-green-50"
          : data.status === "FAILED"
          ? "border-red-400 bg-red-50"
          : data.status === "RUNNING"
          ? "border-blue-400 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* Animated border for RUNNING status */}
      {data.status === "RUNNING" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `conic-gradient(from ${rotation}deg at 50% 50%, transparent 0deg, transparent 315deg, rgba(59, 130, 246, 0.2) 345deg, transparent 360deg)`,
            borderRadius: "0.375rem",
          }}
        />
      )}

      {/* Status indicator dot */}
      <div className="absolute top-1 left-1">
        <div
          className={`w-2 h-2 rounded-full ${
            data.status === "COMPLETED"
              ? "bg-green-400"
              : data.status === "FAILED"
              ? "bg-red-400"
              : data.status === "RUNNING"
              ? "bg-blue-400 animate-pulse"
              : data.breakpoint
              ? "bg-orange-400"
              : "bg-gray-400"
          }`}
        />
      </div>

      <div className="relative px-4 py-2 border-b">
        <button
          onClick={data.onDelete}
          className="absolute -top-2 -right-2 p-0.5 bg-white hover:bg-red-50 rounded-full text-red-500 shadow-md border border-gray-200 transition-colors duration-200 z-10"
        >
          <X className="w-3 h-3" />
        </button>

        <div className="absolute top-2 right-8 flex items-center gap-2">
          <button
            onClick={() => updateNodeData({ breakpoint: !data.breakpoint })}
            className={`p-2 rounded-full transition-colors duration-200 ${
              data.breakpoint
                ? "text-red-500 bg-red-50"
                : "text-gray-400 hover:text-red-500"
            }`}
          >
            <Bug className="w-4 h-4" />
          </button>
        </div>

        <div
          className="flex items-center justify-between cursor-pointer mt-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="px-2">{getStatusIcon()}</div>

          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <input
              type="text"
              value={data.label}
              onChange={(e) => updateNodeData({ label: e.target.value })}
              className="text-sm font-medium bg-transparent border-none p-0 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500"
      />

      {isExpanded && (
        <div className="p-4 space-y-3">
          {data.type === "SHELL" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Command
                </label>
                <input
                  type="text"
                  value={data.command || ""}
                  onChange={(e) => updateNodeData({ command: e.target.value })}
                  className="w-full px-2 py-1 text-sm border rounded"
                  placeholder="Enter shell command"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Upload File
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer px-2 py-1 text-sm border rounded hover:bg-gray-50">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span>{data.file ? data.file.name : "Choose file"}</span>
                    </div>
                  </label>
                </div>
                {data.file && (
                  <p className="text-xs text-gray-500 mt-1">
                    Will be stored at root level: /{data.file.name}
                  </p>
                )}
              </div>
            </>
          )}

          {data.type === "RESTAPI" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Method
                </label>
                <select
                  value={data.method || "GET"}
                  onChange={(e) => updateNodeData({ method: e.target.value })}
                  className="w-full px-2 py-1 text-sm border rounded"
                >
                  {["GET", "POST", "PUT", "DELETE"].map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="text"
                  value={data.url || ""}
                  onChange={(e) => updateNodeData({ url: e.target.value })}
                  className="w-full px-2 py-1 text-sm border rounded"
                  placeholder="https://api.example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Headers (JSON)
                </label>
                <textarea
                  value={
                    data.headers ? JSON.stringify(data.headers, null, 2) : ""
                  }
                  onChange={(e) => {
                    try {
                      const headers = JSON.parse(e.target.value);
                      updateNodeData({ headers });
                    } catch {}
                  }}
                  className="w-full px-2 py-1 text-sm border rounded font-mono"
                  placeholder='{"Content-Type": "application/json"}'
                  rows={3}
                />
              </div>
            </>
          )}

          {data.type === "EMAIL" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={data.subject || ""}
                  onChange={(e) => updateNodeData({ subject: e.target.value })}
                  className="w-full px-2 py-1 text-sm border rounded"
                  placeholder="Email subject"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Body
                </label>
                <textarea
                  value={data.emailBody || ""}
                  onChange={(e) =>
                    updateNodeData({ emailBody: e.target.value })
                  }
                  className="w-full px-2 py-1 text-sm border rounded"
                  placeholder="Email body"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Recipients (comma-separated)
                </label>
                <textarea
                  value={data.recipients?.join(", ") || ""}
                  onChange={(e) => handleRecipientsChange(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                  placeholder="email1@example.com, email2@example.com"
                  rows={2}
                />
              </div>
            </>
          )}

          {/* <OutputConfig 
            data={{
              outputKey: Object.keys(data.outputs || {})[0] || '',
              type: data.outputs ? data.outputs[Object.keys(data.outputs || {})[0]]?.type : '',
              filePath: data.outputs ? data.outputs[Object.keys(data.outputs || {})[0]]?.path : ''
            }}
            updateNodeData={(update) => {
              // Merge the output configuration update with existing data
              updateNodeData(update);
            } } taskType={"SHELL"}            /> */}

          {data.type !== "EMAIL" && (
            <OutputConfig
              taskType={data.type}
              data={outputConfigData}
              updateNodeData={(update) => {
                updateNodeData(update);
              }}
            />
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500"
      />
    </div>
  );
}
