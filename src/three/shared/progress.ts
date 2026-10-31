/** Fast-changing values shared between GSAP ScrollTriggers and R3F useFrame. Never put these in React state. */
export const heroProgress = { value: 0 }
export const pointer = { x: 0, y: 0, active: false } // normalized -1..1 within the hero
