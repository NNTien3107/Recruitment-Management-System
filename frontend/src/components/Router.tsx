import type { AnchorHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

export function AppLink({ to, children, ...rest }: LinkProps) {
  return (
    <Link to={to} {...rest}>
      {children}
    </Link>
  );
}
