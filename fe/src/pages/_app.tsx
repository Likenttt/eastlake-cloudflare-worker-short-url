import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { GoogleAnalytics } from "nextjs-google-analytics";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_MEASUREMENT_ID;
export default function App({ Component, pageProps }: AppProps) {
	return (
		<>
			<GoogleAnalytics trackPageViews />
			<Component {...pageProps} />
		</>
	);
}
