import React from 'react';
import { CompanyLogo, LogoVariant, LogoSize } from '../common/CompanyLogo';

interface BrandLogoProps {
  size?: LogoSize;
  collapsed?: boolean;
  variant?: LogoVariant;
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  collapsed = false,
  variant = 'horizontal',
  className = '',
  onClick,
}) => {
  if (collapsed) {
    return (
      <CompanyLogo
        variant="icon"
        size={size === 'sm' ? 32 : 36}
        className={className}
        onClick={onClick}
      />
    );
  }

  return (
    <CompanyLogo
      variant={variant}
      size={size}
      className={className}
      showSubtitle={true}
      onClick={onClick}
    />
  );
};
