import Image from "next/image";
import Link from "next/link";

export type HomeCircleItem = {
  id: string;
  title: string;
  imageUrl: string | null;
  href: string;
};

export function HomeCircleNav({ items }: { items: HomeCircleItem[] }) {
  if (items.length === 0) return null;

  return (
    <section id="products" className="bg-white pb-6 pt-1 sm:pb-8 sm:pt-2">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-nowrap justify-start gap-3 overflow-x-auto pb-1 scrollbar-hide sm:gap-4 lg:grid lg:grid-cols-8 lg:overflow-visible lg:pb-0">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group flex w-[7.5rem] shrink-0 flex-col items-center sm:w-32 lg:w-full"
            >
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-zinc-100">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="128px"
                  />
                ) : null}
              </div>
              <p className="mt-2.5 w-full px-0.5 text-center text-[11px] font-semibold leading-snug text-zinc-800 line-clamp-2">
                {item.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
