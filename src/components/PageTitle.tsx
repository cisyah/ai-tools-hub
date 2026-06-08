type PageTitleProps = {
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  action?: React.ReactNode;
  before?: React.ReactNode;
};

export function PageTitle({ eyebrow, title, description, action, before }: PageTitleProps) {
  return (
    <header className="py-2">
      {before ? <div className="mb-3">{before}</div> : null}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase leading-4 tracking-[0.16em] text-muted-foreground">{eyebrow}</div>
          <h1 className="mt-2 text-3xl font-bold leading-tight tracking-normal text-foreground">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
