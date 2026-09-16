export type AvatarPerson = {
  name: string;
  image?: string | null;
};

export function Avatar({
  person,
  className = "size-8",
}: {
  person: AvatarPerson;
  className?: string;
}) {
  return (
    <span
      title={person.name}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-page text-xs text-ink ${className}`}
    >
      {person.image ? (
        // The image is decorative: the person's name is already announced by the row.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.image} alt="" className="size-full object-cover" />
      ) : (
        person.name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

export function AvatarStack({
  people,
  limit = 3,
}: {
  people: readonly ({ id: string } & AvatarPerson)[];
  limit?: number;
}) {
  const visible = people.slice(0, limit);
  const remaining = people.length - visible.length;

  return (
    <div className="flex items-center gap-1">
      {visible.map((person) => (
        <span key={person.id} className="rounded-full border-2 border-panel">
          <Avatar person={person} />
        </span>
      ))}
      {remaining > 0 ? (
        <span
          aria-label={`${remaining} more participants`}
          className="flex size-8 items-center justify-center rounded-full border-2 border-panel bg-page text-xs text-ink"
        >
          {remaining}+
        </span>
      ) : null}
    </div>
  );
}
