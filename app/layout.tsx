import React from 'react';
import './global';
import './global.css';
export default function RotLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>uota</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="/global.css" />
      </head>
      
      <body>
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}