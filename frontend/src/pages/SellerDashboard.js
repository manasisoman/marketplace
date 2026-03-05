import { useState, useEffect } from "react";
import axios from "axios";
import SummaryCard from "../components/analytics/SummaryCard";
import TopProductsTable from "../components/analytics/TopProductsTable";
import ConversionFunnel from "../components/analytics/ConversionFunnel";

const API = "";

function SellerDashboard({ currentUserId }) {
  const [period, setPeriod] = useState("30d");
  const [salesData, setSalesData] = useState(null);
  const [viewsData, setViewsData] = useState(null);
  const [conversionData, setConversionData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const headers = { "x-user-id": currentUserId };
    try {
      const [salesRes, viewsRes, conversionRes] = await Promise.all([
        axios.get(`${API}/api/analytics/sales?period=${period}`, { headers }),
        axios.get(`${API}/api/analytics/views?period=${period}`, { headers }),
        axios.get(`${API}/api/analytics/conversion?period=${period}`, { headers }),
      ]);
      setSalesData(salesRes.data);
      setViewsData(viewsRes.data);
      setConversionData(conversionRes.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
    setLoading(false);
  };

  const periodOptions = [
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
    { value: "all", label: "All Time" },
  ];

  const revenueColumns = [
    { key: "revenue", label: "Revenue", format: (v) => `$${v.toFixed(2)}` },
  ];

  const quantityColumns = [
    { key: "quantity", label: "Units Sold" },
  ];

  const conversionColumns = [
    { key: "views", label: "Views" },
    { key: "cartAdds", label: "Cart Adds" },
    { key: "purchases", label: "Purchases" },
    { key: "viewToCartRate", label: "View-to-Cart %", format: (v) => `${v}%` },
    { key: "cartToPurchaseRate", label: "Cart-to-Purchase %", format: (v) => `${v}%` },
  ];

  return (
    <div className="seller-dashboard">
      <div className="dashboard-header">
        <h1>Seller Dashboard</h1>
        <div className="period-selector">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              className={`btn period-btn ${period === opt.value ? "active" : ""}`}
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p>Loading analytics...</p>
      ) : (
        <>
          <div className="summary-cards">
            <SummaryCard
              title="Total Revenue"
              value={salesData ? `$${salesData.totalRevenue.toFixed(2)}` : "$0.00"}
              subtitle={`Period: ${period}`}
            />
            <SummaryCard
              title="Total Orders"
              value={salesData ? salesData.totalOrders : 0}
            />
            <SummaryCard
              title="Total Views"
              value={viewsData ? viewsData.totalViews.toLocaleString() : "0"}
              subtitle={`${viewsData ? viewsData.uniqueViewers : 0} unique viewers`}
            />
            <SummaryCard
              title="Conversion Rate"
              value={
                conversionData
                  ? `${conversionData.overallConversion.viewToCartRate}%`
                  : "0%"
              }
              subtitle="Views to Cart"
            />
          </div>

          <div className="dashboard-section">
            <h2>Top Products by Revenue</h2>
            <TopProductsTable
              products={salesData ? salesData.topProductsByRevenue : []}
              columns={revenueColumns}
            />
          </div>

          <div className="dashboard-section">
            <h2>Top Products by Units Sold</h2>
            <TopProductsTable
              products={salesData ? salesData.topProductsByQuantity : []}
              columns={quantityColumns}
            />
          </div>

          <div className="dashboard-section">
            <h2>Conversion Funnel</h2>
            {conversionData && (
              <ConversionFunnel data={conversionData.overallConversion} />
            )}
          </div>

          <div className="dashboard-section">
            <h2>Per-Product Conversion</h2>
            <TopProductsTable
              products={conversionData ? conversionData.perProduct : []}
              columns={conversionColumns}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default SellerDashboard;
