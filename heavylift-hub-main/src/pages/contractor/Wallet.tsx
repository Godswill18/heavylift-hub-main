import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNaira } from '@/types';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface WalletData {
  balance: number;
  total_spent: number;
  pending_balance: number;
}

interface Transaction {
  id: string;
  type: string;
  description: string | null;
  amount: number;
  created_at: string;
}

const ContractorWallet = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;

    try {
      // Fetch wallet
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance, total_spent, pending_balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletData) {
        setWallet(walletData);
      }

      // Fetch transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('id, type, description, amount, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txData) {
        setTransactions(txData);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-8 mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Wallet</h1>
        <p className="text-muted-foreground">Manage your payments and transactions</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <WalletIcon className="h-8 w-8 mb-4 opacity-80" />
            <p className="text-sm opacity-80">Available Balance</p>
            <p className="text-3xl font-bold">{formatNaira(wallet?.balance || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold">{formatNaira(wallet?.total_spent || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Pending Deposits</p>
            <p className="text-2xl font-bold">{formatNaira(wallet?.pending_balance || 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="outline" size="sm">Add Funds</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            transactions.map((tx) => {
              const isCredit = ['refund', 'deposit'].includes(tx.type);
              return (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {isCredit ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium">{tx.description || tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(tx.created_at), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${isCredit ? 'text-emerald-600' : 'text-foreground'}`}>
                    {isCredit ? '+' : '-'}{formatNaira(Math.abs(tx.amount))}
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractorWallet;
