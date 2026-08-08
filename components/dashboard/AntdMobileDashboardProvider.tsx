import React from 'react';
import ConfigProvider from 'antd-mobile/es/components/config-provider';
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
      <div className="adm-dashboard-scope flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </ConfigProvider>
  );
}
