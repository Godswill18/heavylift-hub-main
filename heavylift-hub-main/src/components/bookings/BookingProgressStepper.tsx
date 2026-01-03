import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  BOOKING_STAGES, 
  TERMINAL_STATES, 
  isStageCompleted, 
  isCurrentStage,
  type BookingStatus 
} from '@/lib/bookingLifecycle';
import { 
  FileText, 
  CheckCircle, 
  CreditCard, 
  Shield, 
  Truck, 
  Package, 
  RotateCcw, 
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface StatusLog {
  id: string;
  new_status: string;
  action_type: string;
  performed_by_role: string;
  notes: string | null;
  created_at: string;
}

interface BookingProgressStepperProps {
  currentStatus: BookingStatus;
  statusLogs?: StatusLog[];
  className?: string;
  compact?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  FileText,
  CheckCircle,
  CreditCard,
  Shield,
  Truck,
  Package,
  RotateCcw,
  CheckCircle2,
  Clock: AlertTriangle, // Fallback for Clock icon
};

export const BookingProgressStepper = ({
  currentStatus,
  statusLogs = [],
  className,
  compact = false,
}: BookingProgressStepperProps) => {
  // Check if booking is in a terminal non-success state
  const isCancelled = currentStatus === 'cancelled';
  const isRejected = currentStatus === 'rejected';
  const isDisputed = currentStatus === 'disputed';
  const isTerminal = TERMINAL_STATES.includes(currentStatus);

  // Get log for a specific status
  const getLogForStatus = (status: string): StatusLog | undefined => {
    return statusLogs.find(log => log.new_status === status);
  };

  // Filter stages based on current flow
  const relevantStages = BOOKING_STAGES.filter(stage => {
    // If cancelled/rejected early, only show up to the point of cancellation
    if (isCancelled || isRejected) {
      const currentStageOrder = BOOKING_STAGES.find(s => s.id === currentStatus)?.order ?? 0;
      return stage.order <= currentStageOrder + 1;
    }
    return true;
  });

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <TooltipProvider>
          {relevantStages.slice(0, 6).map((stage, index) => {
            const completed = isStageCompleted(stage.id, currentStatus);
            const current = isCurrentStage(stage.id, currentStatus);
            const log = getLogForStatus(stage.id);

            return (
              <Tooltip key={stage.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      completed && "bg-emerald-500",
                      current && "bg-primary ring-2 ring-primary/30",
                      !completed && !current && "bg-muted"
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-medium">{stage.label}</p>
                  {log && (
                    <p className="text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM d, h:mm a')}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Terminal state banner */}
      {(isCancelled || isRejected || isDisputed) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mb-4 p-3 rounded-lg flex items-center gap-2",
            isCancelled && "bg-muted text-muted-foreground",
            isRejected && "bg-red-500/10 text-red-600",
            isDisputed && "bg-amber-500/10 text-amber-600"
          )}
        >
          {isDisputed ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">
            {isCancelled && "This booking has been cancelled"}
            {isRejected && "This booking request was rejected"}
            {isDisputed && "This booking is under dispute review"}
          </span>
        </motion.div>
      )}

      {/* Progress stepper */}
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-muted" />
        <motion.div
          className="absolute top-5 left-5 h-0.5 bg-primary"
          initial={{ width: 0 }}
          animate={{ 
            width: `${Math.min(
              ((BOOKING_STAGES.findIndex(s => s.id === currentStatus) + (isTerminal && currentStatus === 'completed' ? 1 : 0)) / 
              (relevantStages.length - 1)) * 100, 
              100
            )}%` 
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Steps */}
        <TooltipProvider>
          <div className="relative flex justify-between">
            {relevantStages.map((stage, index) => {
              const completed = isStageCompleted(stage.id, currentStatus);
              const current = isCurrentStage(stage.id, currentStatus);
              const disabled = !completed && !current;
              const log = getLogForStatus(stage.id);
              const Icon = iconMap[stage.icon] || CheckCircle;

              return (
                <Tooltip key={stage.id}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col items-center"
                    >
                      <motion.div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all",
                          "border-2",
                          completed && "bg-emerald-500 border-emerald-500 text-white",
                          current && "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
                          disabled && "bg-background border-muted text-muted-foreground"
                        )}
                        whileHover={!disabled ? { scale: 1.1 } : undefined}
                      >
                        <Icon className="h-5 w-5" />
                      </motion.div>
                      <span className={cn(
                        "mt-2 text-xs font-medium text-center max-w-[80px]",
                        completed && "text-emerald-600",
                        current && "text-primary",
                        disabled && "text-muted-foreground"
                      )}>
                        {stage.label}
                      </span>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px]">
                    <p className="font-medium">{stage.label}</p>
                    <p className="text-xs text-muted-foreground">{stage.description}</p>
                    {log && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs">
                          <span className="text-muted-foreground">By:</span>{' '}
                          <span className="capitalize">{log.performed_by_role}</span>
                        </p>
                        <p className="text-xs">
                          <span className="text-muted-foreground">At:</span>{' '}
                          {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                        {log.notes && (
                          <p className="text-xs mt-1 italic">{log.notes}</p>
                        )}
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default BookingProgressStepper;
