import React from 'react';
import { ConfigProvider } from 'antd-mobile';
import frFR from 'antd-mobile/es/locales/fr-FR';
import 'antd-mobile/es/global/global.css';
import { getAntdMobileDashboardTheme } from '@/lib/antdMobileDashboardTheme';

type AntdMobileDashboardProviderProps = {
  isDark: boolean;
  children: React.ReactNode;
};

/** Scope Ant Design Mobile au shell dashboard (ConfigProvider + thème InkFlow). */
export function AntdMobileDashboardProvider({
  isDark,
  children,
}: AntdMobileDashboardProviderProps) {
  return (
    <ConfigProvider locale={frFR} theme={getAntdMobileDashboardTheme(isDark)}>
      {children}
    </ConfigProvider>
  );
}
