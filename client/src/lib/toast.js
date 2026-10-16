import { toast as sonnerToast } from 'sonner';
import { notify } from './notify.jsx';

// Function proxy so toast(...) works as callable AND toast.error / toast.success use notify without mutating sonnerToast in place
const toastProxy = new Proxy(sonnerToast, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, argArray);
  },
  get(target, prop, receiver) {
    if (Object.prototype.hasOwnProperty.call(notify, prop)) {
      return notify[prop];
    }
    return Reflect.get(target, prop, receiver);
  },
});

export { toastProxy as toast, notify };
export default toastProxy;
