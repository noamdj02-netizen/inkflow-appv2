import Empty from 'antd-mobile/es/components/empty';
import type { ReactNode } from 'react';

type DashboardAdmEmptyProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
};

/** Empty state mobile (Ant Design Mobile) — typo InkFlow conservée dans la description. */
export function DashboardAdmEmpty({ title, description, icon }: DashboardAdmEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <Empty
        image={icon ?? Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className="space-y-2">
            <p className="type-heading-sm">{title}</p>
            {description ? (
              <p className="type-body text-muted-foreground max-w-sm mx-auto">{description}</p>
            ) : null}
          </div>
        }
      />
    </div>
  );
}
