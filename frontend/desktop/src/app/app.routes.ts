import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		loadComponent: () => import('./dashboard/dashboard.component').then((module) => module.DashboardComponent)
	},
	{
		path: 'trends',
		loadComponent: () => import('./trends/trends.component').then((module) => module.TrendsComponent)
	},
	{ path: '**', redirectTo: '' }
];
