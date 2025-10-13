interface CDItem {
	imgSrc: string;
	title: string;
	description: string;
	path: string;
}

const List: CDItem[] = [
	{
		imgSrc: '/example.png',
		title: '文字としての月',
		description: 'CDジャケットの3Dモデルです。',
		path: '/',
	},
	{
		imgSrc: '/example2.png',
		title: '科学者になりたい！',
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
