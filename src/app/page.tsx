import LoginForm from "./login-form";

export default function Home() {
  const vehicles = [
    {
      plate: "34 KPT 123",
      model: "BMW 320i",
      color: "Karbon Siyah",
      status: "Boyama",
      statusColor: "bg-orange-400",
      progress: 60,
      note: "Arka çamurluk + tampon boyanıyor",
    },
    {
      plate: "06 TKN 456",
      model: "Volvo XC60",
      color: "Buz Gri",
      status: "Parça bekleniyor",
      statusColor: "bg-yellow-300",
      progress: 35,
      note: "Ön tampon siparişte",
    },
    {
      plate: "35 KPR 789",
      model: "Toyota Corolla",
      color: "Şafak Beyaz",
      status: "Tamamlandı",
      statusColor: "bg-lime-400",
      progress: 100,
      note: "Teslimata hazır",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-6 py-12 md:flex-row md:items-center md:gap-16 md:px-12">
        <section className="flex-1 space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 ring-1 ring-white/10">
            KaportaAPP
            <span className="h-1 w-1 rounded-full bg-lime-400" />
            Güvenli Giriş
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Kaporta süreçlerinizi güvenle yönetin.
          </h1>
          <p className="max-w-xl text-base text-slate-300">
            Yetkili kullanıcılar için tek giriş noktası. Araç dosyaları, parçalar, işçilik adımları ve
            sigorta incelemelerine buradan erişin.
          </p>
          <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              Role & permission tabanlı kontrol
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              Token’lı sigorta inceleme linkleri
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              Parça ve işlem durum takibi
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              Fotoğraf ve eksper yönetimi
            </div>
          </div>
        </section>

        <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold">Giriş yap</h2>
            <p className="text-sm text-slate-200">Kurum e-posta adresiniz ve şifrenizle devam edin.</p>
          </div>
          <LoginForm />
        </section>
      </div>

    </div>
  );
}
