import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { paymentService } from "@/services/paymentService";
import { format } from "date-fns";
import { Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

const WalletHistory = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await paymentService.getWalletHistory();
        setHistory(data);
      } catch (error) {
        console.error('Error fetching wallet history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading wallet history...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          Wallet Ledger
        </h3>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              history.map((tx) => (
                <TableRow key={tx.cash_wallet_ID || tx.id}>
                  <TableCell className="font-medium">
                    {tx.transaction_date ? format(new Date(tx.transaction_date), "dd MMM yyyy, hh:mm a") : 'N/A'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {tx.transaction_id || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {tx.transaction_type === 1 ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <ArrowUpCircle className="h-4 w-4" />
                        <span>Credit</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <ArrowDownCircle className="h-4 w-4" />
                        <span>Debit</span>
                      </div>
                    )
                    }
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {tx.remarks || 'N/A'}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${tx.transaction_type === 1 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.transaction_type === 1 ? '+' : '-'} ₹{tx.transaction_amount}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default WalletHistory;
