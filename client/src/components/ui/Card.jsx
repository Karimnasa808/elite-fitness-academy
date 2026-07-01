// src/components/ui/Card.jsx
export default function Card({ children, className = "", notched = false, as: Tag = "div", ...rest }) {
  return (
    <Tag
      className={`bg-cream-card border border-border rounded-2xl ${
        notched ? "notch-tr" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
