interface CDItem {
	imgSrc: string;
	title: string;
	description: string;
	path: string;
}

const List: CDItem[] = [
	{
		imgSrc: '/example.png',
		title: 'moon',
		description: 'CDジャケットの3Dモデルです。',
		path: '/',
	},
	{
		imgSrc: '/example2.png',
		title: 'scientist',
		description: 'CDジャケットの3Dモデルです。',
		path: '/',
	},
	{
		imgSrc: '/example3.png',
		title: 'Share',
		description: 'CDジャケットの3Dモデルです。',
		path: '/',
	},
];

export { List, type CDItem };
