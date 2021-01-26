import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

MyApp.getInitialProps = async (ctx) => {
  fetch("http://localhost:3000/api/features"); // start caching early
  return {};
};

export default MyApp;
