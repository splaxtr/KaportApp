import Link from "next/link";

const cards = [
  {
    title: "Firma Bilgileri",
    desc: "Firma adı, adres, telefon ve vergi bilgilerini düzenle. PDF belgelerinde kullanılır.",
    href: "/settings/company",
  },
  {
    title: "Kullanıcılar ve Roller",
    desc: "Kullanıcı ekle, rol ata ve rolleri yönet.",
    href: "/settings/users",
  },
  {
    title: "İşlem Durumları",
    desc: "İşlem (operation) durumlarını düzenle.",
    href: "/settings/operation-statuses",
  },
  {
    title: "Parça Durumları",
    desc: "Parça durumlarını düzenle.",
    href: "/settings/part-statuses",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Ayarlar</p>
        <h1 className="text-3xl font-semibold">Yönetim ve yapılandırma</h1>
        <p className="text-sm text-slate-300">
          Kullanıcı yönetimi ile işlem/parça durumlarını tek ekrandan düzenleyin.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg transition hover:border-lime-300/60 hover:shadow-[0_15px_40px_rgba(190,242,100,0.18)]"
          >
            <h3 className="text-lg font-semibold text-white group-hover:text-lime-200">{card.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{card.desc}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-lime-300">
              Aç
              <span aria-hidden>→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
