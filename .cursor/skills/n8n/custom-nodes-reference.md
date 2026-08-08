# n8n Custom Nodes Reference

## When to Build a Custom Node
- API not available as built-in n8n node
- Need repeated complex logic encapsulated
- Building an integration for your own service

## Node Structure
```
my-node/
├── package.json
├── nodes/
│   └── MyNode/
│       ├── MyNode.node.ts
│       └── mynode.svg
└── credentials/
    └── MyNodeApi.credentials.ts
```

## Basic Node Template
```typescript
import { IExecuteFunctions, INodeExecutionData, INodeType } from 'n8n-workflow';

export class MyNode implements INodeType {
  description = {
    displayName: 'My Node',
    name: 'myNode',
    group: ['transform'],
    version: 1,
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Field',
        name: 'field',
        type: 'string',
        default: '',
      }
    ]
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const field = this.getNodeParameter('field', 0) as string;
    // process items...
    return [items];
  }
}
```

## Testing Custom Nodes
```bash
npm run build
npm link
cd ~/.n8n/custom && npm link my-node
# Restart n8n
```
