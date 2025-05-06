/**
 * TODO: Update this component to use your client-side framework's link
 * component. We've provided examples of how to do this for Next.js, Remix, and
 * Inertia.js in the Catalyst documentation:
 *
 * https://catalyst.tailwindui.com/docs#client-side-router-integration
 */

import React, { forwardRef } from 'react'
import { Link as RouterLink, LinkProps } from 'react-router-dom'

export const Link = forwardRef(function Link(
  { href, ...props }: { href: string } & Omit<LinkProps, 'to'> & React.ComponentPropsWithoutRef<'a'>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  return <RouterLink to={href} {...props} ref={ref} />
})
 