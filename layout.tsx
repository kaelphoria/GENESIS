import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'GENESIS — The Living Intelligence',description:'A private personal intelligence ecosystem.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}
