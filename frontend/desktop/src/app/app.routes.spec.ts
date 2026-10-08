import { routes } from './app.routes';

describe('application routes', () => {

  it('should define the overview route', () => {
    const overviewRoute = routes.find((route) => route.path === '');

    expect(overviewRoute).toBeDefined();
    expect(overviewRoute?.path).toBe('');
    expect(overviewRoute?.pathMatch).toBe('full');
    expect(overviewRoute?.loadComponent).toBeDefined();
    expect(typeof overviewRoute?.loadComponent).toBe('function');
  });

  it('should lazy-load the Overview component', async () => {
    const overviewRoute = routes.find((route) => route.path === '');

    expect(overviewRoute?.loadComponent).toBeDefined();

    const component = await overviewRoute!.loadComponent!();

    expect(component).toBeDefined();
  });

  it('should define the trends route', () => {
    const trendsRoute = routes.find((route) => route.path === 'trends');

    expect(trendsRoute).toBeDefined();
    expect(trendsRoute?.path).toBe('trends');
    expect(trendsRoute?.loadComponent).toBeDefined();
    expect(typeof trendsRoute?.loadComponent).toBe('function');
  });

  it('should lazy-load the Trends component', async () => {
    const trendsRoute = routes.find((route) => route.path === 'trends');

    expect(trendsRoute?.loadComponent).toBeDefined();

    const component = await trendsRoute!.loadComponent!();

    expect(component).toBeDefined();
  });

  it('should define the wildcard redirect route', () => {
    const wildcardRoute = routes.find((route) => route.path === '**');

    expect(wildcardRoute).toBeDefined();
    expect(wildcardRoute?.path).toBe('**');
    expect(wildcardRoute?.redirectTo).toBe('');
  });

  it('should contain exactly the expected routes', () => {
    expect(routes.length).toBe(3);
    expect(routes.map((route) => route.path)).toEqual([
      '',
      'trends',
      '**'
    ]);
  });
});