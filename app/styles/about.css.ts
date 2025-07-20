import { style } from '@vanilla-extract/css';
export const about = {
	container: style({
		height: '200px',
		width: '200px',
		display: 'grid',
		backgroundColor: '#f0f0f0',
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center',
		margin: '0 auto',
	}),
	list: style({
		padding: 0,
		margin: 0,
	}),
	item: style({
		display: 'flex',
		textDecoration: 'none',
		listStyle: 'none',
	}),
};
