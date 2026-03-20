import { Routes } from '@angular/router';
import { ChatComponent } from '../chat/chat/chat';
import { RagSearchComponent } from '../rag-search/rag-search';

export const routes: Routes = [
  { path: '', component: ChatComponent },
  { path: 'rag', component: RagSearchComponent }
];