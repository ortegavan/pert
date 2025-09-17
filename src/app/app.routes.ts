import { Routes } from '@angular/router';
import { Pert } from './components/pert/pert';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: Pert },
];
