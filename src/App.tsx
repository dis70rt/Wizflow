import React, { useState, useCallback, useEffect, useRef } from "react";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { auth, db } from "./firebase";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { Toaster, toast } from "sonner";

import TaskNode from "./components/TaskNode";
import Sidebar from "./components/Sidebar";
import LoginScreen from "./components/LoginScreen";
import { WorkflowData } from "./types";

const nodeTypes = {
  task: TaskNode,
};

const defaultEdgeOptions = {
  animated: true,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: "#888",
  },
  style: {
    stroke: "#888",
  },
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState("New Workflow");
  const [description, setDescription] = useState("");
  const [jsonOutput, setJsonOutput] = useState("");
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string>();
  const [user, setUser] = useState(auth.currentUser);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isWorkflowCompleted, setIsWorkflowCompleted] = useState(false);

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const generateWorkflowJson = useCallback(() => {
    const workflow: WorkflowData = {
      workflow_name: workflowName,
      description,
      version: "1.0",
      tasks: nodes.map((node) => {
        const dependsOn = edges
          .filter((edge) => edge.target === node.id)
          .map((edge) => edge.source);

        const taskData: any = {
          id: node.id,
          name: node.data.label,
          type: node.data.type,
          status: node.data.status || "PENDING",
          loading: node.data.loading || false,
          breakpoint: node.data.breakpoint || false,
          depends_on: dependsOn,
          position: node.position,
        };

        if (node.data.command) taskData.command = node.data.command;
        if (node.data.method) taskData.method = node.data.method;
        if (node.data.url) taskData.url = node.data.url;
        if (node.data.headers) taskData.headers = node.data.headers;
        if (node.data.outputs) taskData.outputs = node.data.outputs;
        if (node.data.subject) taskData.subject = node.data.subject;
        if (node.data.emailBody) taskData.emailBody = node.data.emailBody;
        if (node.data.recipients) taskData.recipients = node.data.recipients;
        if (node.data.inputs) taskData.inputs = node.data.inputs;

        return taskData;
      }),
    };

    return JSON.stringify(workflow, null, 2);
  }, [workflowName, description, nodes, edges]);

  useEffect(() => {
    setJsonOutput(generateWorkflowJson());
  }, [generateWorkflowJson, nodes, edges, workflowName, description]);

  useEffect(() => {
    const allCompleted =
      nodes.length > 0 &&
      nodes.every((node) => node.data.status === "COMPLETED");

    if (allCompleted) {
      if (!isWorkflowCompleted) {
        toast.success("Workflow execution completed successfully!");
        setIsWorkflowCompleted(true);
      }
    } else {
      if (isWorkflowCompleted) {
        setIsWorkflowCompleted(false);
      }
    }
  }, [nodes, isWorkflowCompleted]);

  useEffect(() => {
    return () => {
      ws.current?.close();
    };
  }, []);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = {
        x: event.clientX - 240,
        y: event.clientY - 40,
      };

      const newNode: Node = {
        id: `${type}_${uuidv4()}`,
        type: "task",
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Task`,
          type: type.toUpperCase(),
          status: "PENDING",
          loading: false,
          breakpoint: false,
          onUpdate: (newData: any) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === newNode.id
                  ? { ...node, data: { ...node.data, ...newData } }
                  : node
              )
            );
          },
          onDelete: () => {
            setNodes((nds) => nds.filter((node) => node.id !== newNode.id));
            setEdges((eds) =>
              eds.filter(
                (edge) =>
                  edge.source !== newNode.id && edge.target !== newNode.id
              )
            );
          },
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, setEdges]
  );

  const handleSave = async () => {
    if (!user || isSaving) return;

    setIsSaving(true);
    try {
      const workflowId = currentWorkflowId || uuidv4();
      const userWorkflowsRef = doc(
        db,
        "users",
        user.uid,
        "workflows",
        workflowId
      );
      const workflowJson = generateWorkflowJson();

      const safeNodes = JSON.parse(JSON.stringify(nodes));
      const safeEdges = JSON.parse(JSON.stringify(edges));

      const workflowData = {
        name: workflowName,
        description,
        nodes: safeNodes,
        edges: safeEdges,
        json: workflowJson,
        updatedAt: new Date(),
        ...(currentWorkflowId ? {} : { created_at: new Date() }),
        userName: user.displayName ? user.displayName : user.email,
      };

      console.log("Saving workflow data:", workflowData);
      await setDoc(userWorkflowsRef, workflowData, { merge: true });

      if (!currentWorkflowId) {
        setCurrentWorkflowId(workflowId);
      }

      console.log("Workflow saved successfully");
    } catch (error) {
      console.error("Error saving workflow:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePause = async () => {
    if (!user || isRunning) return;

    setIsPaused(true);
    try {
      if (ws.current) {
        ws.current.close();
      }

      ws.current = new WebSocket("ws://172.20.75.63:8000/ws");

      ws.current.onopen = () => {
        console.log("WebSocket connection opened");
        ws.current?.send(JSON.stringify({ type: "PAUSE" }));
        toast.success("Workflow execution started");
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast.error("WebSocket connection error");
      };

      ws.current.onclose = (event) => {
        console.log("WebSocket closed:", event);
      };
    } catch (error) {
      console.error("Error running workflow:", error);
      toast.error("Failed to start workflow execution");
    } finally {
      setIsRunning(false);
    }
  };

  const handleResume = async () => {
    if (!user || isRunning) return;

    setIsPaused(false);
    try {
      if (ws.current) {
        ws.current.close();
      }

      ws.current = new WebSocket("ws://172.20.75.63:8000/ws");

      ws.current.onopen = () => {
        console.log("WebSocket connection opened");
        ws.current?.send(JSON.stringify({ type: "RESUME" }));
        toast.success("Workflow execution started");
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast.error("WebSocket connection error");
      };

      ws.current.onclose = (event) => {
        console.log("WebSocket closed:", event);
      };
    } catch (error) {
      console.error("Error running workflow:", error);
      toast.error("Failed to start workflow execution");
    } finally {
      setIsRunning(false);
    }
  };

  const handleRun = async () => {
    if (!user || isRunning) return;

    setIsRunning(true);
    try {
      await handleSave();

      if (ws.current) {
        ws.current.close();
      }

      ws.current = new WebSocket("ws://172.20.75.63:8000/ws");

      ws.current.onopen = () => {
        console.log("WebSocket connection opened");
        const workflowJson = generateWorkflowJson();
        ws.current?.send(
          JSON.stringify({ type: "START", workflow: workflowJson })
        );
        toast.success("Workflow execution started");
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "NODE_UPDATE") {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === data.nodeId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      status: data.status,
                      loading: data.loading,
                    },
                  }
                : node
            )
          );
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast.error("WebSocket connection error");
      };

      ws.current.onclose = (event) => {
        console.log("WebSocket closed:", event);
      };
    } catch (error) {
      console.error("Error running workflow:", error);
      toast.error("Failed to start workflow execution");
    } finally {
      setIsRunning(false);
    }
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workflow = JSON.parse(e.target!.result as string);
          setWorkflowName(workflow.workflow_name);
          setDescription(workflow.description);

          const newNodes = workflow.tasks.map((task: any) => ({
            id: task.id,
            type: "task",
            position: task.position || {
              x: Math.random() * 500,
              y: Math.random() * 500,
            },
            data: {
              label: task.name,
              type: task.type,
              command: task.command,
              method: task.method,
              url: task.url,
              headers: task.headers,
              outputs: task.outputs,
              status: task.status || "PENDING",
              loading: task.loading || false,
              breakpoint: task.breakpoint || false,
              subject: task.subject,
              emailBody: task.emailBody,
              recipients: task.recipients,
              onUpdate: (newData: any) => {
                setNodes((nds) =>
                  nds.map((node) =>
                    node.id === task.id
                      ? { ...node, data: { ...node.data, ...newData } }
                      : node
                  )
                );
              },
              onDelete: () => {
                setNodes((nds) => nds.filter((node) => node.id !== task.id));
                setEdges((eds) =>
                  eds.filter(
                    (edge) => edge.source !== task.id && edge.target !== task.id
                  )
                );
              },
            },
          }));

          const newEdges = workflow.tasks.flatMap((task: any) =>
            task.depends_on.map((sourceId: string) => ({
              id: `${sourceId}-${task.id}`,
              source: sourceId,
              target: task.id,
              type: "default",
              ...defaultEdgeOptions,
            }))
          );

          setNodes(newNodes);
          setEdges(newEdges);
          toast.success("Workflow imported successfully");
        } catch (error) {
          console.error("Error importing workflow:", error);
          toast.error("Failed to import workflow");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([jsonOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Workflow exported successfully");
  };

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-screen">
      <Toaster position="top-right" />
      <Sidebar
        onWorkflowSelect={async (workflow) => {
          setCurrentWorkflowId(workflow.id);
          const docSnap = await getDoc(
            doc(db, "users", user.uid, "workflows", workflow.id)
          );
          if (docSnap.exists()) {
            const data = docSnap.data();
            setWorkflowName(data.name);
            setDescription(data.description);

            const recoveredNodes = data.nodes.map(
              (node: { data: any; id: string }) => ({
                ...node,
                data: {
                  ...node.data,
                  onUpdate: (newData: any) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === node.id
                          ? { ...n, data: { ...n.data, ...newData } }
                          : n
                      )
                    );
                  },
                  onDelete: () => {
                    setNodes((nds) => nds.filter((n) => n.id !== node.id));
                    setEdges((eds) =>
                      eds.filter(
                        (edge) =>
                          edge.source !== node.id && edge.target !== node.id
                      )
                    );
                  },
                },
              })
            );

            setNodes(recoveredNodes);
            setEdges(data.edges);
          }
        }}
        onNewWorkflow={() => {
          setCurrentWorkflowId(undefined);
          setWorkflowName("New Workflow");
          setDescription("");
          setNodes([]);
          setEdges([]);
        }}
        currentWorkflowId={currentWorkflowId}
        userId={user.uid}
      />

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex gap-4 flex-1 mb-6">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Workflow Name"
              className="px-3 py-2 border rounded"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="px-3 py-2 border rounded flex-1"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={isPaused ? handleResume : handlePause}
              className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-all duration-200"
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
            >
              {isRunning ? "Running..." : "Run"}
            </button>
          </div>
        </div>

        <div className="flex-1 flex">
          <div className="flex-1 border-r">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDragOver={onDragOver}
              onDrop={onDrop}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              fitView
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>

          <div className="w-96 p-4 overflow-auto bg-gray-50 border-l">
            <div className="sticky top-0 bg-gray-50 pb-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Live JSON Preview</h3>
                <div className="flex gap-2">
                  <label className="px-3 py-1 bg-gray-100 rounded cursor-pointer hover:bg-gray-200">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                    Import
                  </label>
                  <button
                    onClick={handleExportJson}
                    className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Export
                  </button>
                </div>
              </div>
            </div>
            <pre className="text-sm font-mono bg-white p-4 rounded border shadow-sm overflow-auto">
              {jsonOutput}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
