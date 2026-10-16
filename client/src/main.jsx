import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { LazyMotion, domMax, MotionConfig } from 'motion/react';
import { spring } from './lib/motion';
import { ThemeProvider } from './context/ThemeContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { TooltipProvider } from './components/ui/tooltip';
import App from './App.jsx';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Failed to find the root element with id 'root'");
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <PreferencesProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <MotionConfig reducedMotion="user" transition={spring.soft}>
              <LazyMotion features={domMax} strict>
                <App />
              </LazyMotion>
            </MotionConfig>
          </TooltipProvider>
        </QueryClientProvider>
      </PreferencesProvider>
    </ThemeProvider>
  </StrictMode>
);
