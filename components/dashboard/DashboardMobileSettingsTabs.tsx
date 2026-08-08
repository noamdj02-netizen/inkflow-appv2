import CapsuleTabs from 'antd-mobile/es/components/capsule-tabs';
import type { LucideIcon } from 'lucide-react';

export type DashboardSettingsTabOption = {
  id: string;
  label: string;
  description?: string;
  Icon: LucideIcon;
};

type DashboardMobileSettingsTabsProps = {
  tabs: DashboardSettingsTabOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

/** Onglets Paramètres mobile — CapsuleTabs Ant Design Mobile (scroll horizontal, cibles 44px). */
export function DashboardMobileSettingsTabs({
  tabs,
  activeId,
  onChange,
  className = '',
}: DashboardMobileSettingsTabsProps) {
  if (tabs.length === 0) return null;

  return (
    <div
      className={[
        'adm-settings-capsule-tabs -mx-1 overflow-x-auto overscroll-x-contain',
        className,
      ].join(' ')}
    >
      <CapsuleTabs activeKey={activeId} onChange={onChange}>
        {tabs.map((tab) => (
          <CapsuleTabs.Tab key={tab.id} title={tab.label} />
        ))}
      </CapsuleTabs>
    </div>
  );
}
