import React from 'react';
import Header from '@components/share/GlobalHeader';
import Footer from '@components/share/GlobalFooter';
import '@styles/global.css';

export default function RotLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ja">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>uota</title>
				<link rel="icon" href="/favicon.ico" />
			</head>

			<body>
				<Header />
				<main>{children}</main>
				<Footer />
			</body>
		</html>
	);
}
