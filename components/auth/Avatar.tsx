import { colorFor, initialsOf } from '@/lib/auth/initials';

type Props = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  className?: string;
};

/** Foto do usuário ou, sem foto, as iniciais sobre uma cor estável. */
export function Avatar({ name, email, image, className = 'h-9 w-9 text-sm' }: Props) {
  const identity = name || email || '';
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold text-white ${className}`}
      style={{ background: colorFor(identity) }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initialsOf(identity)
      )}
    </span>
  );
}
