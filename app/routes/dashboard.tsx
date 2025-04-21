import * as React from "react";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { BACKEND_URL } from "~/constant";
import type { Route } from "./+types/home";
import { io } from "socket.io-client";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { formatTanggal } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "~/components/ui/breadcrumb";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "~/components/ui/table";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Dashboard | Monitoring Sawi Menggunakan Internet Of Things" }, { name: "Sawiku", content: "Dashboard" }];
}

interface DataSensorType {
	type: "KELEMBAPAN_TANAH" | "SUHU_UDARA";
	value: number;
	createdAt: Date;
}

const socket = io(BACKEND_URL, {
	transports: ["websocket"],
});

const chartConfigKelembapanTanah = {
	kelembapanTanah: {
		label: "Kelembapan Tanah",
	},
	value: {
		label: "Value",
		color: "hsl(var(--chart-1))",
	},
} satisfies ChartConfig;

const chartConfigSuhuUdata = {
	suhuUdara: {
		label: "SuhurUdara",
	},
	value: {
		label: "Value",
		color: "hsl(var(--chart-2))",
	},
} satisfies ChartConfig;

export default function Page() {
	const navigate = useNavigate();

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [data, setData] = useState<{
		kelembapan_tanah: DataSensorType[];
		suhu_udara: DataSensorType[];
	}>({
		kelembapan_tanah: [],
		suhu_udara: [],
	});

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			if (typeof window === "undefined") return;
			const accessToken = Cookies.get("token");
			if (!accessToken) {
				navigate("/login");
				setIsLoading(false);
				return;
			}
			try {
				const response = await fetch(`${BACKEND_URL}/sensor`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});
				if (!response.ok) return;
				const result = await response.json();
				const resultData = result.data;
				const dataKelembapan = resultData?.length > 1 ? resultData.filter((item: DataSensorType) => item.type === "KELEMBAPAN_TANAH").sort((a: DataSensorType, b: DataSensorType) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
				const dataSuhu = resultData?.length > 1 ? resultData.filter((item: DataSensorType) => item.type === "SUHU_UDARA").sort((a: DataSensorType, b: DataSensorType) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
				setData((prev) => ({
					...prev,
					kelembapan_tanah: dataKelembapan,
					suhu_udara: dataSuhu,
				}));
			} catch (error) {
				console.error("Error fetching data:", error);
				Cookies.remove("token");
				navigate("/login");
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();

		if (socket) {
			socket.on("getDataSensor", (data) => {
				const dataKelembapan = data.filter((item: DataSensorType) => item.type === "KELEMBAPAN_TANAH").sort((a: DataSensorType, b: DataSensorType) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
				const dataSuhu = data.filter((item: DataSensorType) => item.type === "SUHU_UDARA").sort((a: DataSensorType, b: DataSensorType) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
				setData((prev) => ({
					...prev,
					kelembapan_tanah: dataKelembapan,
					suhu_udara: dataSuhu,
				}));
			});
		}

		return () => {
			if (socket) {
				socket.off("getDataSensor");
			}
		};
	}, [navigate]);

	const handlerLogout = async (event: React.FormEvent) => {
		event.preventDefault();
		setIsLoading(true);
		setError("");
		try {
			Cookies.remove("token");
			navigate("/login");
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading) return <p>Loading...</p>;

	return (
		<div className="bg-slate-50 h-full pb-16">
			<header className="flex sticky top-0 z-50 w-full items-center border-b bg-white">
				<div className="mx-auto w-[1200px] flex px-4 xl:px-0 h-12 items-center justify-between">
					<Breadcrumb className="block">
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink
									href="/dashboard"
									className="font-semibold"
								>
									Dashboard Pendeteksi Tanaman Sawi
								</BreadcrumbLink>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<div className="flex gap-4 items-center">
						<Button
							onClick={handlerLogout}
							variant="destructive"
							className="hover:cursor-pointer"
						>
							Keluar
						</Button>
					</div>
				</div>
			</header>

			<div className="xl:w-[1200px] w-full xl:mx-auto grid gap-4 py-4 xl:px-0">
				<div className="px-4">
					<h1 className="font-semibold text-2xl">Dashboard Operator</h1>
					<p>Pantau dan analisa data sensor internet of things yang ada dilapangan.</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4">
					<Card className="@container/card">
						<CardHeader className="relative">
							<CardDescription>Sensor Kelembapan Tanah</CardDescription>
							<CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">{data?.kelembapan_tanah?.[data.kelembapan_tanah.length - 1]?.value ?? "0"} %</CardTitle>
						</CardHeader>
						<CardFooter className="flex-col items-start gap-1 text-sm">
							<div className="line-clamp-1 flex gap-2 font-medium">Terakhir diupdate:</div>
							<div className="text-muted-foreground">{data?.kelembapan_tanah?.[data.kelembapan_tanah.length - 1]?.createdAt ? formatTanggal(data.kelembapan_tanah[data.kelembapan_tanah.length - 1].createdAt) : "-"}</div>
						</CardFooter>
					</Card>
					<Card className="@container/card">
						<CardHeader className="relative">
							<CardDescription>Sensor Suhu Udara</CardDescription>
							<CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">{data?.suhu_udara?.[data.suhu_udara.length - 1]?.value ?? "0"} °C</CardTitle>
						</CardHeader>
						<CardFooter className="flex-col items-start gap-1 text-sm">
							<div className="line-clamp-1 flex gap-2 font-medium">Terakhir diupdate:</div>
							<div className="text-muted-foreground">{data?.suhu_udara?.[data.suhu_udara.length - 1]?.createdAt ? formatTanggal(data.suhu_udara[data.suhu_udara.length - 1].createdAt) : "-"}</div>
						</CardFooter>
					</Card>
				</div>

				<div className="px-4">
					<Card className="@container/card">
						<CardHeader className="relative">
							<CardTitle>List Data Kelembapan Tanah</CardTitle>
							<CardDescription>
								<span className="@[540px]/card:block">Total 50 data terakhir</span>
							</CardDescription>
						</CardHeader>
						<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
							<ChartContainer
								config={chartConfigKelembapanTanah}
								className="aspect-auto h-[250px] w-full"
							>
								<AreaChart data={data.kelembapan_tanah}>
									<defs>
										<linearGradient
											id="fillDesktop"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="var(--primary)"
												stopOpacity={1.0}
											/>
											<stop
												offset="95%"
												stopColor="var(--primary)"
												stopOpacity={0.1}
											/>
										</linearGradient>
										<linearGradient
											id="fillMobile"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="var(--primary)"
												stopOpacity={0.8}
											/>
											<stop
												offset="95%"
												stopColor="var(--primary)"
												stopOpacity={0.1}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="createdAt"
										tickLine={false}
										axisLine={false}
										tickMargin={8}
										minTickGap={32}
										tickFormatter={(value) => {
											const date = new Date(value);
											return date.toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
											});
										}}
									/>
									<ChartTooltip
										cursor={false}
										content={
											<ChartTooltipContent
												labelFormatter={(value) => {
													return new Date(value).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
													});
												}}
												indicator="dot"
											/>
										}
									/>
									<Area
										dataKey="value"
										type="natural"
										fill="var(--primary)"
										stroke="var(--primary)"
										stackId="a"
									/>
								</AreaChart>
							</ChartContainer>
						</CardContent>
					</Card>
				</div>
				<div className="px-4">
					<Card className="@container/card">
						<CardHeader className="relative">
							<CardTitle>List Data Sensor Suhu Udara</CardTitle>
							<CardDescription>
								<span className="@[540px]/card:block">Total 50 data terakhir</span>
							</CardDescription>
						</CardHeader>
						<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
							<ChartContainer
								config={chartConfigSuhuUdata}
								className="aspect-auto h-[250px] w-full"
							>
								<AreaChart data={data.suhu_udara}>
									<defs>
										<linearGradient
											id="fillDesktop"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="var(--primary)"
												stopOpacity={1.0}
											/>
											<stop
												offset="95%"
												stopColor="var(--primary)"
												stopOpacity={0.1}
											/>
										</linearGradient>
										<linearGradient
											id="fillMobile"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="var(--primary)"
												stopOpacity={0.8}
											/>
											<stop
												offset="95%"
												stopColor="var(--primary)"
												stopOpacity={0.1}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="createdAt"
										tickLine={false}
										axisLine={false}
										tickMargin={8}
										minTickGap={32}
										tickFormatter={(value) => {
											const date = new Date(value);
											return date.toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
											});
										}}
									/>
									<ChartTooltip
										cursor={false}
										content={
											<ChartTooltipContent
												labelFormatter={(value) => {
													return new Date(value).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
													});
												}}
												indicator="dot"
											/>
										}
									/>
									<Area
										dataKey="value"
										type="natural"
										stackId="a"
									/>
								</AreaChart>
							</ChartContainer>
						</CardContent>
					</Card>
				</div>

				<div className="px-4">
					<Card>
						<CardHeader className="relative">
							<CardTitle>Tabel Data Sensor</CardTitle>
							<CardDescription>
								<span className="@[540px]/card:block">Total 50 data terakhir</span>
							</CardDescription>
						</CardHeader>
						<CardContent className="px-2 pt-4">
							<div className="grid overflow-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[200px]">Sensor</TableHead>
											<TableHead className="w-[140px]">Nilai</TableHead>
											<TableHead className="w-[300px]">Tanggal Pengambilan</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{[...data.kelembapan_tanah, ...data.suhu_udara]
											.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
											.map((item, index) => (
												<TableRow key={index}>
													<TableCell className="font-medium">{item.type === "KELEMBAPAN_TANAH" ? "Kelembapan Tanah" : "Suhu Udara"}</TableCell>
													<TableCell className="">
														{item.value} {item.type === "KELEMBAPAN_TANAH" ? "%" : "°C"}
													</TableCell>
													<TableCell className="text-wrap">{formatTanggal(item.createdAt)}</TableCell>
												</TableRow>
											))}
									</TableBody>
									<TableFooter>
										<TableRow>
											<TableCell colSpan={2}>Total Data</TableCell>
											<TableCell className="text-right">{[...data.kelembapan_tanah, ...data.suhu_udara].length}</TableCell>
										</TableRow>
									</TableFooter>
								</Table>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
