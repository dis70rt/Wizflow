import React, { useEffect, useState } from 'react';
import { Terminal, Globe, LogOut, Plus, Trash2, Mail } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
}

interface SidebarProps {
  onWorkflowSelect: (workflow: WorkflowItem) => void;
  onNewWorkflow: () => void;
  currentWorkflowId?: string;
  userId: string;
}

export default function Sidebar({ onWorkflowSelect, onNewWorkflow, currentWorkflowId, userId }: SidebarProps) {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);

  useEffect(() => {
    loadWorkflows();
  }, [userId]);

  const loadWorkflows = async () => {
    if (!userId) return;
    
    const workflowsRef = collection(db, 'users', userId, 'workflows');
    const querySnapshot = await getDocs(workflowsRef);
    
    const workflowList: WorkflowItem[] = [];
    querySnapshot.forEach((doc) => {
      workflowList.push({ id: doc.id, ...doc.data() } as WorkflowItem);
    });
    
    setWorkflows(workflowList);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId, 'workflows', workflowId));
      await loadWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white p-4 border-r border-gray-200 flex flex-col h-full">
      {auth.currentUser && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <img
              src={auth.currentUser.photoURL || ''}
              alt="Profile"
              className="w-8 h-8 rounded-full mr-2"
            />
            <span className="text-sm font-medium truncate">
              {auth.currentUser.displayName}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">My Workflows</h2>
          <button
            onClick={onNewWorkflow}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              onClick={() => onWorkflowSelect(workflow)}
              className={`p-2 rounded cursor-pointer flex justify-between items-center group ${
                currentWorkflowId === workflow.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="truncate">{workflow.name}</span>
              <button
                onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Task Types</h2>
        <div className="space-y-2">
          <div
            className="flex items-center gap-2 p-2 border rounded cursor-move hover:bg-gray-50"
            draggable
            onDragStart={(e) => onDragStart(e, 'shell')}
          >
            <Terminal className="w-4 h-4" />
            <span>Shell Task</span>
          </div>
          
          <div
            className="flex items-center gap-2 p-2 border rounded cursor-move hover:bg-gray-50"
            draggable
            onDragStart={(e) => onDragStart(e, 'restapi')}
          >
            <Globe className="w-4 h-4" />
            <span>REST API Task</span>
          </div>

          <div
            className="flex items-center gap-2 p-2 border rounded cursor-move hover:bg-gray-50"
            draggable
            onDragStart={(e) => onDragStart(e, 'email')}
          >
            <Mail className="w-4 h-4" />
            <span>Email Task</span>
          </div>
        </div>
      </div>
    </div>
  );
}