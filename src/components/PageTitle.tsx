type PageTitleProps = {
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  action?: React.ReactNode;
  before?: React.ReactNode;
};

export function PageTitle({ title, description, action, before }: PageTitleProps) {
  return (
    <header className="py-2">
      {before ? <div className="mb-3">{before}</div> : null}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1 className="text-4xl font-bold leading-tight tracking-normal text-foreground">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8A8A8A]">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
