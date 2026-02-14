import * as React from 'react';
import { cn } from '~/utils/cn';

function Input(
  { className, ...props }: React.ComponentProps<'input'>,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  return (
    <input
      ref={ref}
      data-slot="input"
      className={cn(
        'flex h-9 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

const ForwardedInput = React.forwardRef(Input);
ForwardedInput.displayName = 'Input';

export { ForwardedInput as Input };
