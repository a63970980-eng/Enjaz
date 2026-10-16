import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import WorkspaceApp from './WorkspaceApp';
import './index.css';
import './workspace.css';

const root = document.getElementById('root');
if (!root) throw new Error('Workspace root element is missing.');

createRoot(root).render(
  <StrictMode>
    <WorkspaceApp />
  </StrictMode>,
);
