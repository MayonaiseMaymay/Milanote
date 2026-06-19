"use client";

import { useState } from "react";

type LinkItem = {
  id: number;
  url: string;
  x: number;
  y: number;
};

export default function LinkPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);

  const addLink = () => {
    const url = prompt("Link eingeben:");
    if (!url) return;

    const newLink: LinkItem = {
      id: Date.now(),
      url,
      x: 150,
      y: 150,
    };

    setLinks((prev) => [...prev, newLink]);
  };

  const updatePosition = (id: number, x: number, y: number) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id ? { ...link, x, y } : link
      )
    );
  };

  return (
    <div>
      <button onClick={addLink}>+ Link</button>

      <div style={boardStyle}>
        {links.map((link) => (
          <LinkCard
            key={link.id}
            link={link}
            updatePosition={updatePosition}
          />
        ))}
      </div>
    </div>
  );
}

function LinkCard({
  link,
  updatePosition,
}: {
  link: LinkItem;
  updatePosition: (id: number, x: number, y: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setOffset({
      x: e.clientX - link.x,
      y: e.clientY - link.y,
    });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;

    updatePosition(
      link.id,
      e.clientX - offset.x,
      e.clientY - offset.y
    );
  };

  const onMouseUp = () => setDragging(false);

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{
        ...cardStyle,
        left: link.x,
        top: link.y,
      }}
    >
      <div style={{ fontWeight: "bold" }}>🔗 Link</div>

      <a href={link.url} target="_blank">
        {link.url}
      </a>
    </div>
  );
}

const boardStyle: React.CSSProperties = {
  width: "100%",
  height: "90vh",
  position: "relative",
  background: "#f5f5f5",
};

const cardStyle: React.CSSProperties = {
  position: "absolute",
  width: "220px",
  padding: "10px",
  background: "white",
  borderRadius: "10px",
  boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
  cursor: "grab",
};