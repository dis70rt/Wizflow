import React, { useState, useEffect } from 'react';

interface OutputConfigProps {
  data: {
    outputKey: string;
    type?: string;
    filePath?: string;
    jsonPath?: string;
  };
  taskType: "SHELL" | "RESTAPI" | "EMAIL";
  updateNodeData: (updates: Partial<any>) => void;
}

const OutputConfig: React.FC<OutputConfigProps> = ({ 
  data, 
  taskType,
  updateNodeData 
}) => {
  const [outputKey, setOutputKey] = useState(data.outputKey || '');
  const [outputType, setOutputType] = useState(data.type || 'file');
  const [filePath, setFilePath] = useState(data.filePath || '');
  const [jsonPath, setJsonPath] = useState(data.jsonPath || '');









  useEffect(() => {
    if (taskType === 'RESTAPI') {
      setOutputType('json');
    }
  }, [taskType]);

  useEffect(() => {
    if (outputKey.trim()) {
      const output: Record<string, any> = { type: outputType };
      
      if (outputType === 'file') {
        output.path = filePath;
      } else if (outputType === 'json') {
        output.json_path = jsonPath;
      }

      updateNodeData({ 
        outputs: { [outputKey]: output } 
      });
    }
  }, [outputKey, outputType, filePath, jsonPath, updateNodeData]);

  return (
    <div className="p-2 border rounded space-y-2 mt-3">
      <h4 className="text-sm font-semibold">Output Config</h4>
      <div>
        <label className="block text-xs font-medium text-gray-700">Key</label>
        <input
          type="text"
          value={outputKey}
          onChange={(e) => setOutputKey(e.target.value)}
          className="w-full px-2 py-1 border rounded text-sm"
          placeholder="e.g., data_file"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">Type</label>
        <select
          value={outputType}
          onChange={(e) => {
            if (taskType === 'SHELL') {
              setOutputType(e.target.value);
            }
          }}
          disabled={taskType === 'RESTAPI'}
          className="w-full px-2 py-1 border rounded text-sm"
        >
          {taskType === 'SHELL' && <option value="file">file</option>}
          <option value="json">json</option>
        </select>
      </div>
      
      {outputType === 'file' && (
        <div>
          <label className="block text-xs font-medium text-gray-700">File Path</label>
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
            placeholder="workspace/data.txt"
          />
        </div>
      )}
      
      {outputType === 'json' && (
        <div>
          <label className="block text-xs font-medium text-gray-700">JSON Path</label>
          <input
            type="text"
            value={jsonPath}
            onChange={(e) => setJsonPath(e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
            placeholder="$.data.result"
          />
        </div>
      )}
    </div>
  );
};

export default OutputConfig;