import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { getBrokerConnections, saveBrokerConnection } from '../../api/api';

const SUPPORTED_BROKERS = [
  {
    name: 'Colmex',
    label: 'חשבון טריידים (Colmex)',
    hint: 'קישור ל־Colmex API או Token'
  },
  {
    name: 'Interactive',
    label: 'חשבון טווח ארוך (Interactive)',
    hint: 'למשל API key/שירות'
  }
];

export default function BrokerConnections() {
  const queryClient = useQueryClient();
  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['brokerConnections'],
    queryFn: async () => {
      const res = await getBrokerConnections();
      return res.data;
    }
  });

  const mutation = useMutation({
    mutationFn: saveBrokerConnection,
    onSuccess: () => {
      queryClient.invalidateQueries(['brokerConnections']);
    }
  });

  const [inputs, setInputs] = useState({});

  const activeMap = useMemo(() => {
    const map = {};
    connections.forEach((conn) => {
      map[conn.brokerName] = conn;
    });
    return map;
  }, [connections]);

  const handleChange = (broker, value) => {
    setInputs((prev) => ({ ...prev, [broker]: value }));
  };

  const handleSave = (broker) => {
    const credentials = { token: inputs[broker] || '' };
    mutation.mutate({ brokerName: broker, credentials });
  };

  const [notice, setNotice] = useState('');
  const handleQuickConnect = (brokerName) => {
    setNotice(`המשך והזן את פרטי ${brokerName} מצד שמאל כדי להתחבר`);
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">חיבורי ברוקרים</h3>
          <p className="text-slate-400 text-sm">חבר חשבונות טריידים וטווח ארוך כדי שכל הנתונים יזרמו לכאן.</p>
        </div>
        {isLoading && <span className="text-xs text-slate-400">טוען...</span>}
      </div>
      <div className="flex flex-wrap gap-3">
        {SUPPORTED_BROKERS.map((broker) => (
          <Button key={`quick-${broker.name}`} variant="secondary" size="sm" onClick={() => handleQuickConnect(broker.name)}>
            התחבר ל-{broker.name}
          </Button>
        ))}
        {notice && <span className="text-xs text-emerald-300">{notice}</span>}
      </div>
      <div className="space-y-4">
        {SUPPORTED_BROKERS.map((broker) => {
          const connection = activeMap[broker.name];
          const connected = Boolean(connection);
          return (
            <div key={broker.name} className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">{broker.label}</p>
                <p className="text-xs text-slate-400">{broker.hint}</p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <Input
                    label="טוקן/פרטי התחברות"
                    value={inputs[broker.name] ?? ''}
                    onChange={(event) => handleChange(broker.name, event.target.value)}
                  />
                  <Input
                    label="מצב"
                    value={connected ? 'מחובר' : 'ממתין'}
                    disabled
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-center">
                <Button
                  onClick={() => handleSave(broker.name)}
                  disabled={mutation.isLoading}
                >
                  {connected ? 'עדכן חיבור' : 'חבר ברוקר'}
                </Button>
                {connected && (
                  <span className="text-xs text-slate-300">
                    אחרון: {new Date(connection.connectedAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
