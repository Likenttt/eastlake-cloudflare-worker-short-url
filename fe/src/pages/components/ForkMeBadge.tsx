import React from "react";
import Image from "next/image";

const ForkMeBadge: React.FC = () => {
  return (
    <a
      href="https://github.com/Likenttt/cloudflare-worker-short-url"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div style={{ position: "fixed", top: 0, right: 0, zIndex: 1000 }}>
        <Image
          src="/forkme_right_darkblue.webp"
          alt="Fork me on GitHub"
          width={149}
          height={149}
        />
      </div>
    </a>
  );
};

export default ForkMeBadge;
