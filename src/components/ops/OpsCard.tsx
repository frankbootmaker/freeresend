import { type ReactNode } from 'react';

export default function OpsCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <header className="cardhead">
        <h2>{title}</h2>
      </header>
      <div className="cardbody">{children}</div>
    </section>
  );
}
