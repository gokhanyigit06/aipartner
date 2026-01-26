"use client";

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { MenuEngineeringDto, MenuEngineeringCategory } from '@/types/analytics';

interface MenuEngineeringChartProps {
    data: MenuEngineeringDto[];
}

// Kategori renkleri ve isimleri
const categoryConfig = {
    [MenuEngineeringCategory.Star]: {
        name: 'Yıldız Ürün',
        color: '#10b981', // Emerald-500 (Yeşil)
        description: 'Yüksek Satış + Yüksek Kâr'
    },
    [MenuEngineeringCategory.Plow]: {
        name: 'At Ürün',
        color: '#f59e0b', // Amber-500 (Turuncu)
        description: 'Yüksek Satış + Düşük Kâr'
    },
    [MenuEngineeringCategory.Puzzle]: {
        name: 'Bulmaca Ürün',
        color: '#3b82f6', // Blue-500 (Mavi)
        description: 'Düşük Satış + Yüksek Kâr'
    },
    [MenuEngineeringCategory.Dog]: {
        name: 'Köpek Ürün',
        color: '#ef4444', // Red-500 (Kırmızı)
        description: 'Düşük Satış + Düşük Kâr'
    }
};

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as MenuEngineeringDto;
        const config = categoryConfig[data.category];

        return (
            <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 shadow-2xl">
                <p className="font-semibold text-white text-lg mb-2">{data.productName}</p>
                <div className="space-y-1.5 text-sm">
                    <p className="text-gray-300">
                        <span className="font-medium">Kategori:</span>{' '}
                        <span className="font-semibold" style={{ color: config.color }}>
                            {config.name}
                        </span>
                    </p>
                    <p className="text-gray-300">
                        <span className="font-medium">Satış Adedi:</span>{' '}
                        <span className="text-white font-semibold">{data.salesVolume}</span>
                    </p>
                    <p className="text-gray-300">
                        <span className="font-medium">Kâr Marjı:</span>{' '}
                        <span className="text-emerald-400 font-semibold">{data.profitMargin.toFixed(1)}%</span>
                    </p>
                    <p className="text-gray-300">
                        <span className="font-medium">Toplam Gelir:</span>{' '}
                        <span className="text-blue-400 font-semibold">₺{data.revenue.toFixed(2)}</span>
                    </p>
                    <p className="text-gray-300">
                        <span className="font-medium">Toplam Kâr:</span>{' '}
                        <span className="text-green-400 font-semibold">₺{data.totalProfit.toFixed(2)}</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

// Custom Legend
const CustomLegend = () => {
    return (
        <div className="flex flex-wrap justify-center gap-6 mt-6 px-4">
            {Object.entries(categoryConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2 group cursor-pointer">
                    <div
                        className="w-4 h-4 rounded-full transition-transform group-hover:scale-125"
                        style={{ backgroundColor: config.color }}
                    />
                    <div className="text-sm">
                        <p className="font-semibold text-gray-200">{config.name}</p>
                        <p className="text-xs text-gray-400">{config.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function MenuEngineeringChart({ data }: MenuEngineeringChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[500px] bg-gray-800/50 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-lg">Veri bulunamadı</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700 p-6 shadow-2xl">
            <div className="mb-4">
                <h3 className="text-2xl font-bold text-white mb-2">Menü Mühendisliği Analizi</h3>
                <p className="text-gray-400 text-sm">
                    BCG Matrix - Ürünlerin satış hacmi ve kâr marjı bazında kategorize edilmesi
                </p>
            </div>

            <ResponsiveContainer width="100%" height={500}>
                <ScatterChart
                    margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                        type="number"
                        dataKey="salesVolume"
                        name="Satış Adedi"
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af' }}
                        label={{
                            value: 'Satış Adedi',
                            position: 'insideBottom',
                            offset: -10,
                            fill: '#d1d5db',
                            fontSize: 14,
                            fontWeight: 600
                        }}
                    />
                    <YAxis
                        type="number"
                        dataKey="profitMargin"
                        name="Kâr Marjı (%)"
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af' }}
                        label={{
                            value: 'Kâr Marjı (%)',
                            angle: -90,
                            position: 'insideLeft',
                            fill: '#d1d5db',
                            fontSize: 14,
                            fontWeight: 600
                        }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Legend content={<CustomLegend />} />
                    <Scatter
                        name="Ürünler"
                        data={data}
                        fill="#8884d8"
                        shape="circle"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={categoryConfig[entry.category].color}
                                className="transition-all hover:opacity-80 cursor-pointer"
                            />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}
