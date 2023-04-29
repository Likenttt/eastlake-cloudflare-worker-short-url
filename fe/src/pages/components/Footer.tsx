import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="text-center text-black py-4 mt-8 fixed bottom-0 w-full bg-white">
      <p>
        Made by{" "}
        <a
          href="https://blog.li2niu.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-black"
        >
          li2niu
        </a>{" "}
        with &#10084; in Wuhan, China
      </p>
    </footer>
  );
};

export default Footer;
