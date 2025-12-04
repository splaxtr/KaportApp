type Props = {
  title: string;
  subtitle?: string;
};

export function SectionTitle({ title, subtitle }: Props) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
