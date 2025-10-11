export default function Monitoring() {
  return (
    <div className="p-8 text-center">
      <h2 className="text-3xl font-bold text-cyan-400 mb-6">Мониторинг сервера</h2>
      <p className="text-gray-400 mb-8">
        Графики CPU, памяти и температуры от Grafana (Node Exporter).
      </p>

      <div className="flex justify-center">
        <iframe
          src= "http://192.168.0.120:32342/d/7d57716318ee0dddbac5a7f451fb7753/node-exporter-nodes?orgId=1&from=now-1h&to=now&timezone=utc&var-datasource=prometheus&var-cluster=&var-instance=192.168.0.120:9100&refresh=30s"
          width="100%"
          height="900"
          frameBorder="0"
          className="rounded-2xl border border-gray-800 shadow-lg max-w-7xl"
        ></iframe>
      </div>
    </div>
  );
}
