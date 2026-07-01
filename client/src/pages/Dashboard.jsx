// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Building2, CalendarCheck2, TrendingUp, Search } from "lucide-react";
import api from "../api/client";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import Card from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import { PageLoader } from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.get(`/players?search=${encodeURIComponent(search)}`).then((res) => {
        setSearchResults(res.data.slice(0, 6));
      });
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  if (loading) return <PageLoader />;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="لوحة التحكم" subtitle="نظرة سريعة على الأكاديمية اليوم" />

      {/* بحث سريع */}
      <div className="relative mb-6 max-w-md">
        <div className="relative">
          <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث سريع عن لاعب بالاسم..."
            className="pr-10"
          />
        </div>
        {searchResults.length > 0 && (
          <Card className="absolute mt-1.5 w-full z-20 overflow-hidden p-1.5 shadow-lg">
            {searchResults.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/players/${p.id}`)}
                className="w-full text-right px-3 py-2 rounded-lg hover:bg-cream flex items-center justify-between gap-2"
              >
                <span className="font-semibold text-sm text-ink">{p.name}</span>
                <span className="text-xs text-muted">{p.branchName}</span>
              </button>
            ))}
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="إجمالي اللاعبين" value={data.totals.players} accent="red" />
        <StatCard icon={Building2} label="عدد الفروع" value={data.totals.branches} accent="gold" />
        <StatCard
          icon={CalendarCheck2}
          label="حضور وغياب اليوم"
          value={`${data.today.present} / ${data.today.totalMarked}`}
          sub={`غائب: ${data.today.absent}`}
          accent="success"
        />
        <StatCard
          icon={TrendingUp}
          label="نسبة الالتزام العامة"
          value={data.totals.overallAttendanceRate !== null ? `${data.totals.overallAttendanceRate}%` : "—"}
          accent="ink"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* توزيع الفروع */}
        <Card className="p-5">
          <h3 className="font-display font-bold text-ink mb-4">اللاعبين حسب الفرع</h3>
          {data.branchBreakdown.length === 0 ? (
            <EmptyState title="لا توجد فروع بعد" message="أضف فرعك الأول من صفحة الفروع" />
          ) : (
            <div className="space-y-3">
              {data.branchBreakdown.map((b) => (
                <div key={b.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-ink">{b.name}</p>
                    <p className="text-xs text-muted">{b.playersCount} لاعب</p>
                  </div>
                  <Badge variant={b.attendanceRate >= 70 ? "success" : "neutral"}>
                    {b.attendanceRate !== null ? `${b.attendanceRate}% حضور` : "بدون بيانات"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* آخر القياسات */}
        <Card className="p-5">
          <h3 className="font-display font-bold text-ink mb-4">آخر القياسات المضافة</h3>
          {data.recentMeasurements.length === 0 ? (
            <EmptyState title="لا توجد قياسات بعد" message="سجّل أول قياس من ملف أي لاعب" />
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin pl-1">
              {data.recentMeasurements.map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/players/${m.playerId}`)}
                  className="w-full text-right flex items-center justify-between border-b border-border last:border-0 pb-2.5 last:pb-0 hover:bg-cream/50 rounded-lg px-1.5 -mx-1.5"
                >
                  <div>
                    <p className="font-semibold text-sm text-ink">{m.playerName}</p>
                    <p className="text-xs text-muted">{m.date}</p>
                  </div>
                  <Badge variant="gold">قياس جديد</Badge>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
