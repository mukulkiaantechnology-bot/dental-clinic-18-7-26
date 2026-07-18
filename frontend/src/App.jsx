import { useEffect } from 'react';
import { AppRoutes } from './app/routes/AppRoutes';

function App() {
  useEffect(() => {
    const saved = localStorage.getItem('hms_theme');
    const root = window.document.documentElement;
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  return <AppRoutes />;
}

export default App;
