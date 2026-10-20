import React from 'react';
import { CompanyLogo, LogoVariant, LogoSize } from './CompanyLogo';

export type { LogoVariant, LogoSize };

export interface VenancioLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  showSubtitle?: boolean;
  showText?: boolean;
}

/**
 * Re-export wrapper pointing to the single official CompanyLogo
 */
export const VenancioLogo: React.FC<VenancioLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showSubtitle = true,
  showText = true,
}) => {
  return (
    <CompanyLogo
      variant={showText ? variant : 'icon'}
      size={size}
      className={className}
      showSubtitle={showSubtitle}
    />
  );
};
