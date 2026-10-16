import { toast } from 'sonner';
import { notify } from './notify.jsx';

// Default export is the standard toast proxy augmented with Step 12 notify methods
export { toast, notify };
export default Object.assign(toast, notify);
