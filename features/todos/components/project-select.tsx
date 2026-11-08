'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const NO_PROJECT = 'none';
const FIELD_NAME = 'projectId';

/** Reads the value submitted by <ProjectSelect>, as the API expects it. */
export function readProjectId(form: FormData): string | null {
  const value = form.get(FIELD_NAME);
  return typeof value === 'string' && value !== NO_PROJECT ? value : null;
}

export function ProjectSelect({
  id,
  label,
  defaultProjectId,
  projects,
  className,
}: {
  id?: string;
  label?: string;
  defaultProjectId: string | null;
  projects: { id: string; name: string }[];
  className?: string;
}) {
  const items = [
    { value: NO_PROJECT, label: 'No project' },
    ...projects.map((project) => ({
      value: project.id,
      label: project.name,
    })),
  ];

  return (
    <Select
      name={FIELD_NAME}
      items={items}
      defaultValue={defaultProjectId ?? NO_PROJECT}
    >
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
