import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Server, Globe, Shield, RefreshCw, AlertTriangle, Clock, Zap, ExternalLink, MapPin, Filter, Layers, XCircle, Download, FileJson, FileSpreadsheet } from 'lucide-react';

const INITIAL_SERVICES = [
  { 
    id: 1, 
    name: 'Cloudflare', 
    type: 'CDN & Security', 
    icon: 'shield', 
    url: 'https://www.cloudflarestatus.com/',
    regions: [
      { id: 'us', name: 'K. Amerika', status: 'online', latency: 12 },
      { id: 'eu', name: 'Avrupa', status: 'online', latency: 18 },
      { id: 'asia', name: 'Asya/Pasifik', status: 'online', latency: 85 }
    ]
  },
  { 
    id: 2, 
    name: 'AWS (Amazon)', 
    type: 'Cloud Infrastructure', 
    icon: 'server', 
    url: 'https://health.aws.amazon.com/',
    regions: [
      { id: 'us', name: 'US-East-1', status: 'online', latency: 45 },
      { id: 'eu', name: 'EU-Central', status: 'online', latency: 32 },
      { id: 'asia', name: 'AP-Northeast', status: 'online', latency: 120 }
    ]
  },
  { 
    id: 3, 
    name: 'Google Cloud', 
    type: 'Cloud & Compute', 
    icon: 'globe', 
    url: 'https://status.cloud.google.com/',
    regions: [
      { id: 'us', name: 'Americas', status: 'online', latency: 28 },
      { id: 'eu', name: 'Europe', status: 'online', latency: 25 },
      { id: 'asia', name: 'Asia', status: 'online', latency: 90 }
    ]
  },
  { 
    id: 4, 
    name: 'Microsoft Azure', 
    type: 'Enterprise Cloud', 
    icon: 'server', 
    url: 'https://azure.status.microsoft/',
    regions: [
      { id: 'us', name: 'US Regions', status: 'online', latency: 34 },
      { id: 'eu', name: 'Europe', status: 'online', latency: 30 },
      { id: 'asia', name: 'Asia Pacific', status: 'online', latency: 110 }
    ]
  },
  { 
    id: 5, 
    name: 'Lumen (Level 3)', 
    type: 'Tier 1 Carrier', 
    icon: 'activity', 
    url: 'https://status.lumen.com/',
    regions: [
      { id: 'us', name: 'North America', status: 'online', latency: 18 },
      { id: 'eu', name: 'Trans-Atlantic', status: 'online', latency: 78 },
      { id: 'asia', name: 'Trans-Pacific', status: 'online', latency: 145 }
    ]
  },
  { 
    id: 6, 
    name: 'Akamai', 
    type: 'Enterprise CDN', 
    icon: 'globe', 
    url: 'https://www.akamai.com/system-status',
    regions: [
      { id: 'us', name: 'Americas', status: 'online', latency: 15 },
      { id: 'eu', name: 'EMEA', status: 'online', latency: 22 },
      { id: 'asia', name: 'APJ', status: 'online', latency: 95 }
    ]
  },
];

const App = () => {
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filtreleme State'leri
  const [filterLevel, setFilterLevel] = useState('ALL'); // ALL, error, warning, info
  const [filterService, setFilterService] = useState('ALL'); // ALL, Cloudflare, AWS...

  // Log eklerken artık serviceName bilgisini de saklıyoruz
  const addLog = (message, type = 'info', serviceName = 'System') => {
    const time = new Date().toLocaleTimeString('tr-TR');
    // Log geçmişini 50'ye çıkardım ki filtreleyince veri kalsın
    setLogs(prev => [{ id: Date.now() + Math.random(), time, message, type, serviceName }, ...prev].slice(0, 50));
  };

  // Filtrelenmiş Logları Hesapla
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const levelMatch = filterLevel === 'ALL' || log.type === filterLevel;
      const serviceMatch = filterService === 'ALL' || log.serviceName === filterService;
      return levelMatch && serviceMatch;
    });
  }, [logs, filterLevel, filterService]);

  // İndirme Fonksiyonu
  const downloadLogs = (format) => {
    if (filteredLogs.length === 0) return;

    let content = '';
    let filename = `system_logs_${new Date().getTime()}`;
    let mimeType = '';

    if (format === 'csv') {
      // CSV Header
      content += 'Zaman,Seviye,Servis,Mesaj\n';
      // CSV Rows
      filteredLogs.forEach(log => {
        const cleanMessage = log.message.replace(/,/g, ' '); // Virgülleri temizle
        content += `${log.time},${log.type.toUpperCase()},${log.serviceName},${cleanMessage}\n`;
      });
      filename += '.csv';
      mimeType = 'text/csv;charset=utf-8;';
    } else if (format === 'json') {
      content = JSON.stringify(filteredLogs, null, 2);
      filename += '.json';
      mimeType = 'application/json;charset=utf-8;';
    }

    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateOverallStatus = (regions) => {
    const downCount = regions.filter(r => r.status === 'down').length;
    const degradedCount = regions.filter(r => r.status === 'degraded').length;
    
    if (downCount === regions.length) return 'down';
    if (downCount > 0) return 'partial';
    if (degradedCount > 0) return 'degraded';
    return 'online';
  };

  const checkStatus = () => {
    setLoading(true);
    
    setTimeout(() => {
      const updatedServices = services.map(service => {
        const updatedRegions = service.regions.map(region => {
          const rand = Math.random();
          let newStatus = 'online';
          
          if (rand > 0.94) newStatus = 'degraded';
          if (rand > 0.99) newStatus = 'down';

          if (region.status !== newStatus) {
            // Servis ismini parametre olarak gönderiyoruz
            if (newStatus === 'down') addLog(`${region.name} bölgesinde kritik KESİNTİ!`, 'error', service.name);
            else if (newStatus === 'degraded') addLog(`${region.name} yanıt sürelerinde artış.`, 'warning', service.name);
            else if (region.status === 'down') addLog(`${region.name} tekrar çevrimiçi.`, 'success', service.name);
          }

          let latencyChange = Math.floor(Math.random() * 15) - 7;
          let newLatency = region.latency + latencyChange;
          const baseLatency = region.id === 'asia' ? 90 : region.id === 'eu' ? 20 : 10; 
          
          if (newLatency < baseLatency) newLatency = baseLatency;
          if (newStatus === 'degraded') newLatency += 120;
          if (newStatus === 'down') newLatency = 0;

          return { ...region, status: newStatus, latency: newLatency };
        });

        return { 
          ...service, 
          regions: updatedRegions,
          status: calculateOverallStatus(updatedRegions)
        };
      });

      setServices(updatedServices);
      setLastUpdated(new Date());
      setLoading(false);
    }, 600);
  };

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(checkStatus, 4000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, services]);

  useEffect(() => {
    checkStatus();
    addLog("Sistem başlatıldı. Tüm servisler izleniyor.", "info", "System");
  }, []);

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'server': return <Server className="w-6 h-6" />;
      case 'globe': return <Globe className="w-6 h-6" />;
      case 'shield': return <Shield className="w-6 h-6" />;
      case 'activity': return <Activity className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]';
      case 'degraded': return 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]';
      case 'partial': return 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)] animate-pulse';
      case 'down': return 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.9)] animate-pulse';
      default: return 'bg-slate-600';
    }
  };

  const getRegionColor = (status) => {
    switch (status) {
      case 'online': return 'bg-emerald-400';
      case 'degraded': return 'bg-yellow-400';
      case 'down': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getPingColor = (ms, status) => {
    if (status === 'down') return 'text-red-500';
    if (ms > 150) return 'text-red-400';
    if (ms > 80) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans p-4 md:p-8 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-800/60 pb-6">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="relative bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
            <Activity className="w-8 h-8 text-indigo-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Global Backbone Monitor</h1>
            <div className="flex items-center gap-2">
              <span className="flex w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Canlı Bölgesel İzleme v2.1</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800 backdrop-blur-sm">
           <div className="flex items-center gap-2 px-3 border-r border-slate-700/50 py-1">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-mono text-slate-300">
              {lastUpdated.toLocaleTimeString('tr-TR')}
            </span>
          </div>
          
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              autoRefresh 
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh && !loading ? 'animate-spin' : ''} ${loading ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Canlı' : 'Duraklatıldı'}
          </button>
        </div>
      </header>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {services.map((service) => (
          <div 
            key={service.id} 
            className="group relative bg-slate-900/40 border border-slate-800/60 hover:border-slate-600/80 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/5"
          >
            <div className="p-5 pb-4 border-b border-slate-800/60 relative">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-[0.08] blur-2xl rounded-bl-full transition-colors duration-500 pointer-events-none
                ${service.status === 'online' ? 'from-emerald-400' : service.status === 'down' ? 'from-red-500' : 'from-orange-400'}
              `}></div>

              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/50 group-hover:border-indigo-500/30 group-hover:text-white transition-all`}>
                    {getIcon(service.icon)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-100 group-hover:text-indigo-300 transition-colors">{service.name}</h3>
                    <p className="text-[11px] text-slate-500 font-mono uppercase tracking-wide">{service.type}</p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full mt-1 ${getStatusColor(service.status)}`}></div>
              </div>
            </div>

            <div className="p-4 space-y-2 bg-slate-950/20">
              {service.regions.map((region) => (
                <div key={region.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-800/30 transition-colors border border-transparent hover:border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getRegionColor(region.status)} ${region.status !== 'online' ? 'animate-pulse' : ''}`}></div>
                    <span className="text-sm text-slate-300 font-medium">{region.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                     {region.status !== 'online' && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase 
                          ${region.status === 'down' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}
                        `}>
                          {region.status === 'down' ? 'DOWN' : 'SLOW'}
                        </span>
                     )}
                     <span className={`text-xs font-mono font-bold w-12 text-right ${getPingColor(region.latency, region.status)}`}>
                       {region.status === 'down' ? '--' : `${region.latency}ms`}
                     </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="px-4 py-3 bg-slate-900/30 border-t border-slate-800/60 flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${service.status === 'online' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                  <span className={`text-xs font-semibold uppercase ${service.status === 'online' ? 'text-emerald-500' : service.status === 'down' ? 'text-red-500' : 'text-orange-400'}`}>
                    {service.status === 'online' ? 'Sistem Normal' : service.status === 'partial' ? 'Kısmi Kesinti' : service.status === 'down' ? 'Hizmet Dışı' : 'Performans Sorunu'}
                  </span>
                </div>
                <a 
                  href={service.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline opacity-80 hover:opacity-100 transition-opacity"
                >
                  Rapor <ExternalLink className="w-3 h-3" />
                </a>
            </div>
          </div>
        ))}
      </div>

      {/* LOG PANELİ (GELİŞTİRİLMİŞ) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-[#090E1A] rounded-xl border border-slate-800 p-0 overflow-hidden flex flex-col shadow-lg">
          
          {/* Log Toolbar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50 gap-4">
            <span className="text-slate-400 text-xs font-bold uppercase flex items-center gap-2 tracking-wider shrink-0">
              <Activity className="w-3 h-3 text-emerald-500" />
              Olay Günlüğü
            </span>

            {/* Filtre ve İndirme Kontrolleri */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              
              {/* Level Filtresi */}
              <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
                <button 
                  onClick={() => setFilterLevel('ALL')}
                  className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${filterLevel === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  TÜMÜ
                </button>
                <button 
                  onClick={() => setFilterLevel('error')}
                  className={`px-3 py-1 text-[10px] font-bold rounded transition-colors flex items-center gap-1 ${filterLevel === 'error' ? 'bg-red-500/20 text-red-400' : 'text-slate-500 hover:text-red-400'}`}
                >
                  CRITICAL
                </button>
                <button 
                  onClick={() => setFilterLevel('warning')}
                  className={`px-3 py-1 text-[10px] font-bold rounded transition-colors flex items-center gap-1 ${filterLevel === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 'text-slate-500 hover:text-yellow-400'}`}
                >
                  WARN
                </button>
                <button 
                  onClick={() => setFilterLevel('info')}
                  className={`px-3 py-1 text-[10px] font-bold rounded transition-colors flex items-center gap-1 ${filterLevel === 'info' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-emerald-400'}`}
                >
                  INFO
                </button>
              </div>

              {/* Servis Filtresi */}
              <div className="relative flex items-center">
                <Layers className="w-3 h-3 text-slate-500 absolute left-2.5 pointer-events-none" />
                <select 
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                  className="pl-8 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-slate-900 appearance-none"
                >
                  <option value="ALL">Tüm Servisler</option>
                  <option value="System">System</option>
                  {INITIAL_SERVICES.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
                 <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[8px]">▼</div>
              </div>

            </div>
          </div>

          {/* Log Listesi */}
          <div className="p-0 h-64 overflow-y-auto custom-scrollbar font-mono text-xs md:text-sm bg-[#050911]">
            {filteredLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                <Filter className="w-8 h-8 opacity-20" />
                <span className="text-xs">Bu filtre kriterlerine uygun kayıt bulunamadı.</span>
                <button onClick={() => {setFilterLevel('ALL'); setFilterService('ALL');}} className="text-indigo-400 hover:underline text-xs">Filtreleri Temizle</button>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="bg-slate-900/50 sticky top-0 text-left text-[10px] uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="p-2 pl-4 w-24">Zaman</th>
                    <th className="p-2 w-20">Seviye</th>
                    <th className="p-2 w-32">Servis</th>
                    <th className="p-2">Mesaj</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
                      <td className="p-2 pl-4 text-slate-500 tabular-nums text-[11px]">{log.time}</td>
                      <td className="p-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase border 
                          ${log.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                            log.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}
                        `}>
                          {log.type === 'error' ? 'CRITICAL' : log.type === 'warning' ? 'WARNING' : 'INFO'}
                        </span>
                      </td>
                      <td className="p-2 text-slate-400 font-semibold text-[11px]">{log.serviceName}</td>
                      <td className="p-2 text-slate-300 group-hover:text-white transition-colors">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Log Footer - Export Buttons */}
          <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center">
            <span>Gösterilen: {filteredLogs.length} / Toplam: {logs.length}</span>
            
            <div className="flex gap-2">
              <button 
                onClick={() => downloadLogs('csv')}
                disabled={filteredLogs.length === 0}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-green-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Excel (CSV) olarak indir"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Excel (CSV)</span>
              </button>
              
              <div className="w-px h-4 bg-slate-800 my-auto"></div>

              <button 
                onClick={() => downloadLogs('json')}
                disabled={filteredLogs.length === 0}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-orange-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="JSON olarak indir"
              >
                <FileJson className="w-3 h-3" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800 p-5 text-sm text-slate-400 flex flex-col justify-between shadow-lg relative overflow-hidden">
           <div className="absolute top-0 right-0 p-2 opacity-10">
             <Download className="w-24 h-24" />
           </div>
           
          <div className="relative z-10">
            <h4 className="text-white font-bold mb-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-400" />
              Veri Dışa Aktarma
            </h4>
            <p className="mb-4 text-xs leading-relaxed text-slate-400">
              Artık filtrelenen logları <strong>Excel (CSV)</strong> veya <strong>JSON</strong> formatında bilgisayarınıza indirebilirsiniz. 
              Bu özellik, filtrelediğiniz (örneğin sadece "CRITICAL" hataları) verileri raporlamanız için idealdir.
            </p>
            
            <div className="space-y-2 mt-4 bg-slate-950/50 p-3 rounded border border-slate-800/50">
              <div className="flex items-center justify-between text-xs">
                 <span className="text-slate-500">Aktif Filtre:</span>
                 <span className="text-indigo-400 font-mono">
                   {filterLevel !== 'ALL' ? filterLevel.toUpperCase() : 'TÜMÜ'} / {filterService !== 'ALL' ? filterService.toUpperCase() : 'TÜMÜ'}
                 </span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-3/4 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
