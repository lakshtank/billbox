import { useViewTransitionState as useVTS } from '../context/ViewTransitionContext';

export function useViewTransitionState(to) {
  return useVTS(to);
}

export default useViewTransitionState;
