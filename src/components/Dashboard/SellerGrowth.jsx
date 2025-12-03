/* eslint-disable react/prop-types */
import { FaChevronDown } from "react-icons/fa";
import { useState } from "react";
import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useGetSellerOverviewQuery } from "../../Redux/api/dashboard/dashboardApi";

export default function SellerGrowth() {
  const currentYear = dayjs().year();
  const startYear = 2023;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isOpen, setIsOpen] = useState(false);

  const years = Array.from(
    { length: currentYear - startYear + 1 },
    (_, index) => startYear + index
  );

  const handleSelect = (year) => {
    setSelectedYear(year);
    setIsOpen(false);
  };

  const { data: salesData, isLoading } = useGetSellerOverviewQuery({
    year: selectedYear,
  });
  const sellerData = salesData?.data || salesData || {};
  const monthlyData =
    sellerData?.monthlyData ||
    sellerData?.data?.monthlyData ||
    [];
  const apiMonths = Array.isArray(monthlyData) ? monthlyData : [];
  const chartData = apiMonths.map((m) => {
    const month = m?.monthName || "";
    const appUsers = Number(m?.appUsers ?? 0);
    const activeUsers = Number(m?.activeUsers ?? 0);
    return { month, appUsers, activeUsers };
  });
  const currentStats = sellerData?.currentStats || sellerData?.data?.currentStats || null;
  const totals = sellerData?.totals || sellerData?.data?.totals || null;
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { month, appUsers, activeUsers } = payload[0].payload;
      return (
        <div className="px-3 py-2 bg-white border rounded shadow">
          <p className="font-semibold text-black">{`Month: ${month}`}</p>
          <p className="text-[#FF914C]">{`Sellers: ${appUsers}`}</p>
          <p className="text-[#083E24]">{`Customers: ${activeUsers}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="flex flex-col items-center gap-5 my-5 md:flex-row md:justify-between lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Seller Growth</h1>
        </div>
        <div className="relative w-full md:w-32">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full px-3 py-2 transition bg-white border border-gray-300 rounded-md"
          >
            <span className="text-[#0B704E]">{selectedYear}</span>
            <FaChevronDown className="text-[#0B704E] w-5 h-5 ml-5" />
          </button>
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 overflow-y-auto text-lg bg-white border border-gray-300 rounded-md shadow-lg max-h-60">
              {years.map((year) => (
                <div
                  key={year}
                  onClick={() => handleSelect(year)}
                  className={`p-2 cursor-pointer hover:bg-gray-100 transition ${
                    year === selectedYear ? "bg-gray-200" : ""
                  }`}
                >
                  {year}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* KPIs from currentStats and totals */}
      {/* <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-3">
        <div className="p-4 bg-white border rounded-md">
          <p className="text-sm text-gray-500">Total Sellers</p>
          <p className="text-2xl font-semibold text-[#0B704E]">{totals?.totalSellers ?? 0}</p>
        </div>
        <div className="p-4 bg-white border rounded-md">
          <p className="text-sm text-gray-500">Total Active Sellers</p>
          <p className="text-2xl font-semibold text-[#0B704E]">{totals?.totalActiveSellers ?? 0}</p>
        </div>
        <div className="p-4 bg-white border rounded-md">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-sm text-gray-700">{currentStats?.monthName || "-"}</p>
          <div className="flex gap-6 mt-1">
            <div>
              <p className="text-xs text-gray-500">App Users</p>
              <p className="text-lg font-semibold">{currentStats?.appUsers ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Active Users</p>
              <p className="text-lg font-semibold">{currentStats?.activeUsers ?? 0}</p>
            </div>
          </div>
        </div>
      </div> */}
      <div className="w-full h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center w-full h-full text-gray-500">Loading...</div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center w-full h-full text-gray-500">No data to display</div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            barGap={100}
            barCategoryGap={40}
          >
            <XAxis tickLine={false} dataKey="month" />
            <YAxis tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="appUsers"
              fill="#FF914C"
              barSize={30}
              radius={[5, 5, 0, 0]}
              name="Sellers"
            />
            <Bar
              dataKey="activeUsers"
              fill="#083E24"
              barSize={30}
              radius={[5, 5, 0, 0]}
              name="Customers"
            />
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
    </>
  );
}
