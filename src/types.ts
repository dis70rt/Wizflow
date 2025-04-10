export interface TaskNode {
  id: string;
  name: string;
  type: 'SHELL' | 'RESTAPI' | 'EMAIL';
  command?: string;
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: Record<string, any>;
  inputs?: Record<string, string>;
  outputs?: Record<string, { type: string; path?: string; json_path?: string }>;
  input_mappings?: Record<string, { from_task: string; output: string }>;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  loading?: boolean;
  breakpoint?: boolean;
  depends_on: string[];
  
  subject?: string;
  emailBody?: string;
  recipients?: string[];
}

export interface WorkflowData {
  workflow_name: string;
  description: string;
  version: string;
  tasks: TaskNode[];
}

export interface NodeData {
  label: string;
  type: 'SHELL' | 'RESTAPI' | 'EMAIL';
  onUpdate: (data: any) => void;
  onDelete: () => void;
  command?: string;
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: string;
  outputs?: Record<string, { type: string; path?: string; json_path?: string }>;
  file?: File;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  loading?: boolean;
  breakpoint?: boolean;
  subject?: string;
  emailBody?: string;
  recipients?: string[];
}