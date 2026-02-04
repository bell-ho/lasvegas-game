// Breakpoints
// Mobile: 0 - 480px
// Tablet: 481px - 1024px
// Desktop: 1025px+

const breakpoints = {
  mobile: 480,
  tablet: 1024,
};

export const mobile = `
  @media (max-width: ${breakpoints.mobile}px)
`;

export const tablet = `
  @media (min-width: ${breakpoints.mobile + 1}px) and (max-width: ${breakpoints.tablet}px)
`;

export const tabletAndBelow = `
  @media (max-width: ${breakpoints.tablet}px)
`;

export const desktop = `
  @media (min-width: ${breakpoints.tablet + 1}px)
`;

// Legacy exports for compatibility
export const tabletH = `
  @media (max-width: 767px)
`;

export const tabletV = `
  @media (max-width: 1023px)
`;
