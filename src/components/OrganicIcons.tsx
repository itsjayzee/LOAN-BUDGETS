import React from 'react';

export interface OrganicIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  strokeWidth?: number;
  glow?: 'accent' | 'they_owe' | 'i_owe' | 'none';
}

const getGlowClass = (glow?: 'accent' | 'they_owe' | 'i_owe' | 'none') => {
  if (glow === 'they_owe') return 'icon-glow-they-owe';
  if (glow === 'i_owe') return 'icon-glow-i-owe';
  if (glow === 'accent') return 'organic-icon-glow';
  return '';
};

const baseProps = (
  { className = 'w-4 h-4', strokeWidth = 1.75, glow = 'none', ...rest }: OrganicIconProps
) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: `organic-icon ${getGlowClass(glow)} ${className}`.trim(),
  ...rest,
});

// Asymmetric hand-inked drawer menu
export const Menu: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.2 7.2c4.4-.5 10.6-.4 15.6.1" />
    <path d="M4.5 12.1c3.8-.3 8.9-.2 12.4.2" />
    <path d="M4.2 16.9c4.9.4 10.2.3 15.4-.2" />
    <circle cx="19.4" cy="12.2" r="0.9" fill="currentColor" stroke="none" opacity="0.7" />
  </svg>
);

// Hand-crafted bell with organic flare & subtle asymmetrical chime arc
export const Bell: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M6.4 10.6c.2-3.4 2.5-5.7 5.6-5.7 3.2 0 5.4 2.4 5.6 5.8.2 2.4.9 4 2.1 5.1.3.3.1.9-.4.9H4.8c-.5 0-.7-.6-.4-.9 1.2-1.2 1.8-2.8 2-5.2Z" />
    <path d="M10.1 19.2c.5 1.1 1.4 1.7 2.2 1.7.9 0 1.7-.6 2.1-1.7" />
    <path d="M12 3.1c.1-.7.4-1.1.8-1.2" />
    <path d="M19.3 6.2c.8.8 1.3 1.9 1.4 3.1" opacity="0.65" />
  </svg>
);

// Organic Ai Budget lotus/assistant silhouette with asymmetric spark
export const Bot: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12 4.6c-4.2 0-7.2 2.7-7.4 6.9-.1 3.9 2.4 6.8 6.9 7 4.7.2 7.8-2.4 7.9-6.6.1-4.3-2.9-7.3-7.4-7.3Z" />
    <path d="M12 4.6c-.2-1.4.4-2.5 1.7-2.9" />
    <circle cx="9.3" cy="11.3" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="14.9" cy="11.1" r="1.05" fill="currentColor" stroke="none" />
    <path d="M9.6 14.5c1.3.9 3.4.9 4.8-.1" />
    <path d="M2.7 10.6c-.5.9-.5 2.1 0 3" opacity="0.7" />
    <path d="M21.3 10.4c.5.9.5 2.2 0 3.1" opacity="0.7" />
  </svg>
);

// Organic asymmetric cloud contour
export const Cloud: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M7.3 18.4h9.6c2.6 0 4.4-1.8 4.4-4.2 0-2.1-1.5-3.8-3.6-4.1-.5-3-2.9-5.1-6-5.1-3.2 0-5.7 2.3-6 5.4-2 .4-3.4 2-3.4 4 0 2.3 1.9 4 5 4Z" />
  </svg>
);

export const CloudOff: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.2 4.4 19.8 19.6" />
    <path d="M10.4 5.3c2.9-.5 5.8 1.2 6.8 4.4 2.2.3 3.9 2 3.9 4.2 0 1.1-.4 2.1-1.2 2.9" />
    <path d="M6.2 9.9C4 10.4 2.5 12.1 2.5 14.3c0 2.3 1.9 4.1 4.6 4.1h8.6" />
  </svg>
);

// Flowing organic portrait & check icons
export const User: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12.1 4.4c-2.1 0-3.7 1.6-3.7 3.7 0 2.1 1.6 3.7 3.7 3.7 2.1 0 3.6-1.6 3.6-3.7 0-2.1-1.5-3.7-3.6-3.7Z" />
    <path d="M5.1 19.4c.7-3.3 3.4-5.1 7-5.1 3.6 0 6.2 1.8 6.8 5.1" />
  </svg>
);

export const UserCheck: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M9.7 4.6c-2 0-3.5 1.5-3.5 3.5s1.5 3.5 3.5 3.5c2 0 3.4-1.5 3.4-3.5s-1.4-3.5-3.4-3.5Z" />
    <path d="M3.6 19.2c.6-3.1 3-4.8 6.1-4.8 1.8 0 3.3.5 4.4 1.5" />
    <path d="M15.8 12.6c.8.8 1.4 1.5 1.8 2 1.1-1.7 2.3-3.2 3.7-4.5" />
  </svg>
);

export const UserPlus: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M9.6 4.6c-2 0-3.5 1.5-3.5 3.5s1.5 3.5 3.5 3.5c2 0 3.4-1.5 3.4-3.5s-1.4-3.5-3.4-3.5Z" />
    <path d="M3.6 19.2c.6-3.1 3-4.8 6.1-4.8 1.9 0 3.4.5 4.5 1.5" />
    <path d="M18.6 9.3v5.4" />
    <path d="M15.9 12h5.4" />
  </svg>
);

export const Users: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M9.2 5.2c-1.8 0-3.2 1.4-3.2 3.2s1.4 3.2 3.2 3.2 3.1-1.4 3.1-3.2-1.3-3.2-3.1-3.2Z" />
    <path d="M3.4 18.8c.5-2.9 2.7-4.4 5.8-4.4s5.3 1.5 5.8 4.4" />
    <path d="M15.8 6.2c1.4.3 2.4 1.5 2.4 3 0 1.4-.9 2.6-2.2 2.9" />
    <path d="M17.3 14.9c1.9.5 3.1 1.8 3.5 3.9" />
  </svg>
);

// Artisan dial / settings icon with subtle asymmetric inner ring
export const Settings: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12 3.2c1 0 1.4.8 1.7 1.6.3.7 1 .9 1.7.6.8-.3 1.7-.1 2.2.7.5.7.2 1.6-.2 2.2-.4.7-.1 1.4.6 1.7.8.3 1.5.8 1.5 1.9 0 1-.8 1.5-1.6 1.7-.7.3-.9 1-.6 1.7.3.8.1 1.7-.7 2.2-.7.5-1.6.2-2.2-.2-.7-.4-1.4-.1-1.7.6-.3.8-.8 1.5-1.8 1.5-1 0-1.5-.8-1.7-1.6-.3-.7-1-.9-1.7-.6-.8.3-1.7.1-2.2-.7-.5-.7-.2-1.6.2-2.2.4-.7.1-1.4-.6-1.7-.8-.3-1.5-.8-1.5-1.8 0-1 .8-1.5 1.6-1.7.7-.3.9-1 .6-1.7-.3-.8-.1-1.7.7-2.2.7-.5 1.6-.2 2.2.2.7.4 1.4.1 1.7-.6.3-.8.8-1.6 1.9-1.6Z" />
    <path d="M12.1 9.1c-1.7 0-3 1.3-3 2.9s1.3 3 3 3c1.6 0 2.9-1.3 2.9-3 0-1.6-1.3-2.9-2.9-2.9Z" />
  </svg>
);

// Organic flowing "They Owe Me" inward arrow + delicate liquidity arc (Emerald glow compatible)
export const ArrowDownLeft: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M17.4 6.6c-3.4 3.1-6.8 6.4-10.3 10.1" />
    <path d="M15.4 16.9c-2.7.2-5.6.2-8.5 0-.2-2.8-.2-5.7 0-8.4" />
    <path d="M18.8 11.1c-.4 1.5-1.1 2.8-2.2 3.8" opacity="0.6" />
  </svg>
);

// Organic flowing "I Owe Them" outward arrow + delicate arc (Rose/Lotus Pink glow compatible)
export const ArrowUpRight: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M6.6 17.4c3.4-3.1 6.8-6.4 10.3-10.1" />
    <path d="M8.6 7.1c2.7-.2 5.6-.2 8.5 0 .2 2.8.2 5.7 0 8.4" />
    <path d="M5.2 12.9c.4-1.5 1.1-2.8 2.2-3.8" opacity="0.6" />
  </svg>
);

export const ArrowLeft: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M19 12.1c-4.5-.2-9.2-.2-13.8 0" />
    <path d="M10.8 6.4c-2 2-3.9 3.8-5.8 5.6 1.9 1.9 3.8 3.7 5.8 5.7" />
  </svg>
);

export const ArrowRight: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M5 11.9c4.5.2 9.2.2 13.8 0" />
    <path d="M13.2 6.3c2 1.9 3.9 3.8 5.8 5.7-1.9 1.8-3.8 3.7-5.8 5.6" />
  </svg>
);

export const ArrowLeftRight: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M5.4 8.3h13.1" />
    <path d="M15.1 5.1c1.3 1.1 2.5 2.2 3.6 3.2-1.1 1.1-2.3 2.1-3.6 3.2" />
    <path d="M18.6 15.7H5.5" />
    <path d="M8.9 12.5c-1.3 1.1-2.5 2.2-3.6 3.2 1.1 1.1 2.3 2.1 3.6 3.2" />
  </svg>
);

export const Plus: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12.1 5.1c-.2 4.6-.2 9.2 0 13.8" />
    <path d="M5.1 12.1c4.6-.2 9.2-.2 13.8 0" />
  </svg>
);

export const PlusCircle: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12 3.3c-4.8 0-8.6 3.7-8.7 8.6-.1 5 3.7 8.8 8.7 8.8 4.9 0 8.7-3.8 8.7-8.7 0-4.9-3.8-8.7-8.7-8.7Z" />
    <path d="M12 8.4v7.2" />
    <path d="M8.4 12h7.2" />
  </svg>
);

export const MinusCircle: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12 3.3c-4.8 0-8.6 3.7-8.7 8.6-.1 5 3.7 8.8 8.7 8.8 4.9 0 8.7-3.8 8.7-8.7 0-4.9-3.8-8.7-8.7-8.7Z" />
    <path d="M8.4 12h7.2" />
  </svg>
);

export const Check: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.8 12.8c1.7 1.5 3.2 3.1 4.6 4.7 3.1-4.1 6.4-7.7 9.9-10.9" />
  </svg>
);

export const CheckCircle: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M20.4 11.2c.4 5.1-3.4 9.3-8.4 9.4-4.9.1-8.7-3.8-8.6-8.7.1-4.9 4-8.6 8.9-8.5 1.4 0 2.7.3 3.9 1" />
    <path d="M8.8 12.2c1.1 1.1 2.1 2.2 3 3.3 2.5-3.4 5.2-6.4 8.2-9" />
  </svg>
);

export const CheckCircle2 = CheckCircle;

export const X: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M6.4 6.4c3.6 3.7 7.4 7.4 11.2 11.2" />
    <path d="M17.6 6.4c-3.7 3.6-7.4 7.4-11.2 11.2" />
  </svg>
);

export const ChevronDown: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M6.3 9.2c1.9 2.1 3.8 4 5.7 5.7 1.9-1.7 3.8-3.6 5.7-5.7" />
  </svg>
);

export const ChevronUp: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M6.3 14.8c1.9-2.1 3.8-4 5.7-5.7 1.9 1.7 3.8 3.6 5.7 5.7" />
  </svg>
);

export const ChevronLeft: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M14.8 6.3c-2.1 1.9-4 3.8-5.7 5.7 1.7 1.9 3.6 3.8 5.7 5.7" />
  </svg>
);

export const ChevronRight: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M9.2 6.3c2.1 1.9 4 3.8 5.7 5.7-1.7 1.9-3.6 3.8-5.7 5.7" />
  </svg>
);

export const LayoutGrid: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.2 5.4c0-1 .8-1.7 1.9-1.7h2.7c1.1 0 1.8.8 1.8 1.9v2.6c0 1-.8 1.8-1.9 1.8H6c-1 0-1.8-.8-1.8-1.9V5.4Z" />
    <path d="M13.5 5.4c0-1 .8-1.7 1.9-1.7H18c1.1 0 1.8.8 1.8 1.9v2.6c0 1-.8 1.8-1.9 1.8h-2.5c-1 0-1.9-.8-1.9-1.9V5.4Z" />
    <path d="M4.2 15.2c0-1 .8-1.8 1.9-1.8h2.7c1.1 0 1.8.8 1.8 1.9v2.6c0 1-.8 1.8-1.9 1.8H6c-1 0-1.8-.8-1.8-1.9v-2.6Z" />
    <path d="M13.5 15.2c0-1 .8-1.8 1.9-1.8H18c1.1 0 1.8.8 1.8 1.9v2.6c0 1-.8 1.8-1.9 1.8h-2.5c-1 0-1.9-.8-1.9-1.9v-2.6Z" />
  </svg>
);

export const LayoutDashboard: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.2 5.3c0-1 .8-1.8 1.8-1.8h3.4c1 0 1.7.8 1.7 1.8v5.1c0 1-.7 1.8-1.7 1.8H6c-1 0-1.8-.8-1.8-1.8V5.3Z" />
    <path d="M13.8 5.2c0-.9.7-1.7 1.7-1.7h2.7c1 0 1.7.8 1.7 1.7v2.4c0 .9-.7 1.6-1.7 1.6h-2.7c-1 0-1.7-.7-1.7-1.6V5.2Z" />
    <path d="M13.8 13.4c0-.9.7-1.7 1.7-1.7h2.7c1 0 1.7.8 1.7 1.7v5.2c0 1-.7 1.8-1.7 1.8h-2.7c-1 0-1.7-.8-1.7-1.8v-5.2Z" />
    <path d="M4.2 16.4c0-.9.8-1.6 1.8-1.6h3.4c1 0 1.7.7 1.7 1.6v2.2c0 1-.7 1.8-1.7 1.8H6c-1 0-1.8-.8-1.8-1.8v-2.2Z" />
  </svg>
);

export const Archive: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M3.8 5.6c0-.9.8-1.6 1.8-1.6h12.8c1 0 1.8.7 1.8 1.6v1.6c0 .9-.8 1.6-1.8 1.6H5.6c-1 0-1.8-.7-1.8-1.6V5.6Z" />
    <path d="M5.2 8.9v9.2c0 1.1.9 2 2.1 2h9.4c1.2 0 2.1-.9 2.1-2V8.9" />
    <path d="M9.6 13.1c1.6.3 3.2.3 4.8 0" />
  </svg>
);

export const History: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.2 10.6c.8-4 4.3-6.9 8.5-6.8 4.6.1 8.2 3.8 8.2 8.4 0 4.6-3.7 8.3-8.4 8.3-3.4 0-6.4-2-7.7-5" />
    <path d="M3.6 6.2v4.4h4.4" />
    <path d="M12.2 8.1v4.2l2.9 1.7" />
  </svg>
);

export const TrendingUp: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M3.6 16.9c2.4-2.8 4.4-4.7 6.1-5.6 1.5-.8 2.4 1.8 3.9 1.1 1.7-.8 3.8-3 6.5-6.2" />
    <path d="M15.4 6.1c1.7-.1 3.3-.1 4.9.1.1 1.6.1 3.2 0 4.8" />
    <circle cx="20.1" cy="6.2" r="0.9" fill="currentColor" stroke="none" opacity="0.65" />
  </svg>
);

export const BarChart3: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.1 4.2v14.2c0 .9.7 1.5 1.6 1.5h14.4" />
    <path d="M8.8 16.2c-.1-1.9-.1-3.8 0-5.7" />
    <path d="M13.4 16.2c-.1-3.1-.1-6.1 0-9.1" />
    <path d="M18 16.2c-.1-1.4-.1-2.8 0-4.2" />
  </svg>
);

export const Wallet: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.2 7.2c0-1.4 1.1-2.5 2.6-2.5h10.8c1.1 0 1.9.8 1.9 1.9v1.5" />
    <path d="M4.2 7.4v10c0 1.4 1.1 2.4 2.6 2.4h11.4c1.3 0 2.3-1 2.3-2.3v-6.9c0-1.3-1-2.3-2.3-2.3H6.7c-1.4 0-2.5-.4-2.5-1.4Z" />
    <circle cx="16.9" cy="14" r="1.15" fill="currentColor" stroke="none" />
  </svg>
);

export const CreditCard: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M3.4 8.2c0-1.5 1.2-2.7 2.8-2.7h11.6c1.6 0 2.8 1.2 2.8 2.7v7.6c0 1.5-1.2 2.7-2.8 2.7H6.2c-1.6 0-2.8-1.2-2.8-2.7V8.2Z" />
    <path d="M3.6 10.2c5.6-.3 11.2-.3 16.8 0" />
    <path d="M7.1 14.8c1.4-.1 2.8-.1 4.1 0" />
  </svg>
);

export const MessageSquare: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.4 6.6c0-1.4 1.2-2.6 2.7-2.6h9.8c1.5 0 2.7 1.2 2.7 2.6v7.1c0 1.4-1.2 2.6-2.7 2.6H9.8c-1.8 1.2-3.5 2.4-5.2 3.5.3-1.4.4-2.5.3-3.6-.3-.5-.5-1.2-.5-2V6.6Z" />
    <path d="M8.4 9.5c2.2-.2 4.6-.2 7 0" opacity="0.7" />
    <path d="M8.4 12.6c1.5-.1 3-.1 4.4 0" opacity="0.7" />
  </svg>
);

export const Edit3: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M13.6 5.4c1.3-1.3 2.7-1.6 3.9-.4 1.1 1.1.9 2.6-.4 3.9l-8.4 8.4c-.7.7-1.6 1.1-2.6 1.3l-2.3.4.5-2.3c.2-1 .6-1.9 1.3-2.6l8-8.7Z" />
    <path d="M12.2 6.9c1.2 1.1 2.4 2.3 3.5 3.5" />
    <path d="M12.4 19.3c2.5.1 5 .1 7.6 0" opacity="0.6" />
  </svg>
);

export const Edit2 = Edit3;

export const Trash2: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.4 6.7c5-.3 10.2-.3 15.2 0" />
    <path d="M9.1 6.5c.2-1.5 1.1-2.3 2.9-2.3s2.7.8 2.9 2.3" />
    <path d="M6.4 7.1c.3 3.7.6 7.4.8 11 .1 1.1 1 1.9 2.2 1.9h5.2c1.2 0 2.1-.8 2.2-1.9.2-3.6.5-7.3.8-11" />
    <path d="M10.2 10.6v5.6" opacity="0.75" />
    <path d="M13.8 10.6v5.6" opacity="0.75" />
  </svg>
);

export const Calendar: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.2 8.2c0-1.4 1.1-2.5 2.5-2.5h10.6c1.4 0 2.5 1.1 2.5 2.5v9.4c0 1.4-1.1 2.5-2.5 2.5H6.7c-1.4 0-2.5-1.1-2.5-2.5V8.2Z" />
    <path d="M8.1 3.7c-.2 1.1-.2 2.2 0 3.2" />
    <path d="M15.9 3.7c.2 1.1.2 2.2 0 3.2" />
    <path d="M4.4 10.2c5-.2 10.2-.2 15.2 0" />
    <circle cx="15.1" cy="14.6" r="1.05" fill="currentColor" stroke="none" />
  </svg>
);

export const Search: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M10.9 4.1c-3.7 0-6.6 2.9-6.6 6.6 0 3.6 2.9 6.6 6.6 6.6 3.7 0 6.5-2.9 6.5-6.6 0-3.7-2.8-6.6-6.5-6.6Z" />
    <path d="M15.8 15.6c1.4 1.4 2.9 2.8 4.3 4.3" />
  </svg>
);

export const Eye: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M2.6 12c2.2-3.7 5.5-5.6 9.4-5.6 3.9 0 7.2 1.9 9.4 5.6-2.2 3.7-5.5 5.6-9.4 5.6-3.9 0-7.2-1.9-9.4-5.6Z" />
    <circle cx="12" cy="12" r="2.4" />
  </svg>
);

export const EyeOff: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M3.6 3.8 20.4 20.2" />
    <path d="M10.3 6.6c.6-.1 1.1-.2 1.7-.2 3.9 0 7.2 1.9 9.4 5.6-.7 1.2-1.6 2.3-2.6 3.1" />
    <path d="M6.4 8.2C4.9 9.2 3.6 10.5 2.6 12c2.2 3.7 5.5 5.6 9.4 5.6 1.3 0 2.6-.2 3.7-.7" />
  </svg>
);

export const AlertTriangle: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M10.5 4.8c.7-1.2 2.3-1.2 3 0l6.6 11.4c.7 1.2-.2 2.7-1.6 2.7H5.5c-1.4 0-2.3-1.5-1.6-2.7l6.6-11.4Z" />
    <path d="M12 9.2c-.1 1.5-.1 3 0 4.4" />
    <circle cx="12" cy="16.1" r="0.95" fill="currentColor" stroke="none" />
  </svg>
);

export const AlertCircle: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12 3.4c-4.8 0-8.6 3.8-8.6 8.6s3.8 8.6 8.6 8.6 8.6-3.8 8.6-8.6-3.8-8.6-8.6-8.6Z" />
    <path d="M12 8.1v4.8" />
    <circle cx="12" cy="15.8" r="0.95" fill="currentColor" stroke="none" />
  </svg>
);

export const Palette: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12.3 3.6c-4.9-.1-8.8 3.6-8.9 8.3-.1 4.2 3.1 7.6 7.1 7.6 1.3 0 2.1-.8 1.9-2-.2-.9.4-1.7 1.3-1.7h2.2c2.6 0 4.5-1.8 4.5-4.3 0-4.4-3.6-7.8-8.1-7.9Z" />
    <circle cx="7.9" cy="10.4" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="11.2" cy="7.5" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="15.3" cy="8.9" r="1.05" fill="currentColor" stroke="none" />
  </svg>
);

export const BookOpen: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12 6.6c-2-1.4-4.7-1.9-7.6-1.4-.4.1-.7.4-.7.8v11c0 .5.4.9.9.8 2.7-.4 5.3.1 7.4 1.5" />
    <path d="M12 6.6c2-1.4 4.7-1.9 7.6-1.4.4.1.7.4.7.8v11c0 .5-.4.9-.9.8-2.7-.4-5.3.1-7.4 1.5V6.6Z" />
  </svg>
);

export const ShieldCheck: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12 3.4c2.6 1.5 5.1 2.1 7.6 2.2.2 5.4-1.5 10.5-7.6 14.9-6.1-4.4-7.8-9.5-7.6-14.9 2.5-.1 5-.7 7.6-2.2Z" />
    <path d="M9.1 12.1c.9.9 1.7 1.7 2.4 2.5 1.4-1.8 2.9-3.4 4.4-4.8" />
  </svg>
);

export const Coins: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <ellipse cx="9.2" cy="8.4" rx="5.2" ry="2.4" />
    <path d="M4 8.4v4.4c0 1.3 2.3 2.4 5.2 2.4" />
    <ellipse cx="14.9" cy="13.2" rx="5.1" ry="2.3" />
    <path d="M9.8 13.2v4.3c0 1.3 2.3 2.3 5.1 2.3s5.1-1 5.1-2.3v-4.3" />
  </svg>
);

export const RotateCcw: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.2 10.6c.9-3.9 4.4-6.7 8.4-6.6 4.5.1 8 3.7 8 8.2 0 4.5-3.6 8.2-8.2 8.2-3.2 0-6-1.8-7.4-4.5" />
    <path d="M3.6 6.2v4.5h4.5" />
  </svg>
);

export const RefreshCw: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M19.8 9.2c-1-3.1-3.9-5.3-7.4-5.4-3.7-.1-6.9 2.1-8.1 5.4" />
    <path d="M20.3 5.1v4.2h-4.2" />
    <path d="M4.2 14.8c1 3.1 3.9 5.3 7.4 5.4 3.7.1 6.9-2.1 8.1-5.4" />
    <path d="M3.7 18.9v-4.2h4.2" />
  </svg>
);

export const RotateCw: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M19.8 10.6c-.9-3.9-4.4-6.7-8.4-6.6-4.5.1-8 3.7-8 8.2 0 4.5 3.6 8.2 8.2 8.2 3.2 0 6-1.8 7.4-4.5" />
    <path d="M20.4 6.2v4.5h-4.5" />
  </svg>
);

export const Send: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M20.3 4.2 3.8 10.7c-.5.2-.5.9 0 1.1l6.4 2.6 2.6 6.4c.2.5.9.5 1.1 0L20.3 4.2Z" />
    <path d="M10.2 14.4c3-2.9 6.2-6 9.8-9.8" />
  </svg>
);

export const Phone: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M6.4 4.2c.6-.2 1.3.1 1.6.7l1.5 3c.2.5.1 1.1-.3 1.5l-1.3 1.3c1 1.9 2.5 3.5 4.5 4.5l1.3-1.3c.4-.4 1-.5 1.5-.3l3 1.5c.6.3.9 1 .7 1.6-.4 1.6-1.7 2.8-3.4 2.9-5.8.3-11.2-5-10.9-10.9.1-1.7 1.3-3 2.8-3.5Z" />
  </svg>
);

export const FileText: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M6.2 3.8h7.4l4.6 4.6v10.2c0 1-.8 1.8-1.9 1.8H6.2c-1 0-1.8-.8-1.8-1.8V5.6c0-1 .8-1.8 1.8-1.8Z" />
    <path d="M13.5 3.9v4.5h4.5" />
    <path d="M8.4 12.1c2.4-.2 4.9-.2 7.2 0" />
    <path d="M8.4 15.6c1.9-.1 3.8-.1 5.6 0" />
  </svg>
);

export const FileSpreadsheet: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M6.2 3.8h7.4l4.6 4.6v10.2c0 1-.8 1.8-1.9 1.8H6.2c-1 0-1.8-.8-1.8-1.8V5.6c0-1 .8-1.8 1.8-1.8Z" />
    <path d="M13.5 3.9v4.5h4.5" />
    <path d="M8.1 11.8h7.8v5.6H8.1z" />
    <path d="M12 11.8v5.6" />
    <path d="M8.1 14.6h7.8" />
  </svg>
);

export const Lock: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M5.6 11.4c0-1.1.9-2 2-2h8.8c1.1 0 2 .9 2 2v6.4c0 1.2-.9 2.1-2 2.1H7.6c-1.1 0-2-.9-2-2.1v-6.4Z" />
    <path d="M8.4 9.4V7.3c0-2 1.6-3.5 3.6-3.5s3.6 1.5 3.6 3.5v2.1" />
    <circle cx="12" cy="14.6" r="1.05" fill="currentColor" stroke="none" />
  </svg>
);

export const Mail: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.1 7.2c0-1.1.9-2 2.1-2h11.6c1.2 0 2.1.9 2.1 2v9.6c0 1.1-.9 2-2.1 2H6.2c-1.2 0-2.1-.9-2.1-2V7.2Z" />
    <path d="M4.6 7.5c2.5 2.1 4.9 3.9 7.4 5.3 2.5-1.4 4.9-3.2 7.4-5.3" />
  </svg>
);

export const AtSign: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <circle cx="12" cy="12" r="3.4" />
    <path d="M15.4 8.6v4.1c0 1.4 1 2.2 2.1 2.2 1.7 0 2.8-1.5 2.8-3.6 0-4.4-3.5-7.6-8.1-7.6-4.7 0-8.4 3.6-8.4 8.3s3.7 8.3 8.5 8.3c2.1 0 3.9-.6 5.4-1.7" />
  </svg>
);

export const Link2: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M9.6 15.8H7.2c-2 0-3.5-1.6-3.5-3.8s1.5-3.8 3.5-3.8h2.4" />
    <path d="M14.4 8.2h2.4c2 0 3.5 1.6 3.5 3.8s-1.5 3.8-3.5 3.8h-2.4" />
    <path d="M8.6 12c2.3-.2 4.6-.2 6.8 0" />
  </svg>
);

export const Sparkles: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12.2 3.5c.6 3.6 1.7 5.3 5.2 6-3.5.7-4.6 2.4-5.2 6-.6-3.6-1.7-5.3-5.2-6 3.5-.7 4.6-2.4 5.2-6Z" />
    <path d="M6 15.4c.3 1.4.8 2.1 2.2 2.4-1.4.3-1.9 1-2.2 2.4-.3-1.4-.8-2.1-2.2-2.4 1.4-.3 1.9-1 2.2-2.4Z" />
    <circle cx="18.2" cy="16.4" r="1" fill="currentColor" stroke="none" opacity="0.7" />
  </svg>
);

export const SlidersHorizontal: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.2 7.4h15.6" />
    <path d="M4.2 12.1h15.6" />
    <path d="M4.2 16.8h15.6" />
    <circle cx="9.2" cy="7.4" r="1.7" fill="currentColor" />
    <circle cx="15.3" cy="12.1" r="1.7" fill="currentColor" />
    <circle cx="10.6" cy="16.8" r="1.7" fill="currentColor" />
  </svg>
);

export const Filter: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.2 5.4h15.6c.4 0 .6.5.3.9l-5.7 6.3v5.1c0 .4-.4.7-.8.5l-3.2-1.4c-.3-.1-.4-.4-.4-.7v-3.5L3.9 6.3c-.3-.4-.1-.9.3-.9Z" />
  </svg>
);

export const Upload: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12 15.2V4.8" />
    <path d="M7.9 8.6c1.4-1.4 2.7-2.7 4.1-4 1.4 1.3 2.7 2.6 4.1 4" />
    <path d="M4.4 15.4v2.3c0 1.2.9 2.1 2.1 2.1h11c1.2 0 2.1-.9 2.1-2.1v-2.3" />
  </svg>
);

export const Download: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12 4.6v10.6" />
    <path d="M7.9 11.4c1.4 1.4 2.7 2.7 4.1 4 1.4-1.3 2.7-2.6 4.1-4" />
    <path d="M4.4 15.4v2.3c0 1.2.9 2.1 2.1 2.1h11c1.2 0 2.1-.9 2.1-2.1v-2.3" />
  </svg>
);

export const LogOut: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M10.4 4.4H6.5c-1.2 0-2.1.9-2.1 2.1v11c0 1.2.9 2.1 2.1 2.1h3.9" />
    <path d="M10.2 12h9.4" />
    <path d="M16.1 8.4c1.3 1.2 2.5 2.4 3.7 3.6-1.2 1.2-2.4 2.4-3.7 3.6" />
  </svg>
);

export const Clock: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12 3.5c-4.7 0-8.5 3.8-8.5 8.5s3.8 8.5 8.5 8.5 8.5-3.8 8.5-8.5-3.8-8.5-8.5-8.5Z" />
    <path d="M12 7.6v4.6l3.2 1.8" />
  </svg>
);

export const Zap: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M13.2 3.4 5.8 13h5.4l-1.1 7.6L18.2 11h-5.4l.4-7.6Z" />
  </svg>
);

export const Camera: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.2 8.8c0-1.1.9-2 2-2h2l1.4-2h4.8l1.4 2h2c1.1 0 2 .9 2 2v8.2c0 1.1-.9 2-2 2H6.2c-1.1 0-2-.9-2-2V8.8Z" />
    <circle cx="12" cy="12.8" r="3" />
  </svg>
);

export const Crop: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M7.2 3.8v11.4c0 .9.7 1.6 1.6 1.6h11.4" />
    <path d="M3.8 7.2h11.4c.9 0 1.6.7 1.6 1.6v11.4" />
  </svg>
);

export const ZoomIn: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M10.8 4.2c-3.6 0-6.5 2.9-6.5 6.5s2.9 6.5 6.5 6.5 6.5-2.9 6.5-6.5-2.9-6.5-6.5-6.5Z" />
    <path d="M15.6 15.6 20 20" />
    <path d="M10.8 8.1v5.2" />
    <path d="M8.2 10.7h5.2" />
  </svg>
);

export const Maximize2: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M14.6 4.4h5v5" />
    <path d="M19.5 4.5 14 10" />
    <path d="M9.4 19.6h-5v-5" />
    <path d="M4.5 19.5 10 14" />
  </svg>
);

export const Minimize2: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M14 9.8h5" />
    <path d="M14.2 5v5" />
    <path d="M19.5 4.5 14.2 9.8" />
    <path d="M10 14.2H5" />
    <path d="M9.8 19v-5" />
    <path d="M4.5 19.5 9.8 14.2" />
  </svg>
);

export const Mic: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M9.2 6.8c0-1.6 1.2-2.8 2.8-2.8s2.8 1.2 2.8 2.8v4.6c0 1.6-1.2 2.8-2.8 2.8s-2.8-1.2-2.8-2.8V6.8Z" />
    <path d="M6.4 11.4c0 3.1 2.5 5.4 5.6 5.4s5.6-2.3 5.6-5.4" />
    <path d="M12 16.9v3.2" />
    <path d="M9.4 20.1h5.2" />
  </svg>
);

export const MicOff: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.2 4.2 19.8 19.8" />
    <path d="M9.4 6.2c.3-1.3 1.4-2.2 2.6-2.2 1.6 0 2.8 1.2 2.8 2.8v3.9" />
    <path d="M6.4 11.4c0 2.8 2 5 4.9 5.4" />
    <path d="M12 16.9v3.2" />
  </svg>
);

export const Volume2: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M5.2 9.8H8l4.2-3.4v11.2L8 14.2H5.2c-.7 0-1.2-.5-1.2-1.2v-2c0-.7.5-1.2 1.2-1.2Z" />
    <path d="M15.6 9.3c1 1.5 1 3.9 0 5.4" />
    <path d="M18.2 7c1.8 2.8 1.8 7.2 0 10" />
  </svg>
);

export const VolumeX: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M5.2 9.8H8l4.2-3.4v11.2L8 14.2H5.2c-.7 0-1.2-.5-1.2-1.2v-2c0-.7.5-1.2 1.2-1.2Z" />
    <path d="M15.6 9.6 20 14.4" />
    <path d="M20 9.6 15.6 14.4" />
  </svg>
);

export const Copy: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M9.2 8.4c0-1 .8-1.8 1.8-1.8h6.8c1 0 1.8.8 1.8 1.8v8.8c0 1-.8 1.8-1.8 1.8H11c-1 0-1.8-.8-1.8-1.8V8.4Z" />
    <path d="M14.8 6.6V5.4c0-.9-.8-1.6-1.8-1.6H6.2c-1 0-1.8.7-1.8 1.6v8.8c0 .9.8 1.6 1.8 1.6h1.2" />
  </svg>
);

export const Paperclip: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M19.2 10.6 11.4 18.4c-1.8 1.8-4.7 1.8-6.4 0-1.8-1.8-1.8-4.6 0-6.4l8.3-8.3c1.2-1.2 3.1-1.2 4.3 0 1.2 1.2 1.2 3.1 0 4.3l-7.9 7.9c-.6.6-1.6.6-2.2 0-.6-.6-.6-1.6 0-2.2l6.9-6.9" />
  </svg>
);

export const Compass: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12 3.4c-4.8 0-8.6 3.8-8.6 8.6s3.8 8.6 8.6 8.6 8.6-3.8 8.6-8.6-3.8-8.6-8.6-8.6Z" />
    <path d="M15.4 8.6 13.7 13.7 8.6 15.4 10.3 10.3 15.4 8.6Z" />
  </svg>
);

export const Globe: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M3.6 12h16.8" />
    <path d="M12 3.4c2.4 2.4 3.5 5.4 3.5 8.6 0 3.2-1.1 6.2-3.5 8.6-2.4-2.4-3.5-5.4-3.5-8.6 0-3.2 1.1-6.2 3.5-8.6Z" />
  </svg>
);

export const DollarSign: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12 3.4v17.2" />
    <path d="M16.2 7.4c0-1.6-1.9-2.7-4.2-2.7s-4 1.1-4 2.7c0 1.9 2 2.4 4.1 2.9 2.2.5 4.3 1.1 4.3 3.1 0 1.8-1.9 3-4.4 3-2.5 0-4.3-1.1-4.4-2.9" />
  </svg>
);

export const BellOff: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4 4.2 19.8 19.8" />
    <path d="M9.6 5.4c.7-.3 1.5-.5 2.4-.5 3.2 0 5.4 2.4 5.6 5.8.1 1.3.4 2.4.8 3.3" />
    <path d="M6.4 10.6c-.1 2.4-.8 4-2 5.2-.3.3-.1.9.4.9h9.8" />
    <path d="M10.1 19.2c.5 1.1 1.4 1.7 2.2 1.7.7 0 1.4-.4 1.9-1.2" />
  </svg>
);

export const CheckCheck: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M3.4 13.1c1.3 1.3 2.5 2.6 3.6 3.9 2.6-3.4 5.3-6.4 8.2-9.2" />
    <path d="M10.8 15.6c.4.4.8.9 1.2 1.4 2.6-3.4 5.3-6.4 8.2-9.2" />
  </svg>
);

export const ShieldAlert: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12 3.4c2.6 1.5 5.1 2.1 7.6 2.2.2 5.4-1.5 10.5-7.6 14.9-6.1-4.4-7.8-9.5-7.6-14.9 2.5-.1 5-.7 7.6-2.2Z" />
    <path d="M12 8.6v4.1" />
    <circle cx="12" cy="15.3" r="0.95" fill="currentColor" stroke="none" />
  </svg>
);

export const ArrowDown: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12 4.8v14.1" />
    <path d="M6.6 13.5c1.8 1.9 3.6 3.8 5.4 5.5 1.8-1.7 3.6-3.6 5.4-5.5" />
  </svg>
);

export const Info: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12 3.4c-4.8 0-8.6 3.8-8.6 8.6s3.8 8.6 8.6 8.6 8.6-3.8 8.6-8.6-3.8-8.6-8.6-8.6Z" />
    <path d="M12 11.4v4.7" />
    <circle cx="12" cy="8.1" r="0.95" fill="currentColor" stroke="none" />
  </svg>
);

export const CalendarClock: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M19.8 10.4V8.2c0-1.4-1.1-2.5-2.5-2.5H6.7c-1.4 0-2.5 1.1-2.5 2.5v9.4c0 1.4 1.1 2.5 2.5 2.5h4.2" />
    <path d="M8.1 3.7v3.2" />
    <path d="M15.9 3.7v3.2" />
    <path d="M4.4 10.2h15.2" />
    <circle cx="16.4" cy="16.4" r="3.9" />
    <path d="M16.4 14.5v2l1.3.8" />
  </svg>
);

export const Loader2: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M12 3.5c4.7 0 8.5 3.8 8.5 8.5 0 2.5-1.1 4.8-2.8 6.3" />
    <path d="M12 20.5c-4.7 0-8.5-3.8-8.5-8.5 0-2.3.9-4.4 2.4-6" opacity="0.35" />
  </svg>
);

export const ArrowUpDown: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M7.8 4.4v14.8" />
    <path d="M4.6 7.8c1.1-1.2 2.2-2.4 3.2-3.5 1.1 1.1 2.1 2.3 3.2 3.5" />
    <path d="M16.2 19.6V4.8" />
    <path d="M13 16.2c1.1 1.2 2.2 2.4 3.2 3.5 1.1-1.1 2.1-2.3 3.2-3.5" />
  </svg>
);

export const ExternalLink: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M14.4 4.4h5.2v5.2" />
    <path d="M10.4 13.6c3.1-3.1 6.1-6.2 9.2-9.2" />
    <path d="M18.4 13.6v4.2c0 1.2-.9 2-2 2H6.2c-1.1 0-2-.8-2-2V7.6c0-1.1.9-2 2-2h4.2" />
  </svg>
);

export const AlertOctagon: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M8.4 3.5h7.2l4.9 4.9v7.2l-4.9 4.9H8.4l-4.9-4.9V8.4l4.9-4.9Z" />
    <path d="M12 8.2v4.6" />
    <circle cx="12" cy="15.8" r="0.95" fill="currentColor" stroke="none" />
  </svg>
);

export const Printer: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M7.2 8.8V4.8c0-.7.6-1.2 1.3-1.2h7c.7 0 1.3.5 1.3 1.2v4" />
    <path d="M6.4 16.6H5.2c-1 0-1.8-.8-1.8-1.8v-4.2c0-1 .8-1.8 1.8-1.8h13.6c1 0 1.8.8 1.8 1.8v4.2c0 1-.8 1.8-1.8 1.8h-1.2" />
    <path d="M7.2 14.2h9.6v5.2c0 .6-.5 1-1.1 1H8.3c-.6 0-1.1-.4-1.1-1v-5.2Z" />
    <circle cx="17.2" cy="11.6" r="0.85" fill="currentColor" stroke="none" />
  </svg>
);

export const SearchX: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M10.9 4.1c-3.7 0-6.6 2.9-6.6 6.6 0 3.6 2.9 6.6 6.6 6.6 3.7 0 6.5-2.9 6.5-6.6 0-3.7-2.8-6.6-6.5-6.6Z" />
    <path d="M15.8 15.6c1.4 1.4 2.9 2.8 4.3 4.3" />
    <path d="M9.1 8.9 12.7 12.5" />
    <path d="M12.7 8.9 9.1 12.5" />
  </svg>
);

// Hand-crafted QR matrix icon for FIB QuickPay
export const QrCode: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <rect x="3.8" y="3.8" width="6.2" height="6.2" rx="1.4" />
    <rect x="14" y="3.8" width="6.2" height="6.2" rx="1.4" />
    <rect x="3.8" y="14" width="6.2" height="6.2" rx="1.4" />
    <circle cx="6.9" cy="6.9" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="17.1" cy="6.9" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="6.9" cy="17.1" r="0.9" fill="currentColor" stroke="none" />
    <path d="M14 14.2h2.6v2.4H14" />
    <path d="M19.8 14.2v5.6h-5.4" />
    <path d="M17.2 17.2h.4" />
  </svg>
);

// Artisan bank emblem for First Iraqi Bank rail
export const Landmark: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M3.6 9.5c2.8-1.9 5.6-3.7 8.4-5.4 2.8 1.7 5.6 3.5 8.4 5.4" />
    <path d="M4.2 10.2h15.6" />
    <path d="M6.4 10.4v6.8" />
    <path d="M10.1 10.4v6.8" />
    <path d="M13.9 10.4v6.8" />
    <path d="M17.6 10.4v6.8" />
    <path d="M3.4 19.6c5.7.4 11.5.4 17.2 0" />
  </svg>
);

// Hand-crafted mobile device icon for "Scan with FIB App"
export const Smartphone: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <rect x="6.5" y="2.8" width="11" height="18.4" rx="2.4" />
    <path d="M10.2 5.4h3.6" opacity="0.6" />
    <circle cx="12" cy="18.2" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

// Hand-crafted optical QR viewfinder scan icon
export const ScanLine: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <path d="M4.2 8.2V6.2c0-1.1.9-2 2-2h2" />
    <path d="M15.8 4.2h2c1.1 0 2 .9 2 2v2" />
    <path d="M19.8 15.8v2c0 1.1-.9 2-2 2h-2" />
    <path d="M8.2 19.8h-2c-1.1 0-2-.9-2-2v-2" />
    <path d="M5.5 12h13" strokeLinecap="round" />
  </svg>
);

export const Share: React.FC<OrganicIconProps> = (props) => (
  <svg {...baseProps(props)}>
    <circle cx="17.5" cy="5.5" r="2.6" />
    <circle cx="6.5" cy="12" r="2.6" />
    <circle cx="17.5" cy="18.5" r="2.6" />
    <path d="M8.8 10.7 15.2 6.8" />
    <path d="M8.8 13.3 15.2 17.2" />
  </svg>
);
