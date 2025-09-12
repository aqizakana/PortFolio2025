interface CDItem {
	imgSrc: string;
	title: string;
	description: string;
	path: string;
}

const List: CDItem[] = [
	{
		imgSrc: '/example.png',
		title: 'CDジャケット',
		description: 'CDジャケットの3Dモデルです。',
		path: '/',
	},
	{
		imgSrc: '/example2.png',
		title: 'CDジャケット',
		description: 'CDジャケットの3Dモデルです。',
		path: '/',
	},
	{
		imgSrc: '/example3.png',
		title: 'CDジャケット',
		description: 'CDジャケットの3Dモデルです。',
		path: '/',
	},
];

export { List, type CDItem };
