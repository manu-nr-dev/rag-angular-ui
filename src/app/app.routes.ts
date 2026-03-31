import { Routes } from '@angular/router';
import { ChatComponent } from '../chat/chat/chat';
import { RagSearchComponent } from '../rag-search/rag-search';
import { AgentComponent } from './agent/agent/agent';

export const routes: Routes = [
  { path: '', component: ChatComponent },
  { path: 'rag', component: RagSearchComponent },
  {path: 'agent', component: AgentComponent }
];