import { useEffect } from 'react';
import api from '../api/axios';

export const useTracking = () => {
  useEffect(() => {
    const trackUser = async () => {
      try {
        let userUuid = localStorage.getItem('user_tracking_uuid');
        if (!userUuid) {
          userUuid = window.crypto.randomUUID();
          localStorage.setItem('user_tracking_uuid', userUuid);
        }

        await api.post('/tracking/track', { user_uuid: userUuid });
      } catch (error) {
        // Failing silently to not disrupt user experience
        console.debug('Tracking info:', error);
      }
    };

    trackUser();
  }, []);
};
