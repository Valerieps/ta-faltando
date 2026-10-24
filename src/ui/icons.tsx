// Line icons, drawn with currentColor so they follow the theme. Decorative: the button around
// each one carries the label.

const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export const TrashIcon = () => (
  <svg {...base}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);

export const CartIcon = () => (
  <svg {...base}>
    <path d="M3 4h2l2.4 11h10.2L20 8H6.2" />
    <circle cx="9.5" cy="19.5" r="1.3" />
    <circle cx="16.5" cy="19.5" r="1.3" />
  </svg>
);

export const PlusIcon = () => (
  <svg {...base}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const PencilIcon = () => (
  <svg {...base}>
    <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
  </svg>
);

export const BackIcon = () => (
  <svg {...base}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const GroupIcon = () => (
  <svg {...base}>
    <path d="M4 6h10M4 12h16M4 18h12" />
  </svg>
);

export const GripIcon = () => (
  <svg {...base}>
    <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" strokeWidth={3.4} />
  </svg>
);

export const MoreIcon = () => (
  <svg {...base}>
    <path d="M6 12h.01M12 12h.01M18 12h.01" strokeWidth={3.4} />
  </svg>
);

export const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg {...base} width={14} height={14} style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform 150ms' }}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export const ListIcon = () => (
  <svg {...base}>
    <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  </svg>
);

export const BookIcon = () => (
  <svg {...base}>
    <path d="M12 6c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-14c-3-.5-6 0-8 1.5zM12 6v14" />
  </svg>
);

export const PersonIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

export const CaretDownIcon = () => (
  <svg {...base}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
