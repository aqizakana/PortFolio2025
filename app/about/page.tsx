import { about } from '@styles/about.css';
const About = () => {
	return (
		<div className={about.container}>
			<h1>About </h1>
			<ul className={about.list}>
				<li className={about.item}>魚田真之介</li>
				<li className={about.item}>2002年生まれ。兵庫県出身。</li>
				<li className={about.item}>
					建築(高専)→デザイン(大学)→フロントエンドエンジニア(現在)
				</li>
			</ul>
		</div>
	);
};

export default About;
