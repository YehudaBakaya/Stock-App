import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAlerts } from '../api/api';
import { useToast } from '../context/ToastContext';

export default function useAlertNotifications() {
  const { addToast } = useToast();
  const seenTriggered = useRef(new Set());

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await getAlerts();
      return res.data;
    },
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  useEffect(() => {
    alerts.forEach((alert) => {
      if (!alert.triggeredAt) return;
      if (seenTriggered.current.has(alert._id)) return;

      seenTriggered.current.add(alert._id);

      const direction = alert.condition === 'above' ? 'עלה מעל' : 'ירד מתחת';
      addToast(
        'info',
        `🔔 ${alert.symbol} ${direction} $${alert.targetPrice}`
      );
    });
  }, [alerts, addToast]);
}
