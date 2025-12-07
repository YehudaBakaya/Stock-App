import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, Clock, CheckCircle, X, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockOpenOrders = [
  { id: 1, symbol: 'AAPL', side: 'BUY', quantity: 100, price: 190.00, status: 'PENDING', created: '2024-01-15 10:30:00', type: 'LIMIT' },
  { id: 2, symbol: 'MSFT', side: 'SELL', quantity: 50, price: 425.00, status: 'PARTIAL', filled: 25, created: '2024-01-15 09:15:00', type: 'LIMIT' },
  { id: 3, symbol: 'GOOGL', side: 'BUY', quantity: 75, price: 140.00, status: 'PENDING', created: '2024-01-15 08:45:00', type: 'LIMIT' },
];

const mockOrderHistory = [
  { id: 4, symbol: 'TSLA', side: 'BUY', quantity: 25, price: 250.00, status: 'FILLED', created: '2024-01-14 15:20:00', filled: '2024-01-14 15:22:00', type: 'MARKET' },
  { id: 5, symbol: 'NVDA', side: 'SELL', quantity: 10, price: 870.00, status: 'FILLED', created: '2024-01-14 11:30:00', filled: '2024-01-14 11:30:00', type: 'MARKET' },
  { id: 6, symbol: 'META', side: 'BUY', quantity: 40, price: 480.00, status: 'CANCELLED', created: '2024-01-14 09:00:00', type: 'LIMIT' },
];

export default function Orders() {
  const [openOrders, setOpenOrders] = useState(mockOpenOrders);
  const [orderHistory] = useState(mockOrderHistory);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PARTIAL': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FILLED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'PARTIAL': return <Clock className="w-4 h-4" />;
      case 'FILLED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <X className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const cancelOrder = (orderId) => {
    setOpenOrders(prev => prev.filter(order => order.id !== orderId));
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
              Orders
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Manage your trading orders
            </p>
          </div>
          <Button className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
            <Plus className="w-4 h-4" />
            New Order
          </Button>
        </motion.div>

        {/* Orders Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="open" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="open" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Open Orders ({openOrders.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                History ({orderHistory.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="space-y-4">
              {openOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Open Orders</h3>
                    <p className="text-muted-foreground mb-4">You don't have any active orders at the moment</p>
                    <Button>Create New Order</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {openOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-xl font-bold text-foreground">
                                  {order.symbol}
                                </span>
                                <Badge 
                                  className={`${order.side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} border`}
                                >
                                  {order.side}
                                </Badge>
                                <Badge variant="outline">{order.type}</Badge>
                                <Badge className={`${getStatusColor(order.status)} border`}>
                                  <span className="flex items-center gap-1">
                                    {getStatusIcon(order.status)}
                                    {order.status}
                                  </span>
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Quantity:</span>
                                  <p className="font-semibold">
                                    {order.quantity} shares
                                    {order.filled && ` (${order.filled} filled)`}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Price:</span>
                                  <p className="font-semibold">${order.price.toFixed(2)}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Total Value:</span>
                                  <p className="font-semibold">${(order.quantity * order.price).toLocaleString()}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Created:</span>
                                  <p className="font-semibold">
                                    {new Date(order.created).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Edit3 className="w-3 h-3" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                onClick={() => cancelOrder(order.id)}
                              >
                                <X className="w-3 h-3" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="grid gap-4">
                {orderHistory.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xl font-bold text-foreground">
                                {order.symbol}
                              </span>
                              <Badge 
                                className={`${order.side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} border`}
                              >
                                {order.side}
                              </Badge>
                              <Badge variant="outline">{order.type}</Badge>
                              <Badge className={`${getStatusColor(order.status)} border`}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(order.status)}
                                  {order.status}
                                </span>
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Quantity:</span>
                                <p className="font-semibold">{order.quantity} shares</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Price:</span>
                                <p className="font-semibold">${order.price.toFixed(2)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Total Value:</span>
                                <p className="font-semibold">${(order.quantity * order.price).toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  {order.filled ? 'Filled:' : 'Created:'}
                                </span>
                                <p className="font-semibold">
                                  {new Date(order.filled || order.created).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}