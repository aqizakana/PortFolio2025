import { globalStyle, style, keyframes } from '@vanilla-extract/css';

export const pageTitle = style({
	viewTransitionName: 'page-title',
});

export const pageContent = style({
	viewTransitionName: 'page-content',
});

// Keyframes definitions
const fadeIn = keyframes({
	'0%': { opacity: 0 },
	'100%': { opacity: 1 },
});

const fadeOutKeyframes = keyframes({
	'0%': { opacity: 1 },
	'100%': { opacity: 0 },
});

const slideOutUpKeyframes = keyframes({
	'0%': { transform: 'translateY(0)' },
	'100%': { transform: 'translateY(-100%)' },
});

const slideInDownKeyframes = keyframes({
	'0%': { transform: 'translateY(-100%)' },
	'100%': { transform: 'translateY(0)' },
});

export const fadeInAnimation = style({
	animation: `${fadeIn} 0.3s ease-in-out`,
});

// Global styles using vanilla-extract
globalStyle('html', {
	boxSizing: 'border-box',
});

globalStyle('body', {
	margin: 0,
	padding: 0,
	overflowX: 'hidden',
	height: '100vh',
});

// View Transitions API support
globalStyle('::view-transition-old(root)', {
	animation: `${fadeOutKeyframes} 0.3s ease-out`,
});

globalStyle('::view-transition-new(root)', {
	animation: `${fadeIn} 0.3s ease-in`,
});

globalStyle('::view-transition-old(page-content)', {
	animation: `${slideOutUpKeyframes} 0.3s ease-out`,
});

globalStyle('::view-transition-new(page-content)', {
	animation: `${slideInDownKeyframes} 0.3s ease-in`,
});
