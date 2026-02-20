import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const icons = {
    danger: { Icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
    warning: { Icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    info: { Icon: Info, color: 'text-blue-600', bg: 'bg-blue-100' },
    success: { Icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  };

  const { Icon, color, bg } = icons[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <DialogTitle className="text-left">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
