export function Loading() {
  return <div className="py-10 text-center text-sm text-neutral-500">Carregando...</div>;
}

export function Empty({ text }: { text: string }) {
  return <div className="py-10 text-center text-sm text-neutral-500">{text}</div>;
}

export function Thread({ messages }: { messages: { direction: string; content: string }[] }) {
  return (
    <div className="space-y-1.5">
      {messages.map((m, i) => (
        <div key={i} className={`msg ${m.direction === "in" ? "msg-in" : "msg-out"}`}>
          {m.content}
        </div>
      ))}
    </div>
  );
}
