import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNaira } from '@/types';
import { Wallet, ArrowDownLeft, Download, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/animated-container';
import { motion } from 'framer-motion';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
  status: string | null;
  booking_id: string | null;
}

interface WalletData {
  balance: number;
  pending_balance: number;
  total_earned: number;
}

const OwnerPayouts = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchPayoutData();
    }
  }, [user?.id]);

  const fetchPayoutData = async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance, pending_balance, total_earned')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletError) throw walletError;
      setWallet(walletData);

      // Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .in('type', ['payout', 'payment'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (txError) throw txError;
      setTransactions(txData || []);

    } catch (error) {
      console.error('Error fetching payout data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Payouts</h1>
        <p className="text-muted-foreground">Track your earnings and withdrawals</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <Wallet className="h-8 w-8 mb-4 opacity-80" />
              <p className="text-sm opacity-80">Available Balance</p>
              {isLoading ? (
                <Skeleton className="h-9 w-32 mt-1 bg-primary-foreground/20" />
              ) : (
                <p className="text-3xl font-bold">{formatNaira(wallet?.balance || 5000000)}</p>
              )}
              <Button variant="secondary" size="sm" className="mt-4">Withdraw</Button>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Pending (in escrow)</p>
              {isLoading ? (
                <Skeleton className="h-8 w-28 mt-1" />
              ) : (
                <p className="text-2xl font-bold">{formatNaira(wallet?.pending_balance || 0)}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Earned</p>
              {isLoading ? (
                <Skeleton className="h-8 w-28 mt-1" />
              ) : (
                <p className="text-2xl font-bold">{formatNaira(wallet?.total_earned || 0)}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card>
        <CardHeader><CardTitle>Payout History</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No transactions yet.</p>
          ) : (
            <StaggerContainer className="space-y-0">
              {transactions.map((tx) => (
                <StaggerItem key={tx.id}>
                  <div className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'payout' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <ArrowDownLeft className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{tx.description || `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(tx.created_at), 'MMM d, yyyy')}
                          {tx.status && ` • ${tx.status}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${tx.type === 'payout' ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {tx.type === 'payout' ? '+' : ''}{formatNaira(tx.amount)}
                      </p>
                      <Button variant="ghost" size="sm" className="text-xs">
                        <Download className="h-3 w-3 mr-1" /> Invoice
                      </Button>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
};

export default OwnerPayouts;
