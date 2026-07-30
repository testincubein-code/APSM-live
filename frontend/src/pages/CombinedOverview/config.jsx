import React from 'react';
import { Youtube, Linkedin, Facebook, Instagram } from '@/components/icons/BrandIcons';

export const PLATFORM_CONFIG = {
  facebook: {
    label: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    gradient: 'from-[#1877F2]/20 to-[#1877F2]/0',
  },
  instagram: {
    label: 'Instagram',
    icon: Instagram,
    color: '#E1306C',
    gradient: 'from-[#E1306C]/20 to-[#E1306C]/0',
    iconComp: () => (
      <svg width="100%" height="100%" viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <defs>
          <linearGradient id="igGradCombined" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f09433"/>
            <stop offset="25%" stopColor="#e6683c"/>
            <stop offset="50%" stopColor="#dc2743"/>
            <stop offset="75%" stopColor="#cc2366"/>
            <stop offset="100%" stopColor="#bc1888"/>
          </linearGradient>
        </defs>
        <path fill="url(#igGradCombined)" d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85 0 3.2-.01 3.58-.07 4.85-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12c0-3.2.01-3.58.07-4.85C2.38 3.86 3.9 2.31 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0-2.16C8.74 0 8.33.01 7.05.07 2.7.27.27 2.7.07 7.05.01 8.33 0 8.74 0 12c0 3.26.01 3.67.07 4.95.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24c3.26 0 3.67-.01 4.95-.07 4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95 0-3.26-.01-3.67-.07-4.95-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32A6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/>
      </svg>
    ),
  },
  linkedin: {
    label: 'LinkedIn',
    icon: Linkedin,
    color: '#0A66C2',
    gradient: 'from-[#0A66C2]/20 to-[#0A66C2]/0',
  },
  youtube: {
    label: 'YouTube',
    icon: Youtube,
    color: '#FF0000',
    gradient: 'from-[#FF0000]/20 to-[#FF0000]/0',
  },
};
