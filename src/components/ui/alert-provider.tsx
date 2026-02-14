/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '~/components/ui/alert-dialog';

type DialogRequest =
  | {
      type: 'alert';
      title?: string;
      message: string;
      resolve: (v: void) => void;
    }
  | {
      type: 'confirm';
      title?: string;
      message: string;
      resolve: (v: boolean) => void;
    };

const pending: DialogRequest[] = [];
let notify: (() => void) | null = null;

export function showAlert(message: string, title?: string) {
  return new Promise<void>((resolve) => {
    pending.push({ type: 'alert', title, message, resolve });
    notify?.();
  });
}

export function showConfirm(message: string, title?: string) {
  return new Promise<boolean>((resolve) => {
    pending.push({ type: 'confirm', title, message, resolve });
    notify?.();
  });
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<DialogRequest | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    notify = () => {
      if (current) return;
      const next = pending.shift();
      if (next) {
        setCurrent(next);
        setOpen(true);
      }
    };

    // Try to process any pending requests on mount
    notify();

    return () => {
      notify = null;
    };
  }, [current]);

  useEffect(() => {
    if (!open && current) {
      // If dialog was closed, clear current and process next
      setTimeout(() => {
        setCurrent(null);
        notify?.();
      }, 0);
    }
  }, [open, current]);

  if (!current) {
    return <>{children}</>;
  }

  const onClose = () => setOpen(false);

  return (
    <>
      {children}

      <AlertDialog open={open} onOpenChange={(v) => setOpen(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {current.title ??
                (current.type === 'confirm' ? 'Confirm' : 'Alert')}
            </AlertDialogTitle>
            <AlertDialogDescription>{current.message}</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            {current.type === 'confirm' ? (
              <>
                <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    current.resolve(true);
                    setOpen(false);
                  }}
                >
                  Confirm
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction
                onClick={() => {
                  current.resolve();
                  setOpen(false);
                }}
              >
                OK
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default AlertProvider;
