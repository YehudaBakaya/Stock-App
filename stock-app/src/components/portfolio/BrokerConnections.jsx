import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Plug, PlugZap, RefreshCw, Unplug, Clock } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { getBrokerConnections, saveBrokerConnection, deleteBrokerConnection } from '../../api/api';

const SUPPORTED_BROKERS = [
  {
    name: 'Colmex',
    label: 'Colmex Pro',
    type: 'טריידים',
    status: 'active',
    icon: '🏦',
    hint: 'API Token מהגדרות החשבון',
    fields: [{ key: 'token', label: 'API Token' }],
  },
  {
    name: 'Interactive',
    label: 'Interactive Brokers',
    type: 'טווח ארוך',
    status: 'active',
    icon: '📊',
    hint: 'Client Portal API Key',
    fields: [{ key: 'token', label: 'API Key' }],
  },
  {
    name: 'Alpaca',
    label: 'Alpaca Markets',
    type: 'טריידים',
    status: 'active',
    icon: '🦙',
    hint: 'API Key + Secret Key',
    fields: [
      { key: 'apiKey', label: 'API Key' },
      { key: 'secretKey', label: 'Secret Key' },
    ],
  },
  {
    name: 'eToro',
    label: 'eToro',
    type: 'שניהם',
    status: 'soon',
    icon: '💹',
    hint: '',
    fields: [],
  },
  {
    name: 'TradeStation',
    label: 'TradeStation',
    type: 'טריידים',
    status: 'soon',
    icon: '📈',
    hint: '',
    fields: [],
  },
  {
    name: 'Schwab',
    label: 'Charles Schwab',
    type: 'טווח ארוך',
    status: 'soon',
    icon: '🏛️',
    hint: '',
    fields: [],
  },
];

const TYPE_COLORS = {
  'טריידים': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'טווח ארוך': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'שניהם': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

export default function BrokerConnections() {
  const queryClient = useQueryClient();
  const [openForm, setOpenForm] = useState(null); // brokerName of open form
  const [fieldValues, setFieldValues] = useState({});

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['brokerConnections'],
    queryFn: async () => {
      const res = await getBrokerConnections();
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: saveBrokerConnection,
    onSuccess: () => {
      queryClient.invalidateQueries(['brokerConnections']);
      setOpenForm(null);
      setFieldValues({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBrokerConnection,
    onSuccess: () => queryClient.invalidateQueries(['brokerConnections']),
  });

  const activeMap = useMemo(() => {
    const map = {};
    connections.forEach((conn) => { map[conn.brokerName] = conn; });
    return map;
  }, [connections]);

  const handleFieldChange = (field, value) => {
    setFieldValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleConnect = (broker) => {
    const credentials = {};
    broker.fields.forEach((f) => {
      credentials[f.key] = fieldValues[f.key] || '';
    });
    saveMutation.mutate({ brokerName: broker.name, credentials });
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">חיבורי ברוקרים</h3>
          <p className="text-slate-400 text-sm mt-0.5">
            חבר חשבונות מסחר כדי לסנכרן נתונים
          </p>
        </div>
        {isLoading && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SUPPORTED_BROKERS.map((broker) => {
          const connection = activeMap[broker.name];
          const connected = Boolean(connection);
          const isSoon = broker.status === 'soon';
          const isOpen = openForm === broker.name;

          return (
            <div
              key={broker.name}
              className={`rounded-xl border p-4 transition-all ${
                isSoon
                  ? 'border-white/5 bg-white/3 opacity-50'
                  : connected
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{broker.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{broker.label}</p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border ${TYPE_COLORS[broker.type] || 'bg-gray-500/20 text-gray-300'}`}>
                      {broker.type}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {isSoon ? (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      בקרוב
                    </span>
                  ) : connected ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      מחובר
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Plug className="w-3 h-3" />
                      לא מחובר
                    </span>
                  )}
                </div>
              </div>

              {/* Connected date */}
              {connected && (
                <p className="text-xs text-slate-400 mt-2">
                  חובר: {new Date(connection.connectedAt).toLocaleDateString('he-IL')}
                </p>
              )}

              {/* Inline connect form */}
              {isOpen && !isSoon && (
                <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                  {broker.hint && (
                    <p className="text-xs text-slate-400">{broker.hint}</p>
                  )}
                  {broker.fields.map((f) => (
                    <Input
                      key={f.key}
                      label={f.label}
                      value={fieldValues[f.key] || ''}
                      onChange={(e) => handleFieldChange(f.key, e.target.value)}
                      placeholder={f.label}
                    />
                  ))}
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => handleConnect(broker)}
                      disabled={saveMutation.isLoading}
                      className="flex-1"
                    >
                      {saveMutation.isLoading ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <><PlugZap className="w-3 h-3 ml-1" />שמור</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setOpenForm(null); setFieldValues({}); }}
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {!isSoon && !isOpen && (
                <div className="flex gap-2 mt-3">
                  {connected ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => { setOpenForm(broker.name); setFieldValues({}); }}
                      >
                        <RefreshCw className="w-3 h-3 ml-1" />
                        סנכרן
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(broker.name)}
                        disabled={deleteMutation.isLoading}
                      >
                        <Unplug className="w-3 h-3 text-red-400" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => { setOpenForm(broker.name); setFieldValues({}); }}
                    >
                      <PlugZap className="w-3 h-3 ml-1" />
                      חבר
                    </Button>
                  )}
                </div>
              )}

              {isSoon && (
                <Button size="sm" disabled className="w-full mt-3 opacity-40">
                  בקרוב
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
