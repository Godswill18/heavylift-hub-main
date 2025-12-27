import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Package, Search, Calendar, FileText, MessageSquare, 
  Wallet, AlertTriangle, Users, Settings, Truck,
  Plus, RefreshCw
} from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

// Animated illustration wrapper
const IllustrationWrapper = ({ children }: { children: ReactNode }) => (
  <motion.div
    className="relative"
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
  >
    <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
    <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-full p-8">
      {children}
    </div>
  </motion.div>
);

export const EmptyState = ({ icon, title, description, action, secondaryAction }: EmptyStateProps) => (
  <motion.div 
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <IllustrationWrapper>
      <div className="text-primary">{icon}</div>
    </IllustrationWrapper>
    
    <motion.h3 
      className="text-xl font-semibold mt-6 mb-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      {title}
    </motion.h3>
    
    <motion.p 
      className="text-muted-foreground max-w-sm mb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {description}
    </motion.p>
    
    {(action || secondaryAction) && (
      <motion.div 
        className="flex flex-wrap gap-3 justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {action && (
          <Button onClick={action.onClick} className="gap-2">
            {action.icon}
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </motion.div>
    )}
  </motion.div>
);

// Preset empty states
export const NoEquipmentFound = ({ onReset }: { onReset?: () => void }) => (
  <EmptyState
    icon={<Search className="h-12 w-12" />}
    title="No equipment found"
    description="We couldn't find any equipment matching your search. Try adjusting your filters or search terms."
    action={onReset ? { label: 'Clear Filters', onClick: onReset, icon: <RefreshCw className="h-4 w-4" /> } : undefined}
  />
);

export const NoBookings = ({ onBrowse }: { onBrowse: () => void }) => (
  <EmptyState
    icon={<Calendar className="h-12 w-12" />}
    title="No bookings yet"
    description="You haven't made any equipment bookings yet. Start by browsing available equipment in your area."
    action={{ label: 'Browse Equipment', onClick: onBrowse, icon: <Search className="h-4 w-4" /> }}
  />
);

export const NoListings = ({ onAdd }: { onAdd: () => void }) => (
  <EmptyState
    icon={<Package className="h-12 w-12" />}
    title="No equipment listed"
    description="You haven't listed any equipment yet. Start earning by adding your first piece of equipment."
    action={{ label: 'Add Equipment', onClick: onAdd, icon: <Plus className="h-4 w-4" /> }}
  />
);

export const NoRequests = () => (
  <EmptyState
    icon={<Truck className="h-12 w-12" />}
    title="No pending requests"
    description="You don't have any booking requests at the moment. New requests will appear here when contractors want to rent your equipment."
  />
);

export const NoDisputes = () => (
  <EmptyState
    icon={<AlertTriangle className="h-12 w-12" />}
    title="No disputes"
    description="There are no open disputes to review. All transactions are running smoothly!"
  />
);

export const NoMessages = () => (
  <EmptyState
    icon={<MessageSquare className="h-12 w-12" />}
    title="No messages"
    description="You don't have any messages yet. Messages with equipment owners or contractors will appear here."
  />
);

export const NoTransactions = () => (
  <EmptyState
    icon={<Wallet className="h-12 w-12" />}
    title="No transactions"
    description="Your transaction history will appear here once you make or receive payments."
  />
);

export const NoUsers = () => (
  <EmptyState
    icon={<Users className="h-12 w-12" />}
    title="No users found"
    description="No users match your current filters. Try adjusting your search criteria."
  />
);

export const NoResults = ({ title = "No results", description = "No data found matching your criteria." }: { title?: string; description?: string }) => (
  <EmptyState
    icon={<FileText className="h-12 w-12" />}
    title={title}
    description={description}
  />
);

export const ErrorState = ({ onRetry }: { onRetry?: () => void }) => (
  <EmptyState
    icon={<AlertTriangle className="h-12 w-12 text-destructive" />}
    title="Something went wrong"
    description="We encountered an error while loading the data. Please try again."
    action={onRetry ? { label: 'Try Again', onClick: onRetry, icon: <RefreshCw className="h-4 w-4" /> } : undefined}
  />
);
