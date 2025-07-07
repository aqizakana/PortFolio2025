'use client';

import './GlobalHeader.css';
import { useState, useEffect } from 'react';

const Footer = () => {
	const [scrollRate, setScrollRate] = useState(0);

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			const documentHeight =
				document.documentElement.scrollHeight - window.innerHeight;
			const rate = documentHeight > 0 ? currentScrollY / documentHeight : 0;

			setScrollRate(rate);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<footer className="header">
			<span className="name" id="name" style={{ opacity: scrollRate }}>
				UOTA
			</span>
		</footer>
	);
};

export default Footer;
