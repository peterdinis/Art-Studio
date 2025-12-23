'use client';

import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkCompatProps extends Omit<LinkProps, "className" | "href"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  href: string;
  children?: ReactNode
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ 
    className, 
    activeClassName, 
    pendingClassName, 
    href, 
    children,
    ...props 
  }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === href;
    
    const isPending = false;

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(
          className, 
          isActive && activeClassName, 
          isPending && pendingClassName
        )}
        {...props}
      >
        {children}
    </Link>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };