'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const NO_GROUP = 'none';

/** Reads the value submitted by <GroupSelect>, as the API expects it. */
export function readGroupId(form: FormData, name: string): string | null {
  const value = form.get(name);
  return typeof value === 'string' && value !== NO_GROUP ? value : null;
}

export function GroupSelect({
  id,
  name,
  label,
  noneLabel,
  defaultGroupId,
  groups,
  className,
}: {
  id?: string;
  name: string;
  label?: string;
  noneLabel: string;
  defaultGroupId: string | null;
  groups: { id: string; name: string }[];
  className?: string;
}) {
  const items = [
    { value: NO_GROUP, label: noneLabel },
    ...groups.map((group) => ({
      value: group.id,
      label: group.name,
    })),
  ];

  return (
    <Select name={name} items={items} defaultValue={defaultGroupId ?? NO_GROUP}>
      <SelectTrigger
        id={id}
        aria-label={label}
        className={cn(
          'rounded-lg px-3 text-base data-[size=default]:h-11 sm:text-sm',
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-lg">
        {items.map((item) => (
          <SelectItem
            key={item.value}
            value={item.value}
            // Same left padding as the trigger, so the popup lines up with it.
            className="min-h-11 rounded-md pl-3 text-base sm:text-sm"
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
