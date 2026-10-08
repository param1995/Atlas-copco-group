import { routes } from './app.routes';

describe('application routes', () => {
  it('lazy-loads Overview and Trends as separate route components', () => {
    const overviewRoute = routes.find((route) => route.path === '');
    const trendsRoute = routes.find((route) => route.path === 'trends');

    expect(overviewRoute?.pathMatch).toBe('full');
    expect(typeof overviewRoute?.loadComponent).toBe('function');
    expect(typeof trendsRoute?.loadComponent).toBe('function');
    expect(routes.find((route) => route.path === '**')?.redirectTo).toBe('');
  });
});