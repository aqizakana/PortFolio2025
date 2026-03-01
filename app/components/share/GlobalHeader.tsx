'use client';

import Link from 'next/link';
import { useCallback, useEffect } from 'react';
import './GlobalHeader.css';
import HeaderBV from './HeaderBV';

const GlobalHeader = () => {
	const handleScroll = useCallback(() => {
		// Calculate scroll rate for potential future use
		const currentScrollY = window.scrollY;
		const documentHeight =
			document.documentElement.scrollHeight - window.innerHeight;
		const scrollRate = documentHeight > 0 ? currentScrollY / documentHeight : 0;

		// TODO: Use scroll rate for animations or effects
		void scrollRate;
	}, []);

	useEffect(() => {
		// Set initial scroll rate
		handleScroll();

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	return (
		<header className="header" role="banner">
			<div className="header-container" aria-hidden="true">
				<HeaderBV />

				<nav className="nav" role="navigation" aria-label="Main navigation">
					<Link className="link" id="name" href="/" aria-label="Site name">
						UOTA
					</Link>
					<Link className="link" href="/about/" aria-label="About page">
						About
					</Link>
					<Link className="link" href="/lineup/" aria-label="Lineup page">
						Lineup
					</Link>
					<Link
						className="link"
						href="https://soundcloud.com/kkntaxfdsncb"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="SoundCloud profile (opens in new tab)"
					>
						SoundCloud
					</Link>
					<Link className="link" href="/test/" aria-label="Test page">
						Test
					</Link>
				</nav>
			</div>
		</header>
	);
};

export default GlobalHeader;
