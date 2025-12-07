const mockFiles = [
  {
    plate: "34 KPT 123",
    customer: "Ayşe Yılmaz",
    brandModel: "BMW 320i",
    color: "Karbon Siyah",
    status: "open",
    note: "Arka çamurluk + tampon boyanıyor",
  },
  {
    plate: "06 TKN 456",
    customer: "Mehmet Demir",
    brandModel: "Volvo XC60",
    color: "Buz Gri",
    status: "pending",
    note: "Ön tampon siparişte",
  },
  {
    plate: "35 KPR 789",
    customer: "Elif Arslan",
    brandModel: "Toyota Corolla",
    color: "Şafak Beyaz",
    status: "completed",
    note: "Teslim öncesi kontrol",
  },
];

const statusStyles: Record<string, string> = {
  open: "bg-sky-400 text-slate-950",
  pending: "bg-amber-300 text-slate-950",
  completed: "bg-lime-400 text-slate-950",
};

export default function VehicleFilesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl md:flex-row md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Araç Dosyaları</p>
          <h1 className="text-3xl font-semibold">Dosya yönetimi</h1>
          <p className="text-sm text-slate-300">Durum takibi, eksper ve hızlı notlar.</p>
        </div>
        <div className="flex gap-3">
          <input
            type="search"
            placeholder="Plaka / müşteri / dosya no"
            className="w-72 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-lime-300/70 focus:outline-none"
          />
          <button className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)]">
            Yeni dosya
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {mockFiles.map((file) => (
          <div
            key={file.plate}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg hover:border-lime-300/70"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Plaka</p>
                <p className="text-lg font-semibold text-white">{file.plate}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[file.status]}`}>
                {file.status}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-200">
              <p className="font-semibold">{file.brandModel}</p>
              <p>{file.color}</p>
              <p className="text-slate-300">Müşteri: {file.customer}</p>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
              {file.note}
            </div>
            <div className="mt-4 flex gap-2 text-xs text-slate-200">
              <button className="flex-1 rounded-lg border border-white/10 px-3 py-2 hover:border-lime-300/70 hover:text-white">
                Detay
              </button>
              <button className="flex-1 rounded-lg border border-white/10 px-3 py-2 hover:border-lime-300/70 hover:text-white">
                Parçalar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
