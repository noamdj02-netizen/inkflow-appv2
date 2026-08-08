import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { isPosthogInitialized } from '../../lib/analytics/posthogInit';
import {
  identifyStudioUser,
  captureEvent,
  trackOnboardingFunnel,
  AnalyticsEvents,
} from '../../lib/analytics/capture';
import { clearJustSignedUp, isJustSignedUp } from '../../lib/welcomeStorage';

/**
 * Identifie l’utilisateur PostHog (rétention J+7 / J+30) + signup_completed après inscription.
 * Si l’utilisateur accepte les cookies après l’arrivée sur le dashboard, on retente jusqu’à init PostHog.
 */
export const ProductAnalyticsIdentity: React.FC = () => {
  const { user, isAuthenticated, authLoading } = useAuth();
  const lastIdentified = useRef<string | null>(null);
  const signupFired = useRef(false);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return;
    if (!isPosthogInitialized()) return;
    if (lastIdentified.current === user.id) return;
    lastIdentified.current = user.id;
    identifyStudioUser(user.id, { email: user.email, name: user.name });
  }, [authLoading, isAuthenticated, user]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return;
    if (signupFired.current) return;
    if (!isJustSignedUp()) return;

    const fire = () => {
      if (!isPosthogInitialized()) return false;
      signupFired.current = true;
      clearJustSignedUp();
      captureEvent(AnalyticsEvents.SIGNUP_COMPLETED, {
        user_type: 'tattooer',
        funnel: 'tattooer_activation',
      });
      trackOnboardingFunnel('signup', { email: user.email ?? undefined });
      return true;
    };

    if (fire()) return;

    let attempts = 0;
    const id = window.setInterval(() => {
      attempts += 1;
      if (fire() || attempts >= 80) {
        window.clearInterval(id);
        if (attempts >= 80 && isJustSignedUp()) {
          try {
            clearJustSignedUp();
          } catch {
            /* ignore */
          }
        }
      }
    }, 300);
    const onConsent = () => {
      if (fire()) window.clearInterval(id);
    };
    window.addEventListener('inkflow-cookie-consent', onConsent);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('inkflow-cookie-consent', onConsent);
    };
  }, [authLoading, isAuthenticated, user]);

  return null;
};
